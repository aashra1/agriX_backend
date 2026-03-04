import mongoose from "mongoose";
import { WalletModel, IWallet } from "../model/wallet.model";

export class WalletRepository {
  async findByOwner(
    ownerId: string,
    ownerType: "User" | "Business",
    session?: mongoose.ClientSession,
  ): Promise<IWallet | null> {
    try {
      const query = WalletModel.findOne({ ownerId, ownerType });
      if (session) {
        return await query.session(session).exec();
      }
      return await query.exec();
    } catch (error) {
      console.error("Error in findByOwner:", error);
      throw error;
    }
  }

  async create(
    data: Partial<IWallet>,
    session?: mongoose.ClientSession,
  ): Promise<IWallet> {
    try {
      const wallet = new WalletModel(data);
      if (session) {
        return await wallet.save({ session });
      }
      return await wallet.save();
    } catch (error) {
      console.error("Error in create:", error);
      throw error;
    }
  }

  async incrementBalance(
    walletId: string,
    amount: number,
    session?: mongoose.ClientSession,
  ): Promise<IWallet | null> {
    try {
      const update = { $inc: { balance: amount } };
      const options = { new: true, session, runValidators: true };

      const updated = await WalletModel.findByIdAndUpdate(
        walletId,
        update,
        options,
      ).exec();

      if (!updated) {
        console.log(`Wallet with ID ${walletId} not found for increment`);
      }

      return updated;
    } catch (error) {
      console.error("Error in incrementBalance:", error);
      throw error;
    }
  }

  async decrementBalance(
    walletId: string,
    amount: number,
    session?: mongoose.ClientSession,
  ): Promise<IWallet | null> {
    try {
      const update = { $inc: { balance: -amount } };
      const options = { new: true, session, runValidators: true };

      const updated = await WalletModel.findByIdAndUpdate(
        walletId,
        update,
        options,
      ).exec();

      if (!updated) {
        console.log(`Wallet with ID ${walletId} not found for decrement`);
      }

      return updated;
    } catch (error) {
      console.error("Error in decrementBalance:", error);
      throw error;
    }
  }

  async updateBalance(
    walletId: string,
    balance: number,
    session?: mongoose.ClientSession,
  ): Promise<IWallet | null> {
    try {
      const options = { new: true, session, runValidators: true };

      const updated = await WalletModel.findByIdAndUpdate(
        walletId,
        { balance },
        options,
      ).exec();

      if (!updated) {
        console.log(`Wallet with ID ${walletId} not found for update`);
      }

      return updated;
    } catch (error) {
      console.error("Error in updateBalance:", error);
      throw error;
    }
  }
}
