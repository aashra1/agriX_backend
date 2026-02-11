import { z } from "zod";

export const ProductSchema = z.object({
  _id: z.string().optional(),
  business: z.string().min(1, "Business ID is required"),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  discount: z.number().min(0).max(100).optional(),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  weight: z.number().optional(),
  unitType: z.string().optional().default("kg"),
  shortDescription: z.string().max(150).optional(),
  fullDescription: z.string().optional(),
  image: z.string().optional(),
  createdAt: z.date().optional(),
});

export type IProduct = z.infer<typeof ProductSchema>;
