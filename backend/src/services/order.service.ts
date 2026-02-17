import { OrderRepository } from "../repositories/order.repository";
import { ProductRepository } from "../repositories/product.repository";
import { CartRepository } from "../repositories/cart.repository";
import { CreateOrderDto } from "../dtos/order.dto";
import { OrderDocument } from "../model/order.model";
import { CartDocument } from "../model/cart.model";

export class OrderService {
  private orderRepository = new OrderRepository();
  private productRepository = new ProductRepository();
  private cartRepository = new CartRepository();

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDocument> {
    const subtotal = dto.items.reduce((acc, item) => {
      const itemTotal = item.price * item.quantity;
      const discountAmount = itemTotal * ((item.discount || 0) / 100);
      return acc + (itemTotal - discountAmount);
    }, 0);

    const tax = subtotal * 0.13;
    const total = subtotal + tax;

    const orderData = {
      user: userId,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod,
      subtotal,
      tax,
      total,
      notes: dto.notes,
    };

    const order = await this.orderRepository.create(orderData as any);

    // Update product stock
    for (const item of dto.items) {
      const product = await this.productRepository.findById(
        item.product.toString(),
      );
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    // Clear user's cart
    const cart = await this.cartRepository.findByUser(userId);
    if (cart) {
      await this.cartRepository.clearCart(cart);
    }

    return order;
  }

  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<OrderDocument[]> {
    return this.orderRepository.findByUser(userId, page, limit);
  }

  async getOrderById(orderId: string): Promise<OrderDocument | null> {
    return this.orderRepository.findById(orderId);
  }

  async getBusinessOrders(
    businessId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<OrderDocument[]> {
    return this.orderRepository.findByBusiness(businessId, page, limit);
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    trackingNumber?: string,
  ): Promise<OrderDocument | null> {
    return this.orderRepository.updateStatus(orderId, status, trackingNumber);
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
  ): Promise<OrderDocument | null> {
    return this.orderRepository.updatePaymentStatus(orderId, paymentStatus);
  }

  async getUserOrdersCount(userId: string): Promise<number> {
    return this.orderRepository.countByUser(userId);
  }

  async getBusinessOrdersCount(businessId: string): Promise<number> {
    return this.orderRepository.countByBusiness(businessId);
  }
}
