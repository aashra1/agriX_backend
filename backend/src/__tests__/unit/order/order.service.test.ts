import { OrderService } from "../../../services/order.service";

jest.mock("../../../repositories/order.repository", () => {
  const repoMock = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    findByBusiness: jest.fn(),
    updateStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
    countByUser: jest.fn(),
    countByBusiness: jest.fn(),
  };

  return {
    OrderRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

jest.mock("../../../repositories/product.repository", () => {
  const repoMock = {
    findById: jest.fn(),
  };

  return {
    ProductRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

jest.mock("../../../repositories/cart.repository", () => {
  const repoMock = {
    findByUser: jest.fn(),
    clearCart: jest.fn(),
  };

  return {
    CartRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

import { OrderRepository } from "../../../repositories/order.repository";
import { ProductRepository } from "../../../repositories/product.repository";
import { CartRepository } from "../../../repositories/cart.repository";

const mockOrderRepoMethods = (
  jest.requireMock("../../../repositories/order.repository") as any
).__mockRepo;
const mockProductRepoMethods = (
  jest.requireMock("../../../repositories/product.repository") as any
).__mockRepo;
const mockCartRepoMethods = (
  jest.requireMock("../../../repositories/cart.repository") as any
).__mockRepo;

describe("OrderService Unit Tests", () => {
  let service: OrderService;
  let orderRepoMock: any;
  let productRepoMock: any;
  let cartRepoMock: any;

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
      trackingNumber: overrides.trackingNumber ?? undefined,
      createdAt: overrides.createdAt ?? new Date(),
      __v: 0,
    };

    return {
      ...base,
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
      save: jest.fn().mockResolvedValue({ ...base }),
      toObject: () => ({ ...base }),
      ...overrides,
    };
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

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new OrderService();
    orderRepoMock = mockOrderRepoMethods;
    productRepoMock = mockProductRepoMethods;
    cartRepoMock = mockCartRepoMethods;
  });

  describe("createOrder", () => {
    const userId = "user123";
    const dto = {
      items: [
        {
          product: "product123",
          name: "Test Product 1",
          quantity: 2,
          price: 100,
          discount: 10,
          business: "business123",
          image: "product1.jpg",
        },
        {
          product: "product456",
          name: "Test Product 2",
          quantity: 1,
          price: 200,
          discount: 0,
          business: "business123",
          image: "product2.jpg",
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
      notes: "Please deliver quickly",
    };

    test("should create order with correct calculations", async () => {
      const expectedSubtotal = 380;
      const expectedTax = 49.4;
      const expectedTotal = 429.4;

      const products = [
        makeProductDoc({ _id: "product123", stock: 10 }),
        makeProductDoc({ _id: "product456", stock: 5 }),
      ];

      const cart = makeCartDoc({ user: userId });

      productRepoMock.findById
        .mockResolvedValueOnce(products[0])
        .mockResolvedValueOnce(products[1]);

      cartRepoMock.findByUser.mockResolvedValue(cart);
      cartRepoMock.clearCart.mockResolvedValue({ ...cart, items: [] });

      const createdOrder = makeOrderDoc({
        _id: "order123",
        user: userId,
        items: dto.items,
        subtotal: expectedSubtotal,
        tax: expectedTax,
        total: expectedTotal,
      });

      orderRepoMock.create.mockResolvedValue(createdOrder);

      const result = await service.createOrder(userId, dto as any);

      expect(orderRepoMock.create).toHaveBeenCalledWith({
        user: userId,
        items: dto.items,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        subtotal: expectedSubtotal,
        tax: expectedTax,
        total: expectedTotal,
        notes: dto.notes,
      });

      expect(productRepoMock.findById).toHaveBeenCalledTimes(2);
      expect(productRepoMock.findById).toHaveBeenCalledWith("product123");
      expect(productRepoMock.findById).toHaveBeenCalledWith("product456");

      expect(products[0].stock).toBe(8);
      expect(products[1].stock).toBe(4);
      expect(products[0].save).toHaveBeenCalled();
      expect(products[1].save).toHaveBeenCalled();

      expect(cartRepoMock.findByUser).toHaveBeenCalledWith(userId);
      expect(cartRepoMock.clearCart).toHaveBeenCalledWith(cart);

      expect(result).toEqual(createdOrder);
    });

    test("should create order with no discounts", async () => {
      const dtoWithoutDiscounts = {
        ...dto,
        items: [
          {
            product: "product123",
            name: "Test Product 1",
            quantity: 3,
            price: 50,
            discount: 0,
            business: "business123",
            image: "product1.jpg",
          },
        ],
      };

      const expectedSubtotal = 150;
      const expectedTax = 19.5;
      const expectedTotal = 169.5;

      const product = makeProductDoc({ _id: "product123", stock: 10 });
      const cart = makeCartDoc({ user: userId });

      productRepoMock.findById.mockResolvedValue(product);
      cartRepoMock.findByUser.mockResolvedValue(cart);
      cartRepoMock.clearCart.mockResolvedValue({ ...cart, items: [] });

      const createdOrder = makeOrderDoc({
        _id: "order123",
        user: userId,
        items: dtoWithoutDiscounts.items,
        subtotal: expectedSubtotal,
        tax: expectedTax,
        total: expectedTotal,
      });

      orderRepoMock.create.mockResolvedValue(createdOrder);

      const result = await service.createOrder(
        userId,
        dtoWithoutDiscounts as any,
      );

      expect(orderRepoMock.create).toHaveBeenCalledWith({
        user: userId,
        items: dtoWithoutDiscounts.items,
        shippingAddress: dtoWithoutDiscounts.shippingAddress,
        paymentMethod: dtoWithoutDiscounts.paymentMethod,
        subtotal: expectedSubtotal,
        tax: expectedTax,
        total: expectedTotal,
        notes: dtoWithoutDiscounts.notes,
      });

      expect(product.stock).toBe(7);
      expect(product.save).toHaveBeenCalled();
      expect(result).toEqual(createdOrder);
    });

    test("should handle missing cart gracefully", async () => {
      const product = makeProductDoc({ _id: "product123", stock: 10 });

      productRepoMock.findById.mockResolvedValue(product);
      cartRepoMock.findByUser.mockResolvedValue(null);

      const createdOrder = makeOrderDoc({
        _id: "order123",
        user: userId,
        items: [dto.items[0]],
      });

      orderRepoMock.create.mockResolvedValue(createdOrder);

      const result = await service.createOrder(userId, {
        ...dto,
        items: [dto.items[0]],
      } as any);

      expect(productRepoMock.findById).toHaveBeenCalled();
      expect(cartRepoMock.findByUser).toHaveBeenCalledWith(userId);
      expect(cartRepoMock.clearCart).not.toHaveBeenCalled();
      expect(result).toEqual(createdOrder);
    });

    test("should continue even if product stock update fails for one product", async () => {
      const products = [
        makeProductDoc({ _id: "product123", stock: 10 }),
        makeProductDoc({ _id: "product456", stock: 5 }),
      ];

      const cart = makeCartDoc({ user: userId });

      productRepoMock.findById
        .mockResolvedValueOnce(products[0])
        .mockResolvedValueOnce(null);

      cartRepoMock.findByUser.mockResolvedValue(cart);
      cartRepoMock.clearCart.mockResolvedValue({ ...cart, items: [] });

      const createdOrder = makeOrderDoc({
        _id: "order123",
        user: userId,
        items: dto.items,
      });

      orderRepoMock.create.mockResolvedValue(createdOrder);

      const result = await service.createOrder(userId, dto as any);

      expect(productRepoMock.findById).toHaveBeenCalledTimes(2);
      expect(products[0].save).toHaveBeenCalled();
      expect(result).toEqual(createdOrder);
    });
  });

  describe("getUserOrders", () => {
    const userId = "user123";

    test("should return user orders with pagination", async () => {
      const orders = [
        makeOrderDoc({ _id: "order1", user: userId }),
        makeOrderDoc({ _id: "order2", user: userId }),
      ];

      orderRepoMock.findByUser.mockResolvedValue(orders);

      const result = await service.getUserOrders(userId, 2, 5);

      expect(orderRepoMock.findByUser).toHaveBeenCalledWith(userId, 2, 5);
      expect(result).toEqual(orders);
      expect(result).toHaveLength(2);
    });

    test("should use default pagination values", async () => {
      const orders = [makeOrderDoc({ user: userId })];
      orderRepoMock.findByUser.mockResolvedValue(orders);

      const result = await service.getUserOrders(userId);

      expect(orderRepoMock.findByUser).toHaveBeenCalledWith(userId, 1, 10);
      expect(result).toEqual(orders);
    });

    test("should return empty array if no orders found", async () => {
      orderRepoMock.findByUser.mockResolvedValue([]);

      const result = await service.getUserOrders(userId);

      expect(orderRepoMock.findByUser).toHaveBeenCalledWith(userId, 1, 10);
      expect(result).toEqual([]);
    });
  });

  describe("getOrderById", () => {
    test("should return order by id", async () => {
      const orderId = "order123";
      const order = makeOrderDoc({ _id: orderId });

      orderRepoMock.findById.mockResolvedValue(order);

      const result = await service.getOrderById(orderId);

      expect(orderRepoMock.findById).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(order);
    });

    test("should return null if order not found", async () => {
      const orderId = "nonexistent123";

      orderRepoMock.findById.mockResolvedValue(null);

      const result = await service.getOrderById(orderId);

      expect(orderRepoMock.findById).toHaveBeenCalledWith(orderId);
      expect(result).toBeNull();
    });
  });

  describe("getBusinessOrders", () => {
    const businessId = "business123";

    test("should return business orders with pagination", async () => {
      const orders = [
        makeOrderDoc({ _id: "order1" }),
        makeOrderDoc({ _id: "order2" }),
        makeOrderDoc({ _id: "order3" }),
      ];

      orderRepoMock.findByBusiness.mockResolvedValue(orders);

      const result = await service.getBusinessOrders(businessId, 1, 3);

      expect(orderRepoMock.findByBusiness).toHaveBeenCalledWith(
        businessId,
        1,
        3,
      );
      expect(result).toEqual(orders);
      expect(result).toHaveLength(3);
    });

    test("should use default pagination values", async () => {
      const orders = [makeOrderDoc({})];
      orderRepoMock.findByBusiness.mockResolvedValue(orders);

      const result = await service.getBusinessOrders(businessId);

      expect(orderRepoMock.findByBusiness).toHaveBeenCalledWith(
        businessId,
        1,
        10,
      );
      expect(result).toEqual(orders);
    });

    test("should return empty array if no orders found for business", async () => {
      orderRepoMock.findByBusiness.mockResolvedValue([]);

      const result = await service.getBusinessOrders(businessId);

      expect(orderRepoMock.findByBusiness).toHaveBeenCalledWith(
        businessId,
        1,
        10,
      );
      expect(result).toEqual([]);
    });
  });

  describe("updateOrderStatus", () => {
    test("should update order status without tracking number", async () => {
      const orderId = "order123";
      const status = "Shipped";

      const updatedOrder = makeOrderDoc({
        _id: orderId,
        status,
      });

      orderRepoMock.updateStatus.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus(orderId, status);

      expect(orderRepoMock.updateStatus).toHaveBeenCalledWith(
        orderId,
        status,
        undefined,
      );
      expect(result).toEqual(updatedOrder);
    });

    test("should update order status with tracking number", async () => {
      const orderId = "order123";
      const status = "Shipped";
      const trackingNumber = "TRACK123456";

      const updatedOrder = makeOrderDoc({
        _id: orderId,
        status,
        trackingNumber,
      });

      orderRepoMock.updateStatus.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus(
        orderId,
        status,
        trackingNumber,
      );

      expect(orderRepoMock.updateStatus).toHaveBeenCalledWith(
        orderId,
        status,
        trackingNumber,
      );
      expect(result).toEqual(updatedOrder);
    });

    test("should return null if order not found", async () => {
      const orderId = "nonexistent123";
      const status = "Shipped";

      orderRepoMock.updateStatus.mockResolvedValue(null);

      const result = await service.updateOrderStatus(orderId, status);

      expect(orderRepoMock.updateStatus).toHaveBeenCalledWith(
        orderId,
        status,
        undefined,
      );
      expect(result).toBeNull();
    });
  });

  describe("updatePaymentStatus", () => {
    test("should update payment status", async () => {
      const orderId = "order123";
      const paymentStatus = "Paid";

      const updatedOrder = makeOrderDoc({
        _id: orderId,
        paymentStatus,
      });

      orderRepoMock.updatePaymentStatus.mockResolvedValue(updatedOrder);

      const result = await service.updatePaymentStatus(orderId, paymentStatus);

      expect(orderRepoMock.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        paymentStatus,
      );
      expect(result).toEqual(updatedOrder);
    });

    test("should return null if order not found", async () => {
      const orderId = "nonexistent123";
      const paymentStatus = "Paid";

      orderRepoMock.updatePaymentStatus.mockResolvedValue(null);

      const result = await service.updatePaymentStatus(orderId, paymentStatus);

      expect(orderRepoMock.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        paymentStatus,
      );
      expect(result).toBeNull();
    });
  });

  describe("getUserOrdersCount", () => {
    test("should return count of user orders", async () => {
      const userId = "user123";
      const expectedCount = 5;

      orderRepoMock.countByUser.mockResolvedValue(expectedCount);

      const result = await service.getUserOrdersCount(userId);

      expect(orderRepoMock.countByUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedCount);
    });

    test("should return 0 if no orders found", async () => {
      const userId = "user123";

      orderRepoMock.countByUser.mockResolvedValue(0);

      const result = await service.getUserOrdersCount(userId);

      expect(orderRepoMock.countByUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(0);
    });
  });

  describe("getBusinessOrdersCount", () => {
    test("should return count of business orders", async () => {
      const businessId = "business123";
      const expectedCount = 8;

      orderRepoMock.countByBusiness.mockResolvedValue(expectedCount);

      const result = await service.getBusinessOrdersCount(businessId);

      expect(orderRepoMock.countByBusiness).toHaveBeenCalledWith(businessId);
      expect(result).toBe(expectedCount);
    });

    test("should return 0 if no orders found for business", async () => {
      const businessId = "business123";

      orderRepoMock.countByBusiness.mockResolvedValue(0);

      const result = await service.getBusinessOrdersCount(businessId);

      expect(orderRepoMock.countByBusiness).toHaveBeenCalledWith(businessId);
      expect(result).toBe(0);
    });
  });
});
