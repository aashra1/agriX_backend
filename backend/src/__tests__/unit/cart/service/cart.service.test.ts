import { CartService } from "../../../../services/cart.service";

const mockCartRepoMethods = {
  findByUser: jest.fn(),
  create: jest.fn(),
  updateItemQuantity: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
};

const mockProductRepoMethods = {
  findById: jest.fn(),
};

jest.mock("../../../../repositories/cart.repository", () => ({
  CartRepository: jest.fn().mockImplementation(() => mockCartRepoMethods),
}));

jest.mock("../../../../repositories/product.repository", () => ({
  ProductRepository: jest.fn().mockImplementation(() => mockProductRepoMethods),
}));

describe("CartService Unit Tests", () => {
  let service: CartService;
  let cartRepoMock: typeof mockCartRepoMethods;
  let productRepoMock: typeof mockProductRepoMethods;

  const makeCartDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "cart123",
      user: overrides.user ?? "user123",
      items: overrides.items ?? [],
      totalItems: overrides.totalItems ?? 0,
      totalPrice: overrides.totalPrice ?? 0,
      totalDiscount: overrides.totalDiscount ?? 0,
      finalAmount: overrides.finalAmount ?? 0,
      __v: 0,
    };

    return {
      ...base,
      save: jest.fn().mockResolvedValue(base),
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  const makeProductDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "product123",
      name: overrides.name ?? "Test Product",
      price: overrides.price ?? 100,
      stock: overrides.stock ?? 10,
      discount: overrides.discount ?? 0,
      business: overrides.business ?? "business123",
      image: overrides.image ?? "product.jpg",
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    Object.values(mockCartRepoMethods).forEach((mock) => mock.mockReset());
    Object.values(mockProductRepoMethods).forEach((mock) => mock.mockReset());

    service = new CartService();
    cartRepoMock = mockCartRepoMethods;
    productRepoMock = mockProductRepoMethods;
  });

  describe("getCart", () => {
    test("should return existing cart if found", async () => {
      const userId = "user123";
      const existingCart = makeCartDoc({ user: userId });

      cartRepoMock.findByUser.mockResolvedValue(existingCart);

      const result = await service.getCart(userId);

      expect(cartRepoMock.findByUser).toHaveBeenCalledWith(userId);
      expect(cartRepoMock.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingCart);
    });

    test("should create new cart if not found", async () => {
      const userId = "user123";
      const newCart = makeCartDoc({ user: userId });

      cartRepoMock.findByUser.mockResolvedValue(null);
      cartRepoMock.create.mockResolvedValue(newCart);

      const result = await service.getCart(userId);

      expect(cartRepoMock.findByUser).toHaveBeenCalledWith(userId);
      expect(cartRepoMock.create).toHaveBeenCalledWith(userId);
      expect(result).toEqual(newCart);
    });
  });

  describe("addToCart", () => {
    const userId = "user123";
    const dto = { productId: "product123", quantity: 2 };

    test("should throw if product not found", async () => {
      productRepoMock.findById.mockResolvedValue(null);

      await expect(service.addToCart(userId, dto)).rejects.toThrow(
        "Product not found",
      );
      expect(productRepoMock.findById).toHaveBeenCalledWith("product123");
    });

    test("should throw if insufficient stock", async () => {
      const product = makeProductDoc({ _id: "product123", stock: 1 });
      productRepoMock.findById.mockResolvedValue(product);

      await expect(service.addToCart(userId, dto)).rejects.toThrow(
        "Only 1 items available in stock",
      );
    });

    test("should create new cart and add item if cart doesn't exist", async () => {
      const product = makeProductDoc({
        _id: "product123",
        price: 100,
        discount: 10,
      });
      productRepoMock.findById.mockResolvedValue(product);

      cartRepoMock.findByUser.mockResolvedValue(null);

      const newCart = makeCartDoc({
        user: userId,
        items: [],
        save: jest.fn().mockResolvedValue({
          items: [
            {
              product: "product123",
              quantity: 2,
              price: 100,
              discount: 10,
              business: "business123",
              name: "Test Product",
              image: "product.jpg",
            },
          ],
        }),
      });
      cartRepoMock.create.mockResolvedValue(newCart);

      const result = await service.addToCart(userId, dto);

      expect(cartRepoMock.findByUser).toHaveBeenCalledWith(userId);
      expect(cartRepoMock.create).toHaveBeenCalledWith(userId);
      expect(newCart.save).toHaveBeenCalled();
    });

    test("should add new item to existing cart", async () => {
      const product = makeProductDoc({
        _id: "product123",
        price: 100,
        discount: 10,
      });
      productRepoMock.findById.mockResolvedValue(product);

      const existingCart = makeCartDoc({
        user: userId,
        items: [],
        save: jest.fn().mockResolvedValue({
          items: [
            {
              product: "product123",
              quantity: 2,
              price: 100,
              discount: 10,
              business: "business123",
              name: "Test Product",
              image: "product.jpg",
            },
          ],
        }),
      });
      cartRepoMock.findByUser.mockResolvedValue(existingCart);

      const result = await service.addToCart(userId, dto);

      expect(existingCart.items).toHaveLength(1);
      expect(existingCart.items[0]).toMatchObject({
        product: "product123",
        quantity: 2,
        price: 100,
        discount: 10,
      });
      expect(existingCart.save).toHaveBeenCalled();
    });

    test("should update quantity if item already exists in cart", async () => {
      const product = makeProductDoc({ _id: "product123", price: 100 });
      productRepoMock.findById.mockResolvedValue(product);

      const existingCart = makeCartDoc({
        user: userId,
        items: [
          {
            product: "product123",
            quantity: 1,
            price: 100,
            discount: 0,
          },
        ],
        save: jest.fn().mockResolvedValue({
          items: [
            {
              product: "product123",
              quantity: 3,
              price: 100,
              discount: 0,
            },
          ],
        }),
      });
      cartRepoMock.findByUser.mockResolvedValue(existingCart);

      const result = await service.addToCart(userId, {
        productId: "product123",
        quantity: 2,
      });

      expect(existingCart.items[0].quantity).toBe(3);
      expect(existingCart.save).toHaveBeenCalled();
    });
  });

  describe("updateCartItem", () => {
    const userId = "user123";
    const productId = "product123";
    const dto = { quantity: 3 };

    test("should throw if cart not found", async () => {
      cartRepoMock.findByUser.mockResolvedValue(null);

      await expect(
        service.updateCartItem(userId, productId, dto),
      ).rejects.toThrow("Cart not found");
    });

    test("should throw if item not found in cart", async () => {
      const cart = makeCartDoc({ items: [] });
      cartRepoMock.findByUser.mockResolvedValue(cart);

      await expect(
        service.updateCartItem(userId, productId, dto),
      ).rejects.toThrow("Item not found in cart");
    });

    test("should throw if product not found when increasing quantity", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 1 }],
      });
      cartRepoMock.findByUser.mockResolvedValue(cart);
      productRepoMock.findById.mockResolvedValue(null);

      await expect(
        service.updateCartItem(userId, productId, { quantity: 2 }),
      ).rejects.toThrow("Product not found");
    });

    test("should throw if insufficient stock when increasing quantity", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 1 }],
      });
      cartRepoMock.findByUser.mockResolvedValue(cart);

      const product = makeProductDoc({ _id: "product123", stock: 1 });
      productRepoMock.findById.mockResolvedValue(product);

      await expect(
        service.updateCartItem(userId, productId, { quantity: 3 }),
      ).rejects.toThrow("Only 1 items available in stock");
    });

    test("should update item quantity successfully", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 1 }],
      });
      cartRepoMock.findByUser.mockResolvedValue(cart);

      const product = makeProductDoc({ _id: "product123", stock: 10 });
      productRepoMock.findById.mockResolvedValue(product);

      const updatedCart = makeCartDoc({
        items: [{ product: "product123", quantity: 3 }],
      });
      cartRepoMock.updateItemQuantity.mockResolvedValue(updatedCart);

      const result = await service.updateCartItem(userId, productId, {
        quantity: 3,
      });

      expect(productRepoMock.findById).toHaveBeenCalledWith(productId);
      expect(cartRepoMock.updateItemQuantity).toHaveBeenCalledWith(
        cart,
        productId,
        3,
      );
      expect(result).toEqual(updatedCart);
    });

    test("should skip stock check when decreasing quantity", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 5 }],
      });
      cartRepoMock.findByUser.mockResolvedValue(cart);

      const updatedCart = makeCartDoc({
        items: [{ product: "product123", quantity: 2 }],
      });
      cartRepoMock.updateItemQuantity.mockResolvedValue(updatedCart);

      const result = await service.updateCartItem(userId, productId, {
        quantity: 2,
      });

      expect(productRepoMock.findById).not.toHaveBeenCalled();
      expect(cartRepoMock.updateItemQuantity).toHaveBeenCalledWith(
        cart,
        productId,
        2,
      );
      expect(result).toEqual(updatedCart);
    });
  });

  describe("removeFromCart", () => {
    const userId = "user123";
    const productId = "product123";

    test("should throw if cart not found", async () => {
      cartRepoMock.findByUser.mockResolvedValue(null);

      await expect(service.removeFromCart(userId, productId)).rejects.toThrow(
        "Cart not found",
      );
    });

    test("should remove item from cart successfully", async () => {
      const cart = makeCartDoc({ items: [{ product: "product123" }] });
      cartRepoMock.findByUser.mockResolvedValue(cart);

      const updatedCart = makeCartDoc({ items: [] });
      cartRepoMock.removeItem.mockResolvedValue(updatedCart);

      const result = await service.removeFromCart(userId, productId);

      expect(cartRepoMock.removeItem).toHaveBeenCalledWith(cart, productId);
      expect(result).toEqual(updatedCart);
    });
  });

  describe("clearCart", () => {
    const userId = "user123";

    test("should throw if cart not found", async () => {
      cartRepoMock.findByUser.mockResolvedValue(null);

      await expect(service.clearCart(userId)).rejects.toThrow("Cart not found");
    });

    test("should clear cart successfully", async () => {
      const cart = makeCartDoc({ items: [{ product: "product123" }] });
      cartRepoMock.findByUser.mockResolvedValue(cart);

      const emptyCart = makeCartDoc({ items: [] });
      cartRepoMock.clearCart.mockResolvedValue(emptyCart);

      const result = await service.clearCart(userId);

      expect(cartRepoMock.clearCart).toHaveBeenCalledWith(cart);
      expect(result).toEqual(emptyCart);
    });
  });

  describe("getCartCount", () => {
    const userId = "user123";

    test("should return totalItems if cart exists", async () => {
      const cart = makeCartDoc({ totalItems: 5 });
      cartRepoMock.findByUser.mockResolvedValue(cart);

      const result = await service.getCartCount(userId);

      expect(result).toBe(5);
    });

    test("should return 0 if cart does not exist", async () => {
      cartRepoMock.findByUser.mockResolvedValue(null);

      const result = await service.getCartCount(userId);

      expect(result).toBe(0);
    });
  });
});
