import mongoose, { Document, Schema } from "mongoose";

export interface ITaxLiability extends Document {
  businessId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  amount: number;
  period: string;
  status: "accrued" | "paid";
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaxLiabilitySchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    period: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    status: {
      type: String,
      enum: ["accrued", "paid"],
      default: "accrued",
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

TaxLiabilitySchema.index({ businessId: 1, period: 1 });
TaxLiabilitySchema.index({ status: 1 });

export const TaxLiabilityModel = mongoose.model<ITaxLiability>(
  "TaxLiability",
  TaxLiabilitySchema,
);
