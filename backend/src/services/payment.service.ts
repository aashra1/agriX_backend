import {
  PaymentRepository,
  IPaymentRepository,
} from "../repositories/payment.repository";
import { OrderRepository } from "../repositories/order.repository"; // Add this import
import {
  UserRepository,
  IUserRepository,
} from "../repositories/user.repository";
import { CreatePaymentDTO, UpdatePaymentDTO } from "../dtos/payment.dto";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../config/khalti";
import { HttpError } from "../error/http-error";

export class PaymentService {
  private paymentRepository: IPaymentRepository;
  private userRepository: IUserRepository;
  private orderRepository: OrderRepository; // Add this

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.userRepository = new UserRepository();
    this.orderRepository = new OrderRepository(); // Initialize it
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
    const payment = await this.paymentRepository.getPaymentByPidx(pidx);
    if (!payment) {
      throw new HttpError(404, "Payment record not found");
    }

    if (payment.orderId !== orderId) {
      throw new HttpError(400, "Order ID mismatch");
    }

    if (payment.status === "completed") {
      return {
        success: true,
        message: "Payment already verified",
        payment: this.sanitizePayment(payment),
      };
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

      // !!! IMPORTANT: Update the order's payment status !!!
      await this.orderRepository.updatePaymentStatus(
        orderId,
        "completed", // Change from "pending" to "completed"
      );

      return {
        success: true,
        message: "Payment verified successfully",
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

      // Optionally update order payment status to failed
      await this.orderRepository.updatePaymentStatus(orderId, "failed");

      throw new HttpError(400, `Payment status: ${verificationData.status}`);
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
