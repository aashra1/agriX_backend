// src/__tests__/unit/config/khalti.test.ts
import axios from "axios";
import {
  KHALTI_CONFIG,
  getKhaltiConfig,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} from "../../../config/khalti";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Khalti Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv }; // Reset env variables
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original env
  });

  describe("KHALTI_CONFIG", () => {
    test("should have correct baseUrl", () => {
      expect(KHALTI_CONFIG.baseUrl).toBe("https://a.khalti.com/api/v2");
    });
  });

  describe("getKhaltiConfig", () => {
    test("should return config with env variables", () => {
      process.env.KHALTI_TEST_SECRET_KEY = "test-secret-key";
      process.env.KHALTI_TEST_PUBLIC_KEY = "test-public-key";

      const config = getKhaltiConfig();

      expect(config).toEqual({
        baseUrl: "https://a.khalti.com/api/v2",
        secretKey: "test-secret-key",
        publicKey: "test-public-key",
      });
    });

    test("should return undefined secretKey when env not set", () => {
      delete process.env.KHALTI_TEST_SECRET_KEY;
      delete process.env.KHALTI_TEST_PUBLIC_KEY;

      const config = getKhaltiConfig();

      expect(config).toEqual({
        baseUrl: "https://a.khalti.com/api/v2",
        secretKey: undefined,
        publicKey: undefined,
      });
    });
  });

  describe("initiateKhaltiPayment", () => {
    const mockPaymentData = {
      return_url: "https://example.com/return",
      website_url: "https://example.com",
      amount: 1000,
      purchase_order_id: "order_123",
      purchase_order_name: "Order 123",
      customer_info: {
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
      },
    };

    beforeEach(() => {
      process.env.KHALTI_TEST_SECRET_KEY = "test-secret-key";
    });

    test("should successfully initiate payment", async () => {
      const mockResponse = {
        data: {
          pidx: "pidx_123",
          payment_url: "https://khalti.com/pay/pidx_123",
          expires_at: new Date().toISOString(),
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await initiateKhaltiPayment(mockPaymentData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://a.khalti.com/api/v2/epayment/initiate/",
        {
          ...mockPaymentData,
          amount: Math.round(mockPaymentData.amount * 100), // Should convert to paisa
        },
        {
          headers: {
            Authorization: "Key test-secret-key",
            "Content-Type": "application/json",
          },
        },
      );

      expect(result).toEqual(mockResponse.data);
    });

    test("should throw error if secret key is missing", async () => {
      delete process.env.KHALTI_TEST_SECRET_KEY;

      await expect(initiateKhaltiPayment(mockPaymentData)).rejects.toThrow(
        "KHALTI_TEST_SECRET_KEY is missing in .env",
      );

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test("should handle axios error with response detail", async () => {
      const errorResponse = {
        response: {
          data: {
            detail: "Invalid amount",
          },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(initiateKhaltiPayment(mockPaymentData)).rejects.toThrow(
        "Invalid amount",
      );
    });

    test("should handle axios error without response detail", async () => {
      const errorResponse = {
        response: {
          data: {},
        },
      };
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(initiateKhaltiPayment(mockPaymentData)).rejects.toThrow(
        "Failed to initiate Khalti payment",
      );
    });

    test("should handle non-axios error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(initiateKhaltiPayment(mockPaymentData)).rejects.toThrow(
        "Failed to initiate Khalti payment",
      );
    });

    test("should convert amount to paisa correctly", async () => {
      const testCases = [
        { amount: 1000, expected: 100000 },
        { amount: 500.5, expected: 50050 },
        { amount: 0, expected: 0 },
      ];

      for (const { amount, expected } of testCases) {
        const mockResponse = { data: {} };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        await initiateKhaltiPayment({
          ...mockPaymentData,
          amount,
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            amount: expected,
          }),
          expect.any(Object),
        );
      }
    });

    test("should handle optional phone number", async () => {
      const dataWithoutPhone = {
        ...mockPaymentData,
        customer_info: {
          name: "John Doe",
          email: "john@example.com",
          // phone omitted
        },
      };

      const mockResponse = { data: {} };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await initiateKhaltiPayment(dataWithoutPhone);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          customer_info: {
            name: "John Doe",
            email: "john@example.com",
          },
        }),
        expect.any(Object),
      );
    });
  });

  describe("verifyKhaltiPayment", () => {
    const pidx = "pidx_123";

    beforeEach(() => {
      process.env.KHALTI_TEST_SECRET_KEY = "test-secret-key";
    });

    test("should successfully verify payment", async () => {
      const mockResponse = {
        data: {
          pidx: "pidx_123",
          status: "Completed",
          transaction_id: "txn_123",
          total_amount: 1000,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await verifyKhaltiPayment(pidx);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://a.khalti.com/api/v2/epayment/lookup/",
        { pidx },
        {
          headers: {
            Authorization: "Key test-secret-key",
            "Content-Type": "application/json",
          },
        },
      );

      expect(result).toEqual(mockResponse.data);
    });

    test("should throw error if secret key is missing", async () => {
      delete process.env.KHALTI_TEST_SECRET_KEY;

      await expect(verifyKhaltiPayment(pidx)).rejects.toThrow(
        "KHALTI_TEST_SECRET_KEY is missing in .env",
      );

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test("should handle axios error with response detail", async () => {
      const errorResponse = {
        response: {
          data: {
            detail: "Invalid pidx",
          },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(verifyKhaltiPayment(pidx)).rejects.toThrow("Invalid pidx");
    });

    test("should handle axios error without response detail", async () => {
      const errorResponse = {
        response: {
          data: {},
        },
      };
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(verifyKhaltiPayment(pidx)).rejects.toThrow(
        "Failed to verify Khalti payment",
      );
    });

    test("should handle non-axios error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(verifyKhaltiPayment(pidx)).rejects.toThrow(
        "Failed to verify Khalti payment",
      );
    });

    test("should handle different payment status responses", async () => {
      const statuses = ["Completed", "Pending", "Failed", "Expired"];

      for (const status of statuses) {
        const mockResponse = {
          data: {
            pidx,
            status,
            transaction_id: status === "Completed" ? "txn_123" : undefined,
          },
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const result = await verifyKhaltiPayment(pidx);
        expect(result.status).toBe(status);
      }
    });

    test("should handle empty response data", async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const result = await verifyKhaltiPayment(pidx);
      expect(result).toEqual({});
    });
  });

  describe("Environment Variable Handling", () => {
    test("should work without public key (optional)", async () => {
      process.env.KHALTI_TEST_SECRET_KEY = "test-secret-key";
      delete process.env.KHALTI_TEST_PUBLIC_KEY;

      const config = getKhaltiConfig();
      expect(config.publicKey).toBeUndefined();

      // Payment initiation should still work
      const mockResponse = { data: {} };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const paymentData = {
        return_url: "https://example.com",
        website_url: "https://example.com",
        amount: 1000,
        purchase_order_id: "order_123",
        purchase_order_name: "Order 123",
        customer_info: {
          name: "John Doe",
          email: "john@example.com",
        },
      };

      await expect(initiateKhaltiPayment(paymentData)).resolves.toBeDefined();
    });
  });
});
