import mongoose, { Schema, Document } from "mongoose";
import { ICart, ICartItem } from "../types/cart.type";

export interface CartItemDocument
  extends Omit<ICartItem, "product" | "business">, Document {
  product: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
}

export interface CartDocument
  extends Omit<ICart, "user" | "items" | "_id">, Document {
  user: mongoose.Types.ObjectId;
  items: CartItemDocument[];
}

const cartItemSchema = new Schema<CartItemDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
  },
  { _id: true },
);

const cartSchema = new Schema<CartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);
  this.totalAmount = this.items.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    const discountAmount = itemTotal * ((item.discount || 0) / 100);
    return acc + (itemTotal - discountAmount);
  }, 0);
  next();
});

export const Cart = mongoose.model<CartDocument>("Cart", cartSchema);
