// __tests__/unit/controllers/payment.controller.test.ts
import { Request, Response } from "express";
import { PaymentController } from "../../../controllers/payment.controller";
import { PaymentService } from "../../../services/payment.service";
import {
  InitiateKhaltiPaymentDTO,
  VerifyKhaltiPaymentDTO,
  PaymentFilterDTO,
  KhaltiWebhookDTO,
} from "../../../dtos/payment.dto";

jest.mock("../../../services/payment.service");
jest.mock("../../../dtos/payment.dto");

describe("PaymentController", () => {
  let controller: PaymentController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    controller = new PaymentController();
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockResponse = { status: statusFn, json: jsonFn };
    jest.clearAllMocks();
    (PaymentService as jest.Mock).mockClear();
    (PaymentService.prototype.initiateKhaltiPayment as jest.Mock) = jest.fn();
    (PaymentService.prototype.verifyKhaltiPayment as jest.Mock) = jest.fn();
    (PaymentService.prototype.getPaymentByOrderId as jest.Mock) = jest.fn();
    (PaymentService.prototype.getUserPayments as jest.Mock) = jest.fn();
    (PaymentService.prototype.getAllPayments as jest.Mock) = jest.fn();
  });

  describe("initiateKhaltiPayment", () => {
    test("should initiate payment successfully with DTO validation", async () => {
      const mockValidatedData = {
        orderId: "order123",
        amount: 1000,
        returnUrl: "http://localhost:3000/callback",
      };
      (InitiateKhaltiPaymentDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        user: { id: "user123" } as any,
        body: mockValidatedData,
      };

      const mockResult = {
        payment: { id: "pay123" },
        paymentUrl: "https://khalti.com/pay",
        pidx: "pidx123",
      };
      (
        PaymentService.prototype.initiateKhaltiPayment as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.initiateKhaltiPayment(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(InitiateKhaltiPaymentDTO.safeParse).toHaveBeenCalledWith(
        mockValidatedData,
      );
      expect(
        PaymentService.prototype.initiateKhaltiPayment,
      ).toHaveBeenCalledWith(
        "user123",
        "order123",
        1000,
        "http://localhost:3000/callback",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Payment initiated successfully",
        data: mockResult,
      });
    });

    test("should return 400 for DTO validation error", async () => {
      const mockError = {
        format: () => ({ orderId: { _errors: ["Required"] } }),
      };
      (InitiateKhaltiPaymentDTO.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: mockError,
      });

      mockRequest = { user: { id: "user123" } as any, body: {} };

      await controller.initiateKhaltiPayment(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        errors: mockError.format(),
      });
    });

    test("should handle service error", async () => {
      const mockValidatedData = {
        orderId: "order123",
        amount: 1000,
        returnUrl: "url",
      };
      (InitiateKhaltiPaymentDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { user: { id: "user123" } as any, body: mockValidatedData };
      (
        PaymentService.prototype.initiateKhaltiPayment as jest.Mock
      ).mockRejectedValue(new Error("Failed"));

      await controller.initiateKhaltiPayment(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Failed",
      });
    });
  });

  describe("verifyKhaltiPayment", () => {
    test("should verify payment successfully with DTO validation", async () => {
      const mockValidatedData = { pidx: "pidx123", orderId: "order123" };
      (VerifyKhaltiPaymentDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { body: mockValidatedData };
      const mockResult = { success: true, payment: { id: "pay123" } };
      (
        PaymentService.prototype.verifyKhaltiPayment as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.verifyKhaltiPayment(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(VerifyKhaltiPaymentDTO.safeParse).toHaveBeenCalledWith(
        mockValidatedData,
      );
      expect(PaymentService.prototype.verifyKhaltiPayment).toHaveBeenCalledWith(
        "pidx123",
        "order123",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Payment verified successfully",
        data: mockResult,
      });
    });
  });

  describe("getPaymentByOrderId", () => {
    test("should get payment by order id", async () => {
      mockRequest = { params: { orderId: "order123" } };
      const mockPayment = { id: "pay123", status: "completed" };
      (
        PaymentService.prototype.getPaymentByOrderId as jest.Mock
      ).mockResolvedValue(mockPayment);

      await controller.getPaymentByOrderId(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(PaymentService.prototype.getPaymentByOrderId).toHaveBeenCalledWith(
        "order123",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({ success: true, data: mockPayment });
    });

    test("should return 400 if no orderId", async () => {
      mockRequest = { params: {} };

      await controller.getPaymentByOrderId(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Order ID is required",
      });
    });

    test("should return 404 if not found", async () => {
      mockRequest = { params: { orderId: "order123" } };
      (
        PaymentService.prototype.getPaymentByOrderId as jest.Mock
      ).mockRejectedValue(new Error("Payment not found"));

      await controller.getPaymentByOrderId(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(404);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Payment not found",
      });
    });
  });

  describe("getUserPayments", () => {
    test("should get user payments with DTO validation", async () => {
      const mockValidatedData = { page: 2, limit: 5, status: "completed" };
      (PaymentFilterDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        user: { id: "user123" } as any,
        query: { page: "2", limit: "5", status: "completed" },
      };
      const mockPayments: any[] = [{ id: "pay1" }];
      (PaymentService.prototype.getUserPayments as jest.Mock).mockResolvedValue(
        mockPayments,
      );

      await controller.getUserPayments(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(PaymentFilterDTO.safeParse).toHaveBeenCalledWith({
        page: "2",
        limit: "5",
        status: "completed",
      });
      expect(PaymentService.prototype.getUserPayments).toHaveBeenCalledWith(
        "user123",
        2,
        5,
        "completed",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        page: 2,
        limit: 5,
        count: 1,
        data: mockPayments,
      });
    });

    test("should use default pagination", async () => {
      const mockValidatedData = { page: 1, limit: 10, status: undefined };
      (PaymentFilterDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { user: { id: "user123" } as any, query: {} };
      const mockPayments: any[] = [];
      (PaymentService.prototype.getUserPayments as jest.Mock).mockResolvedValue(
        mockPayments,
      );

      await controller.getUserPayments(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(PaymentService.prototype.getUserPayments).toHaveBeenCalledWith(
        "user123",
        1,
        10,
        undefined,
      );
      expect(statusFn).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllPayments", () => {
    test("should get all payments for admin with DTO validation", async () => {
      const mockValidatedData = { page: 1, limit: 10, status: undefined };
      (PaymentFilterDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        user: { isAdmin: true } as any,
        query: { page: "1", limit: "10" },
      };
      const mockPayments = [{ id: "pay1" }];
      (PaymentService.prototype.getAllPayments as jest.Mock).mockResolvedValue(
        mockPayments,
      );

      await controller.getAllPayments(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(PaymentFilterDTO.safeParse).toHaveBeenCalledWith({
        page: "1",
        limit: "10",
      });
      expect(PaymentService.prototype.getAllPayments).toHaveBeenCalledWith(
        1,
        10,
        undefined,
      );
      expect(statusFn).toHaveBeenCalledWith(200);
    });

    test("should return 403 if not admin", async () => {
      mockRequest = { user: { isAdmin: false } as any, query: {} };

      await controller.getAllPayments(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Access denied. Admin only.",
      });
    });
  });

  describe("khaltiWebhook", () => {
    test("should process webhook with DTO validation", async () => {
      const mockValidatedData = {
        pidx: "pidx123",
        purchase_order_id: "order123",
      };
      (KhaltiWebhookDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { body: mockValidatedData };
      const mockResult = { success: true };
      (
        PaymentService.prototype.verifyKhaltiPayment as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.khaltiWebhook(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(KhaltiWebhookDTO.safeParse).toHaveBeenCalledWith(
        mockValidatedData,
      );
      expect(PaymentService.prototype.verifyKhaltiPayment).toHaveBeenCalledWith(
        "pidx123",
        "order123",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Webhook processed successfully",
        data: mockResult,
      });
    });

    test("should return 400 for invalid data", async () => {
      const mockError = { format: () => ({}) };
      (KhaltiWebhookDTO.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: mockError,
      });

      mockRequest = { body: {} };

      await controller.khaltiWebhook(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Invalid webhook data",
        errors: mockError.format(),
      });
    });
  });
});
