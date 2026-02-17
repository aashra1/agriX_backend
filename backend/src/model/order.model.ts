import mongoose, { Schema, Document } from "mongoose";
import { IOrder, IOrderItem, IShippingAddress } from "../types/order.type";

export interface OrderItemDocument
  extends Omit<IOrderItem, "product" | "business">, Document {
  product: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
}

export interface OrderDocument
  extends Omit<IOrder, "user" | "items" | "_id">, Document {
  user: mongoose.Types.ObjectId;
  items: OrderItemDocument[];
}

const orderItemSchema = new Schema<OrderItemDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    image: { type: String },
  },
  { _id: true },
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "esewa", "khalti"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    trackingNumber: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "items.business": 1 });

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
