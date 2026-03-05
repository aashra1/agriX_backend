// __tests__/unit/services/cart.service.test.ts
import { CartService } from "../../../services/cart.service";
import { CartRepository } from "../../../repositories/cart.repository";
import { ProductRepository } from "../../../repositories/product.repository";

jest.mock("../../../repositories/cart.repository");
jest.mock("../../../repositories/product.repository");

describe("CartService", () => {
  let service: CartService;
  let mockCartRepository: jest.Mocked<CartRepository>;
  let mockProductRepository: jest.Mocked<ProductRepository>;

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
      save: jest.fn().mockResolvedValue(overrides),
    };
    return base;
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
    return base;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CartService();
    mockCartRepository = new CartRepository() as jest.Mocked<CartRepository>;
    mockProductRepository =
      new ProductRepository() as jest.Mocked<ProductRepository>;
    (service as any).cartRepository = mockCartRepository;
    (service as any).productRepository = mockProductRepository;
  });

  describe("getCart", () => {
    test("should return existing cart if found", async () => {
      const userId = "user123";
      const existingCart = makeCartDoc({ user: userId });
      mockCartRepository.findByUser.mockResolvedValue(existingCart as any);
      const result = await service.getCart(userId);
      expect(mockCartRepository.findByUser).toHaveBeenCalledWith(userId);
      expect(mockCartRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingCart);
    });

    test("should create new cart if not found", async () => {
      const userId = "user123";
      const newCart = makeCartDoc({ user: userId });
      mockCartRepository.findByUser.mockResolvedValue(null);
      mockCartRepository.create.mockResolvedValue(newCart as any);
      const result = await service.getCart(userId);
      expect(mockCartRepository.create).toHaveBeenCalledWith(userId);
      expect(result).toEqual(newCart);
    });
  });

  describe("addToCart", () => {
    const userId = "user123";
    const dto = { productId: "product123", quantity: 2 };

    test("should throw if product not found", async () => {
      mockProductRepository.findById.mockResolvedValue(null);
      await expect(service.addToCart(userId, dto)).rejects.toThrow(
        "Product not found",
      );
    });

    test("should throw if insufficient stock", async () => {
      const product = makeProductDoc({ _id: "product123", stock: 1 });
      mockProductRepository.findById.mockResolvedValue(product as any);
      await expect(service.addToCart(userId, dto)).rejects.toThrow(
        "Only 1 items available in stock",
      );
    });

    test("should create new cart and add item", async () => {
      const product = makeProductDoc({
        _id: "product123",
        price: 100,
        discount: 10,
      });
      mockProductRepository.findById.mockResolvedValue(product as any);
      mockCartRepository.findByUser.mockResolvedValue(null);
      const newCart = makeCartDoc({ user: userId, items: [] });
      mockCartRepository.create.mockResolvedValue(newCart as any);
      newCart.save = jest
        .fn()
        .mockResolvedValue({ items: [{ product: "product123", quantity: 2 }] });
      await service.addToCart(userId, dto);
      expect(mockCartRepository.create).toHaveBeenCalledWith(userId);
      expect(newCart.save).toHaveBeenCalled();
    });

    test("should add new item to existing cart", async () => {
      const product = makeProductDoc({
        _id: "product123",
        price: 100,
        discount: 10,
      });
      mockProductRepository.findById.mockResolvedValue(product as any);
      const existingCart = makeCartDoc({ user: userId, items: [] });
      mockCartRepository.findByUser.mockResolvedValue(existingCart as any);
      existingCart.save = jest
        .fn()
        .mockResolvedValue({ items: [{ product: "product123", quantity: 2 }] });
      await service.addToCart(userId, dto);
      expect(existingCart.items).toHaveLength(1);
      expect(existingCart.save).toHaveBeenCalled();
    });

    test("should update quantity if item exists", async () => {
      const product = makeProductDoc({ _id: "product123", price: 100 });
      mockProductRepository.findById.mockResolvedValue(product as any);
      const existingCart = makeCartDoc({
        user: userId,
        items: [
          { product: "product123", quantity: 1, price: 100, discount: 0 },
        ],
      });
      mockCartRepository.findByUser.mockResolvedValue(existingCart as any);
      existingCart.save = jest
        .fn()
        .mockResolvedValue({ items: [{ product: "product123", quantity: 3 }] });
      await service.addToCart(userId, { productId: "product123", quantity: 2 });
      expect(existingCart.items[0].quantity).toBe(3);
      expect(existingCart.save).toHaveBeenCalled();
    });
  });

  describe("updateCartItem", () => {
    const userId = "user123";
    const productId = "product123";
    const dto = { quantity: 3 };

    test("should throw if cart not found", async () => {
      mockCartRepository.findByUser.mockResolvedValue(null);
      await expect(
        service.updateCartItem(userId, productId, dto),
      ).rejects.toThrow("Cart not found");
    });

    test("should throw if item not found in cart", async () => {
      const cart = makeCartDoc({ items: [] });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      await expect(
        service.updateCartItem(userId, productId, dto),
      ).rejects.toThrow("Item not found in cart");
    });

    test("should throw if product not found when increasing", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 1 }],
      });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      mockProductRepository.findById.mockResolvedValue(null);
      await expect(
        service.updateCartItem(userId, productId, { quantity: 2 }),
      ).rejects.toThrow("Product not found");
    });

    test("should throw if insufficient stock", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 1 }],
      });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      const product = makeProductDoc({ _id: "product123", stock: 1 });
      mockProductRepository.findById.mockResolvedValue(product as any);
      await expect(
        service.updateCartItem(userId, productId, { quantity: 3 }),
      ).rejects.toThrow("Only 1 items available in stock");
    });

    test("should update item quantity successfully", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 1 }],
      });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      const product = makeProductDoc({ _id: "product123", stock: 10 });
      mockProductRepository.findById.mockResolvedValue(product as any);
      const updatedCart = makeCartDoc({
        items: [{ product: "product123", quantity: 3 }],
      });
      mockCartRepository.updateItemQuantity.mockResolvedValue(
        updatedCart as any,
      );
      const result = await service.updateCartItem(userId, productId, {
        quantity: 3,
      });
      expect(mockCartRepository.updateItemQuantity).toHaveBeenCalledWith(
        cart,
        productId,
        3,
      );
      expect(result).toEqual(updatedCart);
    });

    test("should skip stock check when decreasing", async () => {
      const cart = makeCartDoc({
        items: [{ product: "product123", quantity: 5 }],
      });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      const updatedCart = makeCartDoc({
        items: [{ product: "product123", quantity: 2 }],
      });
      mockCartRepository.updateItemQuantity.mockResolvedValue(
        updatedCart as any,
      );
      const result = await service.updateCartItem(userId, productId, {
        quantity: 2,
      });
      expect(mockProductRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(updatedCart);
    });
  });

  describe("removeFromCart", () => {
    test("should throw if cart not found", async () => {
      mockCartRepository.findByUser.mockResolvedValue(null);
      await expect(
        service.removeFromCart("user123", "product123"),
      ).rejects.toThrow("Cart not found");
    });

    test("should remove item successfully", async () => {
      const cart = makeCartDoc({ items: [{ product: "product123" }] });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      const updatedCart = makeCartDoc({ items: [] });
      mockCartRepository.removeItem.mockResolvedValue(updatedCart as any);
      const result = await service.removeFromCart("user123", "product123");
      expect(mockCartRepository.removeItem).toHaveBeenCalledWith(
        cart,
        "product123",
      );
      expect(result).toEqual(updatedCart);
    });
  });

  describe("clearCart", () => {
    test("should throw if cart not found", async () => {
      mockCartRepository.findByUser.mockResolvedValue(null);
      await expect(service.clearCart("user123")).rejects.toThrow(
        "Cart not found",
      );
    });

    test("should clear cart successfully", async () => {
      const cart = makeCartDoc({ items: [{ product: "product123" }] });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      const emptyCart = makeCartDoc({ items: [] });
      mockCartRepository.clearCart.mockResolvedValue(emptyCart as any);
      const result = await service.clearCart("user123");
      expect(mockCartRepository.clearCart).toHaveBeenCalledWith(cart);
      expect(result).toEqual(emptyCart);
    });
  });

  describe("getCartCount", () => {
    test("should return totalItems if cart exists", async () => {
      const cart = makeCartDoc({ totalItems: 5 });
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      const result = await service.getCartCount("user123");
      expect(result).toBe(5);
    });

    test("should return 0 if cart does not exist", async () => {
      mockCartRepository.findByUser.mockResolvedValue(null);
      const result = await service.getCartCount("user123");
      expect(result).toBe(0);
    });
  });
});
