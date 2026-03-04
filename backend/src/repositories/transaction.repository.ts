// repositories/transaction.repository.ts
import mongoose from "mongoose";
import { TransactionModel, ITransaction } from "../model/wallet.model";

export class TransactionRepository {
  async createTransaction(
    data: Partial<ITransaction>,
    session?: mongoose.ClientSession,
  ): Promise<ITransaction> {
    console.log(
      "📝 Creating transaction with data:",
      JSON.stringify(data, null, 2),
    );

    try {
      const transaction = new TransactionModel(data);

      if (session) {
        console.log("Using session for transaction creation");
        const saved = await transaction.save({ session });
        console.log(`✅ Transaction saved with ID: ${saved._id}`);
        return saved;
      }

      console.log("No session provided, saving directly");
      const saved = await transaction.save();
      console.log(`✅ Transaction saved with ID: ${saved._id}`);
      return saved;
    } catch (error) {
      console.error("❌ Error creating transaction:", error);
      throw error;
    }
  }

  // repositories/transaction.repository.ts
  async findByOwner(
    ownerId: string,
    ownerType: "User" | "Business",
    skip: number = 0,
    limit: number = 10,
  ): Promise<ITransaction[]> {
    console.log(
      `🔍 Finding transactions for ${ownerType} ${ownerId}, skip: ${skip}, limit: ${limit}`,
    );

    try {
      // Try both string and ObjectId formats
      const transactions = await TransactionModel.find({
        $or: [
          { ownerId: ownerId }, // String match
          { ownerId: new mongoose.Types.ObjectId(ownerId) }, // ObjectId match
        ],
        ownerType: ownerType,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      console.log(`✅ Found ${transactions.length} transactions`);
      if (transactions.length > 0) {
        console.log(
          "First transaction:",
          JSON.stringify(transactions[0], null, 2),
        );
      }

      return transactions;
    } catch (error) {
      console.error("❌ Error finding transactions:", error);
      throw error;
    }
  }

  async countByOwner(
    ownerId: string,
    ownerType: "User" | "Business",
  ): Promise<number> {
    console.log(`🔍 Counting transactions for ${ownerType} ${ownerId}`);

    try {
      const count = await TransactionModel.countDocuments({
        $or: [
          { ownerId: ownerId },
          { ownerId: new mongoose.Types.ObjectId(ownerId) },
        ],
        ownerType: ownerType,
      }).exec();

      console.log(`✅ Count: ${count}`);
      return count;
    } catch (error) {
      console.error("❌ Error counting transactions:", error);
      throw error;
    }
  }

  async findByReference(
    ownerId: string,
    reference: string,
    session?: mongoose.ClientSession,
  ): Promise<ITransaction | null> {
    console.log(
      `🔍 Finding transaction by reference: ${reference} for owner ${ownerId}`,
    );

    try {
      const query = TransactionModel.findOne({
        $or: [
          { ownerId: ownerId },
          { ownerId: new mongoose.Types.ObjectId(ownerId) },
        ],
        reference,
        type: "credit",
      });

      let transaction;
      if (session) {
        transaction = await query.session(session).exec();
      } else {
        transaction = await query.exec();
      }

      console.log(
        `✅ Transaction found: ${transaction ? transaction._id : "none"}`,
      );
      return transaction;
    } catch (error) {
      console.error("❌ Error finding transaction by reference:", error);
      throw error;
    }
  }

  async findById(transactionId: string): Promise<ITransaction | null> {
    return await TransactionModel.findById(transactionId).exec();
  }

  async updateStatus(
    transactionId: string,
    status: "pending" | "completed" | "failed",
    session?: mongoose.ClientSession,
  ): Promise<ITransaction | null> {
    const update = { status };
    if (session) {
      return await TransactionModel.findByIdAndUpdate(transactionId, update, {
        new: true,
        session,
      }).exec();
    }
    return await TransactionModel.findByIdAndUpdate(transactionId, update, {
      new: true,
    }).exec();
  }
}
