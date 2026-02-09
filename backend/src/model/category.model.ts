import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "../types/category.type";

export interface CategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
  },
  { timestamps: true },
);

export const Category = mongoose.model<CategoryDocument>(
  "Category",
  categorySchema,
);
