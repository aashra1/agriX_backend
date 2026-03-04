import { ProductSchema } from "../../../types/product.type";

describe("Product Schema Validation", () => {
  describe("ProductSchema - Basic Validation", () => {
    test("should validate a product with all properties", () => {
      const createdAt = new Date("2024-01-01");
      const validProduct = {
        _id: "product123",
        business: "business123",
        name: "Test Product",
        category: "category123",
        brand: "Test Brand",
        price: 99.99,
        discount: 10,
        stock: 50,
        weight: 1.5,
        unitType: "kg",
        shortDescription: "Short description here",
        fullDescription: "Full product description with details",
        image: "product-image.jpg",
        createdAt: createdAt,
      };

      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        _id: "product123",
        business: "business123",
        name: "Test Product",
        price: 99.99,
        discount: 10,
        stock: 50,
        unitType: "kg",
      });
    });

    test("should validate a product with only required properties", () => {
      const validProduct = {
        business: "business123",
        name: "Basic Product",
        category: "category123",
        price: 49.99,
        stock: 10,
      };

      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      expect(result.data?.unitType).toBe("kg"); // Default value
      expect(result.data?._id).toBeUndefined();
      expect(result.data?.brand).toBeUndefined();
      expect(result.data?.discount).toBeUndefined();
      expect(result.data?.weight).toBeUndefined();
      expect(result.data?.shortDescription).toBeUndefined();
      expect(result.data?.fullDescription).toBeUndefined();
      expect(result.data?.image).toBeUndefined();
      expect(result.data?.createdAt).toBeUndefined();
    });

    test("should fail if business is missing", () => {
      const invalidProduct = {
        name: "Product",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("business");
      }
    });

    test("should fail if name is missing", () => {
      const invalidProduct = {
        business: "biz123",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("name");
    });

    test("should fail if price is negative", () => {
      const invalidProduct = {
        business: "biz123",
        name: "Product",
        category: "cat123",
        price: -10,
        stock: 10,
      };

      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    test("should fail if stock is negative", () => {
      const invalidProduct = {
        business: "biz123",
        name: "Product",
        category: "cat123",
        price: 100,
        stock: -5,
      };

      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe("ProductSchema - Optional Fields", () => {
    test("should allow zero discount", () => {
      const product = {
        business: "biz123",
        name: "No Discount",
        category: "cat123",
        price: 100,
        stock: 10,
        discount: 0,
      };

      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);
      expect(result.data?.discount).toBe(0);
    });

    test("should allow zero stock", () => {
      const product = {
        business: "biz123",
        name: "Out of Stock",
        category: "cat123",
        price: 100,
        stock: 0,
      };

      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);
      expect(result.data?.stock).toBe(0);
    });

    test("should handle different unit types", () => {
      const product1 = {
        business: "biz1",
        name: "Weight Based",
        category: "cat1",
        price: 100,
        stock: 10,
        unitType: "kg",
      };

      const product2 = {
        business: "biz2",
        name: "Unit Based",
        category: "cat2",
        price: 50,
        stock: 100,
        unitType: "piece",
      };

      const product3 = {
        business: "biz3",
        name: "Liter Based",
        category: "cat3",
        price: 75,
        stock: 20,
        unitType: "liter",
      };

      expect(ProductSchema.safeParse(product1).success).toBe(true);
      expect(ProductSchema.safeParse(product2).success).toBe(true);
      expect(ProductSchema.safeParse(product3).success).toBe(true);
    });

    test("should handle optional brand field", () => {
      const withBrand = {
        business: "biz123",
        name: "Branded",
        category: "cat123",
        price: 100,
        stock: 10,
        brand: "Nike",
      };

      const withoutBrand = {
        business: "biz123",
        name: "Generic",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      expect(ProductSchema.safeParse(withBrand).success).toBe(true);
      expect(ProductSchema.safeParse(withoutBrand).success).toBe(true);
    });

    test("should handle optional weight field", () => {
      const withWeight = {
        business: "biz123",
        name: "Heavy",
        category: "cat123",
        price: 100,
        stock: 10,
        weight: 2.5,
      };

      const withoutWeight = {
        business: "biz123",
        name: "Light",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      expect(ProductSchema.safeParse(withWeight).success).toBe(true);
      expect(ProductSchema.safeParse(withoutWeight).success).toBe(true);
    });

    test("should handle optional description fields", () => {
      const product = {
        business: "biz123",
        name: "Descriptive",
        category: "cat123",
        price: 100,
        stock: 10,
        shortDescription: "Short",
        fullDescription: "Long description with details",
      };

      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);
      expect(result.data?.shortDescription).toBe("Short");
      expect(result.data?.fullDescription).toBe(
        "Long description with details",
      );
    });

    test("should handle optional image field", () => {
      const withImage = {
        business: "biz123",
        name: "With Image",
        category: "cat123",
        price: 100,
        stock: 10,
        image: "https://example.com/image.jpg",
      };

      const withoutImage = {
        business: "biz123",
        name: "Without Image",
        category: "cat123",
        price: 100,
        stock: 10,
      };

      expect(ProductSchema.safeParse(withImage).success).toBe(true);
      expect(ProductSchema.safeParse(withoutImage).success).toBe(true);
    });

    test("should handle optional _id and createdAt", () => {
      const now = new Date();
      const product = {
        _id: "prod123",
        business: "biz123",
        name: "New Product",
        category: "cat123",
        price: 100,
        stock: 10,
        createdAt: now,
      };

      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);
      expect(result.data?._id).toBe("prod123");
      expect(result.data?.createdAt).toBe(now);
    });
  });

  describe("ProductSchema - Validation Rules", () => {
    test("should enforce discount between 0 and 100", () => {
      const validProduct = {
        business: "biz123",
        name: "Valid Discount",
        category: "cat123",
        price: 100,
        stock: 10,
        discount: 25,
      };

      const invalidProduct = {
        business: "biz123",
        name: "Invalid Discount",
        category: "cat123",
        price: 100,
        stock: 10,
        discount: 150,
      };

      expect(ProductSchema.safeParse(validProduct).success).toBe(true);
      expect(ProductSchema.safeParse(invalidProduct).success).toBe(false);
    });

    test("should enforce shortDescription max length", () => {
      const validProduct = {
        business: "biz123",
        name: "Valid",
        category: "cat123",
        price: 100,
        stock: 10,
        shortDescription: "A".repeat(150), // Max length
      };

      const invalidProduct = {
        business: "biz123",
        name: "Invalid",
        category: "cat123",
        price: 100,
        stock: 10,
        shortDescription: "A".repeat(151), // Too long
      };

      expect(ProductSchema.safeParse(validProduct).success).toBe(true);
      expect(ProductSchema.safeParse(invalidProduct).success).toBe(false);
    });
  });

  describe("ProductSchema - Array Operations", () => {
    test("should validate array of products", () => {
      const products = [
        {
          business: "biz1",
          name: "Product 1",
          category: "cat1",
          price: 100,
          stock: 10,
          unitType: "kg",
        },
        {
          business: "biz1",
          name: "Product 2",
          category: "cat2",
          price: 200,
          stock: 5,
          unitType: "kg",
        },
        {
          business: "biz2",
          name: "Product 3",
          category: "cat1",
          price: 150,
          stock: 8,
          unitType: "kg",
        },
      ];

      products.forEach((product) => {
        expect(ProductSchema.safeParse(product).success).toBe(true);
      });
    });

    test("should filter valid products", () => {
      const mixedProducts = [
        {
          business: "biz1",
          name: "Valid 1",
          category: "cat1",
          price: 100,
          stock: 10,
        },
        { business: "biz1", name: "", category: "cat2", price: 200, stock: 5 }, // Invalid name
        {
          business: "biz2",
          name: "Valid 2",
          category: "cat1",
          price: 150,
          stock: 8,
        },
      ];

      const validProducts = mixedProducts.filter(
        (p) => ProductSchema.safeParse(p).success,
      );

      expect(validProducts).toHaveLength(2);
      expect(validProducts[0].name).toBe("Valid 1");
      expect(validProducts[1].name).toBe("Valid 2");
    });
  });

  describe("ProductSchema - Calculations", () => {
    test("should calculate price after discount", () => {
      const product = {
        business: "biz1",
        name: "Discounted",
        category: "c1",
        price: 1000,
        discount: 20,
        stock: 10,
      };

      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);

      const finalPrice =
        result.data!.price * (1 - result.data!.discount! / 100);
      expect(finalPrice).toBe(800);
    });

    test("should calculate total value of stock", () => {
      const product = {
        business: "biz1",
        name: "Valuable",
        category: "c1",
        price: 100,
        stock: 50,
      };

      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);

      const totalValue = result.data!.price * result.data!.stock;
      expect(totalValue).toBe(5000);
    });
  });
});
