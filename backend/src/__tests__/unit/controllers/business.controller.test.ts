import { Request, Response } from "express";
import { BusinessController } from "../../../controllers/business.controller";
import { BusinessService } from "../../../services/business.service";
import jwt from "jsonwebtoken";

jest.mock("../../../services/business.service");
jest.mock("jsonwebtoken");

describe("BusinessController Unit Tests", () => {
  let controller: BusinessController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockService: jest.Mocked<BusinessService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new BusinessController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockService = {
      register: jest.fn(),
      login: jest.fn(),
      uploadDocument: jest.fn(),
      approveBusiness: jest.fn(),
      getAllBusinesses: jest.fn(),
      getBusinessProfile: jest.fn(),
      editBusinessProfile: jest.fn(),
    } as any;
    (controller as any).businessService = mockService;
  });

  test("register - should register business successfully", async () => {
    const registerData = {
      businessName: "Test Business",
      email: "test@test.com",
      password: "password123",
      phoneNumber: "1234567890",
      address: "Test Address",
    };

    mockRequest.body = registerData;
    mockRequest.file = { path: "test.jpg" } as any;

    const mockResult = {
      message: "Business registered successfully. Please upload your document.",
      tempToken: "token",
      business: { _id: "123", ...registerData },
    };

    mockService.register.mockResolvedValue(mockResult as any);

    await controller.register(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      ...mockResult,
    });
  });

  test("register - should return 400 on validation error", async () => {
    mockRequest.body = { email: "invalid" };

    await controller.register(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  test("login - should login business successfully", async () => {
    const loginData = {
      email: "test@test.com",
      password: "password123",
    };

    mockRequest.body = loginData;

    const mockBusiness = {
      _id: "123",
      businessName: "Test Business",
      email: "test@test.com",
    };

    mockService.login.mockResolvedValue({
      business: mockBusiness,
      token: "service-token",
      message: "Business logged in successfully",
    });

    (jwt.sign as jest.Mock).mockReturnValue("new-jwt-token");

    await controller.login(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      token: "new-jwt-token",
      business: mockBusiness,
    });
  });

  test("login - should handle missing business id", async () => {
    const loginData = {
      email: "test@test.com",
      password: "password123",
    };

    mockRequest.body = loginData;

    mockService.login.mockResolvedValue({
      business: { businessName: "Test Business" },
      token: "service-token",
      message: "Business logged in successfully",
    });

    await controller.login(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Business ID not found in token creation",
    });
  });

  test("uploadDocument - should upload document", async () => {
    mockRequest.user = { id: "123", role: "Business" };
    mockRequest.file = { path: "doc.pdf" } as any;

    mockService.uploadDocument.mockResolvedValue({
      businessDocument: "doc.pdf",
    } as any);

    await controller.uploadDocument(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Document uploaded",
      document: "doc.pdf",
    });
  });

  test("approve - should approve business", async () => {
    mockRequest.user = { id: "admin", role: "Admin" };
    mockRequest.params = { businessId: "123" };
    mockRequest.body = { action: "Approve" };

    mockService.approveBusiness.mockResolvedValue({
      businessStatus: "Approved",
      businessVerified: true,
    } as any);

    await controller.approve(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Business Approve successfully",
      data: {
        businessStatus: "Approved",
        businessVerified: true,
      },
    });
  });

  test("getProfile - should return profile", async () => {
    mockRequest.user = { id: "123", role: "Business" };

    mockService.getBusinessProfile.mockResolvedValue({
      _id: "123",
      businessName: "Test Business",
    } as any);

    await controller.getProfile(mockRequest as any, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      _id: "123",
      businessName: "Test Business",
    });
  });
});
