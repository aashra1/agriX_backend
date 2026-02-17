import { z } from "zod";
import {
  PaymentStatusValues,
  PaymentMethodValues,
} from "../types/payment.type";

export const InitiateKhaltiPaymentDTO = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().positive("Amount must be positive").min(1),
  returnUrl: z.string().url("Return URL must be a valid URL"),
});

export type InitiateKhaltiPaymentDTO = z.infer<typeof InitiateKhaltiPaymentDTO>;

export const VerifyKhaltiPaymentDTO = z.object({
  pidx: z.string().min(1, "PIDX is required"),
  orderId: z.string().min(1, "Order ID is required"),
});

export type VerifyKhaltiPaymentDTO = z.infer<typeof VerifyKhaltiPaymentDTO>;

export const CreatePaymentDTO = z.object({
  userId: z.string().min(1, "User ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().positive(),
  status: z.enum(PaymentStatusValues).default("pending"),
  paymentMethod: z.enum(PaymentMethodValues).default("khalti"),
  transactionId: z.string().optional(),
  pidx: z.string().optional(),
  paymentUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreatePaymentDTO = z.infer<typeof CreatePaymentDTO>;

export const UpdatePaymentDTO = z.object({
  status: z.enum(PaymentStatusValues).optional(),
  transactionId: z.string().optional(),
  pidx: z.string().optional(),
  paymentUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type UpdatePaymentDTO = z.infer<typeof UpdatePaymentDTO>;

export const PaymentResponseDTO = z.object({
  success: z.boolean(),
  message: z.string(),
  payment: z.any().optional(),
  paymentUrl: z.string().url().optional(),
  pidx: z.string().optional(),
});

export type PaymentResponseDTO = z.infer<typeof PaymentResponseDTO>;

export const PaymentFilterDTO = z.object({
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1)),
  limit: z.preprocess((val) => Number(val) || 10, z.number().min(1).max(100)),
  status: z.enum(PaymentStatusValues).optional(),
});

export type PaymentFilterDTO = z.infer<typeof PaymentFilterDTO>;

export const KhaltiWebhookDTO = z.object({
  pidx: z.string(),
  status: z.string(),
  amount: z.number(),
  total_amount: z.number(),
  transaction_id: z.string().nullable(),
  purchase_order_id: z.string(),
  purchase_order_name: z.string().optional(),
  mobile: z.string().optional(),
});

export type KhaltiWebhookDTO = z.infer<typeof KhaltiWebhookDTO>;
