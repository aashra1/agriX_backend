import mongoose from "mongoose";
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
import { TaxRepository } from "../repositories/tax.repository";
import { CreatePaymentDTO, UpdatePaymentDTO } from "../dtos/payment.dto";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../config/khalti";
import { HttpError } from "../error/http-error";

export class PaymentService {
  private paymentRepository: IPaymentRepository;
  private userRepository: IUserRepository;
  private orderRepository: OrderRepository;
  private walletService: WalletService;
  private taxRepository: TaxRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.userRepository = new UserRepository();
    this.orderRepository = new OrderRepository();
    this.walletService = new WalletService();
    this.taxRepository = new TaxRepository();
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

  // services/payment.service.ts
  verifyKhaltiPayment = async (pidx: string, orderId: string) => {
    console.log("========== VERIFY KHALTI PAYMENT ==========");
    console.log(`PIDX: ${pidx}, OrderId: ${orderId}`);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await this.paymentRepository.getPaymentByPidx(pidx);
      if (!payment) {
        console.error("❌ Payment record not found for pidx:", pidx);
        throw new HttpError(404, "Payment record not found");
      }
      console.log("✅ Payment found:", payment._id);

      if (payment.orderId !== orderId) {
        console.error(
          `❌ Order ID mismatch: payment has ${payment.orderId}, request has ${orderId}`,
        );
        throw new HttpError(400, "Order ID mismatch");
      }

      if (payment.status === "completed") {
        console.log("⚠️ Payment already completed");
        await session.abortTransaction();
        session.endSession();
        return {
          success: true,
          message: "Payment already verified",
          payment: this.sanitizePayment(payment),
        };
      }

      console.log("Verifying with Khalti API...");
      const verificationData = await verifyKhaltiPayment(pidx);
      console.log(
        "Khalti verification response:",
        JSON.stringify(verificationData, null, 2),
      );

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
        console.log("✅ Payment status updated to completed");

        await this.orderRepository.updatePaymentStatus(orderId, "completed");
        console.log("✅ Order payment status updated");

        const order = await this.orderRepository.findById(orderId);

        if (!order) {
          console.error("❌ Order not found:", orderId);
          throw new HttpError(404, "Order not found");
        }
        console.log("✅ Order found:", order._id);
        console.log("Order items count:", order.items?.length);

        if (order && order.items && order.items.length > 0) {
          const businessAmounts = new Map<string, number>();
          const businessTaxes = new Map<string, number>();

          for (const item of order.items) {
            console.log("Processing item:", JSON.stringify(item, null, 2));

            let businessId = "";

            if (item.business) {
              if (typeof item.business === "object" && item.business._id) {
                businessId = item.business._id.toString();
                console.log("Business ID from object:", businessId);
              } else if (typeof item.business === "string") {
                businessId = item.business;
                console.log("Business ID from string:", businessId);
              }
            }

            if (!businessId) {
              console.error("❌ Could not extract business ID from item");
              continue;
            }

            const itemTotal = (item.price || 0) * (item.quantity || 0);
            const discountAmount = itemTotal * ((item.discount || 0) / 100);
            const finalAmount = Number((itemTotal - discountAmount).toFixed(2));
            const taxAmount = Number((finalAmount * 0.13).toFixed(2));

            console.log(
              `Item calculation - Total: ${itemTotal}, Discount: ${discountAmount}, Final: ${finalAmount}, Tax: ${taxAmount}`,
            );

            businessAmounts.set(
              businessId,
              Number(
                ((businessAmounts.get(businessId) || 0) + finalAmount).toFixed(
                  2,
                ),
              ),
            );

            businessTaxes.set(
              businessId,
              Number(
                ((businessTaxes.get(businessId) || 0) + taxAmount).toFixed(2),
              ),
            );
          }

          console.log("Business amounts:", Object.fromEntries(businessAmounts));
          console.log("Business taxes:", Object.fromEntries(businessTaxes));

          for (const [businessId, amount] of businessAmounts.entries()) {
            console.log(
              `Processing credit for business ${businessId}, amount: ${amount}`,
            );

            const transactionExists =
              await this.walletService.checkTransactionExists(
                businessId,
                orderId,
                session,
              );

            console.log(`Transaction exists check: ${transactionExists}`);

            if (!transactionExists) {
              console.log(`Crediting business ${businessId} with ${amount}`);

              const creditResult = await this.walletService.creditUser(
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

              console.log(`Credit result:`, creditResult);

              const taxAmount = businessTaxes.get(businessId) || 0;
              if (taxAmount > 0) {
                console.log(
                  `Creating tax liability for business ${businessId}, amount: ${taxAmount}`,
                );
                const period = new Date().toISOString().slice(0, 7);

                await this.taxRepository.createWithSession(
                  {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    orderId: new mongoose.Types.ObjectId(orderId),
                    amount: taxAmount,
                    period: period,
                    status: "accrued",
                  },
                  session,
                );
                console.log(`✅ Tax liability created`);
              }
            } else {
              console.log(
                `Transaction already exists for business ${businessId}, skipping`,
              );
            }
          }
        }

        console.log("Committing transaction...");
        await session.commitTransaction();
        session.endSession();
        console.log("✅ Transaction committed successfully");
        console.log("========== VERIFICATION COMPLETE ==========");

        return {
          success: true,
          message: "Payment verified and businesses credited successfully",
          payment: this.sanitizePayment(updatedPayment),
        };
      } else {
        console.error(
          `❌ Khalti verification failed with status: ${verificationData.status}`,
        );

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
      console.error("❌ Error in verifyKhaltiPayment:", error);
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
