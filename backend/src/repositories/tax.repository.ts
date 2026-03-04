import mongoose from "mongoose";
import { TaxLiabilityModel, ITaxLiability } from "../model/tax.model";

export class TaxRepository {
  async create(data: Partial<ITaxLiability>): Promise<ITaxLiability> {
    const tax = new TaxLiabilityModel(data);
    return await tax.save();
  }

  async createWithSession(
    data: Partial<ITaxLiability>,
    session: mongoose.ClientSession,
  ): Promise<ITaxLiability> {
    console.log(
      "📝 Creating tax liability with data:",
      JSON.stringify(data, null, 2),
    );

    try {
      const tax = new TaxLiabilityModel(data);
      const saved = await tax.save({ session });
      console.log(`✅ Tax liability saved with ID: ${saved._id}`);
      return saved;
    } catch (error) {
      console.error("❌ Error creating tax liability:", error);
      throw error;
    }
  }
  
  async findByBusiness(
    businessId: string,
    period?: string,
    status?: "accrued" | "paid",
  ): Promise<ITaxLiability[]> {
    const query: any = { businessId };
    if (period) query.period = period;
    if (status) query.status = status;
    return await TaxLiabilityModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findByOrder(orderId: string): Promise<ITaxLiability | null> {
    return await TaxLiabilityModel.findOne({ orderId }).exec();
  }

  async getTotalAccruedByBusiness(
    businessId: string,
    period?: string,
  ): Promise<number> {
    const query: any = { businessId, status: "accrued" };
    if (period) query.period = period;
    const result = await TaxLiabilityModel.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async markAsPaid(
    businessId: string,
    period: string,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const update = {
      status: "paid" as const,
      paidAt: new Date(),
    };
    if (session) {
      return await TaxLiabilityModel.updateMany(
        { businessId, period, status: "accrued" },
        update,
        { session },
      ).exec();
    }
    return await TaxLiabilityModel.updateMany(
      { businessId, period, status: "accrued" },
      update,
    ).exec();
  }
}
