import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  userId: string;
  orderId: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "khalti";
  transactionId?: string;
  pidx?: string;
  paymentUrl?: string;
  metadata?: Record<string, any>;
}

const PaymentSchema: Schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["khalti"],
      default: "khalti",
      required: true,
    },
    transactionId: {
      type: String,
    },
    pidx: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
