import { Types } from "mongoose";
import { CategoryService } from "../../../services/category.service";
import { CategoryRepository } from "../../../repositories/category.repository";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../../../dtos/category.dto";

jest.mock("../../../repositories/category.repository");

describe("CategoryService", () => {
  let service: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  const validIds = {
    cat1: "507f1f77bcf86cd799439011",
    cat2: "507f191e810c19729de860ea",
    parent: "507f1f77bcf86cd799439022",
    newParent: "60b8d2919ad39d00158a5948",
  };

  const mockCategoryDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? new Types.ObjectId(validIds.cat1),
      name: overrides.name ?? "Test Category",
      description: overrides.description ?? "Test Description",
      parentCategory: overrides.parentCategory ?? null,
      __v: 0,
    };

    const doc = {
      ...base,
      ...overrides,
      toObject: function () {
        const { __v, ...rest } = { ...base, ...this };
        return rest;
      },
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    return doc;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryRepository =
      new CategoryRepository() as jest.Mocked<CategoryRepository>;
    service = new CategoryService();

    (service as any).repository = mockCategoryRepository;
  });

  describe("addCategory", () => {
    test("should create category without parent", async () => {
      const dto: CreateCategoryDto = {
        name: "Electronics",
        description: "Electronic items",
      };

      const createdCategory = mockCategoryDoc(dto);
      mockCategoryRepository.create.mockResolvedValue(createdCategory as any);

      const result = await service.addCategory(dto);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        name: "Electronics",
        description: "Electronic items",
        parentCategory: undefined,
      });
      expect(result).toEqual(createdCategory);
    });

    test("should create category with parent", async () => {
      const dto: CreateCategoryDto = {
        name: "Laptops",
        description: "All laptop products",
        parentCategory: validIds.parent,
      };

      const createdCategory = mockCategoryDoc({
        ...dto,
        parentCategory: new Types.ObjectId(validIds.parent),
      });

      mockCategoryRepository.create.mockResolvedValue(createdCategory as any);

      const result = await service.addCategory(dto);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        name: "Laptops",
        description: "All laptop products",
        parentCategory: expect.any(Types.ObjectId),
      });
      expect(result.parentCategory?.toString()).toBe(validIds.parent);
    });
  });

  describe("getCategories", () => {
    test("should return all categories", async () => {
      const categories = [
        mockCategoryDoc({
          _id: new Types.ObjectId(validIds.cat1),
          name: "Electronics",
        }),
        mockCategoryDoc({
          _id: new Types.ObjectId(validIds.cat2),
          name: "Clothing",
        }),
      ];

      mockCategoryRepository.findAll.mockResolvedValue(categories as any);

      const result = await service.getCategories();

      expect(mockCategoryRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(categories);
    });

    test("should return empty array if none exist", async () => {
      mockCategoryRepository.findAll.mockResolvedValue([]);
      const result = await service.getCategories();
      expect(result).toEqual([]);
    });
  });

  describe("getCategoryById", () => {
    test("should return category by id", async () => {
      const category = mockCategoryDoc({ name: "Electronics" });
      mockCategoryRepository.findById.mockResolvedValue(category as any);

      const result = await service.getCategoryById(validIds.cat1);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(
        validIds.cat1,
      );
      expect(result).toEqual(category);
    });

    test("should return null if not found", async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);
      const result = await service.getCategoryById(validIds.cat1);
      expect(result).toBeNull();
    });
  });

  describe("updateCategory", () => {
    test("should update category name and description", async () => {
      const categoryDoc = mockCategoryDoc({
        name: "Electronics",
        description: "Old desc",
      });

      const dto: UpdateCategoryDto = {
        name: "Electronics & Gadgets",
        description: "New desc",
      };

      // Mock update to return the mutated doc
      mockCategoryRepository.update.mockResolvedValue(categoryDoc as any);

      const result = await service.updateCategory(categoryDoc as any, dto);

      expect(categoryDoc.name).toBe("Electronics & Gadgets");
      expect(categoryDoc.description).toBe("New desc");
      expect(mockCategoryRepository.update).toHaveBeenCalledWith(categoryDoc);
      expect(result).toEqual(categoryDoc);
    });

    test("should add parent category", async () => {
      const categoryDoc = mockCategoryDoc({
        name: "Laptops",
        parentCategory: null,
      });
      const dto: UpdateCategoryDto = { parentCategory: validIds.parent };

      mockCategoryRepository.update.mockResolvedValue(categoryDoc as any);

      const result = await service.updateCategory(categoryDoc as any, dto);

      expect(categoryDoc.parentCategory).toBeInstanceOf(Types.ObjectId);
      expect(categoryDoc.parentCategory?.toString()).toBe(validIds.parent);
      expect(mockCategoryRepository.update).toHaveBeenCalled();
    });

    test("should not change parent when not provided in DTO", async () => {
      const categoryDoc = mockCategoryDoc({
        parentCategory: new Types.ObjectId(validIds.parent),
      });

      const dto: UpdateCategoryDto = { name: "Updated Name" };
      mockCategoryRepository.update.mockResolvedValue(categoryDoc as any);

      await service.updateCategory(categoryDoc as any, dto);

      expect(categoryDoc.parentCategory?.toString()).toBe(validIds.parent);
      expect(categoryDoc.name).toBe("Updated Name");
    });

    test("should update multiple fields including parent", async () => {
      const categoryDoc = mockCategoryDoc({
        name: "Old",
        parentCategory: null,
      });
      const dto: UpdateCategoryDto = {
        name: "New",
        parentCategory: validIds.newParent,
      };

      mockCategoryRepository.update.mockResolvedValue(categoryDoc as any);

      await service.updateCategory(categoryDoc as any, dto);

      expect(categoryDoc.name).toBe("New");
      expect(categoryDoc.parentCategory?.toString()).toBe(validIds.newParent);
    });
  });

  describe("deleteCategory", () => {
    test("should delete category by id", async () => {
      const deletedCategory = mockCategoryDoc({ name: "To Delete" });
      mockCategoryRepository.delete.mockResolvedValue(deletedCategory as any);

      const result = await service.deleteCategory(validIds.cat1);

      expect(mockCategoryRepository.delete).toHaveBeenCalledWith(validIds.cat1);
      expect(result).toEqual(deletedCategory);
    });

    test("should return null if not found", async () => {
      mockCategoryRepository.delete.mockResolvedValue(null);
      const result = await service.deleteCategory(validIds.cat1);
      expect(result).toBeNull();
    });
  });
});
