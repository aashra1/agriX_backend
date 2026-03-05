// __tests__/unit/services/payment.service.test.ts
import mongoose from "mongoose";
import { PaymentService } from "../../../services/payment.service";
import { PaymentRepository } from "../../../repositories/payment.repository";
import { OrderRepository } from "../../../repositories/order.repository";
import { UserRepository } from "../../../repositories/user.repository";
import { TaxRepository } from "../../../repositories/tax.repository";
import { WalletService } from "../../../services/wallet.service";
import {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} from "../../../config/khalti";

jest.mock("../../../repositories/payment.repository");
jest.mock("../../../repositories/order.repository");
jest.mock("../../../repositories/user.repository");
jest.mock("../../../repositories/tax.repository");
jest.mock("../../../services/wallet.service");
jest.mock("../../../config/khalti");
jest.mock("mongoose");

describe("PaymentService", () => {
  let service: PaymentService;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTaxRepository: jest.Mocked<TaxRepository>;
  let mockWalletService: jest.Mocked<WalletService>;
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
      toObject: () => ({ ...base, ...overrides }),
    };
    return base;
  };

  const makeUserDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "user123",
      fullName: overrides.fullName ?? "Test User",
      email: overrides.email ?? "test@example.com",
      phoneNumber: overrides.phoneNumber ?? "1234567890",
    };
    return base;
  };

  const makeOrderDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "order123",
      user: overrides.user ?? "user123",
      items: overrides.items ?? [],
      total: overrides.total ?? 1000,
    };
    return base;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

    service = new PaymentService();
    mockPaymentRepository =
      new PaymentRepository() as jest.Mocked<PaymentRepository>;
    mockOrderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockTaxRepository = new TaxRepository() as jest.Mocked<TaxRepository>;
    mockWalletService = new WalletService() as jest.Mocked<WalletService>;

    (service as any).paymentRepository = mockPaymentRepository;
    (service as any).orderRepository = mockOrderRepository;
    (service as any).userRepository = mockUserRepository;
    (service as any).taxRepository = mockTaxRepository;
    (service as any).walletService = mockWalletService;

    process.env.CLIENT_URL = "http://localhost:3000";
  });

  describe("initiateKhaltiPayment", () => {
    const userId = "user123";
    const orderId = "order123";
    const amount = 1000;
    const returnUrl = "http://localhost:3000/callback";

    test("should initiate new payment successfully", async () => {
      const user = makeUserDoc({ _id: userId });
      mockUserRepository.getUserById.mockResolvedValue(user as any);
      mockPaymentRepository.getPaymentByOrderId.mockResolvedValue(null);

      const khaltiResponse = {
        pidx: "new-pidx-123",
        payment_url: "https://test.khalti.com/pay/new",
        expires_at: new Date(),
      };
      (initiateKhaltiPayment as jest.Mock).mockResolvedValue(khaltiResponse);

      const createdPayment = makePaymentDoc({
        _id: "payment123",
        userId,
        orderId,
        amount,
        pidx: khaltiResponse.pidx,
        paymentUrl: khaltiResponse.payment_url,
      });
      mockPaymentRepository.createPayment.mockResolvedValue(
        createdPayment as any,
      );

      const result = await service.initiateKhaltiPayment(
        userId,
        orderId,
        amount,
        returnUrl,
      );

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockPaymentRepository.getPaymentByOrderId).toHaveBeenCalledWith(
        orderId,
      );
      expect(initiateKhaltiPayment).toHaveBeenCalledWith({
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
      expect(mockPaymentRepository.createPayment).toHaveBeenCalled();
      expect(result).toEqual({
        payment: expect.any(Object),
        paymentUrl: khaltiResponse.payment_url,
        pidx: khaltiResponse.pidx,
      });
    });

    test("should throw if user not found", async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);
      await expect(
        service.initiateKhaltiPayment(userId, orderId, amount, returnUrl),
      ).rejects.toThrow("User not found");
    });

    test("should throw if order already paid", async () => {
      const user = makeUserDoc({ _id: userId });
      const existingPayment = makePaymentDoc({ orderId, status: "completed" });
      mockUserRepository.getUserById.mockResolvedValue(user as any);
      mockPaymentRepository.getPaymentByOrderId.mockResolvedValue(
        existingPayment as any,
      );
      await expect(
        service.initiateKhaltiPayment(userId, orderId, amount, returnUrl),
      ).rejects.toThrow("Order has already been paid for");
    });

    test("should return existing pending payment", async () => {
      const user = makeUserDoc({ _id: userId });
      const existingPayment = makePaymentDoc({
        orderId,
        status: "pending",
        paymentUrl: "url",
        pidx: "pidx",
      });
      mockUserRepository.getUserById.mockResolvedValue(user as any);
      mockPaymentRepository.getPaymentByOrderId.mockResolvedValue(
        existingPayment as any,
      );
      const result = await service.initiateKhaltiPayment(
        userId,
        orderId,
        amount,
        returnUrl,
      );
      expect(initiateKhaltiPayment).not.toHaveBeenCalled();
      expect(result).toEqual({
        payment: expect.any(Object),
        paymentUrl: existingPayment.paymentUrl,
        pidx: existingPayment.pidx,
      });
    });
  });

  describe("verifyKhaltiPayment", () => {
    const pidx = "pidx123";
    const orderId = "order123";

    test("should verify payment and credit businesses", async () => {
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
            quantity: 2,
            price: 100,
            discount: 10,
            business: { _id: "business123" },
          },
          {
            product: "product456",
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

      mockPaymentRepository.getPaymentByPidx.mockResolvedValue(payment as any);
      mockOrderRepository.findById.mockResolvedValue(order as any);
      (verifyKhaltiPayment as jest.Mock).mockResolvedValue(
        verificationResponse,
      );

      const updatedPayment = makePaymentDoc({
        ...payment,
        status: "completed",
        transactionId: "txn123",
        metadata: verificationResponse,
      });
      mockPaymentRepository.updatePayment.mockResolvedValue(
        updatedPayment as any,
      );
      mockOrderRepository.updatePaymentStatus.mockResolvedValue({
        ...order,
        paymentStatus: "completed",
      } as any);
      mockWalletService.checkTransactionExists.mockResolvedValue(false);
      mockWalletService.creditUser.mockResolvedValue({ success: true } as any);
      mockTaxRepository.createWithSession.mockResolvedValue({} as any);

      const result = await service.verifyKhaltiPayment(pidx, orderId);

      expect(mockPaymentRepository.getPaymentByPidx).toHaveBeenCalledWith(pidx);
      expect(verifyKhaltiPayment).toHaveBeenCalledWith(pidx);
      expect(mockPaymentRepository.updatePayment).toHaveBeenCalledWith(
        "payment123",
        {
          status: "completed",
          transactionId: "txn123",
          metadata: verificationResponse,
        },
      );
      expect(mockOrderRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "completed",
      );
      expect(mockWalletService.creditUser).toHaveBeenCalledTimes(2);
      expect(mockTaxRepository.createWithSession).toHaveBeenCalledTimes(2);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: "Payment verified and businesses credited successfully",
        payment: expect.any(Object),
      });
    });

    test("should return success if payment already completed", async () => {
      const payment = makePaymentDoc({ orderId, pidx, status: "completed" });
      mockPaymentRepository.getPaymentByPidx.mockResolvedValue(payment as any);
      const result = await service.verifyKhaltiPayment(pidx, orderId);
      expect(verifyKhaltiPayment).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: "Payment already verified",
        payment: expect.any(Object),
      });
    });

    test("should throw if payment record not found", async () => {
      mockPaymentRepository.getPaymentByPidx.mockResolvedValue(null);
      await expect(service.verifyKhaltiPayment(pidx, orderId)).rejects.toThrow(
        "Payment record not found",
      );
    });

    test("should throw if order ID mismatch", async () => {
      const payment = makePaymentDoc({
        orderId: "different-order",
        pidx,
        status: "pending",
      });
      mockPaymentRepository.getPaymentByPidx.mockResolvedValue(payment as any);
      await expect(service.verifyKhaltiPayment(pidx, orderId)).rejects.toThrow(
        "Order ID mismatch",
      );
    });

    test("should throw if Khalti verification fails", async () => {
      const payment = makePaymentDoc({ orderId, pidx, status: "pending" });
      const verificationResponse = {
        status: "Failed",
        detail: "Payment failed",
      };

      mockPaymentRepository.getPaymentByPidx.mockResolvedValue(payment as any);
      (verifyKhaltiPayment as jest.Mock).mockResolvedValue(
        verificationResponse,
      );

      const updatedPayment = makePaymentDoc({
        ...payment,
        status: "failed",
        metadata: verificationResponse,
      });
      mockPaymentRepository.updatePayment.mockResolvedValue(
        updatedPayment as any,
      );

      await expect(service.verifyKhaltiPayment(pidx, orderId)).rejects.toThrow(
        "Payment status: Failed",
      );
      expect(mockPaymentRepository.updatePayment).toHaveBeenCalledWith(
        payment._id.toString(),
        {
          status: "failed",
          metadata: verificationResponse,
        },
      );
    });
  });

  describe("getPaymentByOrderId", () => {
    test("should return payment by order id", async () => {
      const payment = makePaymentDoc({ orderId: "order123" });
      mockPaymentRepository.getPaymentByOrderId.mockResolvedValue(
        payment as any,
      );
      const result = await service.getPaymentByOrderId("order123");
      expect(mockPaymentRepository.getPaymentByOrderId).toHaveBeenCalledWith(
        "order123",
      );
      expect(result).toEqual(expect.any(Object));
    });

    test("should throw if payment not found", async () => {
      mockPaymentRepository.getPaymentByOrderId.mockResolvedValue(null);
      await expect(service.getPaymentByOrderId("order123")).rejects.toThrow(
        "Payment not found",
      );
    });
  });

  describe("getUserPayments", () => {
    test("should return user payments", async () => {
      const payments = [makePaymentDoc({})];
      mockPaymentRepository.getPaymentsByUser.mockResolvedValue(
        payments as any,
      );
      const result = await service.getUserPayments(
        "user123",
        2,
        5,
        "completed",
      );
      expect(mockPaymentRepository.getPaymentsByUser).toHaveBeenCalledWith(
        "user123",
        5,
        5,
        "completed",
      );
      expect(result).toEqual(payments);
    });

    test("should use default pagination", async () => {
      const payments = [makePaymentDoc({})];
      mockPaymentRepository.getPaymentsByUser.mockResolvedValue(
        payments as any,
      );
      const result = await service.getUserPayments("user123");
      expect(mockPaymentRepository.getPaymentsByUser).toHaveBeenCalledWith(
        "user123",
        0,
        10,
        undefined,
      );
      expect(result).toEqual(payments);
    });
  });

  describe("getAllPayments", () => {
    test("should return all payments", async () => {
      const payments = [makePaymentDoc({})];
      mockPaymentRepository.getAllPayments.mockResolvedValue(payments as any);
      const result = await service.getAllPayments(2, 5, "pending");
      expect(mockPaymentRepository.getAllPayments).toHaveBeenCalledWith(
        5,
        5,
        "pending",
      );
      expect(result).toEqual(payments);
    });
  });
});
