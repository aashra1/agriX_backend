import { Request, Response } from "express";
import { OrderService } from "../../../services/order.service";
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from "../../../dtos/order.dto";

jest.mock("../../../dtos/order.dto");

import * as orderController from "../../../controllers/order.controller";

describe("OrderController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockResponse = { status: statusFn, json: jsonFn };

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("createOrder", () => {
    test("should create order successfully with DTO validation", async () => {
      const mockValidatedData = {
        items: [{ productId: "prod123", quantity: 2 }],
        shippingAddress: { street: "Test St" },
        paymentMethod: "Khalti",
      };

      (CreateOrderDto.parse as jest.Mock).mockReturnValue(mockValidatedData);
      const createSpy = jest.spyOn(OrderService.prototype, "createOrder");
      const mockOrder = { id: "order123", total: 200 };
      createSpy.mockResolvedValue(mockOrder as any);

      mockRequest = {
        user: { id: "user123" } as any,
        body: mockValidatedData,
      };

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(CreateOrderDto.parse).toHaveBeenCalledWith(mockValidatedData);
      expect(createSpy).toHaveBeenCalledWith("user123", mockValidatedData);
      expect(statusFn).toHaveBeenCalledWith(201);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Order created successfully",
        order: mockOrder,
      });
    });

    test("should return 400 for Zod validation error", async () => {
      const zodError = {
        name: "ZodError",
        errors: [{ path: ["items"], message: "Required" }],
      };
      (CreateOrderDto.parse as jest.Mock).mockImplementation(() => {
        throw zodError;
      });

      mockRequest = { user: { id: "user123" } as any, body: {} };

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: zodError.errors,
      });
    });

    test("should return 500 for server error", async () => {
      const mockValidatedData = { items: [] };
      (CreateOrderDto.parse as jest.Mock).mockReturnValue(mockValidatedData);

      const createSpy = jest.spyOn(OrderService.prototype, "createOrder");
      createSpy.mockRejectedValue(new Error("DB Error"));

      mockRequest = { user: { id: "user123" } as any, body: mockValidatedData };

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "DB Error",
      });
    });
  });

  describe("updateOrderStatus", () => {
    test("should update order status with DTO validation", async () => {
      const mockValidatedData = {
        orderStatus: "Shipped",
        trackingNumber: "TRACK123",
      };
      (UpdateOrderStatusDto.parse as jest.Mock).mockReturnValue(
        mockValidatedData,
      );

      const getSpy = jest.spyOn(OrderService.prototype, "getOrderById");
      const updateSpy = jest.spyOn(OrderService.prototype, "updateOrderStatus");

      const mockOrder = {
        id: "order123",
        items: [{ business: "biz123" }],
      };
      getSpy.mockResolvedValue(mockOrder as any);

      const updatedOrder = { id: "order123", status: "Shipped" };
      updateSpy.mockResolvedValue(updatedOrder as any);

      mockRequest = {
        user: { businessId: "biz123" } as any,
        params: { orderId: "order123" },
        body: { orderStatus: "Shipped", trackingNumber: "TRACK123" },
      };

      await orderController.updateOrderStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(UpdateOrderStatusDto.parse).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith("order123", "Shipped", "TRACK123");
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Order status updated successfully",
        order: updatedOrder,
      });
    });
  });

  describe("updatePaymentStatus", () => {
    test("should update payment status successfully", async () => {
      const mockValidatedData = { paymentStatus: "Paid" };
      (UpdatePaymentStatusDto.parse as jest.Mock).mockReturnValue(
        mockValidatedData,
      );

      jest.spyOn(OrderService.prototype, "getOrderById").mockResolvedValue({
        id: "order123",
        items: [{ business: "biz123" }],
      } as any);

      const updatePaymentSpy = jest.spyOn(
        OrderService.prototype,
        "updatePaymentStatus",
      );
      const updatedOrder = { id: "order123", paymentStatus: "Paid" };
      updatePaymentSpy.mockResolvedValue(updatedOrder as any);

      mockRequest = {
        user: { businessId: "biz123" } as any,
        params: { orderId: "order123" },
        body: { paymentStatus: "Paid" },
      };

      await orderController.updatePaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(updatePaymentSpy).toHaveBeenCalledWith("order123", "Paid");
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Payment status updated successfully",
        order: updatedOrder,
      });
    });
  });
});
