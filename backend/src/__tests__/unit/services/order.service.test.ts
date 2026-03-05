
import { OrderService } from "../../../services/order.service";
import { OrderRepository } from "../../../repositories/order.repository";
import { ProductRepository } from "../../../repositories/product.repository";
import { CartRepository } from "../../../repositories/cart.repository";

jest.mock("../../../repositories/order.repository");
jest.mock("../../../repositories/product.repository");
jest.mock("../../../repositories/cart.repository");

describe("OrderService", () => {
  let service: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockCartRepository: jest.Mocked<CartRepository>;

  const makeOrderDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "order123",
      user: overrides.user ?? "user123",
      items: overrides.items ?? [],
      shippingAddress: overrides.shippingAddress ?? {
        street: "123 Test St",
        city: "Test City",
        state: "Test State",
        zipCode: "12345",
        country: "Test Country",
      },
      paymentMethod: overrides.paymentMethod ?? "Credit Card",
      subtotal: overrides.subtotal ?? 0,
      tax: overrides.tax ?? 0,
      total: overrides.total ?? 0,
      status: overrides.status ?? "Pending",
      paymentStatus: overrides.paymentStatus ?? "Pending",
      notes: overrides.notes ?? "",
      __v: 0,
      toObject: () => ({ ...base, ...overrides }),
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
      save: jest.fn().mockResolvedValue(overrides),
    };
    return base;
  };

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
    return base;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderService();
    mockOrderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    mockProductRepository =
      new ProductRepository() as jest.Mocked<ProductRepository>;
    mockCartRepository = new CartRepository() as jest.Mocked<CartRepository>;
    (service as any).orderRepository = mockOrderRepository;
    (service as any).productRepository = mockProductRepository;
    (service as any).cartRepository = mockCartRepository;
  });

  describe("createOrder", () => {
    const userId = "user123";
    const dto = {
      items: [
        {
          product: "product123",
          name: "Product 1",
          quantity: 2,
          price: 100,
          discount: 10,
          business: "business123",
          image: "img1.jpg",
        },
        {
          product: "product456",
          name: "Product 2",
          quantity: 1,
          price: 200,
          discount: 0,
          business: "business123",
          image: "img2.jpg",
        },
      ],
      shippingAddress: {
        street: "123 Test St",
        city: "Test City",
        state: "Test State",
        zipCode: "12345",
        country: "Test Country",
      },
      paymentMethod: "Credit Card",
      notes: "Fast delivery",
    };

    test("should create order with correct calculations", async () => {
      const products = [
        makeProductDoc({ _id: "product123", stock: 10 }),
        makeProductDoc({ _id: "product456", stock: 5 }),
      ];
      const cart = makeCartDoc({ user: userId });

      mockProductRepository.findById
        .mockResolvedValueOnce(products[0] as any)
        .mockResolvedValueOnce(products[1] as any);
      mockCartRepository.findByUser.mockResolvedValue(cart as any);
      mockCartRepository.clearCart.mockResolvedValue({
        ...cart,
        items: [],
      } as any);

      const createdOrder = makeOrderDoc({
        _id: "order123",
        user: userId,
        items: dto.items,
      });
      mockOrderRepository.create.mockResolvedValue(createdOrder as any);

      const result = await service.createOrder(userId, dto as any);

      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(2);
      expect(products[0].save).toHaveBeenCalled();
      expect(products[1].save).toHaveBeenCalled();
      expect(mockCartRepository.clearCart).toHaveBeenCalledWith(cart);
      expect(result).toEqual(createdOrder);
    });

    test("should handle missing cart gracefully", async () => {
      const product = makeProductDoc({ _id: "product123", stock: 10 });
      mockProductRepository.findById.mockResolvedValue(product as any);
      mockCartRepository.findByUser.mockResolvedValue(null);
      const createdOrder = makeOrderDoc({ _id: "order123" });
      mockOrderRepository.create.mockResolvedValue(createdOrder as any);

      const result = await service.createOrder(userId, {
        ...dto,
        items: [dto.items[0]],
      } as any);
      expect(mockCartRepository.clearCart).not.toHaveBeenCalled();
      expect(result).toEqual(createdOrder);
    });
  });

  describe("getUserOrders", () => {
    test("should return user orders with pagination", async () => {
      const orders = [
        makeOrderDoc({ _id: "order1" }),
        makeOrderDoc({ _id: "order2" }),
      ];
      mockOrderRepository.findByUser.mockResolvedValue(orders as any);
      const result = await service.getUserOrders("user123", 2, 5);
      expect(mockOrderRepository.findByUser).toHaveBeenCalledWith(
        "user123",
        2,
        5,
      );
      expect(result).toEqual(orders);
    });

    test("should use default pagination", async () => {
      const orders = [makeOrderDoc({})];
      mockOrderRepository.findByUser.mockResolvedValue(orders as any);
      const result = await service.getUserOrders("user123");
      expect(mockOrderRepository.findByUser).toHaveBeenCalledWith(
        "user123",
        1,
        10,
      );
      expect(result).toEqual(orders);
    });
  });

  describe("getOrderById", () => {
    test("should return order by id", async () => {
      const order = makeOrderDoc({ _id: "order123" });
      mockOrderRepository.findById.mockResolvedValue(order as any);
      const result = await service.getOrderById("order123");
      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order123");
      expect(result).toEqual(order);
    });

    test("should return null if not found", async () => {
      mockOrderRepository.findById.mockResolvedValue(null);
      const result = await service.getOrderById("order123");
      expect(result).toBeNull();
    });
  });

  describe("getBusinessOrders", () => {
    test("should return business orders", async () => {
      const orders = [makeOrderDoc({})];
      mockOrderRepository.findByBusiness.mockResolvedValue(orders as any);
      const result = await service.getBusinessOrders("business123", 1, 10);
      expect(mockOrderRepository.findByBusiness).toHaveBeenCalledWith(
        "business123",
        1,
        10,
      );
      expect(result).toEqual(orders);
    });
  });

  describe("updateOrderStatus", () => {
    test("should update order status", async () => {
      const updatedOrder = makeOrderDoc({ _id: "order123", status: "Shipped" });
      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder as any);
      const result = await service.updateOrderStatus(
        "order123",
        "Shipped",
        "TRACK123",
      );
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order123",
        "Shipped",
        "TRACK123",
      );
      expect(result).toEqual(updatedOrder);
    });

    test("should return null if order not found", async () => {
      mockOrderRepository.updateStatus.mockResolvedValue(null);
      const result = await service.updateOrderStatus("order123", "Shipped");
      expect(result).toBeNull();
    });
  });

  describe("updatePaymentStatus", () => {
    test("should update payment status", async () => {
      const updatedOrder = makeOrderDoc({
        _id: "order123",
        paymentStatus: "Paid",
      });
      mockOrderRepository.updatePaymentStatus.mockResolvedValue(
        updatedOrder as any,
      );
      const result = await service.updatePaymentStatus("order123", "Paid");
      expect(mockOrderRepository.updatePaymentStatus).toHaveBeenCalledWith(
        "order123",
        "Paid",
      );
      expect(result).toEqual(updatedOrder);
    });
  });

  describe("getUserOrdersCount", () => {
    test("should return count", async () => {
      mockOrderRepository.countByUser.mockResolvedValue(5);
      const result = await service.getUserOrdersCount("user123");
      expect(result).toBe(5);
    });
  });

  describe("getBusinessOrdersCount", () => {
    test("should return count", async () => {
      mockOrderRepository.countByBusiness.mockResolvedValue(8);
      const result = await service.getBusinessOrdersCount("business123");
      expect(result).toBe(8);
    });
  });
});
