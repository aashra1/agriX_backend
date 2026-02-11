import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "../types/category.type";

export interface CategoryDocument
  extends Omit<ICategory, "parentCategory" | "_id">, Document {
  parentCategory: mongoose.Types.ObjectId | null;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

export const Category = mongoose.model<CategoryDocument>(
  "Category",
  categorySchema,
);
