// src/__tests__/unit/category/service/category.service.test.ts
import { Types } from "mongoose";
import { CategoryService } from "../../../../services/category.service";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../../../../dtos/category.dto";

const mockRepoMethods = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock("../../../../repositories/category.repository", () => ({
  CategoryRepository: jest.fn().mockImplementation(() => mockRepoMethods),
}));

const mockObjectId = (id: string) => ({ toString: () => id }) as any;
jest
  .spyOn(Types, "ObjectId")
  .mockImplementation((id?: any) =>
    mockObjectId(id?.toString?.() || "507f1f77bcf86cd799439011"),
  );

describe("CategoryService Unit Tests", () => {
  let service: CategoryService;
  let repoMock: typeof mockRepoMethods;

  const makeCategoryDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? mockObjectId("507f1f77bcf86cd799439011"),
      name: overrides.name ?? "Test Category",
      description: overrides.description ?? "Test Description",
      parentCategory: overrides.parentCategory ?? null,
      __v: 0,
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockRepoMethods).forEach((mock) => mock.mockReset());
    service = new CategoryService();
    repoMock = mockRepoMethods;
  });

  describe("addCategory", () => {
    test("should create category without parent", async () => {
      const dto: CreateCategoryDto = {
        name: "Electronics",
        description: "Electronic items and gadgets",
      };

      const expectedData = {
        name: "Electronics",
        description: "Electronic items and gadgets",
        parentCategory: undefined,
      };

      const createdCategory = makeCategoryDoc({
        name: "Electronics",
        description: "Electronic items and gadgets",
      });

      repoMock.create.mockResolvedValue(createdCategory);

      const result = await service.addCategory(dto);

      expect(repoMock.create).toHaveBeenCalledWith(expectedData);
      expect(result).toEqual(createdCategory);
    });

    test("should create category with parent", async () => {
      const parentId = "507f1f77bcf86cd799439022";
      const dto: CreateCategoryDto = {
        name: "Laptops",
        description: "All laptop products",
        parentCategory: parentId,
      };

      const createdCategory = makeCategoryDoc({
        name: "Laptops",
        description: "All laptop products",
        parentCategory: mockObjectId(parentId),
      });

      repoMock.create.mockResolvedValue(createdCategory);

      const result = await service.addCategory(dto);

      expect(repoMock.create).toHaveBeenCalledWith({
        name: "Laptops",
        description: "All laptop products",
        parentCategory: expect.any(Object),
      });

      const callArg = repoMock.create.mock.calls[0][0];
      expect(callArg.parentCategory.toString()).toBe(parentId);
      expect(result).toEqual(createdCategory);
    });

    test("should handle parent category as ObjectId conversion", async () => {
      const parentId = "507f1f77bcf86cd799439022";
      const dto: CreateCategoryDto = {
        name: "Gaming Laptops",
        description: "High-performance gaming laptops",
        parentCategory: parentId,
      };

      const createdCategory = makeCategoryDoc({
        name: "Gaming Laptops",
        description: "High-performance gaming laptops",
        parentCategory: mockObjectId(parentId),
      });

      repoMock.create.mockResolvedValue(createdCategory);

      const result = await service.addCategory(dto);

      expect(repoMock.create).toHaveBeenCalled();
      expect(result.parentCategory?.toString()).toBe(parentId);
    });
  });

  describe("getCategories", () => {
    test("should return all categories", async () => {
      const categories = [
        makeCategoryDoc({
          _id: mockObjectId("507f1f77bcf86cd799439011"),
          name: "Electronics",
          description: "Electronic items",
        }),
        makeCategoryDoc({
          _id: mockObjectId("507f1f77bcf86cd799439012"),
          name: "Clothing",
          description: "Apparel and fashion",
        }),
        makeCategoryDoc({
          _id: mockObjectId("507f1f77bcf86cd799439013"),
          name: "Books",
          description: "All types of books",
        }),
      ];

      repoMock.findAll.mockResolvedValue(categories);

      const result = await service.getCategories();

      expect(repoMock.findAll).toHaveBeenCalled();
      expect(result).toEqual(categories);
      expect(result).toHaveLength(3);
    });

    test("should return empty array if no categories exist", async () => {
      repoMock.findAll.mockResolvedValue([]);

      const result = await service.getCategories();

      expect(repoMock.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("getCategoryById", () => {
    test("should return category by id", async () => {
      const categoryId = "507f1f77bcf86cd799439011";
      const category = makeCategoryDoc({
        _id: mockObjectId(categoryId),
        name: "Electronics",
        description: "Electronic items",
      });

      repoMock.findById.mockResolvedValue(category);

      const result = await service.getCategoryById(categoryId);

      expect(repoMock.findById).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(category);
    });

    test("should return null if category not found", async () => {
      const categoryId = "507f1f77bcf86cd799439011";

      repoMock.findById.mockResolvedValue(null);

      const result = await service.getCategoryById(categoryId);

      expect(repoMock.findById).toHaveBeenCalledWith(categoryId);
      expect(result).toBeNull();
    });
  });

  describe("updateCategory", () => {
    test("should update category name and description without changing parent", async () => {
      const categoryId = "507f1f77bcf86cd799439011";
      const categoryDoc = makeCategoryDoc({
        _id: mockObjectId(categoryId),
        name: "Electronics",
        description: "Electronic items",
        parentCategory: null,
      });

      const dto: UpdateCategoryDto = {
        name: "Electronics & Gadgets",
        description: "All electronic products and accessories",
      };

      const updatedCategory = makeCategoryDoc({
        ...categoryDoc,
        name: "Electronics & Gadgets",
        description: "All electronic products and accessories",
      });

      repoMock.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(categoryDoc, dto);

      expect(categoryDoc.name).toBe("Electronics & Gadgets");
      expect(categoryDoc.description).toBe(
        "All electronic products and accessories",
      );
      expect(categoryDoc.parentCategory).toBeNull();
      expect(repoMock.update).toHaveBeenCalledWith(categoryDoc);
      expect(result).toEqual(updatedCategory);
    });

    test("should add parent category to existing category", async () => {
      const categoryId = "507f1f77bcf86cd799439011";
      const parentId = "507f1f77bcf86cd799439022";

      const categoryDoc = makeCategoryDoc({
        _id: mockObjectId(categoryId),
        name: "Laptops",
        description: "All laptops",
        parentCategory: null,
      });

      const dto: UpdateCategoryDto = {
        parentCategory: parentId,
      };

      const updatedCategory = makeCategoryDoc({
        ...categoryDoc,
        parentCategory: mockObjectId(parentId),
      });

      repoMock.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(categoryDoc, dto);

      expect(categoryDoc.parentCategory).toBeDefined();
      expect(categoryDoc.parentCategory?.toString()).toBe(parentId);
      expect(categoryDoc.name).toBe("Laptops");
      expect(categoryDoc.description).toBe("All laptops");
      expect(repoMock.update).toHaveBeenCalledWith(categoryDoc);
      expect(result).toEqual(updatedCategory);
    });

    test("should not change parent category when parentCategory is undefined", async () => {
      const categoryId = "507f1f77bcf86cd799439011";
      const oldParentId = "507f1f77bcf86cd799439022";

      const categoryDoc = makeCategoryDoc({
        _id: mockObjectId(categoryId),
        name: "Gaming Laptops",
        description: "High-performance gaming laptops",
        parentCategory: mockObjectId(oldParentId),
      });

      const dto: UpdateCategoryDto = {
        name: "Updated Gaming Laptops",
      };

      const updatedCategory = makeCategoryDoc({
        ...categoryDoc,
        name: "Updated Gaming Laptops",
        parentCategory: mockObjectId(oldParentId),
      });

      repoMock.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(categoryDoc, dto);

      expect(categoryDoc.parentCategory?.toString()).toBe(oldParentId);
      expect(categoryDoc.name).toBe("Updated Gaming Laptops");
      expect(repoMock.update).toHaveBeenCalledWith(categoryDoc);
      expect(result).toEqual(updatedCategory);
    });

    test("should update multiple fields including parent", async () => {
      const categoryId = "507f1f77bcf86cd799439011";
      const parentId = "507f1f77bcf86cd799439022";

      const categoryDoc = makeCategoryDoc({
        _id: mockObjectId(categoryId),
        name: "Old Name",
        description: "Old Description",
        parentCategory: null,
      });

      const dto: UpdateCategoryDto = {
        name: "New Category Name",
        description: "New category description",
        parentCategory: parentId,
      };

      const updatedCategory = makeCategoryDoc({
        ...categoryDoc,
        name: "New Category Name",
        description: "New category description",
        parentCategory: mockObjectId(parentId),
      });

      repoMock.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(categoryDoc, dto);

      expect(categoryDoc.name).toBe("New Category Name");
      expect(categoryDoc.description).toBe("New category description");
      expect(categoryDoc.parentCategory).toBeDefined();
      expect(categoryDoc.parentCategory?.toString()).toBe(parentId);
      expect(repoMock.update).toHaveBeenCalledWith(categoryDoc);
      expect(result).toEqual(updatedCategory);
    });

    test("should handle parent category conversion correctly", async () => {
      const categoryId = "507f1f77bcf86cd799439011";
      const parentId = "507f1f77bcf86cd799439022";

      const categoryDoc = makeCategoryDoc({
        _id: mockObjectId(categoryId),
        name: "Subcategory",
      });

      const dto: UpdateCategoryDto = {
        parentCategory: parentId,
      };

      const objectIdSpy = jest.spyOn(Types, "ObjectId");

      await service.updateCategory(categoryDoc, dto);

      expect(objectIdSpy).toHaveBeenCalledWith(parentId);

      objectIdSpy.mockRestore();
    });
  });

  describe("deleteCategory", () => {
    test("should delete category by id", async () => {
      const categoryId = "507f1f77bcf86cd799439011";
      const deletedCategory = makeCategoryDoc({
        _id: mockObjectId(categoryId),
        name: "Category to Delete",
      });

      repoMock.delete.mockResolvedValue(deletedCategory);

      const result = await service.deleteCategory(categoryId);

      expect(repoMock.delete).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(deletedCategory);
    });

    test("should return null if category not found for deletion", async () => {
      const categoryId = "507f1f77bcf86cd799439011";

      repoMock.delete.mockResolvedValue(null);

      const result = await service.deleteCategory(categoryId);

      expect(repoMock.delete).toHaveBeenCalledWith(categoryId);
      expect(result).toBeNull();
    });
  });
});
