import { Request, Response } from "express";
import * as categoryController from "../../../controllers/category.controller";
import { CategoryService } from "../../../services/category.service";

jest.mock("../../../services/category.service");

describe("CategoryController Unit Tests", () => {
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

  test("addCategory - should add category successfully", async () => {
    mockRequest.body = { name: "Electronics", description: "Gadgets" };

    jest.spyOn(CategoryService.prototype, "addCategory").mockResolvedValue({
      _id: "cat123",
      name: "Electronics",
    } as any);

    await categoryController.addCategory(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  test("getCategories - should return all categories", async () => {
    const mockCategories = [
      { _id: "1", name: "Cat 1" },
      { _id: "2", name: "Cat 2" },
    ];
    jest
      .spyOn(CategoryService.prototype, "getCategories")
      .mockResolvedValue(mockCategories as any);

    await categoryController.getCategories(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 2,
        categories: mockCategories,
      }),
    );
  });

  test("getCategoryById - should return 404 if not found", async () => {
    mockRequest.params = { id: "cat123" };

    jest
      .spyOn(CategoryService.prototype, "getCategoryById")
      .mockResolvedValue(null);

    await categoryController.getCategoryById(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });
});
