import { Request, Response } from "express";
import * as cartController from "../../../controllers/cart.controller";
import { CartService } from "../../../services/cart.service";

jest.mock("../../../services/cart.service");

describe("CartController Unit Tests", () => {
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

  test("getCart - should return user cart", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    const mockCart = { _id: "cart123", items: [] };
    jest
      .spyOn(CartService.prototype, "getCart")
      .mockResolvedValue(mockCart as any);

    await cartController.getCart(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, cart: mockCart }),
    );
  });

  test("addToCart - should add item to cart", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockRequest.body = { productId: "prod123", quantity: 2 };
    const mockCart = {
      _id: "cart123",
      items: [{ product: "prod123", quantity: 2 }],
    };
    jest
      .spyOn(CartService.prototype, "addToCart")
      .mockResolvedValue(mockCart as any);
    await cartController.addToCart(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, cart: mockCart }),
    );
  });

  test("updateCartItem - should update item", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockRequest.params = { productId: "prod123" };
    mockRequest.body = { quantity: 5 };
    const mockCart = {
      _id: "cart123",
      items: [{ product: "prod123", quantity: 5 }],
    };

    jest
      .spyOn(CartService.prototype, "updateCartItem")
      .mockResolvedValue(mockCart as any);
    await cartController.updateCartItem(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, cart: mockCart }),
    );
  });

  test("getCartCount - should return count", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    jest.spyOn(CartService.prototype, "getCartCount").mockResolvedValue(5);

    await cartController.getCartCount(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 5 }),
    );
  });
});
