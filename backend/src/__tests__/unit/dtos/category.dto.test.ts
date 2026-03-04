import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../../../dtos/category.dto";
import { z } from "zod";

describe("Category DTOs", () => {
  describe("CreateCategoryDto", () => {
    test("should validate a valid create category DTO with all fields", () => {
      const validData = {
        name: "Electronics",
        description: "Electronic items and gadgets",
        parentCategory: "parent123",
      };

      const result = CreateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Electronics",
        description: "Electronic items and gadgets",
        parentCategory: "parent123",
      });
    });

    test("should validate a create category DTO with only required fields", () => {
      const validData = {
        name: "Clothing",
      };

      const result = CreateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Clothing",
      });
      expect(result.data?.description).toBeUndefined();
      expect(result.data?.parentCategory).toBeUndefined();
    });

    test("should validate a create category DTO with name and description only", () => {
      const validData = {
        name: "Books",
        description: "All kinds of books",
      };

      const result = CreateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Books",
        description: "All kinds of books",
      });
      expect(result.data?.parentCategory).toBeUndefined();
    });

    test("should validate a create category DTO with name and parent only", () => {
      const validData = {
        name: "Laptops",
        parentCategory: "electronics123",
      };

      const result = CreateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Laptops",
        parentCategory: "electronics123",
      });
      expect(result.data?.description).toBeUndefined();
    });

    test("should fail if name is missing", () => {
      const invalidData = {
        description: "No name here",
      };

      const result = CreateCategoryDto.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    test("should fail if name is empty string", () => {
      const invalidData = {
        name: "",
      };

      const result = CreateCategoryDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should handle special characters in name", () => {
      const validData = {
        name: "Café & Restaurant",
      };

      const result = CreateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Café & Restaurant");
    });

    test("should handle very long category names", () => {
      const longName = "A".repeat(100);
      const validData = {
        name: longName,
      };

      const result = CreateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(longName);
      expect(result.data?.name.length).toBe(100);
    });
  });

  describe("UpdateCategoryDto", () => {
    test("should validate a valid update category DTO with all fields", () => {
      const validData = {
        name: "Updated Electronics",
        description: "Updated description",
        parentCategory: "newParent123",
      };

      const result = UpdateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Updated Electronics",
        description: "Updated description",
        parentCategory: "newParent123",
      });
    });

    test("should validate an update category DTO with only name", () => {
      const validData = {
        name: "New Name Only",
      };

      const result = UpdateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "New Name Only",
      });
    });

    test("should validate an update category DTO with only description", () => {
      const validData = {
        description: "New description only",
      };

      const result = UpdateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        description: "New description only",
      });
    });

    test("should validate an update category DTO with only parentCategory", () => {
      const validData = {
        parentCategory: "newParent456",
      };

      const result = UpdateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        parentCategory: "newParent456",
      });
    });

    test("should validate an empty update DTO (partial allows empty)", () => {
      const validData = {};

      const result = UpdateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    test("should allow updating name to empty string? No - should fail", () => {
      const invalidData = {
        name: "",
      };

      const result = UpdateCategoryDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should handle updating with multiple fields", () => {
      const validData = {
        name: "New Name",
        description: "New Description",
      };

      const result = UpdateCategoryDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "New Name",
        description: "New Description",
      });
    });
  });

  describe("DTO Type Inference", () => {
    test("should properly infer types from DTOs", () => {
      type InferredCreate = z.infer<typeof CreateCategoryDto>;
      type InferredUpdate = z.infer<typeof UpdateCategoryDto>;

      const createData: InferredCreate = {
        name: "Test Category",
      };

      const updateData: InferredUpdate = {
        name: "Updated",
        description: "New desc",
      };

      expect(createData.name).toBe("Test Category");
      expect(updateData.name).toBe("Updated");
      expect(updateData.description).toBe("New desc");
    });
  });
});
