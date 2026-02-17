import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from "../dtos/order.dto";

const orderService = new OrderService();

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = CreateOrderDto.parse(req.body);

    const order = await orderService.createOrder(userId, validatedData);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const orders = await orderService.getUserOrders(userId, page, limit);
    const total = await orderService.getUserOrdersCount(userId);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.isAdmin;
    const businessId = req.user?.businessId;

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderUser = order.user as any;
    const orderUserId = orderUser._id
      ? orderUser._id.toString()
      : orderUser.toString();

    if (!businessId && !isAdmin && orderUserId === userId) {
      return res.json({
        success: true,
        order,
      });
    }

    if (businessId) {
      const hasBusinessItems = order.items.some((item: any) => {
        const itemBusinessId =
          item.business?._id?.toString() || item.business?.toString();
        return itemBusinessId === businessId;
      });

      if (hasBusinessItems) {
        return res.json({
          success: true,
          order,
        });
      }
    }

    if (isAdmin) {
      return res.json({
        success: true,
        order,
      });
    }

    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};

export const getBusinessOrders = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID required",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const orders = await orderService.getBusinessOrders(
      businessId,
      page,
      limit,
    );
    const total = await orderService.getBusinessOrdersCount(businessId);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const businessId = req.user?.businessId;
    const validatedData = UpdateOrderStatusDto.parse(req.body);

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const hasBusinessItems = order.items.some((item: any) => {
      const itemBusinessId =
        item.business?._id?.toString() || item.business?.toString();
      return itemBusinessId === businessId;
    });

    if (!hasBusinessItems) {
      return res.status(403).json({
        success: false,
        message: "You can only update orders containing your products",
      });
    }

    const updatedOrder = await orderService.updateOrderStatus(
      orderId,
      validatedData.orderStatus,
      validatedData.trackingNumber,
    );

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const businessId = req.user?.businessId;
    const validatedData = UpdatePaymentStatusDto.parse(req.body);

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const hasBusinessItems = order.items.some((item: any) => {
      const itemBusinessId =
        item.business?._id?.toString() || item.business?.toString();
      return itemBusinessId === businessId;
    });

    if (!hasBusinessItems) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update payment for orders containing your products",
      });
    }

    const updatedOrder = await orderService.updatePaymentStatus(
      orderId,
      validatedData.paymentStatus,
    );

    res.json({
      success: true,
      message: "Payment status updated successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update payment status",
    });
  }
};
