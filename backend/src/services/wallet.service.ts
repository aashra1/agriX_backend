import { HttpError } from "../error/http-error";
import mongoose from "mongoose";

export class WalletService {
  private walletRepository = new WalletRepository();

  async ensureWallet(userId: string) {
    let wallet = await this.walletRepository.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.walletRepository.createWallet(userId);
    }
    return wallet;
  }

  async creditUser(
    userId: string,
    amount: number,
    reference: string,
    description: string,
    session?: any,
  ) {
    const wallet = await this.ensureWallet(userId);

    const updatedWallet = await this.walletRepository.updateBalance(
      userId,
      amount,
      session,
    );

    await this.walletRepository.createTransaction({
      wallet: wallet._id,
      type: "credit",
      amount,
      balance: updatedWallet!.balance,
      reference,
      description,
    });

    return updatedWallet;
  }

  async debitUser(
    userId: string,
    amount: number,
    reference: string,
    description: string,
    session?: any,
  ) {
    const wallet = await this.ensureWallet(userId);

    if (wallet.balance < amount) {
      throw new HttpError(400, "Insufficient balance");
    }

    const updatedWallet = await this.walletRepository.updateBalance(
      userId,
      -amount,
      session,
    );

    await this.walletRepository.createTransaction({
      wallet: wallet._id,
      type: "debit",
      amount,
      balance: updatedWallet!.balance,
      reference,
      description,
    });

    return updatedWallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return wallet.balance;
  }

  async getTransactions(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return await this.walletRepository.getTransactions(userId, skip, limit);
  }
}
