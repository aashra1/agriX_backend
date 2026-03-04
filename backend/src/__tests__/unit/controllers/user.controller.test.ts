import { Request, Response } from "express";
import { UserController } from "../../../controllers/user.controller";
import { UserService } from "../../../services/user.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Mock the modules
jest.mock("../../../services/user.service");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("fs");

describe("UserController Unit Tests", () => {
  let controller: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UserController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test("register - should create user successfully", async () => {
    mockRequest.body = {
      fullName: "John Doe",
      email: "john@example.com",
      phoneNumber: "1234567890",
      password: "password123",
      address: "Test Address",
      isAdmin: false,
    };

    const mockCreatedUser = {
      _id: "user123",
      fullName: "John Doe",
      role: "User",
    };

    // Use prototype spy to intercept the internal userService instance
    const spy = jest
      .spyOn(UserService.prototype, "createUser")
      .mockResolvedValue(mockCreatedUser as any);

    await controller.register(mockRequest as Request, mockResponse as Response);

    expect(spy).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  test("loginUser - should login successfully", async () => {
    mockRequest.body = { email: "john@example.com", password: "password123" };
    const mockUser = {
      _id: "user123",
      email: "john@example.com",
      password: "hashedPassword",
      role: "User",
      isAdmin: false,
    };

    jest
      .spyOn(UserService.prototype, "getUserRawByEmail")
      .mockResolvedValue(mockUser as any);
    jest
      .spyOn(UserService.prototype, "getSanitizedUser")
      .mockReturnValue({ _id: "user123", email: "john@example.com" } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("jwt-token");

    await controller.loginUser(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "jwt-token" }),
    );
  });

  test("loginUser - should return 401 for invalid password", async () => {
    mockRequest.body = { email: "john@example.com", password: "wrongpassword" };
    const mockUser = { _id: "user123", password: "hashedPassword" };

    jest
      .spyOn(UserService.prototype, "getUserRawByEmail")
      .mockResolvedValue(mockUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await controller.loginUser(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  test("getMyProfile - should return profile", async () => {
    mockRequest.user = { id: "user123", role: "User" };
    const mockProfile = { _id: "user123", fullName: "John Doe" };

    const spy = jest
      .spyOn(UserService.prototype, "getUserById")
      .mockResolvedValue(mockProfile as any);

    await controller.getMyProfile(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(spy).toHaveBeenCalledWith("user123");
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("changePassword - should change password", async () => {
    // Note: controller expects (req as any).user?.id
    (mockRequest as any).user = { id: "user123" };
    mockRequest.body = {
      currentPassword: "oldpass",
      newPassword: "newpass123",
      confirmPassword: "newpass123", // Required by ChangePasswordDTO
    };

    const spy = jest
      .spyOn(UserService.prototype, "changePassword")
      .mockResolvedValue({} as any);

    await controller.changePassword(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(spy).toHaveBeenCalledWith("user123", "oldpass", "newpass123");
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test("getAllUsers - should return users", async () => {
    mockRequest.query = { page: "1", limit: "10" };
    const mockUsers = [{ _id: "u1" }, { _id: "u2" }];

    const spy = jest
      .spyOn(UserService.prototype, "getAllUsers")
      .mockResolvedValue(mockUsers as any);

    await controller.getAllUsers(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(spy).toHaveBeenCalledWith(1, 10);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ count: 2 }),
    );
  });
});
