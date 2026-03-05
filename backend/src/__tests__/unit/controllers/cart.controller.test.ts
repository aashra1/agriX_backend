
import { Request, Response } from "express";
import * as cartController from "../../../controllers/cart.controller";
import { CartService } from "../../../services/cart.service";

jest.mock("../../../services/cart.service");

describe("CartController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockResponse = { status: statusFn, json: jsonFn };
    jest.clearAllMocks();
  });

  describe("getCart", () => {
    test("should get user cart", async () => {
      mockRequest = { user: { id: "user123" } as any };
      const mockCart = { id: "cart123", items: [] };
      (CartService.prototype.getCart as jest.Mock).mockResolvedValue(mockCart);
      await cartController.getCart(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CartService.prototype.getCart).toHaveBeenCalledWith("user123");
      expect(jsonFn).toHaveBeenCalledWith({ success: true, cart: mockCart });
    });

    test("should handle error", async () => {
      mockRequest = { user: { id: "user123" } as any };
      (CartService.prototype.getCart as jest.Mock).mockRejectedValue(
        new Error("Failed"),
      );
      await cartController.getCart(
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

  describe("addToCart", () => {
    test("should add item to cart", async () => {
      mockRequest = {
        user: { id: "user123" } as any,
        body: { productId: "prod123", quantity: 2 },
      };
      const mockCart = {
        id: "cart123",
        items: [{ product: "prod123", quantity: 2 }],
      };
      (CartService.prototype.addToCart as jest.Mock).mockResolvedValue(
        mockCart,
      );
      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CartService.prototype.addToCart).toHaveBeenCalledWith("user123", {
        productId: "prod123",
        quantity: 2,
      });
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({ success: true, cart: mockCart });
    });

    test("should return 400 for zod error", async () => {
      mockRequest = { user: { id: "user123" } as any, body: {} };
      const zodError = { name: "ZodError", message: "Validation error" };
      (CartService.prototype.addToCart as jest.Mock).mockRejectedValue(
        zodError,
      );
      await cartController.addToCart(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(400);
    });
  });

  describe("updateCartItem", () => {
    test("should update cart item", async () => {
      mockRequest = {
        user: { id: "user123" } as any,
        params: { productId: "prod123" },
        body: { quantity: 3 },
      };
      const mockCart = {
        id: "cart123",
        items: [{ product: "prod123", quantity: 3 }],
      };
      (CartService.prototype.updateCartItem as jest.Mock).mockResolvedValue(
        mockCart,
      );
      await cartController.updateCartItem(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CartService.prototype.updateCartItem).toHaveBeenCalledWith(
        "user123",
        "prod123",
        { quantity: 3 },
      );
      expect(jsonFn).toHaveBeenCalledWith({ success: true, cart: mockCart });
    });

    test("should return 404 if item not found", async () => {
      mockRequest = {
        user: { id: "user123" } as any,
        params: { productId: "prod123" },
        body: { quantity: 3 },
      };
      (CartService.prototype.updateCartItem as jest.Mock).mockRejectedValue(
        new Error("Item not found in cart"),
      );
      await cartController.updateCartItem(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(404);
    });
  });

  describe("removeFromCart", () => {
    test("should remove item from cart", async () => {
      mockRequest = {
        user: { id: "user123" } as any,
        params: { productId: "prod123" },
      };
      const mockCart = { id: "cart123", items: [] };
      (CartService.prototype.removeFromCart as jest.Mock).mockResolvedValue(
        mockCart,
      );
      await cartController.removeFromCart(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CartService.prototype.removeFromCart).toHaveBeenCalledWith(
        "user123",
        "prod123",
      );
      expect(jsonFn).toHaveBeenCalledWith({ success: true, cart: mockCart });
    });
  });

  describe("clearCart", () => {
    test("should clear cart", async () => {
      mockRequest = { user: { id: "user123" } as any };
      const mockCart = { id: "cart123", items: [] };
      (CartService.prototype.clearCart as jest.Mock).mockResolvedValue(
        mockCart,
      );
      await cartController.clearCart(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CartService.prototype.clearCart).toHaveBeenCalledWith("user123");
      expect(jsonFn).toHaveBeenCalledWith({ success: true, cart: mockCart });
    });
  });

  describe("getCartCount", () => {
    test("should get cart count", async () => {
      mockRequest = { user: { id: "user123" } as any };
      (CartService.prototype.getCartCount as jest.Mock).mockResolvedValue(5);
      await cartController.getCartCount(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CartService.prototype.getCartCount).toHaveBeenCalledWith(
        "user123",
      );
      expect(jsonFn).toHaveBeenCalledWith({ success: true, count: 5 });
    });
  });
});
