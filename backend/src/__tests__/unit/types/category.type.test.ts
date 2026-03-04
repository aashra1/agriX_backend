import { CategorySchema } from "../../../types/category.type";

describe("Category Schema Validation", () => {
  describe("CategorySchema - Basic Validation", () => {
    test("should validate a category with all properties", () => {
      const validCategory = {
        _id: "category123",
        name: "Electronics",
        description: "Electronic items and gadgets",
        parentCategory: "parent456",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const result = CategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Electronics",
        description: "Electronic items and gadgets",
        parentCategory: "parent456",
      });
    });

    test("should validate a category with only required properties", () => {
      const validCategory = {
        name: "Clothing",
      };

      const result = CategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Clothing");
      expect(result.data?._id).toBeUndefined();
      expect(result.data?.description).toBeUndefined();
      expect(result.data?.parentCategory).toBeUndefined();
    });

    test("should fail if name is missing", () => {
      const invalidCategory = {
        description: "No name here",
      };

      const result = CategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    test("should fail if name is empty string", () => {
      const invalidCategory = {
        name: "",
      };

      const result = CategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });
  });

  describe("CategorySchema - Optional Fields", () => {
    test("should allow category without parent", () => {
      const category = {
        name: "Root Category",
        description: "This is a top-level category",
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.parentCategory).toBeUndefined();
    });

    test("should allow category without description", () => {
      const category = {
        name: "Uncategorized",
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBeUndefined();
    });

    test("should allow category with parent as string", () => {
      const category = {
        name: "Child Category",
        parentCategory: "507f1f77bcf86cd799439022",
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.parentCategory).toBe("507f1f77bcf86cd799439022");
    });
  });

  describe("CategorySchema - Edge Cases", () => {
    test("should handle long category names", () => {
      const longName = "A".repeat(100);
      const category = {
        name: longName,
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(longName);
      expect(result.data?.name.length).toBe(100);
    });

    test("should handle special characters in name", () => {
      const category = {
        name: "Café & Restaurant",
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Café & Restaurant");
    });

    test("should handle dates", () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const category = {
        name: "Dated Category",
        createdAt: yesterday,
        updatedAt: now,
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.createdAt).toBe(yesterday);
      expect(result.data?.updatedAt).toBe(now);
    });

    test("should handle future dates", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);

      const category = {
        name: "Future Category",
        createdAt: future,
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.createdAt).toBe(future);
    });
  });

  describe("CategorySchema - ObjectId Format", () => {
    test("should accept valid MongoDB ObjectId format for _id", () => {
      const category = {
        _id: "507f1f77bcf86cd799439011",
        name: "ObjectId Category",
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?._id).toMatch(/^[0-9a-fA-F]{24}$/);
    });

    test("should accept valid MongoDB ObjectId format for parentCategory", () => {
      const category = {
        name: "Child Category",
        parentCategory: "507f1f77bcf86cd799439022",
      };

      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
      expect(result.data?.parentCategory).toMatch(/^[0-9a-fA-F]{24}$/);
    });
  });

  describe("CategorySchema - Array Operations", () => {
    test("should validate array of categories", () => {
      const categories = [
        { name: "Category 1", _id: "1" },
        { name: "Category 2", _id: "2" },
        { name: "Category 3", _id: "3", parentCategory: "1" },
      ];

      categories.forEach((cat) => {
        const result = CategorySchema.safeParse(cat);
        expect(result.success).toBe(true);
      });
    });

    test("should filter valid categories", () => {
      const mixedCategories = [
        { name: "Valid 1", _id: "1" },
        { name: "", _id: "2" },
        { name: "Valid 2", _id: "3" },
      ];

      const validCategories = mixedCategories.filter(
        (cat) => CategorySchema.safeParse(cat).success,
      );

      expect(validCategories).toHaveLength(2);
      expect(validCategories[0].name).toBe("Valid 1");
      expect(validCategories[1].name).toBe("Valid 2");
    });
  });
});
