import { Request, Response } from "express";
import { WalletController } from "../../../controllers/wallet.controller";
import { WalletService } from "../../../services/wallet.service";

jest.mock("../../../services/wallet.service");

describe("WalletController Unit Tests", () => {
  let controller: WalletController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockService: jest.Mocked<WalletService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new WalletController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockService = { getBalance: jest.fn(), getTransactions: jest.fn() } as any;
    (controller as any).walletService = mockService;
  });

  test("getWalletBalance - should return user balance", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockService.getBalance.mockResolvedValue({ balance: 1000 } as any);
    await controller.getWalletBalance(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("getTransactions - should return transactions", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    mockRequest.query = { page: "1", limit: "10" };
    mockService.getTransactions.mockResolvedValue({
      transactions: [{ _id: "1" }],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    } as any);
    await controller.getTransactions(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("getBusinessWalletBalance - should return business balance", async () => {
    mockRequest.user = { id: "biz123", businessId: "biz123", role: "Business" };
    mockService.getBalance.mockResolvedValue({ balance: 5000 } as any);
    await controller.getBusinessWalletBalance(
      mockRequest as Request,
      mockResponse as Response,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
