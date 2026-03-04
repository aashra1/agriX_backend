import { z } from "zod";
import { CreateProductDto, UpdateProductDto } from "../../../dtos/product.dto";

describe("Product DTOs", () => {
  describe("CreateProductDto", () => {
    test("should validate a valid create product DTO with all fields", () => {
      const validData = {
        name: "Smartphone",
        category: "electronics123",
        brand: "Samsung",
        price: 999.99,
        discount: 10,
        stock: 50,
        weight: 0.5,
        unitType: "kg",
        shortDescription: "Latest smartphone",
        fullDescription: "Full detailed description here",
        image: "phone.jpg",
      };

      const result = CreateProductDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Smartphone",
        category: "electronics123",
        brand: "Samsung",
        price: 999.99,
        discount: 10,
        stock: 50,
        weight: 0.5,
        unitType: "kg",
        shortDescription: "Latest smartphone",
        fullDescription: "Full detailed description here",
        image: "phone.jpg",
      });
    });

    test("should validate a create product DTO with only required fields", () => {
      const validData = {
        name: "Basic Product",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      const result = CreateProductDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: "Basic Product",
        category: "cat123",
        price: 100,
        stock: 10,
        unitType: "kg",
      });
      expect(result.data?.brand).toBeUndefined();
      expect(result.data?.discount).toBeUndefined();
      expect(result.data?.weight).toBeUndefined();
      expect(result.data?.shortDescription).toBeUndefined();
      expect(result.data?.fullDescription).toBeUndefined();
      expect(result.data?.image).toBeUndefined();
    });

    // FIX: This test should PASS - unitType is optional with default
    test("should use default unitType when missing", () => {
      const validData = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
        // unitType missing - should use default
      };

      const result = CreateProductDto.safeParse(validData);
      expect(result.success).toBe(true); // Should pass
      expect(result.data?.unitType).toBe("kg"); // Default applied
    });

    test("should fail if name is missing", () => {
      const invalidData = {
        category: "cat123",
        price: 100,
        stock: 10,
      };

      const result = CreateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if category is missing", () => {
      const invalidData = {
        name: "Product",
        price: 100,
        stock: 10,
      };

      const result = CreateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if price is missing", () => {
      const invalidData = {
        name: "Product",
        category: "cat123",
        stock: 10,
      };

      const result = CreateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if stock is missing", () => {
      const invalidData = {
        name: "Product",
        category: "cat123",
        price: 100,
      };

      const result = CreateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if price is negative", () => {
      const invalidData = {
        name: "Product",
        category: "cat123",
        price: -10,
        stock: 10,
      };

      const result = CreateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if stock is negative", () => {
      const invalidData = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: -5,
      };

      const result = CreateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should allow discount to be zero", () => {
      const validData = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
        discount: 0,
      };

      const result = CreateProductDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data?.discount).toBe(0);
    });

    test("should enforce discount between 0 and 100", () => {
      const invalidData = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
        discount: 150,
      };

      const result = CreateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should handle different unit types", () => {
      const testCases = [
        { unitType: "kg", expected: true },
        { unitType: "piece", expected: true },
        { unitType: "liter", expected: true },
      ];

      testCases.forEach(({ unitType, expected }) => {
        const data = {
          name: "Product",
          category: "cat123",
          price: 100,
          stock: 10,
          unitType,
        };

        const result = CreateProductDto.safeParse(data);
        expect(result.success).toBe(expected);
      });
    });

    test("should handle optional brand field", () => {
      const withBrand = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
        brand: "Nike",
      };

      const withoutBrand = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      expect(CreateProductDto.safeParse(withBrand).success).toBe(true);
      expect(CreateProductDto.safeParse(withoutBrand).success).toBe(true);
    });

    test("should handle optional weight field", () => {
      const withWeight = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
        weight: 2.5,
      };

      const withoutWeight = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      expect(CreateProductDto.safeParse(withWeight).success).toBe(true);
      expect(CreateProductDto.safeParse(withoutWeight).success).toBe(true);
    });

    test("should enforce shortDescription max length", () => {
      const validData = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
        shortDescription: "A".repeat(150),
      };

      const invalidData = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
        shortDescription: "A".repeat(151),
      };

      expect(CreateProductDto.safeParse(validData).success).toBe(true);
      expect(CreateProductDto.safeParse(invalidData).success).toBe(false);
    });
  });

  describe("UpdateProductDto", () => {
    test("should validate a valid update product DTO with all fields", () => {
      const validData = {
        name: "Updated Phone",
        category: "newCat123",
        brand: "Apple",
        price: 1099.99,
        discount: 15,
        stock: 30,
        weight: 0.4,
        unitType: "piece",
        shortDescription: "Updated short",
        fullDescription: "Updated full description",
        image: "new-phone.jpg",
      };

      const result = UpdateProductDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(validData);
    });

    test("should validate an update product DTO with single field", () => {
      const testCases = [
        { field: "name", value: "New Name" },
        { field: "price", value: 150 },
        { field: "stock", value: 25 },
        { field: "category", value: "newCat" },
        { field: "brand", value: "New Brand" },
        { field: "discount", value: 20 },
        { field: "unitType", value: "liter" },
      ];

      testCases.forEach(({ field, value }) => {
        const data = { [field]: value };
        const result = UpdateProductDto.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data).toMatchObject(data);
      });
    });

    test("should validate an empty update DTO with defaults", () => {
      const result = UpdateProductDto.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        unitType: "kg",
      });
    });

    test("should fail if name is empty string", () => {
      const invalidData = {
        name: "",
      };

      const result = UpdateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if price is negative", () => {
      const invalidData = {
        price: -10,
      };

      const result = UpdateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if stock is negative", () => {
      const invalidData = {
        stock: -5,
      };

      const result = UpdateProductDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail if discount is out of range", () => {
      const testCases = [{ discount: -10 }, { discount: 150 }];

      testCases.forEach((data) => {
        const result = UpdateProductDto.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    test("should allow updating multiple fields", () => {
      const validData = {
        name: "New Name",
        price: 200,
        stock: 15,
        brand: "New Brand",
        unitType: "piece",
      };

      const result = UpdateProductDto.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(validData);
    });
  });

  describe("DTO Type Inference", () => {
    test("should properly infer types from DTOs", () => {
      type InferredCreate = z.infer<typeof CreateProductDto>;
      type InferredUpdate = z.infer<typeof UpdateProductDto>;

      const createData: InferredCreate = {
        name: "Test Product",
        category: "cat123",
        price: 100,
        stock: 10,
        unitType: "kg",
      };

      const updateData: InferredUpdate = {
        name: "Updated",
        price: 150,
      };

      expect(createData.name).toBe("Test Product");
      expect(updateData.name).toBe("Updated");
      expect(updateData.price).toBe(150);
    });
  });
});
