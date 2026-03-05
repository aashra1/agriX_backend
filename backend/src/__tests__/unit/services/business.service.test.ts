import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const mockBusinessRepository = {
  findByEmail: jest.fn(),
  getBusinessById: jest.fn(),
  getAllBusinesses: jest.fn(),
  createBusiness: jest.fn(),
  updateBusiness: jest.fn(),
  deleteBusiness: jest.fn(),
  save: jest.fn(),
  getBusinessByEmail: jest.fn(),
};

jest.mock("../../../repositories/business.repository", () => {
  return {
    BusinessRepository: jest
      .fn()
      .mockImplementation(() => mockBusinessRepository),
  };
});

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

import { BusinessService } from "../../../services/business.service";

describe("BusinessService Unit Tests", () => {
  let service: BusinessService;

  const makeBusinessDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "biz123",
      businessName: overrides.businessName ?? "Test Business",
      email: overrides.email ?? "test@business.com",
      phoneNumber: overrides.phoneNumber ?? "1234567890",
      password: overrides.password ?? "hashedPass",
      address: overrides.address ?? "Test Address",
      profilePicture: overrides.profilePicture ?? "profile.jpg",
      businessDocument: overrides.businessDocument ?? null,
      businessVerified: overrides.businessVerified ?? false,
      businessStatus: overrides.businessStatus ?? "Pending",
      rejectionReason: overrides.rejectionReason ?? undefined,
      role: "Business",
      __v: 0,
    };

    const merged = { ...base, ...overrides };

    return {
      ...merged,
      toObject: function () {
        const { password, __v, ...rest } = merged;
        return rest;
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
    service = new BusinessService();
  });

  describe("register", () => {
    test("should create business with pending status", async () => {
      const dto = {
        businessName: "New Business",
        email: "new@business.com",
        phoneNumber: "9876543210",
        password: "password123",
        address: "New Address",
        profilePicture: "new.jpg",
      };

      mockBusinessRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPass");
      (jwt.sign as jest.Mock).mockReturnValue("temp-token");

      const createdBusiness = makeBusinessDoc({
        _id: "biz123",
        ...dto,
        password: "hashedPass",
        businessStatus: "Pending",
      });

      mockBusinessRepository.createBusiness.mockResolvedValue(
        createdBusiness as any,
      );

      const result = await service.register(dto);

      expect(mockBusinessRepository.findByEmail).toHaveBeenCalledWith(
        "new@business.com",
      );
      expect(result.tempToken).toBe("temp-token");
      expect(result.business.businessName).toBe("New Business");
    });

    test("should throw if business already exists", async () => {
      const dto = {
        businessName: "Existing Biz",
        email: "existing@business.com",
        phoneNumber: "1234567890",
        password: "password123",
        address: "Address",
      };

      mockBusinessRepository.findByEmail.mockResolvedValue(
        makeBusinessDoc({ email: "existing@business.com" }) as any,
      );

      await expect(service.register(dto)).rejects.toThrow(
        "Business already exists",
      );
    });
  });

  describe("login", () => {
    test("should throw if business not found", async () => {
      mockBusinessRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "nonexistent@business.com", password: "pass" }),
      ).rejects.toThrow("Business not found");
    });

    test("should throw if password invalid", async () => {
      const business = makeBusinessDoc({
        email: "test@business.com",
        password: "hashedPass",
      });
      mockBusinessRepository.findByEmail.mockResolvedValue(business as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: "test@business.com", password: "wrongpass" }),
      ).rejects.toThrow("Invalid credentials");
    });

    test("should throw if pending and no document", async () => {
      const business = makeBusinessDoc({
        email: "test@business.com",
        businessStatus: "Pending",
        businessDocument: null,
      });

      mockBusinessRepository.findByEmail.mockResolvedValue(business as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: "test@business.com", password: "pass" }),
      ).rejects.toThrow("Please upload document and wait for admin approval");
    });

    test("should throw if rejected", async () => {
      const business = makeBusinessDoc({
        email: "test@business.com",
        businessStatus: "Rejected",
        businessDocument: "doc.pdf",
      });

      mockBusinessRepository.findByEmail.mockResolvedValue(business as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: "test@business.com", password: "pass" }),
      ).rejects.toThrow("Business registration rejected by admin");
    });

    test("should return sanitized business on success", async () => {
      const business = makeBusinessDoc({
        _id: "biz123",
        email: "test@business.com",
        businessStatus: "Approved",
        businessDocument: "doc.pdf",
      });

      mockBusinessRepository.findByEmail.mockResolvedValue(business as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: "test@business.com",
        password: "pass",
      });

      expect(result.business.email).toBe("test@business.com");
      expect(result.business).not.toHaveProperty("password");
    });
  });

  describe("uploadDocument", () => {
    test("should throw if business not found", async () => {
      mockBusinessRepository.getBusinessById.mockResolvedValue(null);
      await expect(service.uploadDocument("biz123", "doc.pdf")).rejects.toThrow(
        "Business not found",
      );
    });

    test("should update document and status to pending", async () => {
      const business = makeBusinessDoc({
        _id: "biz123",
        businessStatus: "Document Pending",
      });
      mockBusinessRepository.getBusinessById.mockResolvedValue(business as any);
      mockBusinessRepository.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.uploadDocument("biz123", "doc.pdf");

      expect(result.businessDocument).toBe("doc.pdf");
      expect(result.businessStatus).toBe("Pending");
    });
  });

  describe("approveBusiness", () => {
    test("should throw if business not found", async () => {
      mockBusinessRepository.getBusinessById.mockResolvedValue(null);
      await expect(
        service.approveBusiness("biz123", { action: "Approve" }),
      ).rejects.toThrow("Business not found");
    });

    test("should approve business", async () => {
      const business = makeBusinessDoc({
        _id: "biz123",
        businessVerified: false,
      });
      mockBusinessRepository.getBusinessById.mockResolvedValue(business as any);
      mockBusinessRepository.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.approveBusiness("biz123", {
        action: "Approve",
      });

      expect(result.businessVerified).toBe(true);
      expect(result.businessStatus).toBe("Approved");
    });

    test("should reject business with reason", async () => {
      const business = makeBusinessDoc({ _id: "biz123" });
      mockBusinessRepository.getBusinessById.mockResolvedValue(business as any);
      mockBusinessRepository.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.approveBusiness("biz123", {
        action: "Reject",
        reason: "Invalid",
      });

      expect(result.businessStatus).toBe("Rejected");
      expect(result.rejectionReason).toBe("Invalid");
    });
  });

  describe("getAllBusinesses", () => {
    test("calls repo with skip/limit and sanitizes results", async () => {
      const businesses = [
        makeBusinessDoc({ _id: "biz1" }),
        makeBusinessDoc({ _id: "biz2" }),
      ];
      mockBusinessRepository.getAllBusinesses.mockResolvedValue(
        businesses as any,
      );

      const result = await service.getAllBusinesses(2, 10);

      expect(mockBusinessRepository.getAllBusinesses).toHaveBeenCalledWith(
        10,
        10,
      );
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("password");
    });
  });

  describe("getBusinessProfile", () => {
    test("should throw if business not found", async () => {
      mockBusinessRepository.getBusinessById.mockResolvedValue(null);
      await expect(service.getBusinessProfile("biz123")).rejects.toThrow(
        "Business not found",
      );
    });

    test("returns sanitized business", async () => {
      const business = makeBusinessDoc({ _id: "biz123" });
      mockBusinessRepository.getBusinessById.mockResolvedValue(business as any);

      const result = await service.getBusinessProfile("biz123");
      expect(result._id).toBe("biz123");
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("editBusinessProfile", () => {
    test("should throw if no valid fields to update", async () => {
      await expect(
        service.editBusinessProfile("biz123", {} as any),
      ).rejects.toThrow("No valid fields to update");
    });

    test("should throw if business not found", async () => {
      mockBusinessRepository.updateBusiness.mockResolvedValue(null);
      await expect(
        service.editBusinessProfile("biz123", { businessName: "New" }),
      ).rejects.toThrow("Business not found or update failed");
    });

    test("should update business with file", async () => {
      const updatedBusiness = makeBusinessDoc({
        businessName: "Updated",
        profilePicture: "new.jpg",
      });
      mockBusinessRepository.updateBusiness.mockResolvedValue(
        updatedBusiness as any,
      );

      const result = await service.editBusinessProfile(
        "biz123",
        { businessName: "Updated" },
        { path: "new.jpg" } as any,
      );

      expect(result.business.businessName).toBe("Updated");
      expect(result.business.profilePicture).toBe("new.jpg");
    });
  });
});
