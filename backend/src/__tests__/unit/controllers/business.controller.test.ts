// __tests__/unit/controllers/business.controller.test.ts
import { Request, Response } from "express";
import { BusinessController } from "../../../controllers/business.controller";
import { BusinessService } from "../../../services/business.service";
import {
  RegisterBusinessDto,
  LoginBusinessDto,
  ApproveBusinessDto,
} from "../../../dtos/business.dto";
import jwt from "jsonwebtoken";

jest.mock("../../../services/business.service");
jest.mock("../../../dtos/business.dto");
jest.mock("jsonwebtoken");

describe("BusinessController", () => {
  let controller: BusinessController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    controller = new BusinessController();
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockResponse = { status: statusFn, json: jsonFn };
    jest.clearAllMocks();
    (BusinessService as jest.Mock).mockClear();
    (BusinessService.prototype.register as jest.Mock) = jest.fn();
    (BusinessService.prototype.login as jest.Mock) = jest.fn();
    (BusinessService.prototype.uploadDocument as jest.Mock) = jest.fn();
    (BusinessService.prototype.approveBusiness as jest.Mock) = jest.fn();
    (BusinessService.prototype.getAllBusinesses as jest.Mock) = jest.fn();
    (BusinessService.prototype.getBusinessProfile as jest.Mock) = jest.fn();
    (BusinessService.prototype.editBusinessProfile as jest.Mock) = jest.fn();
  });

  describe("register", () => {
    test("should register business successfully with DTO validation", async () => {
      const mockValidatedData = {
        businessName: "Test Biz",
        email: "test@biz.com",
        password: "pass123",
        phoneNumber: "1234567890",
        address: "Addr",
      };
      (RegisterBusinessDto.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        body: mockValidatedData,
        file: { path: "profile.jpg" } as any,
      };

      const mockResult = {
        message: "Registered",
        tempToken: "token",
        business: { id: "biz123" },
      };
      (BusinessService.prototype.register as jest.Mock).mockResolvedValue(
        mockResult,
      );

      await controller.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(RegisterBusinessDto.safeParse).toHaveBeenCalledWith(
        mockValidatedData,
      );
      expect(BusinessService.prototype.register).toHaveBeenCalledWith({
        ...mockValidatedData,
        profilePicture: "profile.jpg",
      });
      expect(statusFn).toHaveBeenCalledWith(201);
      expect(jsonFn).toHaveBeenCalledWith({ success: true, ...mockResult });
    });

    test("should return 400 for DTO validation error", async () => {
      const mockError = {
        errors: [{ path: ["email"], message: "Invalid email" }],
      };
      (RegisterBusinessDto.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: mockError,
      });

      mockRequest = { body: {} };

      await controller.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({ errors: mockError });
    });

    test("should handle service error", async () => {
      const mockValidatedData = {
        businessName: "Test Biz",
        email: "test@biz.com",
        password: "pass123",
        phoneNumber: "1234567890",
        address: "Addr",
      };
      (RegisterBusinessDto.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { body: mockValidatedData };
      (BusinessService.prototype.register as jest.Mock).mockRejectedValue(
        new Error("Already exists"),
      );

      await controller.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Already exists",
      });
    });
  });

  describe("login", () => {
    test("should login successfully with DTO validation", async () => {
      const mockValidatedData = { email: "test@biz.com", password: "pass123" };
      (LoginBusinessDto.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { body: mockValidatedData };
      const mockResult = { business: { id: "biz123", _id: "biz123" } };
      (BusinessService.prototype.login as jest.Mock).mockResolvedValue(
        mockResult,
      );
      (jwt.sign as jest.Mock).mockReturnValue("token123");
      process.env.JWT_SECRET = "secret";

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(LoginBusinessDto.safeParse).toHaveBeenCalledWith(
        mockValidatedData,
      );
      expect(BusinessService.prototype.login).toHaveBeenCalledWith(
        mockValidatedData,
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "biz123", role: "Business", businessId: "biz123" },
        "secret",
        { expiresIn: "7d" },
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        token: "token123",
        business: mockResult.business,
      });
    });

    test("should return 500 if no business id", async () => {
      const mockValidatedData = { email: "test@biz.com", password: "pass123" };
      (LoginBusinessDto.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { body: mockValidatedData };
      (BusinessService.prototype.login as jest.Mock).mockResolvedValue({
        business: {},
      });

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Business ID not found",
      });
    });
  });

  describe("uploadDocument", () => {
    test("should upload document", async () => {
      mockRequest = {
        user: { id: "biz123" } as any,
        file: { path: "doc.pdf" } as any,
      };
      const updated = { businessDocument: "doc.pdf" };
      (BusinessService.prototype.uploadDocument as jest.Mock).mockResolvedValue(
        updated,
      );

      await controller.uploadDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(BusinessService.prototype.uploadDocument).toHaveBeenCalledWith(
        "biz123",
        "doc.pdf",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Document uploaded",
        document: "doc.pdf",
      });
    });

    test("should return 401 if no user", async () => {
      mockRequest = { user: undefined as any };
      await controller.uploadDocument(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(401);
    });

    test("should return 400 if no file", async () => {
      mockRequest = { user: { id: "biz123" } as any };
      await controller.uploadDocument(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(400);
    });
  });

  describe("approve", () => {
    test("should approve business with DTO validation", async () => {
      const mockValidatedData = { action: "Approve" };
      (ApproveBusinessDto.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        params: { businessId: "biz123" },
        body: { action: "Approve" },
      };
      const updated = { businessStatus: "Approved", businessVerified: true };
      (
        BusinessService.prototype.approveBusiness as jest.Mock
      ).mockResolvedValue(updated);

      await controller.approve(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(ApproveBusinessDto.safeParse).toHaveBeenCalledWith({
        action: "Approve",
      });
      expect(BusinessService.prototype.approveBusiness).toHaveBeenCalledWith(
        "biz123",
        mockValidatedData,
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Business Approve successfully",
        data: { businessStatus: "Approved", businessVerified: true },
      });
    });

    test("should reject business with reason", async () => {
      const mockValidatedData = { action: "Reject", reason: "Invalid docs" };
      (ApproveBusinessDto.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        params: { businessId: "biz123" },
        body: { action: "Reject", reason: "Invalid docs" },
      };
      const updated = {
        businessStatus: "Rejected",
        businessVerified: false,
        rejectionReason: "Invalid docs",
      };
      (
        BusinessService.prototype.approveBusiness as jest.Mock
      ).mockResolvedValue(updated);

      await controller.approve(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Business Reject successfully",
        data: {
          businessStatus: "Rejected",
          businessVerified: false,
          rejectionReason: "Invalid docs",
        },
      });
    });
  });

  describe("getAll", () => {
    test("should get all businesses", async () => {
      mockRequest = {};
      const businesses = [{ id: "biz1" }, { id: "biz2" }];
      (
        BusinessService.prototype.getAllBusinesses as jest.Mock
      ).mockResolvedValue(businesses);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        count: 2,
        businesses,
      });
    });
  });

  describe("getProfile", () => {
    test("should get profile", async () => {
      mockRequest = { user: { id: "biz123" } as any };
      const profile = { id: "biz123", name: "Test" };
      (
        BusinessService.prototype.getBusinessProfile as jest.Mock
      ).mockResolvedValue(profile);

      await controller.getProfile(mockRequest as any, mockResponse as Response);

      expect(BusinessService.prototype.getBusinessProfile).toHaveBeenCalledWith(
        "biz123",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith(profile);
    });

    test("should return 404 if not found", async () => {
      mockRequest = { user: { id: "biz123" } as any };
      (
        BusinessService.prototype.getBusinessProfile as jest.Mock
      ).mockRejectedValue(new Error("Not found"));

      await controller.getProfile(mockRequest as any, mockResponse as Response);

      expect(statusFn).toHaveBeenCalledWith(404);
    });
  });

  describe("editProfile", () => {
    test("should edit profile", async () => {
      mockRequest = {
        user: { id: "biz123" } as any,
        body: { businessName: "New Name" },
        file: { path: "new.jpg" } as any,
      };
      const result = {
        message: "Updated",
        business: { id: "biz123", name: "New Name" },
      };
      (
        BusinessService.prototype.editBusinessProfile as jest.Mock
      ).mockResolvedValue(result);

      await controller.editProfile(
        mockRequest as any,
        mockResponse as Response,
      );

      expect(
        BusinessService.prototype.editBusinessProfile,
      ).toHaveBeenCalledWith(
        "biz123",
        { businessName: "New Name" },
        { path: "new.jpg" },
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith(result);
    });

    test("should handle error", async () => {
      mockRequest = { user: { id: "biz123" } as any, body: {} };
      (
        BusinessService.prototype.editBusinessProfile as jest.Mock
      ).mockRejectedValue(new Error("No fields"));

      await controller.editProfile(
        mockRequest as any,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
    });
  });
});
