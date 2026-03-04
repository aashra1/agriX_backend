import { Request, Response } from "express";
import { TaxRepository } from "../repositories/tax.repository";
import mongoose from "mongoose";

const taxRepository = new TaxRepository();

export class TaxController {
  getBusinessTaxLiabilities = async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "Business ID required",
        });
      }

      const { period, status } = req.query;
      const taxes = await taxRepository.findByBusiness(
        businessId,
        period as string,
        status as "accrued" | "paid",
      );

      const totalAccrued = await taxRepository.getTotalAccruedByBusiness(
        businessId,
        period as string,
      );

      return res.status(200).json({
        success: true,
        data: {
          taxes,
          summary: {
            totalAccrued,
            count: taxes.length,
          },
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch tax liabilities",
      });
    }
  };

  payTaxes = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const businessId = req.user?.businessId;
      const { period } = req.body;

      if (!businessId || !period) {
        return res.status(400).json({
          success: false,
          message: "Business ID and period are required",
        });
      }

      const result = await taxRepository.markAsPaid(
        businessId,
        period,
        session,
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: `Tax for period ${period} marked as paid`,
        data: { modifiedCount: result.modifiedCount },
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process tax payment",
      });
    }
  };
}
