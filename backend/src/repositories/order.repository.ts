import { Order, OrderDocument } from "../model/order.model";
import { IOrderItem } from "../types/order.type";

export class OrderRepository {
  async create(orderData: Partial<OrderDocument>): Promise<OrderDocument> {
    const order = new Order(orderData);
    return order.save();
  }

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<OrderDocument[]> {
    const skip = (page - 1) * limit;
    return Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.product", "name images price")
      .populate("items.business", "businessName")
      .exec();
  }

  async findById(orderId: string): Promise<OrderDocument | null> {
    return Order.findById(orderId)
      .populate("items.product", "name images price")
      .populate("items.business", "businessName")
      .populate("user", "fullName email phone")
      .exec();
  }

  async findByBusiness(
    businessId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<OrderDocument[]> {
    const skip = (page - 1) * limit;
    return Order.find({ "items.business": businessId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email phone")
      .populate("items.product", "name images")
      .exec();
  }

  async updateStatus(
    orderId: string,
    status: string,
    trackingNumber?: string,
  ): Promise<OrderDocument | null> {
    const updateData: any = { orderStatus: status };
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    return Order.findByIdAndUpdate(orderId, updateData, { new: true });
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
  ): Promise<OrderDocument | null> {
    return Order.findByIdAndUpdate(orderId, { paymentStatus }, { new: true });
  }

  async countByUser(userId: string): Promise<number> {
    return Order.countDocuments({ user: userId });
  }

  async countByBusiness(businessId: string): Promise<number> {
    return Order.countDocuments({ "items.business": businessId });
  }
}
