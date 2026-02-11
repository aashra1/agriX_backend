import { z } from "zod";

export const CategorySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentCategory: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ICategory = z.infer<typeof CategorySchema>;
