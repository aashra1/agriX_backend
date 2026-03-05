// __tests__/unit/services/wallet.service.test.ts
import mongoose from "mongoose";
import { WalletService } from "../../../services/wallet.service";
import { WalletRepository } from "../../../repositories/wallet.repository";
import { TransactionRepository } from "../../../repositories/transaction.repository";

jest.mock("../../../repositories/wallet.repository");
jest.mock("../../../repositories/transaction.repository");
jest.mock("mongoose");

describe("WalletService", () => {
  let service: WalletService;
  let mockWalletRepository: jest.Mocked<WalletRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockSession: any;

  const makeWalletDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "wallet123",
      ownerId: overrides.ownerId ?? "user123",
      ownerType: overrides.ownerType ?? "User",
      balance: overrides.balance ?? 1000,
      currency: overrides.currency ?? "NPR",
      __v: 0,
      toObject: () => ({ ...base, ...overrides }),
    };
    return base;
  };

  const makeTransactionDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "transaction123",
      wallet: overrides.wallet ?? "wallet123",
      type: overrides.type ?? "credit",
      amount: overrides.amount ?? 500,
      balance: overrides.balance ?? 1500,
      description: overrides.description ?? "Test",
      reference: overrides.reference ?? "order123",
      metadata: overrides.metadata ?? {},
      ownerId: overrides.ownerId ?? "user123",
      ownerType: overrides.ownerType ?? "User",
      __v: 0,
    };
    return base;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

    service = new WalletService();
    mockWalletRepository =
      new WalletRepository() as jest.Mocked<WalletRepository>;
    mockTransactionRepository =
      new TransactionRepository() as jest.Mocked<TransactionRepository>;
    (service as any).walletRepository = mockWalletRepository;
    (service as any).transactionRepository = mockTransactionRepository;
  });

  describe("getOrCreateWallet", () => {
    test("should return existing wallet", async () => {
      const wallet = makeWalletDoc({ ownerId: "user123", ownerType: "User" });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      const result = await service.getOrCreateWallet("user123", "User");
      expect(mockWalletRepository.findByOwner).toHaveBeenCalledWith(
        "user123",
        "User",
        undefined,
      );
      expect(mockWalletRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(wallet);
    });

    test("should create new wallet if not found", async () => {
      mockWalletRepository.findByOwner.mockResolvedValue(null);
      const newWallet = makeWalletDoc({
        ownerId: "user123",
        ownerType: "User",
        balance: 0,
      });
      mockWalletRepository.create.mockResolvedValue(newWallet as any);
      const result = await service.getOrCreateWallet("user123", "User");
      expect(mockWalletRepository.create).toHaveBeenCalledWith(
        {
          ownerId: expect.any(Object),
          ownerType: "User",
          balance: 0,
          currency: "NPR",
        },
        undefined,
      );
      expect(result).toEqual(newWallet);
    });

    test("should use session if provided", async () => {
      const wallet = makeWalletDoc({});
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      await service.getOrCreateWallet("user123", "User", mockSession);
      expect(mockWalletRepository.findByOwner).toHaveBeenCalledWith(
        "user123",
        "User",
        mockSession,
      );
    });
  });

  describe("creditUser", () => {
    const creditData = {
      ownerId: "user123",
      ownerType: "User" as const,
      amount: 500,
      description: "Credit",
      reference: "order123",
      metadata: {},
    };

    test("should credit user with session", async () => {
      const wallet = makeWalletDoc({ ownerId: "user123", balance: 1000 });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      const updatedWallet = makeWalletDoc({ ...wallet, balance: 1500 });
      mockWalletRepository.incrementBalance.mockResolvedValue(
        updatedWallet as any,
      );
      const transaction = makeTransactionDoc({});
      mockTransactionRepository.createTransaction.mockResolvedValue(
        transaction as any,
      );

      const result = await service.creditUser(creditData, mockSession);
      expect(mockWalletRepository.findByOwner).toHaveBeenCalledWith(
        "user123",
        "User",
        mockSession,
      );
      expect(mockWalletRepository.incrementBalance).toHaveBeenCalledWith(
        wallet._id.toString(),
        500,
        mockSession,
      );
      expect(mockTransactionRepository.createTransaction).toHaveBeenCalled();
      expect(result).toEqual({ wallet: updatedWallet, transaction });
    });

    test("should credit user without session", async () => {
      const wallet = makeWalletDoc({ ownerId: "user123", balance: 1000 });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      const updatedWallet = makeWalletDoc({ ...wallet, balance: 1500 });
      mockWalletRepository.incrementBalance.mockResolvedValue(
        updatedWallet as any,
      );
      const transaction = makeTransactionDoc({});
      mockTransactionRepository.createTransaction.mockResolvedValue(
        transaction as any,
      );

      const result = await service.creditUser(creditData);
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ wallet: updatedWallet, transaction });
    });

    test("should create wallet if not exists", async () => {
      mockWalletRepository.findByOwner.mockResolvedValue(null);
      const newWallet = makeWalletDoc({ ownerId: "user123", balance: 0 });
      mockWalletRepository.create.mockResolvedValue(newWallet as any);
      const updatedWallet = makeWalletDoc({ ...newWallet, balance: 500 });
      mockWalletRepository.incrementBalance.mockResolvedValue(
        updatedWallet as any,
      );
      const transaction = makeTransactionDoc({});
      mockTransactionRepository.createTransaction.mockResolvedValue(
        transaction as any,
      );

      const result = await service.creditUser(creditData, mockSession);
      expect(mockWalletRepository.create).toHaveBeenCalled();
      expect(result.wallet.balance).toBe(500);
    });

    test("should throw if increment fails", async () => {
      const wallet = makeWalletDoc({ ownerId: "user123" });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      mockWalletRepository.incrementBalance.mockResolvedValue(null);
      await expect(service.creditUser(creditData, mockSession)).rejects.toThrow(
        "Failed to update wallet balance",
      );
    });
  });

  describe("debitUser", () => {
    const debitData = {
      ownerId: "user123",
      ownerType: "User" as const,
      amount: 500,
      description: "Debit",
      reference: "order123",
      metadata: {},
    };

    test("should debit user with session", async () => {
      const wallet = makeWalletDoc({ ownerId: "user123", balance: 1000 });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      const updatedWallet = makeWalletDoc({ ...wallet, balance: 500 });
      mockWalletRepository.decrementBalance.mockResolvedValue(
        updatedWallet as any,
      );
      const transaction = makeTransactionDoc({ type: "debit" });
      mockTransactionRepository.createTransaction.mockResolvedValue(
        transaction as any,
      );

      const result = await service.debitUser(debitData, mockSession);
      expect(mockWalletRepository.decrementBalance).toHaveBeenCalledWith(
        wallet._id.toString(),
        500,
        mockSession,
      );
      expect(result).toEqual({ wallet: updatedWallet, transaction });
    });

    test("should throw if insufficient balance", async () => {
      const wallet = makeWalletDoc({ ownerId: "user123", balance: 100 });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      await expect(service.debitUser(debitData, mockSession)).rejects.toThrow(
        "Insufficient balance",
      );
    });

    test("should throw if decrement fails", async () => {
      const wallet = makeWalletDoc({ ownerId: "user123", balance: 1000 });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      mockWalletRepository.decrementBalance.mockResolvedValue(null);
      await expect(service.debitUser(debitData, mockSession)).rejects.toThrow(
        "Failed to update wallet balance",
      );
    });
  });

  describe("getBalance", () => {
    test("should return balance if wallet exists", async () => {
      const wallet = makeWalletDoc({ balance: 5000 });
      mockWalletRepository.findByOwner.mockResolvedValue(wallet as any);
      const result = await service.getBalance("user123", "User");
      expect(result).toEqual({ balance: 5000, currency: "NPR" });
    });

    test("should return zero if wallet not exists", async () => {
      mockWalletRepository.findByOwner.mockResolvedValue(null);
      const result = await service.getBalance("user123", "User");
      expect(result).toEqual({ balance: 0, currency: "NPR" });
    });
  });

  describe("getTransactions", () => {
    test("should return transactions with pagination", async () => {
      const transactions = [makeTransactionDoc({}), makeTransactionDoc({})];
      mockTransactionRepository.findByOwner.mockResolvedValue(
        transactions as any,
      );
      mockTransactionRepository.countByOwner.mockResolvedValue(2);

      const result = await service.getTransactions("user123", "User", {
        page: 2,
        limit: 5,
      });
      expect(mockTransactionRepository.findByOwner).toHaveBeenCalledWith(
        "user123",
        "User",
        5,
        5,
      );
      expect(mockTransactionRepository.countByOwner).toHaveBeenCalledWith(
        "user123",
        "User",
      );
      expect(result).toEqual({
        transactions,
        pagination: { page: 2, limit: 5, total: 2, pages: 1 },
      });
    });

    test("should use default pagination", async () => {
      const transactions = [makeTransactionDoc({})];
      mockTransactionRepository.findByOwner.mockResolvedValue(
        transactions as any,
      );
      mockTransactionRepository.countByOwner.mockResolvedValue(1);

      const result = await service.getTransactions("user123", "User");
      expect(mockTransactionRepository.findByOwner).toHaveBeenCalledWith(
        "user123",
        "User",
        0,
        10,
      );
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      });
    });
  });

  describe("checkTransactionExists", () => {
    test("should return true if exists", async () => {
      const transaction = makeTransactionDoc({});
      mockTransactionRepository.findByReference.mockResolvedValue(
        transaction as any,
      );
      const result = await service.checkTransactionExists(
        "user123",
        "order123",
      );
      expect(mockTransactionRepository.findByReference).toHaveBeenCalledWith(
        "user123",
        "order123",
        undefined,
      );
      expect(result).toBe(true);
    });

    test("should return false if not exists", async () => {
      mockTransactionRepository.findByReference.mockResolvedValue(null);
      const result = await service.checkTransactionExists(
        "user123",
        "order123",
      );
      expect(result).toBe(false);
    });

    test("should return false on error", async () => {
      mockTransactionRepository.findByReference.mockRejectedValue(
        new Error("DB error"),
      );
      const result = await service.checkTransactionExists(
        "user123",
        "order123",
      );
      expect(result).toBe(false);
    });
  });
});
