import { z } from "zod";
import { CategorySchema } from "../types/category.type";

export const CreateCategoryDto = CategorySchema.pick({
  name: true,
  description: true,
  parentCategory: true,
});

export type CreateCategoryDto = z.infer<typeof CreateCategoryDto>;

export const UpdateCategoryDto = CreateCategoryDto.partial();

export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDto>;
