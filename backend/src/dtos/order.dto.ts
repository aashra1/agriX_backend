import { z } from "zod";
import { OrderItemSchema, ShippingAddressSchema } from "../types/order.type";

export const CreateOrderDto = z.object({
  items: z.array(OrderItemSchema),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(["cod", "card", "esewa", "khalti"]),
  notes: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDto>;

export const UpdateOrderStatusDto = z.object({
  orderStatus: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  trackingNumber: z.string().optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusDto>;

export const UpdatePaymentStatusDto = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed"]),
});

export type UpdatePaymentStatusDto = z.infer<typeof UpdatePaymentStatusDto>;
