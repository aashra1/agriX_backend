// src/__tests__/unit/payment/payment.service.test.ts
import mongoose from "mongoose";
import { PaymentService } from "../../../services/payment.service";
import { HttpError } from "../../../error/http-error";

// Mock dependencies
jest.mock("mongoose", () => ({
  startSession: jest.fn(),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id })),
  },
}));

// Mock external config
jest.mock("../../../config/khalti", () => ({
  initiateKhaltiPayment: jest.fn(),
  verifyKhaltiPayment: jest.fn(),
}));

// Mock repositories
jest.mock("../../../repositories/payment.repository", () => {
  const repoMock = {
    getPaymentByOrderId: jest.fn(),
    getPaymentByPidx: jest.fn(),
    createPayment: jest.fn(),
    updatePayment: jest.fn(),
    getPaymentsByUser: jest.fn(),
    getAllPayments: jest.fn(),
  };

  return {
    PaymentRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

jest.mock("../../../repositories/order.repository", () => {
  const repoMock = {
    findById: jest.fn(),
    updatePaymentStatus: jest.fn(),
  };

  return {
    OrderRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

jest.mock("../../../repositories/user.repository", () => {
  const repoMock = {
    getUserById: jest.fn(),
  };

  return {
    UserRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

jest.mock("../../../repositories/tax.repository", () => {
  const repoMock = {
    createWithSession: jest.fn(),
  };

  return {
    TaxRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

jest.mock("../../../services/wallet.service", () => {
  const serviceMock = {
    checkTransactionExists: jest.fn(),
    creditUser: jest.fn(),
  };

  return {
    WalletService: jest.fn().mockImplementation(() => serviceMock),
    __mockService: serviceMock,
  };
});

// Import after mocks
import { PaymentRepository } from "../../../repositories/payment.repository";
import { OrderRepository } from "../../../repositories/order.repository";
import { UserRepository } from "../../../repositories/user.repository";
import { TaxRepository } from "../../../repositories/tax.repository";
import { WalletService } from "../../../services/wallet.service";
import {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} from "../../../config/khalti";

// Get mock objects from mocked modules
const mockPaymentRepoMethods = (
  jest.requireMock("../../../repositories/payment.repository") as any
).__mockRepo;
const mockOrderRepoMethods = (
  jest.requireMock("../../../repositories/order.repository") as any
).__mockRepo;
const mockUserRepoMethods = (
  jest.requireMock("../../../repositories/user.repository") as any
).__mockRepo;
const mockTaxRepoMethods = (
  jest.requireMock("../../../repositories/tax.repository") as any
).__mockRepo;
const mockWalletServiceMethods = (
  jest.requireMock("../../../services/wallet.service") as any
).__mockService;

const mockInitiateKhalti = initiateKhaltiPayment as jest.Mock;
const mockVerifyKhalti = verifyKhaltiPayment as jest.Mock;

describe("PaymentService Unit Tests", () => {
  let service: PaymentService;
  let paymentRepoMock: any;
  let orderRepoMock: any;
  let userRepoMock: any;
  let taxRepoMock: any;
  let walletServiceMock: any;
  let mockSession: any;

  const makePaymentDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "payment123",
      userId: overrides.userId ?? "user123",
      orderId: overrides.orderId ?? "order123",
      amount: overrides.amount ?? 1000,
      status: overrides.status ?? "pending",
      paymentMethod: overrides.paymentMethod ?? "khalti",
      pidx: overrides.pidx ?? "pidx123",
      paymentUrl: overrides.paymentUrl ?? "https://test.khalti.com/pay",
      transactionId: overrides.transactionId ?? undefined,
      metadata: overrides.metadata ?? {},
      createdAt: overrides.createdAt ?? new Date(),
      __v: 0,
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  const makeUserDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "user123",
      fullName: overrides.fullName ?? "Test User",
      email: overrides.email ?? "test@example.com",
      phoneNumber: overrides.phoneNumber ?? "1234567890",
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  const makeOrderDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "order123",
      user: overrides.user ?? "user123",
      items: overrides.items ?? [],
      total: overrides.total ?? 1000,
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLIENT_URL = "http://localhost:3000";

    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

    service = new PaymentService();
    paymentRepoMock = mockPaymentRepoMethods;
    orderRepoMock = mockOrderRepoMethods;
    userRepoMock = mockUserRepoMethods;
    taxRepoMock = mockTaxRepoMethods;
    walletServiceMock = mockWalletServiceMethods;
  });

  describe("initiateKhaltiPayment", () => {
    const userId = "user123";
    const orderId = "order123";
    const amount = 1000;
    const returnUrl = "http://localhost:3000/payment/callback";

    test("should initiate new payment successfully", async () => {
      const user = makeUserDoc({ _id: userId });
      userRepoMock.getUserById.mockResolvedValue(user);
      paymentRepoMock.getPaymentByOrderId.mockResolvedValue(null);

      const khaltiResponse = {
        pidx: "new-pidx-123",
        payment_url: "https://test.khalti.com/pay/new",
        expires_at: new Date(),
      };

      mockInitiateKhalti.mockResolvedValue(khaltiResponse);

      const createdPayment = makePaymentDoc({
        _id: "payment123",
        userId,
        orderId,
        amount,
        status: "pending",
        pidx: khaltiResponse.pidx,
        paymentUrl: khaltiResponse.payment_url,
        metadata: khaltiResponse,
      });

      paymentRepoMock.createPayment.mockResolvedValue(createdPayment);

      const result = await service.initiateKhaltiPayment(
        userId,
        orderId,
        amount,
        returnUrl,
      );

      expect(userRepoMock.getUserById).toHaveBeenCalledWith(userId);
      expect(paymentRepoMock.getPaymentByOrderId).toHaveBeenCalledWith(orderId);

      expect(mockInitiateKhalti).toHaveBeenCalledWith({
        return_url: returnUrl,
        website_url: "http://localhost:3000",
        amount: amount,
        purchase_order_id: orderId,
        purchase_order_name: `Order ${orderId}`,
        customer_info: {
          name: user.fullName,
          email: user.email,
          phone: user.phoneNumber,
        },
      });

      expect(paymentRepoMock.createPayment).toHaveBeenCalledWith({
        userId,
        orderId,
        amount,
        status: "pending",
        paymentMethod: "khalti",
        pidx: khaltiResponse.pidx,
        paymentUrl: khaltiResponse.payment_url,
        metadata: khaltiResponse,
      });

      expect(result).toEqual({
        payment: expect.not.objectContaining({ __v: 0 }),
        paymentUrl: khaltiResponse.payment_url,
        pidx: khaltiResponse.pidx,
      });
    });

    test("should throw if user not found", async () => {
      userRepoMock.getUserById.mockResolvedValue(null);

      await expect(
        service.initiateKhaltiPayment(userId, orderId, amount, returnUrl),
      ).rejects.toThrow(new HttpError(404, "User not found"));

      expect(paymentRepoMock.getPaymentByOrderId).not.toHaveBeenCalled();
      expect(mockInitiateKhalti).not.toHaveBeenCalled();
    });

    test("should throw if order already paid", async () => {
      const user = makeUserDoc({ _id: userId });
      const existingPayment = makePaymentDoc({
        orderId,
        status: "completed",
      });

      userRepoMock.getUserById.mockResolvedValue(user);
      paymentRepoMock.getPaymentByOrderId.mockResolvedValue(existingPayment);

      await expect(
        service.initiateKhaltiPayment(userId, orderId, amount, returnUrl),
      ).rejects.toThrow(new HttpError(400, "Order has already been paid for"));

      expect(mockInitiateKhalti).not.toHaveBeenCalled();
      expect(paymentRepoMock.createPayment).not.toHaveBeenCalled();
    });

    test("should return existing payment if found and pending", async () => {
      const user = makeUserDoc({ _id: userId });
      const existingPayment = makePaymentDoc({
        orderId,
        status: "pending",
        paymentUrl: "https://test.khalti.com/pay/existing",
        pidx: "existing-pidx",
      });

      userRepoMock.getUserById.mockResolvedValue(user);
      paymentRepoMock.getPaymentByOrderId.mockResolvedValue(existingPayment);

      const result = await service.initiateKhaltiPayment(
        userId,
        orderId,
        amount,
        returnUrl,
      );

      expect(mockInitiateKhalti).not.toHaveBeenCalled();
      expect(paymentRepoMock.createPayment).not.toHaveBeenCalled();
      expect(result).toEqual({
        payment: expect.not.objectContaining({ __v: 0 }),
        paymentUrl: existingPayment.paymentUrl,
        pidx: existingPayment.pidx,
      });
    });
  });

  describe("verifyKhaltiPayment", () => {
    const pidx = "pidx123";
    const orderId = "order123";

    test("should verify payment successfully and credit businesses", async () => {
      const payment = makePaymentDoc({
        _id: "payment123",
        orderId,
        pidx,
        status: "pending",
      });

      const order = makeOrderDoc({
        _id: orderId,
        user: "user123",
        total: 429.4,
        items: [
          {
            product: "product123",
            name: "Product 1",
            quantity: 2,
            price: 100,
            discount: 10,
            business: { _id: "business123" },
          },
          {
            product: "product456",
            name: "Product 2",
            quantity: 1,
            price: 200,
            discount: 0,
            business: "business456",
          },
        ],
      });

      const verificationResponse = {
        status: "Completed",
        transaction_id: "txn123",
        total_amount: 1000,
      };

      paymentRepoMock.getPaymentByPidx.mockResolvedValue(payment);
      orderRepoMock.findById.mockResolvedValue(order);
      mockVerifyKhalti.mockResolvedValue(verificationResponse);

      const updatedPayment = makePaymentDoc({
        ...payment,
        status: "completed",
        transactionId: "txn123",
        metadata: verificationResponse,
      });

      paymentRepoMock.updatePayment.mockResolvedValue(updatedPayment);
      orderRepoMock.updatePaymentStatus.mockResolvedValue({
        ...order,
        paymentStatus: "completed",
      });

      walletServiceMock.checkTransactionExists.mockResolvedValue(false);
      walletServiceMock.creditUser.mockResolvedValue({ success: true });
      taxRepoMock.createWithSession.mockResolvedValue({});

      const result = await service.verifyKhaltiPayment(pidx, orderId);

      expect(paymentRepoMock.getPaymentByPidx).toHaveBeenCalledWith(pidx);
      expect(mockVerifyKhalti).toHaveBeenCalledWith(pidx);
      expect(paymentRepoMock.updatePayment).toHaveBeenCalledWith("payment123", {
        status: "completed",
        transactionId: "txn123",
        metadata: verificationResponse,
      });
      expect(orderRepoMock.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "completed",
      );
      expect(orderRepoMock.findById).toHaveBeenCalledWith(orderId);

      // Should credit both businesses
      expect(walletServiceMock.checkTransactionExists).toHaveBeenCalledTimes(2);
      expect(walletServiceMock.creditUser).toHaveBeenCalledTimes(2);
      expect(taxRepoMock.createWithSession).toHaveBeenCalledTimes(2);

      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(result).toEqual({
        success: true,
        message: "Payment verified and businesses credited successfully",
        payment: expect.not.objectContaining({ __v: 0 }),
      });
    });

    test("should return success if payment already completed", async () => {
      const payment = makePaymentDoc({
        orderId,
        pidx,
        status: "completed",
      });

      paymentRepoMock.getPaymentByPidx.mockResolvedValue(payment);

      const result = await service.verifyKhaltiPayment(pidx, orderId);

      expect(mockVerifyKhalti).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(result).toEqual({
        success: true,
        message: "Payment already verified",
        payment: expect.not.objectContaining({ __v: 0 }),
      });
    });

    test("should throw if payment record not found", async () => {
      paymentRepoMock.getPaymentByPidx.mockResolvedValue(null);

      await expect(service.verifyKhaltiPayment(pidx, orderId)).rejects.toThrow(
        new HttpError(404, "Payment record not found"),
      );

      expect(mockVerifyKhalti).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    test("should throw if order ID mismatch", async () => {
      const payment = makePaymentDoc({
        orderId: "different-order",
        pidx,
        status: "pending",
      });

      paymentRepoMock.getPaymentByPidx.mockResolvedValue(payment);

      await expect(service.verifyKhaltiPayment(pidx, orderId)).rejects.toThrow(
        new HttpError(400, "Order ID mismatch"),
      );

      expect(mockVerifyKhalti).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    test("should throw if Khalti verification fails", async () => {
      const payment = makePaymentDoc({
        orderId,
        pidx,
        status: "pending",
      });

      const verificationResponse = {
        status: "Failed",
        detail: "Payment failed",
      };

      paymentRepoMock.getPaymentByPidx.mockResolvedValue(payment);
      mockVerifyKhalti.mockResolvedValue(verificationResponse);

      const updatedPayment = makePaymentDoc({
        ...payment,
        status: "failed",
        metadata: verificationResponse,
      });

      paymentRepoMock.updatePayment.mockResolvedValue(updatedPayment);

      await expect(service.verifyKhaltiPayment(pidx, orderId)).rejects.toThrow(
        new HttpError(400, "Payment status: Failed"),
      );

      expect(paymentRepoMock.updatePayment).toHaveBeenCalledWith(
        payment._id.toString(),
        {
          status: "failed",
          metadata: verificationResponse,
        },
      );
      expect(orderRepoMock.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "failed",
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    test("should skip if transaction already exists", async () => {
      const payment = makePaymentDoc({
        orderId,
        pidx,
        status: "pending",
      });

      const order = makeOrderDoc({
        _id: orderId,
        items: [
          {
            product: "product123",
            quantity: 2,
            price: 100,
            discount: 10,
            business: { _id: "business123" },
          },
        ],
      });

      const verificationResponse = {
        status: "Completed",
        transaction_id: "txn123",
      };

      paymentRepoMock.getPaymentByPidx.mockResolvedValue(payment);
      orderRepoMock.findById.mockResolvedValue(order);
      mockVerifyKhalti.mockResolvedValue(verificationResponse);

      const updatedPayment = makePaymentDoc({
        ...payment,
        status: "completed",
        transactionId: "txn123",
        metadata: verificationResponse,
      });

      paymentRepoMock.updatePayment.mockResolvedValue(updatedPayment);
      orderRepoMock.updatePaymentStatus.mockResolvedValue({
        ...order,
        paymentStatus: "completed",
      });

      // Transaction already exists
      walletServiceMock.checkTransactionExists.mockResolvedValue(true);

      const result = await service.verifyKhaltiPayment(pidx, orderId);

      expect(walletServiceMock.checkTransactionExists).toHaveBeenCalled();
      expect(walletServiceMock.creditUser).not.toHaveBeenCalled();
      expect(taxRepoMock.createWithSession).not.toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();

      expect(result).toEqual({
        success: true,
        message: "Payment verified and businesses credited successfully",
        payment: expect.not.objectContaining({ __v: 0 }),
      });
    });

    test("should handle items with different business ID formats", async () => {
      const payment = makePaymentDoc({
        orderId,
        pidx,
        status: "pending",
      });

      const order = makeOrderDoc({
        _id: orderId,
        items: [
          {
            product: "product123",
            quantity: 2,
            price: 100,
            discount: 10,
            business: { _id: "business123" }, // Object format
          },
          {
            product: "product456",
            quantity: 1,
            price: 200,
            discount: 0,
            business: "business456", // String format
          },
          {
            product: "product789",
            quantity: 1,
            price: 50,
            discount: 0,
            // Missing business ID
          },
        ],
      });

      const verificationResponse = {
        status: "Completed",
        transaction_id: "txn123",
      };

      paymentRepoMock.getPaymentByPidx.mockResolvedValue(payment);
      orderRepoMock.findById.mockResolvedValue(order);
      mockVerifyKhalti.mockResolvedValue(verificationResponse);

      const updatedPayment = makePaymentDoc({
        ...payment,
        status: "completed",
        transactionId: "txn123",
        metadata: verificationResponse,
      });

      paymentRepoMock.updatePayment.mockResolvedValue(updatedPayment);
      orderRepoMock.updatePaymentStatus.mockResolvedValue({
        ...order,
        paymentStatus: "completed",
      });

      walletServiceMock.checkTransactionExists.mockResolvedValue(false);
      walletServiceMock.creditUser.mockResolvedValue({ success: true });

      const result = await service.verifyKhaltiPayment(pidx, orderId);

      // Should only credit businesses with valid IDs (2 out of 3 items)
      expect(walletServiceMock.creditUser).toHaveBeenCalledTimes(2);
      expect(taxRepoMock.createWithSession).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });
  });

  describe("getPaymentByOrderId", () => {
    test("should return payment by order id", async () => {
      const orderId = "order123";
      const payment = makePaymentDoc({ orderId });

      paymentRepoMock.getPaymentByOrderId.mockResolvedValue(payment);

      const result = await service.getPaymentByOrderId(orderId);

      expect(paymentRepoMock.getPaymentByOrderId).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(expect.not.objectContaining({ __v: 0 }));
    });

    test("should throw if payment not found", async () => {
      const orderId = "order123";

      paymentRepoMock.getPaymentByOrderId.mockResolvedValue(null);

      await expect(service.getPaymentByOrderId(orderId)).rejects.toThrow(
        new HttpError(404, "Payment not found"),
      );
    });
  });

  describe("getUserPayments", () => {
    const userId = "user123";

    test("should return user payments with pagination and status filter", async () => {
      const payments = [
        makePaymentDoc({ _id: "payment1", userId, status: "completed" }),
        makePaymentDoc({ _id: "payment2", userId, status: "pending" }),
      ];

      paymentRepoMock.getPaymentsByUser.mockResolvedValue(payments);

      const result = await service.getUserPayments(userId, 2, 5, "completed");

      expect(paymentRepoMock.getPaymentsByUser).toHaveBeenCalledWith(
        userId,
        5,
        5,
        "completed",
      );
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("__v");
    });

    test("should use default pagination values", async () => {
      const payments = [makePaymentDoc({ userId })];
      paymentRepoMock.getPaymentsByUser.mockResolvedValue(payments);

      const result = await service.getUserPayments(userId);

      expect(paymentRepoMock.getPaymentsByUser).toHaveBeenCalledWith(
        userId,
        0,
        10,
        undefined,
      );
      expect(result).toEqual([expect.not.objectContaining({ __v: 0 })]);
    });

    test("should return empty array if no payments found", async () => {
      paymentRepoMock.getPaymentsByUser.mockResolvedValue([]);

      const result = await service.getUserPayments(userId);

      expect(result).toEqual([]);
    });
  });

  describe("getAllPayments", () => {
    test("should return all payments with pagination and status filter", async () => {
      const payments = [
        makePaymentDoc({ _id: "payment1", status: "completed" }),
        makePaymentDoc({ _id: "payment2", status: "pending" }),
        makePaymentDoc({ _id: "payment3", status: "completed" }),
      ];

      paymentRepoMock.getAllPayments.mockResolvedValue(payments);

      const result = await service.getAllPayments(2, 5, "completed");

      expect(paymentRepoMock.getAllPayments).toHaveBeenCalledWith(
        5,
        5,
        "completed",
      );
      expect(result).toHaveLength(3);
      expect(result[0]).not.toHaveProperty("__v");
    });

    test("should use default pagination values", async () => {
      const payments = [makePaymentDoc({})];
      paymentRepoMock.getAllPayments.mockResolvedValue(payments);

      const result = await service.getAllPayments();

      expect(paymentRepoMock.getAllPayments).toHaveBeenCalledWith(
        0,
        10,
        undefined,
      );
      expect(result).toEqual([expect.not.objectContaining({ __v: 0 })]);
    });

    test("should return empty array if no payments found", async () => {
      paymentRepoMock.getAllPayments.mockResolvedValue([]);

      const result = await service.getAllPayments();

      expect(result).toEqual([]);
    });
  });
});
