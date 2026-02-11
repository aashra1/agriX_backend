import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../types/product.type";

export interface ProductDocument
  extends Omit<IProduct, "business" | "category" | "_id">, Document {
  business: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
}

const productSchema = new Schema<ProductDocument>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: String,
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, required: true },
    weight: Number,
    unitType: String,
    shortDescription: String,
    fullDescription: String,
    image: String,
  },
  { timestamps: true },
);

export const ProductModel = mongoose.model<ProductDocument>(
  "Product",
  productSchema,
);
