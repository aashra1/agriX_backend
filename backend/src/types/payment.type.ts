import { z } from "zod";

// Export these for use in DTOs
export const PaymentStatusValues = [
  "pending",
  "completed",
  "failed",
  "refunded",
] as const;

export const PaymentMethodValues = ["khalti"] as const;

export const PaymentSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  orderId: z.string(),
  amount: z.number(),
  status: z.enum(PaymentStatusValues),
  paymentMethod: z.enum(PaymentMethodValues),
  transactionId: z.string().optional(),
  pidx: z.string().optional(),
  paymentUrl: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;
