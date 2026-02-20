import {
  PaymentRepository,
  IPaymentRepository,
} from "../repositories/payment.repository";
import { OrderRepository } from "../repositories/order.repository";
import {
  UserRepository,
  IUserRepository,
} from "../repositories/user.repository";
import { WalletService } from "../services/wallet.service";
import { CreatePaymentDTO, UpdatePaymentDTO } from "../dtos/payment.dto";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../config/khalti";
import { HttpError } from "../error/http-error";
import mongoose from "mongoose";

export class PaymentService {
  private paymentRepository: IPaymentRepository;
  private userRepository: IUserRepository;
  private orderRepository: OrderRepository;
  private walletService: WalletService;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.userRepository = new UserRepository();
    this.orderRepository = new OrderRepository();
    this.walletService = new WalletService();
  }

  private sanitizePayment(payment: any) {
    const paymentObj = payment.toObject ? payment.toObject() : payment;
    const { __v, ...safePayment } = paymentObj;
    return safePayment;
  }

  public getSanitizedPayment(payment: any) {
    return this.sanitizePayment(payment);
  }

  initiateKhaltiPayment = async (
    userId: string,
    orderId: string,
    amount: number,
    returnUrl: string,
  ) => {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const existingPayment =
      await this.paymentRepository.getPaymentByOrderId(orderId);

    if (existingPayment) {
      if (existingPayment.status === "completed") {
        throw new HttpError(400, "Order has already been paid for");
      }
      return {
        payment: this.sanitizePayment(existingPayment),
        paymentUrl: existingPayment.paymentUrl,
        pidx: existingPayment.pidx,
      };
    }

    const customerInfo = {
      name: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
    };

    const paymentData = await initiateKhaltiPayment({
      return_url: returnUrl,
      website_url: process.env.CLIENT_URL || "http://localhost:3000",
      amount: amount,
      purchase_order_id: orderId,
      purchase_order_name: `Order ${orderId}`,
      customer_info: customerInfo,
    });

    const createPaymentData: CreatePaymentDTO = {
      userId,
      orderId,
      amount,
      status: "pending",
      paymentMethod: "khalti",
      pidx: paymentData.pidx,
      paymentUrl: paymentData.payment_url,
      metadata: paymentData,
    };

    const payment =
      await this.paymentRepository.createPayment(createPaymentData);

    return {
      payment: this.sanitizePayment(payment),
      paymentUrl: paymentData.payment_url,
      pidx: paymentData.pidx,
    };
  };

  verifyKhaltiPayment = async (pidx: string, orderId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await this.paymentRepository.getPaymentByPidx(pidx);
      if (!payment) {
        throw new HttpError(404, "Payment record not found");
      }

      if (payment.orderId !== orderId) {
        throw new HttpError(400, "Order ID mismatch");
      }

      const verificationData = await verifyKhaltiPayment(pidx);

      if (verificationData.status === "Completed") {
        const updateData: UpdatePaymentDTO = {
          status: "completed",
          transactionId: verificationData.transaction_id,
          metadata: verificationData,
        };

        const updatedPayment = await this.paymentRepository.updatePayment(
          payment._id!.toString(),
          updateData,
        );

        await this.orderRepository.updatePaymentStatus(orderId, "completed");

        const order = await this.orderRepository.findById(orderId);

        if (order && order.items && order.items.length > 0) {
          const businessAmounts = new Map<string, number>();

          for (const item of order.items) {
            let businessId = "";

            const businessField = item as any;

            if (businessField.businessData && businessField.businessData._id) {
              businessId = businessField.businessData._id.toString();
            } else if (
              businessField.business &&
              typeof businessField.business === "object" &&
              businessField.business._id
            ) {
              businessId = businessField.business._id.toString();
            } else if (
              businessField.business &&
              typeof businessField.business === "string"
            ) {
              businessId = businessField.business;
            } else if (
              businessField.business &&
              businessField.business.toString
            ) {
              businessId = businessField.business.toString();
            }

            if (!businessId) {
              console.error("Could not extract business ID from item:", item);
              continue;
            }

            const itemTotal = (item.price || 0) * (item.quantity || 0);
            const discountAmount = itemTotal * ((item.discount || 0) / 100);
            const finalAmount = itemTotal - discountAmount;

            businessAmounts.set(
              businessId,
              (businessAmounts.get(businessId) || 0) + finalAmount,
            );
          }

          for (const [businessId, amount] of businessAmounts.entries()) {
            await this.walletService.creditUser(
              {
                ownerId: businessId,
                ownerType: "Business",
                amount: amount,
                reference: orderId,
                description: `Earnings from order ${orderId}`,
                metadata: {
                  orderId,
                  paymentId: payment._id,
                  orderTotal: order.total,
                },
              },
              session,
            );
          }
        }

        await session.commitTransaction();
        session.endSession();

        return {
          success: true,
          message: "Payment verified and businesses credited successfully",
          payment: this.sanitizePayment(updatedPayment),
        };
      } else {
        const updateData: UpdatePaymentDTO = {
          status: "failed",
          metadata: verificationData,
        };

        await this.paymentRepository.updatePayment(
          payment._id!.toString(),
          updateData,
        );

        await this.orderRepository.updatePaymentStatus(orderId, "failed");

        await session.commitTransaction();
        session.endSession();

        throw new HttpError(400, `Payment status: ${verificationData.status}`);
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  };

  getPaymentByOrderId = async (orderId: string) => {
    const payment = await this.paymentRepository.getPaymentByOrderId(orderId);
    if (!payment) {
      throw new HttpError(404, "Payment not found");
    }
    return this.sanitizePayment(payment);
  };

  getUserPayments = async (
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ) => {
    const skip = (page - 1) * limit;
    const payments = await this.paymentRepository.getPaymentsByUser(
      userId,
      skip,
      limit,
      status,
    );
    return payments.map((p) => this.sanitizePayment(p));
  };

  getAllPayments = async (
    page: number = 1,
    limit: number = 10,
    status?: string,
  ) => {
    const skip = (page - 1) * limit;
    const payments = await this.paymentRepository.getAllPayments(
      skip,
      limit,
      status,
    );
    return payments.map((p) => this.sanitizePayment(p));
  };
}
