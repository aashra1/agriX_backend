import { Request, Response } from "express";
import { TaxController } from "../../../controllers/tax.controller";
import { TaxRepository } from "../../../repositories/tax.repository";
import mongoose from "mongoose";

jest.mock("../../../repositories/tax.repository");

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
    mockResponse = {
      status: statusFn,
    };
    jest.clearAllMocks();
  });

  describe("getBusinessTaxLiabilities", () => {
    test("should return 400 if businessId is missing", async () => {
      mockRequest = {
        user: undefined as any,
        query: {},
      };

      await controller.getBusinessTaxLiabilities(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Business ID required" }),
      );
    });

    test("should fetch taxes successfully", async () => {
      const mockBusinessId = "biz_123";
      mockRequest = {
        user: {
          id: "user_123",
          role: "Business",
          businessId: mockBusinessId,
        } as any,
        query: { period: "2024-Q1", status: "accrued" },
      };

      const mockTaxes = [{ id: "1", amount: 100 }];
      const mockTotal = 100;

      (TaxRepository.prototype.findByBusiness as jest.Mock).mockResolvedValue(
        mockTaxes,
      );
      (
        TaxRepository.prototype.getTotalAccruedByBusiness as jest.Mock
      ).mockResolvedValue(mockTotal);

      await controller.getBusinessTaxLiabilities(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        data: {
          taxes: mockTaxes,
          summary: { totalAccrued: mockTotal, count: 1 },
        },
      });
    });
  });

  describe("payTaxes", () => {
    test("should handle tax payment with transactions", async () => {
      const mockBusinessId = "biz_123";
      mockRequest = {
        user: {
          id: "user_123",
          role: "Business",
          businessId: mockBusinessId,
        } as any,
        body: { period: "2024-Q1" },
      };

      (TaxRepository.prototype.markAsPaid as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });

      await controller.payTaxes(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    test("should abort transaction on error", async () => {
      mockRequest = {
        user: {
          id: "user_123",
          role: "Business",
          businessId: "biz_123",
        } as any,
        body: { period: "2024-Q1" },
      };

      (TaxRepository.prototype.markAsPaid as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );

      await controller.payTaxes(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({ message: "DB Error" }),
      );
    });
  });
});
