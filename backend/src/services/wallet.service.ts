// services/wallet.service.ts
import { WalletRepository } from "../repositories/wallet.repository";
import {
  CreditWalletDTO,
  DebitWalletDTO,
  WalletFilterDTO,
} from "../dtos/wallet.dto";
import { HttpError } from "../error/http-error";

export class WalletService {
  private walletRepository = new WalletRepository();

  async ensureWallet(ownerId: string, ownerType: "User" | "Business") {
    let wallet = await this.walletRepository.getWalletByOwner(
      ownerId,
      ownerType,
    );
    if (!wallet) {
      wallet = await this.walletRepository.createWallet({
        ownerId,
        ownerType,
        currency: "NPR",
      });
    }
    return wallet;
  }

  async creditUser(data: CreditWalletDTO, session?: any) {
    console.log("Crediting:", {
      ownerId: data.ownerId,
      ownerType: data.ownerType,
    });

    const wallet = await this.ensureWallet(data.ownerId, data.ownerType);

    const updatedWallet = await this.walletRepository.updateBalance(
      data.ownerId,
      data.ownerType,
      data.amount,
      session,
    );

    const transaction = await this.walletRepository.createTransaction({
      wallet: wallet._id.toString(),
      type: "credit",
      amount: data.amount,
      balance: updatedWallet!.balance,
      reference: data.reference,
      description: data.description,
      metadata: data.metadata,
    });

    return { wallet: updatedWallet, transaction };
  }

  async getBalance(ownerId: string, ownerType: "User" | "Business") {
    const wallet = await this.ensureWallet(ownerId, ownerType);
    return {
      balance: wallet.balance,
      currency: wallet.currency,
    };
  }

  async getTransactions(
    ownerId: string,
    ownerType: "User" | "Business",
    filter: WalletFilterDTO,
  ) {
    const skip = (filter.page - 1) * filter.limit;
    const result = await this.walletRepository.getTransactions(
      ownerId,
      ownerType,
      skip,
      filter.limit,
    );

    return {
      transactions: result.transactions,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total: result.total,
        pages: Math.ceil(result.total / filter.limit),
      },
    };
  }

  // Keep these for backward compatibility
  async creditUserOld(data: any, session?: any) {
    return this.creditUser(
      {
        ownerId: data.userId,
        ownerType: "User",
        amount: data.amount,
        reference: data.reference,
        description: data.description,
        metadata: data.metadata,
      },
      session,
    );
  }
}
