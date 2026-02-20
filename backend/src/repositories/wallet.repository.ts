import {
  WalletModel,
  TransactionModel,
  IWallet,
  ITransaction,
} from "../model/wallet.model";
import { CreateWalletDTO, CreateTransactionDTO } from "../dtos/wallet.dto";

export interface IWalletRepository {
  getWalletByOwner(ownerId: string, ownerType: string): Promise<IWallet | null>;
  createWallet(data: CreateWalletDTO): Promise<IWallet>;
  updateBalance(
    ownerId: string,
    ownerType: string,
    amount: number,
    session?: any,
  ): Promise<IWallet | null>;
  createTransaction(data: CreateTransactionDTO): Promise<ITransaction>;
  getTransactions(
    ownerId: string,
    ownerType: string,
    skip: number,
    limit: number,
  ): Promise<{ transactions: ITransaction[]; total: number }>;
}

export class WalletRepository implements IWalletRepository {
  async getWalletByOwner(
    ownerId: string,
    ownerType: string,
  ): Promise<IWallet | null> {
    return await WalletModel.findOne({ ownerId, ownerType }).exec();
  }

  async createWallet(data: CreateWalletDTO): Promise<IWallet> {
    const wallet = new WalletModel({
      ownerId: data.ownerId,
      ownerType: data.ownerType,
      balance: 0,
      currency: data.currency,
    });
    return await wallet.save();
  }

  async updateBalance(
    ownerId: string,
    ownerType: string,
    amount: number,
    session?: any,
  ): Promise<IWallet | null> {
    return await WalletModel.findOneAndUpdate(
      { ownerId, ownerType },
      { $inc: { balance: amount } },
      { new: true, session },
    ).exec();
  }

  async createTransaction(data: CreateTransactionDTO): Promise<ITransaction> {
    const transaction = new TransactionModel(data);
    return await transaction.save();
  }

  async getTransactions(
    ownerId: string,
    ownerType: string,
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    const wallet = await this.getWalletByOwner(ownerId, ownerType);
    if (!wallet) {
      return { transactions: [], total: 0 };
    }

    const transactions = await TransactionModel.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await TransactionModel.countDocuments({ wallet: wallet._id });

    return { transactions, total };
  }
}
