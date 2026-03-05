import { Request, Response } from "express";
import { TaxController } from "../../../controllers/tax.controller";
import { TaxRepository } from "../../../repositories/tax.repository";
import mongoose from "mongoose";

jest.mock("../../../repositories/tax.repository");
jest.mock("mongoose");

describe("TaxController", () => {
  let controller: TaxController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    controller = new TaxController();
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockResponse = { status: statusFn, json: jsonFn };

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("getBusinessTaxLiabilities", () => {
    test("should get tax liabilities", async () => {
      mockRequest = {
        user: { businessId: "biz123" } as any,
        query: { period: "2024-Q1", status: "accrued" },
      };

      const mockTaxes = [{ id: "tax1", amount: 100 }];

      // Spy on the prototype to catch the instance inside the controller
      const findSpy = jest.spyOn(TaxRepository.prototype, "findByBusiness");
      const totalSpy = jest.spyOn(
        TaxRepository.prototype,
        "getTotalAccruedByBusiness",
      );

      findSpy.mockResolvedValue(mockTaxes as any);
      totalSpy.mockResolvedValue(100);

      await controller.getBusinessTaxLiabilities(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(findSpy).toHaveBeenCalledWith("biz123", "2024-Q1", "accrued");
      expect(totalSpy).toHaveBeenCalledWith("biz123", "2024-Q1");
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        data: {
          taxes: mockTaxes,
          summary: { totalAccrued: 100, count: 1 },
        },
      });
    });

    test("should return 400 if no businessId", async () => {
      mockRequest = { user: {} as any, query: {} };

      await controller.getBusinessTaxLiabilities(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Business ID required",
      });
    });

    test("should handle error", async () => {
      mockRequest = { user: { businessId: "biz123" } as any, query: {} };

      jest
        .spyOn(TaxRepository.prototype, "findByBusiness")
        .mockRejectedValue(new Error("Failed"));

      await controller.getBusinessTaxLiabilities(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Failed",
      });
    });
  });

  describe("payTaxes", () => {
    let mockSession: any;

    beforeEach(() => {
      mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);
    });

    test("should pay taxes successfully", async () => {
      mockRequest = {
        user: { businessId: "biz123" } as any,
        body: { period: "2024-Q1" },
      };

      const markPaidSpy = jest.spyOn(TaxRepository.prototype, "markAsPaid");
      markPaidSpy.mockResolvedValue({ modifiedCount: 5 } as any);

      await controller.payTaxes(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(markPaidSpy).toHaveBeenCalledWith(
        "biz123",
        "2024-Q1",
        mockSession,
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Tax for period 2024-Q1 marked as paid",
        data: { modifiedCount: 5 },
      });
    });

    test("should return 400 if missing fields", async () => {
      mockRequest = { user: {} as any, body: {} };

      await controller.payTaxes(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Business ID and period are required",
      });
    });

    test("should abort transaction on error", async () => {
      mockRequest = {
        user: { businessId: "biz123" } as any,
        body: { period: "2024-Q1" },
      };

      jest
        .spyOn(TaxRepository.prototype, "markAsPaid")
        .mockRejectedValue(new Error("Failed"));

      await controller.payTaxes(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Failed",
      });
    });
  });
});
