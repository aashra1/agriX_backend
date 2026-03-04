import { Request, Response } from "express";
import { PaymentController } from "../../../controllers/payment.controller";

// Mock the entire service module
jest.mock("../../../services/payment.service", () => ({
  PaymentService: jest.fn().mockImplementation(() => ({
    initiateKhaltiPayment: jest.fn().mockResolvedValue({
      payment: { _id: "pay123" },
      paymentUrl: "https://khalti.com/pay",
      pidx: "pidx123",
    }),
    verifyKhaltiPayment: jest.fn().mockResolvedValue({
      success: true,
      payment: { _id: "pay123" },
    }),
    getPaymentByOrderId: jest.fn().mockResolvedValue({
      _id: "pay123",
      orderId: "order123",
    }),
  })),
}));

describe("PaymentController Unit Tests", () => {
  let controller: PaymentController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PaymentController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test("initiateKhaltiPayment - should initiate payment", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockRequest.body = {
      orderId: "order123",
      amount: 1000,
      returnUrl: "https://test.com/return",
    };

    await controller.initiateKhaltiPayment(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Payment initiated successfully",
      }),
    );
  });

  test("verifyKhaltiPayment - should verify payment", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockRequest.body = {
      pidx: "pidx123",
      orderId: "order123",
    };

    await controller.verifyKhaltiPayment(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Payment verified successfully",
      }),
    );
  });

  test("getPaymentByOrderId - should return payment", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockRequest.params = { orderId: "order123" };

    await controller.getPaymentByOrderId(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });
});
