import { z } from "zod";

export const AddToCartDto = z.object({
  productId: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export type AddToCartDto = z.infer<typeof AddToCartDto>;

export const UpdateCartItemDto = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export type UpdateCartItemDto = z.infer<typeof UpdateCartItemDto>;
