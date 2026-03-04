// src/__tests__/unit/wallet/wallet.service.test.ts
import mongoose from "mongoose";
import { WalletService } from "../../../services/wallet.service";
import { HttpError } from "../../../error/http-error";

// Mock mongoose
jest.mock("mongoose", () => ({
  startSession: jest.fn(),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id })),
  },
  ClientSession: jest.fn(),
}));

// Mock repositories
jest.mock("../../../repositories/wallet.repository", () => {
  const repoMock = {
    findByOwner: jest.fn(),
    create: jest.fn(),
    incrementBalance: jest.fn(),
    decrementBalance: jest.fn(),
  };

  return {
    WalletRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

jest.mock("../../../repositories/transaction.repository", () => {
  const repoMock = {
    createTransaction: jest.fn(),
    findByOwner: jest.fn(),
    countByOwner: jest.fn(),
    findByReference: jest.fn(),
  };

  return {
    TransactionRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

// Import after mocks
import { WalletRepository } from "../../../repositories/wallet.repository";
import { TransactionRepository } from "../../../repositories/transaction.repository";

// Get mock objects from mocked modules
const mockWalletRepoMethods = (
  jest.requireMock("../../../repositories/wallet.repository") as any
).__mockRepo;
const mockTransactionRepoMethods = (
  jest.requireMock("../../../repositories/transaction.repository") as any
).__mockRepo;

describe("WalletService Unit Tests", () => {
  let service: WalletService;
  let walletRepoMock: any;
  let transactionRepoMock: any;
  let mockSession: any;

  const makeWalletDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "wallet123",
      ownerId: overrides.ownerId ?? "user123",
      ownerType: overrides.ownerType ?? "User",
      balance: overrides.balance ?? 1000,
      currency: overrides.currency ?? "NPR",
      __v: 0,
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  const makeTransactionDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "transaction123",
      wallet: overrides.wallet ?? "wallet123",
      type: overrides.type ?? "credit",
      amount: overrides.amount ?? 500,
      balance: overrides.balance ?? 1500,
      description: overrides.description ?? "Test transaction",
      reference: overrides.reference ?? "order123",
      metadata: overrides.metadata ?? {},
      ownerId: overrides.ownerId ?? "user123",
      ownerType: overrides.ownerType ?? "User",
      __v: 0,
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
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
    walletRepoMock = mockWalletRepoMethods;
    transactionRepoMock = mockTransactionRepoMethods;
  });

  describe("getOrCreateWallet", () => {
    const ownerId = "user123";
    const ownerType = "User" as const;

    test("should return existing wallet if found", async () => {
      const existingWallet = makeWalletDoc({ ownerId, ownerType });
      walletRepoMock.findByOwner.mockResolvedValue(existingWallet);

      const result = await service.getOrCreateWallet(ownerId, ownerType);

      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
        undefined,
      );
      expect(walletRepoMock.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingWallet);
    });

    test("should create new wallet if not found", async () => {
      walletRepoMock.findByOwner.mockResolvedValue(null);

      const newWallet = makeWalletDoc({ ownerId, ownerType, balance: 0 });
      walletRepoMock.create.mockResolvedValue(newWallet);

      const result = await service.getOrCreateWallet(ownerId, ownerType);

      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
        undefined,
      );
      expect(walletRepoMock.create).toHaveBeenCalledWith(
        {
          ownerId: expect.any(Object),
          ownerType,
          balance: 0,
          currency: "NPR",
        },
        undefined,
      );
      expect(result).toEqual(newWallet);
    });

    test("should use session if provided", async () => {
      const existingWallet = makeWalletDoc({ ownerId, ownerType });
      walletRepoMock.findByOwner.mockResolvedValue(existingWallet);

      const result = await service.getOrCreateWallet(
        ownerId,
        ownerType,
        mockSession,
      );

      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
        mockSession,
      );
      expect(result).toEqual(existingWallet);
    });
  });

  describe("creditUser", () => {
    const creditData = {
      ownerId: "user123",
      ownerType: "User" as const,
      amount: 500,
      description: "Credit test",
      reference: "order123",
      metadata: { orderId: "order123" },
    };

    test("should credit user successfully with provided session", async () => {
      const wallet = makeWalletDoc({
        ownerId: creditData.ownerId,
        ownerType: creditData.ownerType,
        balance: 1000,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);

      const updatedWallet = makeWalletDoc({
        ...wallet,
        balance: 1500,
      });

      walletRepoMock.incrementBalance.mockResolvedValue(updatedWallet);

      const transaction = makeTransactionDoc({
        wallet: wallet._id,
        type: "credit",
        amount: 500,
        balance: 1500,
        description: creditData.description,
        reference: creditData.reference,
        metadata: creditData.metadata,
        ownerId: creditData.ownerId,
        ownerType: creditData.ownerType,
      });

      transactionRepoMock.createTransaction.mockResolvedValue(transaction);

      const result = await service.creditUser(creditData, mockSession);

      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        creditData.ownerId,
        creditData.ownerType,
        mockSession,
      );
      expect(walletRepoMock.incrementBalance).toHaveBeenCalledWith(
        wallet._id.toString(),
        creditData.amount,
        mockSession,
      );
      expect(transactionRepoMock.createTransaction).toHaveBeenCalledWith(
        {
          wallet: wallet._id,
          type: "credit",
          amount: creditData.amount,
          balance: updatedWallet.balance,
          description: creditData.description,
          reference: creditData.reference,
          metadata: creditData.metadata,
          ownerId: creditData.ownerId,
          ownerType: creditData.ownerType,
        },
        mockSession,
      );
      expect(result).toEqual({ wallet: updatedWallet, transaction });
    });

    test("should credit user successfully without session", async () => {
      const wallet = makeWalletDoc({
        ownerId: creditData.ownerId,
        ownerType: creditData.ownerType,
        balance: 1000,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);

      const updatedWallet = makeWalletDoc({
        ...wallet,
        balance: 1500,
      });

      walletRepoMock.incrementBalance.mockResolvedValue(updatedWallet);

      const transaction = makeTransactionDoc({
        wallet: wallet._id,
        type: "credit",
        amount: 500,
        balance: 1500,
      });

      transactionRepoMock.createTransaction.mockResolvedValue(transaction);

      const result = await service.creditUser(creditData);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        creditData.ownerId,
        creditData.ownerType,
        mockSession,
      );
      expect(walletRepoMock.incrementBalance).toHaveBeenCalled();
      expect(transactionRepoMock.createTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual({ wallet: updatedWallet, transaction });
    });

    test("should create wallet if not exists during credit", async () => {
      walletRepoMock.findByOwner.mockResolvedValue(null);

      const newWallet = makeWalletDoc({
        ownerId: creditData.ownerId,
        ownerType: creditData.ownerType,
        balance: 0,
      });

      walletRepoMock.create.mockResolvedValue(newWallet);

      const updatedWallet = makeWalletDoc({
        ...newWallet,
        balance: 500,
      });

      walletRepoMock.incrementBalance.mockResolvedValue(updatedWallet);

      const transaction = makeTransactionDoc({
        wallet: newWallet._id,
        type: "credit",
        amount: 500,
        balance: 500,
      });

      transactionRepoMock.createTransaction.mockResolvedValue(transaction);

      const result = await service.creditUser(creditData, mockSession);

      expect(walletRepoMock.create).toHaveBeenCalled();
      expect(walletRepoMock.incrementBalance).toHaveBeenCalled();
      expect(result.wallet.balance).toBe(500);
    });

    test("should throw error if increment balance fails", async () => {
      const wallet = makeWalletDoc({
        ownerId: creditData.ownerId,
        ownerType: creditData.ownerType,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);
      walletRepoMock.incrementBalance.mockResolvedValue(null);

      await expect(service.creditUser(creditData, mockSession)).rejects.toThrow(
        "Failed to update wallet balance",
      );

      expect(transactionRepoMock.createTransaction).not.toHaveBeenCalled();
    });

    test("should abort transaction if error occurs without session", async () => {
      const wallet = makeWalletDoc({
        ownerId: creditData.ownerId,
        ownerType: creditData.ownerType,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);
      walletRepoMock.incrementBalance.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.creditUser(creditData)).rejects.toThrow(
        "Database error",
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe("debitUser", () => {
    const debitData = {
      ownerId: "user123",
      ownerType: "User" as const,
      amount: 500,
      description: "Debit test",
      reference: "order123",
      metadata: { orderId: "order123" },
    };

    test("should debit user successfully with provided session", async () => {
      const wallet = makeWalletDoc({
        ownerId: debitData.ownerId,
        ownerType: debitData.ownerType,
        balance: 1000,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);

      const updatedWallet = makeWalletDoc({
        ...wallet,
        balance: 500,
      });

      walletRepoMock.decrementBalance.mockResolvedValue(updatedWallet);

      const transaction = makeTransactionDoc({
        wallet: wallet._id,
        type: "debit",
        amount: 500,
        balance: 500,
        description: debitData.description,
        reference: debitData.reference,
        metadata: debitData.metadata,
        ownerId: debitData.ownerId,
        ownerType: debitData.ownerType,
      });

      transactionRepoMock.createTransaction.mockResolvedValue(transaction);

      const result = await service.debitUser(debitData, mockSession);

      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        debitData.ownerId,
        debitData.ownerType,
        mockSession,
      );
      expect(walletRepoMock.decrementBalance).toHaveBeenCalledWith(
        wallet._id.toString(),
        debitData.amount,
        mockSession,
      );
      expect(transactionRepoMock.createTransaction).toHaveBeenCalledWith(
        {
          wallet: wallet._id,
          type: "debit",
          amount: debitData.amount,
          balance: updatedWallet.balance,
          description: debitData.description,
          reference: debitData.reference,
          metadata: debitData.metadata,
          ownerId: debitData.ownerId,
          ownerType: debitData.ownerType,
        },
        mockSession,
      );
      expect(result).toEqual({ wallet: updatedWallet, transaction });
    });

    test("should debit user successfully without session", async () => {
      const wallet = makeWalletDoc({
        ownerId: debitData.ownerId,
        ownerType: debitData.ownerType,
        balance: 1000,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);

      const updatedWallet = makeWalletDoc({
        ...wallet,
        balance: 500,
      });

      walletRepoMock.decrementBalance.mockResolvedValue(updatedWallet);

      const transaction = makeTransactionDoc({
        wallet: wallet._id,
        type: "debit",
        amount: 500,
        balance: 500,
      });

      transactionRepoMock.createTransaction.mockResolvedValue(transaction);

      const result = await service.debitUser(debitData);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        debitData.ownerId,
        debitData.ownerType,
        mockSession,
      );
      expect(walletRepoMock.decrementBalance).toHaveBeenCalled();
      expect(transactionRepoMock.createTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual({ wallet: updatedWallet, transaction });
    });

    test("should throw error if insufficient balance", async () => {
      const wallet = makeWalletDoc({
        ownerId: debitData.ownerId,
        ownerType: debitData.ownerType,
        balance: 100, // Less than debit amount
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);

      await expect(service.debitUser(debitData, mockSession)).rejects.toThrow(
        new HttpError(400, "Insufficient balance"),
      );

      expect(walletRepoMock.decrementBalance).not.toHaveBeenCalled();
      expect(transactionRepoMock.createTransaction).not.toHaveBeenCalled();
    });

    test("should throw error if decrement balance fails", async () => {
      const wallet = makeWalletDoc({
        ownerId: debitData.ownerId,
        ownerType: debitData.ownerType,
        balance: 1000,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);
      walletRepoMock.decrementBalance.mockResolvedValue(null);

      await expect(service.debitUser(debitData, mockSession)).rejects.toThrow(
        "Failed to update wallet balance",
      );

      expect(transactionRepoMock.createTransaction).not.toHaveBeenCalled();
    });

    test("should create wallet if not exists during debit (but will fail due to balance)", async () => {
      walletRepoMock.findByOwner.mockResolvedValue(null);

      const newWallet = makeWalletDoc({
        ownerId: debitData.ownerId,
        ownerType: debitData.ownerType,
        balance: 0,
      });

      walletRepoMock.create.mockResolvedValue(newWallet);

      // Even though wallet is created, debit will fail due to insufficient balance
      await expect(service.debitUser(debitData, mockSession)).rejects.toThrow(
        new HttpError(400, "Insufficient balance"),
      );

      expect(walletRepoMock.create).toHaveBeenCalled();
      expect(walletRepoMock.decrementBalance).not.toHaveBeenCalled();
    });

    test("should abort transaction if error occurs without session", async () => {
      const wallet = makeWalletDoc({
        ownerId: debitData.ownerId,
        ownerType: debitData.ownerType,
        balance: 1000,
      });

      walletRepoMock.findByOwner.mockResolvedValue(wallet);
      walletRepoMock.decrementBalance.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.debitUser(debitData)).rejects.toThrow(
        "Database error",
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe("getBalance", () => {
    const ownerId = "user123";
    const ownerType = "User" as const;

    test("should return balance if wallet exists", async () => {
      const wallet = makeWalletDoc({ ownerId, ownerType, balance: 5000 });
      walletRepoMock.findByOwner.mockResolvedValue(wallet);

      const result = await service.getBalance(ownerId, ownerType);

      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
      );
      expect(result).toEqual({ balance: 5000, currency: "NPR" });
    });

    test("should return zero balance if wallet does not exist", async () => {
      walletRepoMock.findByOwner.mockResolvedValue(null);

      const result = await service.getBalance(ownerId, ownerType);

      expect(walletRepoMock.findByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
      );
      expect(result).toEqual({ balance: 0, currency: "NPR" });
    });

    test("should throw error if repository throws", async () => {
      walletRepoMock.findByOwner.mockRejectedValue(new Error("Database error"));

      await expect(service.getBalance(ownerId, ownerType)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("getTransactions", () => {
    const ownerId = "user123";
    const ownerType = "User" as const;

    test("should return transactions with pagination", async () => {
      const transactions = [
        makeTransactionDoc({ _id: "txn1", ownerId, ownerType, amount: 500 }),
        makeTransactionDoc({ _id: "txn2", ownerId, ownerType, amount: 300 }),
      ];

      transactionRepoMock.findByOwner.mockResolvedValue(transactions);
      transactionRepoMock.countByOwner.mockResolvedValue(2);

      const result = await service.getTransactions(ownerId, ownerType, {
        page: 2,
        limit: 5,
      });

      expect(transactionRepoMock.findByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
        5,
        5,
      );
      expect(transactionRepoMock.countByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
      );
      expect(result).toEqual({
        transactions,
        pagination: {
          page: 2,
          limit: 5,
          total: 2,
          pages: 1,
        },
      });
    });

    test("should use default pagination values", async () => {
      const transactions = [makeTransactionDoc({ ownerId, ownerType })];
      transactionRepoMock.findByOwner.mockResolvedValue(transactions);
      transactionRepoMock.countByOwner.mockResolvedValue(1);

      const result = await service.getTransactions(ownerId, ownerType);

      expect(transactionRepoMock.findByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
        0,
        10,
      );
      expect(transactionRepoMock.countByOwner).toHaveBeenCalledWith(
        ownerId,
        ownerType,
      );
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      });
    });

    test("should return empty array if no transactions", async () => {
      transactionRepoMock.findByOwner.mockResolvedValue([]);
      transactionRepoMock.countByOwner.mockResolvedValue(0);

      const result = await service.getTransactions(ownerId, ownerType);

      expect(result.transactions).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    test("should throw error if repository throws", async () => {
      transactionRepoMock.findByOwner.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.getTransactions(ownerId, ownerType)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("checkTransactionExists", () => {
    const ownerId = "user123";
    const reference = "order123";

    test("should return true if transaction exists", async () => {
      const transaction = makeTransactionDoc({ ownerId, reference });
      transactionRepoMock.findByReference.mockResolvedValue(transaction);

      const result = await service.checkTransactionExists(ownerId, reference);

      expect(transactionRepoMock.findByReference).toHaveBeenCalledWith(
        ownerId,
        reference,
        undefined,
      );
      expect(result).toBe(true);
    });

    test("should return false if transaction does not exist", async () => {
      transactionRepoMock.findByReference.mockResolvedValue(null);

      const result = await service.checkTransactionExists(ownerId, reference);

      expect(transactionRepoMock.findByReference).toHaveBeenCalledWith(
        ownerId,
        reference,
        undefined,
      );
      expect(result).toBe(false);
    });

    test("should return false if repository throws error", async () => {
      transactionRepoMock.findByReference.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await service.checkTransactionExists(ownerId, reference);

      expect(result).toBe(false);
    });

    test("should use session if provided", async () => {
      const transaction = makeTransactionDoc({ ownerId, reference });
      transactionRepoMock.findByReference.mockResolvedValue(transaction);

      const result = await service.checkTransactionExists(
        ownerId,
        reference,
        mockSession,
      );

      expect(transactionRepoMock.findByReference).toHaveBeenCalledWith(
        ownerId,
        reference,
        mockSession,
      );
      expect(result).toBe(true);
    });
  });
});
