import { z } from "zod";

export const OrderItemSchema = z.object({
  product: z.string(),
  name: z.string(),
  price: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  quantity: z.number().min(1),
  business: z.string(),
  image: z.string().optional(),
});

export const ShippingAddressSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
});

export const OrderSchema = z.object({
  user: z.string(),
  items: z.array(OrderItemSchema),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(["cod", "card", "esewa", "khalti"]),
  paymentStatus: z.enum(["pending", "paid", "failed"]).default("pending"),
  orderStatus: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .default("pending"),
  subtotal: z.number(),
  shipping: z.number().default(0),
  tax: z.number(),
  total: z.number(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type IOrderItem = z.infer<typeof OrderItemSchema>;
export type IShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type IOrder = z.infer<typeof OrderSchema>;
