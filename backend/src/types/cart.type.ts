import { z } from "zod";

export const CartItemSchema = z.object({
  product: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().positive("Price must be positive"),
  discount: z.number().min(0).max(100).optional().default(0),
  business: z.string(),
  name: z.string().optional(),
  image: z.string().optional(),
});

export const CartSchema = z.object({
  user: z.string(),
  items: z.array(CartItemSchema),
  totalAmount: z.number(),
  totalItems: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ICartItem = z.infer<typeof CartItemSchema>;
export type ICart = z.infer<typeof CartSchema>;
