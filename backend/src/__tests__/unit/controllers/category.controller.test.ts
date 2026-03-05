import { Request, Response } from "express";
import * as categoryController from "../../../controllers/category.controller";
import { CategoryService } from "../../../services/category.service";

jest.mock("../../../services/category.service");

describe("CategoryController", () => {
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

  describe("addCategory", () => {
    test("should add category successfully", async () => {
      mockRequest = {
        body: {
          name: "Electronics",
          description: "Gadgets",
          parentCategory: "parent123",
        },
      };
      const mockCategory = { id: "cat123", name: "Electronics" };
      (CategoryService.prototype.addCategory as jest.Mock).mockResolvedValue(
        mockCategory,
      );
      await categoryController.addCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CategoryService.prototype.addCategory).toHaveBeenCalledWith({
        name: "Electronics",
        description: "Gadgets",
        parentCategory: "parent123",
      });
      expect(statusFn).toHaveBeenCalledWith(201);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Category created successfully",
        category: mockCategory,
      });
    });

    test("should return 400 if name missing", async () => {
      mockRequest = { body: {} };
      await categoryController.addCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Category name is required",
      });
    });

    test("should return 409 if duplicate", async () => {
      mockRequest = { body: { name: "Electronics" } };
      const error = { code: 11000 };
      (CategoryService.prototype.addCategory as jest.Mock).mockRejectedValue(
        error,
      );
      await categoryController.addCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(409);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Category already exists",
      });
    });

    test("should return 500 for server error", async () => {
      mockRequest = { body: { name: "Electronics" } };
      (CategoryService.prototype.addCategory as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );
      await categoryController.addCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(500);
    });
  });

  describe("getCategories", () => {
    test("should get all categories", async () => {
      mockRequest = {};
      const mockCategories = [
        { id: "cat1", name: "Electronics" },
        { id: "cat2", name: "Clothing" },
      ];
      (CategoryService.prototype.getCategories as jest.Mock).mockResolvedValue(
        mockCategories,
      );
      await categoryController.getCategories(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CategoryService.prototype.getCategories).toHaveBeenCalled();
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        count: 2,
        categories: mockCategories,
      });
    });

    test("should return empty array", async () => {
      mockRequest = {};
      (CategoryService.prototype.getCategories as jest.Mock).mockResolvedValue(
        [],
      );
      await categoryController.getCategories(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        count: 0,
        categories: [],
      });
    });
  });

  describe("getCategoryById", () => {
    test("should get category by id", async () => {
      mockRequest = { params: { id: "cat123" } };
      const mockCategory = { id: "cat123", name: "Electronics" };
      (
        CategoryService.prototype.getCategoryById as jest.Mock
      ).mockResolvedValue(mockCategory);
      await categoryController.getCategoryById(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CategoryService.prototype.getCategoryById).toHaveBeenCalledWith(
        "cat123",
      );
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
      });
    });

    test("should return 404 if not found", async () => {
      mockRequest = { params: { id: "cat123" } };
      (
        CategoryService.prototype.getCategoryById as jest.Mock
      ).mockResolvedValue(null);
      await categoryController.getCategoryById(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(404);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
      });
    });
  });

  describe("updateCategory", () => {
    test("should update category", async () => {
      mockRequest = { params: { id: "cat123" }, body: { name: "Updated" } };
      const mockCategory = { id: "cat123", name: "Old" };
      const updatedCategory = { id: "cat123", name: "Updated" };
      (
        CategoryService.prototype.getCategoryById as jest.Mock
      ).mockResolvedValue(mockCategory);
      (CategoryService.prototype.updateCategory as jest.Mock).mockResolvedValue(
        updatedCategory,
      );
      await categoryController.updateCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CategoryService.prototype.updateCategory).toHaveBeenCalledWith(
        mockCategory,
        { name: "Updated" },
      );
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Category updated successfully",
        category: updatedCategory,
      });
    });

    test("should return 404 if category not found", async () => {
      mockRequest = { params: { id: "cat123" }, body: {} };
      (
        CategoryService.prototype.getCategoryById as jest.Mock
      ).mockResolvedValue(null);
      await categoryController.updateCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteCategory", () => {
    test("should delete category", async () => {
      mockRequest = { params: { id: "cat123" } };
      const mockCategory = { id: "cat123" };
      (
        CategoryService.prototype.getCategoryById as jest.Mock
      ).mockResolvedValue(mockCategory);
      (CategoryService.prototype.deleteCategory as jest.Mock).mockResolvedValue(
        mockCategory,
      );
      await categoryController.deleteCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(CategoryService.prototype.deleteCategory).toHaveBeenCalledWith(
        "cat123",
      );
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Category deleted successfully",
      });
    });

    test("should return 404 if not found", async () => {
      mockRequest = { params: { id: "cat123" } };
      (
        CategoryService.prototype.getCategoryById as jest.Mock
      ).mockResolvedValue(null);
      await categoryController.deleteCategory(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(404);
    });
  });
});
