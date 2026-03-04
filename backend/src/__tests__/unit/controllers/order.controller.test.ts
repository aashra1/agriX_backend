import { Request, Response } from "express";
import * as orderController from "../../../controllers/order.controller";
import { OrderService } from "../../../services/order.service";

jest.mock("../../../services/order.service");

describe("OrderController Unit Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test("createOrder - should create order successfully", async () => {
    mockRequest.user = { id: "user123", role: "User" };

    // Updated body to satisfy Zod validation based on your Mongoose Schema
    mockRequest.body = {
      items: [
        {
          product: "65f12345678901234567890a",
          name: "Test Product",
          price: 100,
          quantity: 1,
          business: "65f12345678901234567890b",
        },
      ],
      shippingAddress: {
        fullName: "John Doe",
        phone: "9841234567",
        addressLine1: "Kathmandu",
        city: "Kathmandu",
        state: "Bagmati",
        postalCode: "44600",
      },
      paymentMethod: "khalti",
      notes: "Handle with care",
    };

    // Mock the service to return a successful order object
    jest.spyOn(OrderService.prototype, "createOrder").mockResolvedValue({
      _id: "order123",
      ...mockRequest.body,
      total: 113, // 100 + 13% tax
    } as any);

    await orderController.createOrder(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Order created successfully",
      }),
    );
  });

  test("createOrder - should handle validation error", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    // Sending empty/invalid data to trigger ZodError
    mockRequest.body = { items: [] };

    await orderController.createOrder(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  test("getUserOrders - should return paginated orders", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockRequest.query = { page: "1", limit: "10" };

    jest
      .spyOn(OrderService.prototype, "getUserOrders")
      .mockResolvedValue([{ _id: "1" }] as any);
    jest
      .spyOn(OrderService.prototype, "getUserOrdersCount")
      .mockResolvedValue(1);

    await orderController.getUserOrders(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.json).toHaveBeenCalled();
  });

  test("getOrderById - should allow user to access their order", async () => {
    mockRequest.user = { id: "user123", role: "User", isAdmin: false };
    mockRequest.params = { orderId: "order123" };

    jest.spyOn(OrderService.prototype, "getOrderById").mockResolvedValue({
      user: "user123",
      items: [],
    } as any);

    await orderController.getOrderById(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.json).toHaveBeenCalled();
  });

  test("getOrderById - should deny access to unauthorized user", async () => {
    mockRequest.user = { id: "user456", role: "User", isAdmin: false };
    mockRequest.params = { orderId: "order123" };

    jest.spyOn(OrderService.prototype, "getOrderById").mockResolvedValue({
      user: "user123",
      items: [],
    } as any);

    await orderController.getOrderById(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });

  test("updateOrderStatus - should update status", async () => {
    mockRequest.user = { id: "biz123", role: "Business", businessId: "biz123" };
    mockRequest.params = { orderId: "order123" };
    mockRequest.body = { orderStatus: "shipped" };

    jest.spyOn(OrderService.prototype, "getOrderById").mockResolvedValue({
      items: [{ business: "biz123" }],
    } as any);
    jest
      .spyOn(OrderService.prototype, "updateOrderStatus")
      .mockResolvedValue({} as any);

    await orderController.updateOrderStatus(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.json).toHaveBeenCalled();
  });
});
