import { Request, Response } from "express";
import * as productController from "../../../controllers/product.controller";
import { ProductService } from "../../../services/product.service";

jest.mock("../../../services/product.service");

describe("ProductController Unit Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockService: jest.Mocked<ProductService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockService = {
      addProduct: jest.fn(),
      getBusinessProducts: jest.fn(),
      getProductById: jest.fn(),
      getProductsByCategory: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
    } as any;
    (productController as any).productService = mockService;
  });

  test("addProduct - should add product successfully", async () => {
    mockRequest.user = { id: "biz123", role: "Business" };
    mockRequest.body = {
      name: "Test Product",
      category: "cat123",
      price: 100,
      stock: 10,
      brand: "Test Brand",
      description: "Test Description",
    };
    mockRequest.file = { path: "image.jpg" } as any;

    const mockProduct = { _id: "prod123", ...mockRequest.body };
    mockService.addProduct.mockResolvedValue(mockProduct as any);

    await productController.addProduct(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Product added successfully.",
      product: mockProduct,
    });
  });

  test("addProduct - should return 400 if fields missing", async () => {
    mockRequest.user = { id: "biz123", role: "Business" };
    mockRequest.body = { name: "Test" };

    await productController.addProduct(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Name, category, price and stock are required.",
    });
  });

  test("getBusinessProducts - should return products", async () => {
    mockRequest.user = { id: "biz123", role: "Business" };
    const mockProducts = [
      { _id: "prod1", name: "Product 1" },
      { _id: "prod2", name: "Product 2" },
    ];
    mockService.getBusinessProducts.mockResolvedValue(mockProducts as any);

    await productController.getBusinessProducts(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockService.getBusinessProducts).toHaveBeenCalledWith("biz123");
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      products: mockProducts,
    });
  });

  test("getProductById - should return product if found", async () => {
    mockRequest.params = { id: "prod123" };
    const mockProduct = { _id: "prod123", name: "Test Product" };
    mockService.getProductById.mockResolvedValue(mockProduct as any);

    await productController.getProductById(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      product: mockProduct,
    });
  });

  test("getProductById - should return 404 if not found", async () => {
    mockRequest.params = { id: "prod123" };
    mockService.getProductById.mockResolvedValue(null);

    await productController.getProductById(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("deleteProduct - should return 403 if not owner", async () => {
    mockRequest.user = { id: "biz456", role: "Business" };
    mockRequest.params = { id: "prod123" };

    const mockProduct = {
      _id: "prod123",
      business: { toString: () => "biz789" },
    };
    mockService.getProductById.mockResolvedValue(mockProduct as any);

    await productController.deleteProduct(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied",
    });
  });
});
