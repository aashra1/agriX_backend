// src/__tests__/unit/business/service/business.service.test.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BusinessService } from "../../../../services/business.service";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

jest.mock("../../../../repositories/business.repository", () => {
  const repoMock = {
    findByEmail: jest.fn(),
    getBusinessById: jest.fn(),
    getAllBusinesses: jest.fn(),
    createBusiness: jest.fn(),
    updateBusiness: jest.fn(),
    deleteBusiness: jest.fn(),
    save: jest.fn(),
  };

  return {
    BusinessRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

import { BusinessRepository } from "../../../../repositories/business.repository";

const mockRepoMethods = (
  jest.requireMock("../../../../repositories/business.repository") as any
).__mockRepo;

const hashMock = bcrypt.hash as jest.Mock;
const compareMock = bcrypt.compare as jest.Mock;
const jwtSignMock = jwt.sign as jest.Mock;

describe("BusinessService Unit Tests", () => {
  let service: BusinessService;
  let repoMock: any;

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

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
    service = new BusinessService();
    repoMock = mockRepoMethods;
  });

  test("register - should create business with pending status", async () => {
    const dto = {
      businessName: "New Business",
      email: "new@business.com",
      phoneNumber: "9876543210",
      password: "password123",
      address: "New Address",
      profilePicture: "new.jpg",
    };

    repoMock.findByEmail.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashedPass");
    jwtSignMock.mockReturnValue("temp-token");

    const createdBusiness = makeBusinessDoc({
      _id: "biz123",
      ...dto,
      password: "hashedPass",
      businessStatus: "Pending",
    });

    repoMock.createBusiness.mockResolvedValue(createdBusiness);

    const result = await service.register(dto);

    expect(repoMock.findByEmail).toHaveBeenCalledWith("new@business.com");
    expect(hashMock).toHaveBeenCalledWith("password123", 10);
    expect(repoMock.createBusiness).toHaveBeenCalledWith(
      expect.objectContaining({
        businessName: "New Business",
        email: "new@business.com",
        password: "hashedPass",
        businessStatus: "Pending",
      }),
    );
    expect(jwtSignMock).toHaveBeenCalledWith(
      { id: "biz123", role: "Business", temp: true },
      "testsecret",
      { expiresIn: "1h" },
    );
    expect(result).toEqual({
      message: "Business registered successfully. Please upload your document.",
      tempToken: "temp-token",
      business: expect.not.objectContaining({ password: "hashedPass", __v: 0 }),
    });
  });

  test("register - should throw if business already exists", async () => {
    const dto = {
      businessName: "Existing Biz",
      email: "existing@business.com",
      phoneNumber: "1234567890",
      password: "password123",
      address: "Address",
    };

    repoMock.findByEmail.mockResolvedValue(
      makeBusinessDoc({ email: "existing@business.com" }),
    );

    await expect(service.register(dto)).rejects.toThrow(
      "Business already exists",
    );
    expect(repoMock.createBusiness).not.toHaveBeenCalled();
  });

  test("login - should throw if business not found", async () => {
    repoMock.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: "nonexistent@business.com", password: "pass" }),
    ).rejects.toThrow("Business not found");
  });

  test("login - should throw if password invalid", async () => {
    const business = makeBusinessDoc({
      email: "test@business.com",
      password: "hashedPass",
    });

    repoMock.findByEmail.mockResolvedValue(business);
    compareMock.mockResolvedValue(false);

    await expect(
      service.login({ email: "test@business.com", password: "wrongpass" }),
    ).rejects.toThrow("Invalid credentials");
  });

  test("login - should throw if pending and no document", async () => {
    const business = makeBusinessDoc({
      email: "test@business.com",
      password: "hashedPass",
      businessStatus: "Pending",
      businessDocument: null,
    });

    repoMock.findByEmail.mockResolvedValue(business);
    compareMock.mockResolvedValue(true);

    await expect(
      service.login({ email: "test@business.com", password: "pass" }),
    ).rejects.toThrow("Please upload document and wait for admin approval");
  });

  test("login - should throw if rejected", async () => {
    const business = makeBusinessDoc({
      email: "test@business.com",
      password: "hashedPass",
      businessStatus: "Rejected",
      businessDocument: "doc.pdf",
    });

    repoMock.findByEmail.mockResolvedValue(business);
    compareMock.mockResolvedValue(true);

    await expect(
      service.login({ email: "test@business.com", password: "pass" }),
    ).rejects.toThrow("Business registration rejected by admin");
  });

  test("login - should return sanitized business on success", async () => {
    const business = makeBusinessDoc({
      _id: "biz123",
      email: "test@business.com",
      password: "hashedPass",
      businessStatus: "Approved",
      businessDocument: "doc.pdf",
    });

    repoMock.findByEmail.mockResolvedValue(business);
    compareMock.mockResolvedValue(true);

    const result = await service.login({
      email: "test@business.com",
      password: "pass",
    });

    expect(repoMock.findByEmail).toHaveBeenCalledWith("test@business.com");
    expect(compareMock).toHaveBeenCalledWith("pass", "hashedPass");
    expect(result).toEqual({
      business: expect.not.objectContaining({ password: "hashedPass", __v: 0 }),
      message: "Business logged in successfully",
    });
  });

  test("uploadDocument - should throw if business not found", async () => {
    repoMock.getBusinessById.mockResolvedValue(null);

    await expect(service.uploadDocument("biz123", "doc.pdf")).rejects.toThrow(
      "Business not found",
    );
  });

  test("uploadDocument - should update document and status to pending", async () => {
    const business = makeBusinessDoc({
      _id: "biz123",
      businessDocument: null,
      businessStatus: "Document Pending",
    });

    repoMock.getBusinessById.mockResolvedValue(business);
    repoMock.save.mockResolvedValue({
      ...business,
      businessDocument: "doc.pdf",
      businessStatus: "Pending",
    });

    const result = await service.uploadDocument("biz123", "doc.pdf");

    expect(repoMock.getBusinessById).toHaveBeenCalledWith("biz123");
    expect(business.businessDocument).toBe("doc.pdf");
    expect(business.businessStatus).toBe("Pending");
    expect(repoMock.save).toHaveBeenCalledWith(business);
    expect(result.businessDocument).toBe("doc.pdf");
  });

  test("approveBusiness - should throw if business not found", async () => {
    repoMock.getBusinessById.mockResolvedValue(null);

    await expect(
      service.approveBusiness("biz123", { action: "Approve" }),
    ).rejects.toThrow("Business not found");
  });

  test("approveBusiness - should approve business", async () => {
    const business = makeBusinessDoc({
      _id: "biz123",
      businessStatus: "Pending",
      businessVerified: false,
      rejectionReason: undefined,
    });

    repoMock.getBusinessById.mockResolvedValue(business);
    repoMock.save.mockResolvedValue({
      ...business,
      businessStatus: "Approved",
      businessVerified: true,
    });

    const result = await service.approveBusiness("biz123", {
      action: "Approve",
    });

    expect(repoMock.getBusinessById).toHaveBeenCalledWith("biz123");
    expect(business.businessStatus).toBe("Approved");
    expect(business.businessVerified).toBe(true);
    expect(business.rejectionReason).toBeUndefined();
    expect(repoMock.save).toHaveBeenCalledWith(business);
    expect(result.businessStatus).toBe("Approved");
  });

  test("approveBusiness - should reject business with reason", async () => {
    const business = makeBusinessDoc({
      _id: "biz123",
      businessStatus: "Pending",
      businessVerified: false,
    });

    repoMock.getBusinessById.mockResolvedValue(business);
    repoMock.save.mockResolvedValue({
      ...business,
      businessStatus: "Rejected",
      businessVerified: false,
      rejectionReason: "Invalid documents",
    });

    const result = await service.approveBusiness("biz123", {
      action: "Reject",
      reason: "Invalid documents",
    });

    expect(business.businessStatus).toBe("Rejected");
    expect(business.businessVerified).toBe(false);
    expect(business.rejectionReason).toBe("Invalid documents");
    expect(result.businessStatus).toBe("Rejected");
  });

  test("getAllBusinesses - calls repo with skip/limit and sanitizes results", async () => {
    repoMock.getAllBusinesses.mockResolvedValue([
      makeBusinessDoc({ _id: "biz1" }),
      makeBusinessDoc({ _id: "biz2" }),
    ]);

    const result = await service.getAllBusinesses(2, 10);

    expect(repoMock.getAllBusinesses).toHaveBeenCalledWith(10, 10);
    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("password");
    expect(result[0]).not.toHaveProperty("__v");
  });

  test("getBusinessProfile - should throw if business not found", async () => {
    repoMock.getBusinessById.mockResolvedValue(null);

    await expect(service.getBusinessProfile("biz123")).rejects.toThrow(
      "Business not found",
    );
  });

  test("getBusinessProfile - returns sanitized business", async () => {
    const business = makeBusinessDoc({ _id: "biz123" });
    repoMock.getBusinessById.mockResolvedValue(business);

    const result = await service.getBusinessProfile("biz123");

    expect(repoMock.getBusinessById).toHaveBeenCalledWith("biz123");
    expect(result).toEqual(
      expect.not.objectContaining({ password: "hashedPass", __v: 0 }),
    );
  });

  test("editBusinessProfile - should throw if no valid fields to update", async () => {
    await expect(
      service.editBusinessProfile("biz123", {} as any),
    ).rejects.toThrow("No valid fields to update");
  });

  test("editBusinessProfile - should throw if no valid fields to update with empty string", async () => {
    await expect(
      service.editBusinessProfile("biz123", { businessName: "" } as any),
    ).rejects.toThrow("No valid fields to update");
  });

  test("editBusinessProfile - should throw if business not found", async () => {
    repoMock.updateBusiness.mockResolvedValue(null);

    await expect(
      service.editBusinessProfile("biz123", { businessName: "New Name" }),
    ).rejects.toThrow("Business not found or update failed");
  });

  test("editBusinessProfile - should update business with file", async () => {
    const updateData = { businessName: "Updated Name" };
    const file = { path: "new-profile.jpg" } as Express.Multer.File;

    const updatedBusiness = makeBusinessDoc({
      _id: "biz123",
      businessName: "Updated Name",
      profilePicture: "new-profile.jpg",
    });

    repoMock.updateBusiness.mockResolvedValue(updatedBusiness);

    const result = await service.editBusinessProfile(
      "biz123",
      updateData,
      file,
    );

    expect(repoMock.updateBusiness).toHaveBeenCalledWith("biz123", {
      businessName: "Updated Name",
      profilePicture: "new-profile.jpg",
    });
    expect(result).toEqual({
      message: "Profile updated successfully",
      business: expect.not.objectContaining({ password: "hashedPass", __v: 0 }),
    });
  });

  test("editBusinessProfile - should update business without file", async () => {
    const updateData = {
      businessName: "Updated Name",
      phoneNumber: "9999999999",
    };

    const updatedBusiness = makeBusinessDoc({
      _id: "biz123",
      businessName: "Updated Name",
      phoneNumber: "9999999999",
    });

    repoMock.updateBusiness.mockResolvedValue(updatedBusiness);

    const result = await service.editBusinessProfile("biz123", updateData);

    expect(repoMock.updateBusiness).toHaveBeenCalledWith("biz123", {
      businessName: "Updated Name",
      phoneNumber: "9999999999",
    });
    expect(result).toEqual({
      message: "Profile updated successfully",
      business: expect.not.objectContaining({ password: "hashedPass", __v: 0 }),
    });
  });
});
