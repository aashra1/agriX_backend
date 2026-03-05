import { Request, Response } from "express";
import * as productController from "../../../controllers/product.controller";
import { ProductService } from "../../../services/product.service";

jest.mock("../../../services/product.service");

describe("ProductController", () => {
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

  describe("addProduct", () => {
    test("should add product successfully", async () => {
      mockRequest = {
        user: { id: "biz123" } as any,
        body: { name: "Product", category: "cat123", price: 100, stock: 10 },
        file: { path: "img.jpg" } as any,
      };
      const mockProduct = { id: "prod123", name: "Product" };
      (ProductService.prototype.addProduct as jest.Mock).mockResolvedValue(
        mockProduct,
      );
      await productController.addProduct(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(ProductService.prototype.addProduct).toHaveBeenCalledWith(
        "biz123",
        { name: "Product", category: "cat123", price: 100, stock: 10 },
        "img.jpg",
      );
      expect(statusFn).toHaveBeenCalledWith(201);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Product added successfully.",
        product: mockProduct,
      });
    });

    test("should return 400 if fields missing", async () => {
      mockRequest = { user: { id: "biz123" } as any, body: {} };
      await productController.addProduct(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Name, category, price and stock are required.",
      });
    });

    test("should handle error", async () => {
      mockRequest = {
        user: { id: "biz123" } as any,
        body: { name: "Product", category: "cat123", price: 100, stock: 10 },
      };
      (ProductService.prototype.addProduct as jest.Mock).mockRejectedValue(
        new Error("Failed"),
      );
      await productController.addProduct(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(500);
    });
  });

  describe("getBusinessProducts", () => {
    test("should get business products", async () => {
      mockRequest = { user: { id: "biz123" } as any };
      const products = [{ id: "prod1" }, { id: "prod2" }];
      (
        ProductService.prototype.getBusinessProducts as jest.Mock
      ).mockResolvedValue(products);
      await productController.getBusinessProducts(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(ProductService.prototype.getBusinessProducts).toHaveBeenCalledWith(
        "biz123",
      );
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        count: 2,
        products,
      });
    });
  });

  describe("getProductById", () => {
    test("should get product by id", async () => {
      mockRequest = { params: { id: "prod123" } };
      const product = { id: "prod123", name: "Test" };
      (ProductService.prototype.getProductById as jest.Mock).mockResolvedValue(
        product,
      );
      await productController.getProductById(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(ProductService.prototype.getProductById).toHaveBeenCalledWith(
        "prod123",
      );
      expect(jsonFn).toHaveBeenCalledWith({ success: true, product });
    });

    test("should return 404 if not found", async () => {
      mockRequest = { params: { id: "prod123" } };
      (ProductService.prototype.getProductById as jest.Mock).mockResolvedValue(
        null,
      );
      await productController.getProductById(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(404);
    });
  });

  describe("getProductsByCategory", () => {
    test("should get products by category", async () => {
      mockRequest = { params: { categoryId: "cat123" } };
      const products = [{ id: "prod1" }];
      (
        ProductService.prototype.getProductsByCategory as jest.Mock
      ).mockResolvedValue(products);
      await productController.getProductsByCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(
        ProductService.prototype.getProductsByCategory,
      ).toHaveBeenCalledWith("cat123");
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        count: 1,
        products,
      });
    });

    test("should handle error", async () => {
      mockRequest = { params: { categoryId: "cat123" } };
      (
        ProductService.prototype.getProductsByCategory as jest.Mock
      ).mockRejectedValue(new Error("Failed"));
      await productController.getProductsByCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(500);
    });
  });

  describe("updateProduct", () => {
    test("should update product", async () => {
      mockRequest = {
        user: { id: "biz123" } as any,
        params: { id: "prod123" },
        body: { name: "Updated" },
        file: { path: "new.jpg" } as any,
      };
      const product = { id: "prod123", business: "biz123" };
      const updated = { id: "prod123", name: "Updated" };
      (ProductService.prototype.getProductById as jest.Mock).mockResolvedValue(
        product,
      );
      (ProductService.prototype.updateProduct as jest.Mock).mockResolvedValue(
        updated,
      );
      await productController.updateProduct(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(ProductService.prototype.updateProduct).toHaveBeenCalledWith(
        product,
        { name: "Updated" },
        "new.jpg",
      );
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Product updated",
        product: updated,
      });
    });

    test("should return 403 if not owner", async () => {
      mockRequest = {
        user: { id: "otherBiz" } as any,
        params: { id: "prod123" },
        body: {},
      };
      const product = { id: "prod123", business: "biz123" };
      (ProductService.prototype.getProductById as jest.Mock).mockResolvedValue(
        product,
      );
      await productController.updateProduct(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(403);
    });
  });

  describe("deleteProduct", () => {
    test("should delete product", async () => {
      mockRequest = {
        user: { id: "biz123" } as any,
        params: { id: "prod123" },
      };
      const product = { id: "prod123", business: "biz123" };
      (ProductService.prototype.getProductById as jest.Mock).mockResolvedValue(
        product,
      );
      (ProductService.prototype.deleteProduct as jest.Mock).mockResolvedValue(
        product,
      );
      await productController.deleteProduct(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(ProductService.prototype.deleteProduct).toHaveBeenCalledWith(
        "prod123",
      );
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Product deleted successfully",
      });
    });

    test("should return 403 if not owner", async () => {
      mockRequest = {
        user: { id: "otherBiz" } as any,
        params: { id: "prod123" },
      };
      const product = { id: "prod123", business: "biz123" };
      (ProductService.prototype.getProductById as jest.Mock).mockResolvedValue(
        product,
      );
      await productController.deleteProduct(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(403);
    });
  });
});
