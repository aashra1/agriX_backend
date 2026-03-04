import { CartSchema, CartItemSchema } from "../../../types/cart.type";
import { z } from "zod";

describe("Cart Schema Validation", () => {
  describe("CartItemSchema", () => {
    test("should validate a cart item with all properties", () => {
      const validItem = {
        product: "product123",
        quantity: 2,
        price: 100,
        discount: 10,
        business: "business123",
        name: "Test Product",
        image: "product.jpg",
      };

      const result = CartItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        product: "product123",
        quantity: 2,
        price: 100,
        discount: 10,
        business: "business123",
        name: "Test Product",
        image: "product.jpg",
      });
    });

    test("should validate a cart item with only required properties", () => {
      const validItem = {
        product: "product123",
        quantity: 1,
        price: 50,
        discount: 0,
        business: "business123",
      };

      const result = CartItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        product: "product123",
        quantity: 1,
        price: 50,
        discount: 0,
        business: "business123",
      });
      expect(result.data?.name).toBeUndefined();
      expect(result.data?.image).toBeUndefined();
    });

    test("should fail if quantity is zero or negative", () => {
      const testCases = [
        { quantity: 0, desc: "zero" },
        { quantity: -5, desc: "negative" },
      ];

      testCases.forEach(({ quantity, desc }) => {
        const invalidItem = {
          product: "product123",
          quantity,
          price: 50,
          business: "business123",
        };

        const result = CartItemSchema.safeParse(invalidItem);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("quantity");
          expect(result.error.issues[0].message).toContain("at least 1");
        }
      });
    });

    test("should fail if price is negative", () => {
      const invalidItem = {
        product: "product123",
        quantity: 2,
        price: -10,
        business: "business123",
      };

      const result = CartItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("price");
      }
    });

    test("should allow discount to be zero", () => {
      const validItem = {
        product: "product123",
        quantity: 5,
        price: 200,
        discount: 0,
        business: "business123",
      };

      const result = CartItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      expect(result.data?.discount).toBe(0);
    });

    test("should enforce discount between 0 and 100", () => {
      const testCases = [
        { discount: -10, expected: false },
        { discount: 150, expected: false },
        { discount: 25, expected: true },
        { discount: undefined, expected: true }, // default should be 0
      ];

      testCases.forEach(({ discount, expected }) => {
        const item = {
          product: "product123",
          quantity: 2,
          price: 100,
          business: "business123",
          ...(discount !== undefined && { discount }),
        };

        const result = CartItemSchema.safeParse(item);
        expect(result.success).toBe(expected);
        if (expected && discount === undefined) {
          expect(result.data?.discount).toBe(0); // Check default
        }
      });
    });

    test("should handle optional name and image fields", () => {
      const withOptional = {
        product: "product123",
        quantity: 2,
        price: 100,
        business: "business123",
        name: "Product Name",
        image: "image.jpg",
      };

      const withoutOptional = {
        product: "product123",
        quantity: 2,
        price: 100,
        business: "business123",
      };

      expect(CartItemSchema.safeParse(withOptional).success).toBe(true);
      expect(CartItemSchema.safeParse(withoutOptional).success).toBe(true);
    });
  });

  describe("CartSchema", () => {
    test("should validate a cart with items", () => {
      const validCart = {
        user: "user123",
        items: [
          {
            product: "product123",
            quantity: 2,
            price: 100,
            discount: 10,
            business: "business123",
            name: "Product 1",
            image: "img1.jpg",
          },
          {
            product: "product456",
            quantity: 1,
            price: 200,
            discount: 0,
            business: "business456",
            name: "Product 2",
          },
        ],
        totalAmount: 380,
        totalItems: 3,
      };

      const result = CartSchema.safeParse(validCart);
      expect(result.success).toBe(true);
      expect(result.data?.user).toBe("user123");
      expect(result.data?.items).toHaveLength(2);
      expect(result.data?.totalAmount).toBe(380);
      expect(result.data?.totalItems).toBe(3);
    });

    test("should validate an empty cart", () => {
      const validCart = {
        user: "user123",
        items: [],
        totalAmount: 0,
        totalItems: 0,
      };

      const result = CartSchema.safeParse(validCart);
      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(0);
      expect(result.data?.totalAmount).toBe(0);
      expect(result.data?.totalItems).toBe(0);
    });

    test("should allow optional date fields", () => {
      const now = new Date();
      const validCart = {
        user: "user123",
        items: [],
        totalAmount: 0,
        totalItems: 0,
        createdAt: now,
        updatedAt: now,
      };

      const result = CartSchema.safeParse(validCart);
      expect(result.success).toBe(true);
      expect(result.data?.createdAt).toBe(now);
      expect(result.data?.updatedAt).toBe(now);
    });

    test("should validate that items array contains valid cart items", () => {
      const cart = {
        user: "user123",
        items: [
          {
            product: "product123",
            quantity: 2,
            price: 100,
            discount: 10,
            business: "business123",
          },
          {
            product: "product456",
            quantity: -1, // Invalid
            price: 200,
            business: "business456",
          },
        ],
        totalAmount: 380,
        totalItems: 1,
      };

      const result = CartSchema.safeParse(cart);
      expect(result.success).toBe(false);
    });

    test("should fail if items is not an array", () => {
      const invalidCart = {
        user: "user123",
        items: "not-an-array",
        totalAmount: 0,
        totalItems: 0,
      };

      const result = CartSchema.safeParse(invalidCart);
      expect(result.success).toBe(false);
    });

    test("should handle carts with multiple items", () => {
      const items = Array(5)
        .fill(null)
        .map((_, i) => ({
          product: `product${i}`,
          quantity: i + 1,
          price: 100 * (i + 1),
          business: `business${i}`,
        }));

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const cart = {
        user: "user123",
        items,
        totalAmount,
        totalItems,
      };

      const result = CartSchema.safeParse(cart);
      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(5);
    });
  });

  describe("Cart Calculations", () => {
    test("should calculate totalAmount correctly from items", () => {
      const items = [
        {
          product: "product1",
          quantity: 3,
          price: 50,
          discount: 20,
          business: "business1",
        },
        {
          product: "product2",
          quantity: 2,
          price: 30,
          discount: 15,
          business: "business2",
        },
        {
          product: "product3",
          quantity: 1,
          price: 100,
          discount: 0,
          business: "business3",
        },
      ];

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

      // Calculate expected total: (3*50 - 20%) = 120, (2*30 - 15%) = 51, (1*100) = 100 => 271
      const calculatedTotal = items.reduce((acc, item) => {
        const itemTotal = item.price * item.quantity;
        const discountAmount = itemTotal * ((item.discount || 0) / 100);
        return acc + (itemTotal - discountAmount);
      }, 0);

      const cart = {
        user: "user123",
        items,
        totalAmount: calculatedTotal,
        totalItems,
      };

      const result = CartSchema.safeParse(cart);
      expect(result.success).toBe(true);
      expect(result.data?.totalAmount).toBe(271);
      expect(result.data?.totalItems).toBe(6);
    });
  });

  describe("Cart Validation Edge Cases", () => {
    test("should handle missing optional fields", () => {
      const minimalCart = {
        user: "user123",
        items: [],
        totalAmount: 0,
        totalItems: 0,
      };

      const result = CartSchema.safeParse(minimalCart);
      expect(result.success).toBe(true);
    });

    test("should handle very large numbers", () => {
      const cart = {
        user: "user123",
        items: [
          {
            product: "product1",
            quantity: 999999,
            price: 999999.99,
            business: "business1",
          },
        ],
        totalAmount: 999999 * 999999.99,
        totalItems: 999999,
      };

      const result = CartSchema.safeParse(cart);
      expect(result.success).toBe(true);
    });

    test("should validate that all items have required fields", () => {
      const incompleteItem = {
        product: "product1",
        // missing quantity
        price: 100,
        business: "business1",
      };

      const cart = {
        user: "user123",
        items: [incompleteItem],
        totalAmount: 100,
        totalItems: 1,
      };

      const result = CartSchema.safeParse(cart);
      expect(result.success).toBe(false);
    });
  });

  describe("Type Inference", () => {
    test("should properly infer types from schemas", () => {
      type InferredCart = z.infer<typeof CartSchema>;
      type InferredCartItem = z.infer<typeof CartItemSchema>;

      // This is a type test, not a runtime test
      const cartItem: InferredCartItem = {
        product: "p1",
        quantity: 2,
        price: 100,
        discount: 10,
        business: "b1",
      };

      const cart: InferredCart = {
        user: "u1",
        items: [cartItem],
        totalAmount: 180,
        totalItems: 2,
      };

      expect(cart.user).toBe("u1");
      expect(cart.items[0].quantity).toBe(2);
    });
  });
});
