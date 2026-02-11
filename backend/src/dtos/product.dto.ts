import { z } from "zod";
import { ProductSchema } from "../types/product.type";

export const CreateProductDto = ProductSchema.pick({
  name: true,
  category: true,
  brand: true,
  price: true,
  discount: true,
  stock: true,
  weight: true,
  unitType: true,
  shortDescription: true,
  fullDescription: true,
  image: true,
});

export type CreateProductDto = z.infer<typeof CreateProductDto>;

export const UpdateProductDto = CreateProductDto.partial();

export type UpdateProductDto = z.infer<typeof UpdateProductDto>;
