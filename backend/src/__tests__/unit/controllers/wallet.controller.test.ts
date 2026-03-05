import { Request, Response } from "express";
import { WalletController } from "../../../controllers/wallet.controller";
import { WalletService } from "../../../services/wallet.service";
import { WalletFilterDTO } from "../../../dtos/wallet.dto";

jest.mock("../../../services/wallet.service");
jest.mock("../../../dtos/wallet.dto");

describe("WalletController", () => {
  let controller: WalletController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    controller = new WalletController();
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockResponse = { status: statusFn, json: jsonFn };

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("getWalletBalance", () => {
    test("should get user wallet balance successfully", async () => {
      mockRequest = {
        user: { id: "user123" } as any,
      };

      const mockBalance = { balance: 5000, currency: "NPR" };
      const balanceSpy = jest.spyOn(WalletService.prototype, "getBalance");
      balanceSpy.mockResolvedValue(mockBalance as any);

      await controller.getWalletBalance(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(balanceSpy).toHaveBeenCalledWith("user123", "User");
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        data: mockBalance,
      });
    });

    test("should handle error with custom status code", async () => {
      mockRequest = { user: { id: "user123" } as any };

      const error: any = new Error("Wallet not found");
      error.statusCode = 404;
      jest
        .spyOn(WalletService.prototype, "getBalance")
        .mockRejectedValue(error);

      await controller.getWalletBalance(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(404);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Wallet not found",
      });
    });
  });

  describe("getTransactions", () => {
    test("should get user transactions with valid query", async () => {
      const mockQuery = { page: "1", limit: "10" };
      const mockValidated = { page: 1, limit: 10 };

      (WalletFilterDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidated,
      });

      mockRequest = {
        user: { id: "user123" } as any,
        query: mockQuery,
      };

      const mockResult = {
        transactions: [{ id: "tx1" }],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      const txSpy = jest.spyOn(WalletService.prototype, "getTransactions");
      txSpy.mockResolvedValue(mockResult as any);

      await controller.getTransactions(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(txSpy).toHaveBeenCalledWith("user123", "User", mockValidated);
      expect(statusFn).toHaveBeenCalledWith(200);
    });

    test("should return 400 for invalid query parameters", async () => {
      (WalletFilterDTO.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { format: () => ({ page: "Invalid" }) },
      });

      mockRequest = { user: { id: "user123" } as any, query: { page: "abc" } };

      await controller.getTransactions(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });
  });

  describe("getBusinessWalletBalance", () => {
    test("should get business wallet balance successfully", async () => {
      mockRequest = {
        user: { businessId: "biz123" } as any,
      };

      const mockBalance = { balance: 10000 };
      const balanceSpy = jest.spyOn(WalletService.prototype, "getBalance");
      balanceSpy.mockResolvedValue(mockBalance as any);

      await controller.getBusinessWalletBalance(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(balanceSpy).toHaveBeenCalledWith("biz123", "Business");
      expect(statusFn).toHaveBeenCalledWith(200);
    });

    test("should return 400 if businessId is missing", async () => {
      mockRequest = { user: {} as any };

      await controller.getBusinessWalletBalance(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Business ID required",
      });
    });
  });

  describe("getBusinessTransactions", () => {
    test("should get business transactions successfully", async () => {
      mockRequest = {
        user: { businessId: "biz123" } as any,
        query: { page: "1" },
      };

      (WalletFilterDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { page: 1, limit: 10 },
      });

      const txSpy = jest.spyOn(WalletService.prototype, "getTransactions");
      txSpy.mockResolvedValue({ transactions: [], pagination: {} } as any);

      await controller.getBusinessTransactions(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(txSpy).toHaveBeenCalledWith("biz123", "Business", {
        page: 1,
        limit: 10,
      });
      expect(statusFn).toHaveBeenCalledWith(200);
    });
  });
});
