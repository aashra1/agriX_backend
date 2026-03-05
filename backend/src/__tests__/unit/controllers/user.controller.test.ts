// __tests__/unit/controllers/user.controller.test.ts
import { Request, Response } from "express";
import { UserController } from "../../../controllers/user.controller";
import { UserService } from "../../../services/user.service";
import {
  CreateUserDTO,
  LoginUserDTO,
  EditUserDTO,
  ChangePasswordDTO,
} from "../../../dtos/user.dto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../../../services/user.service");
jest.mock("../../../dtos/user.dto");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("fs");

describe("UserController", () => {
  let controller: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    controller = new UserController();
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockResponse = { status: statusFn, json: jsonFn };
    jest.clearAllMocks();
    (UserService as jest.Mock).mockClear();
    (UserService.prototype.createUser as jest.Mock) = jest.fn();
    (UserService.prototype.getUserRawByEmail as jest.Mock) = jest.fn();
    (UserService.prototype.getUserById as jest.Mock) = jest.fn();
    (UserService.prototype.updateUser as jest.Mock) = jest.fn();
    (UserService.prototype.getAllUsers as jest.Mock) = jest.fn();
    (UserService.prototype.sendResetPasswordEmail as jest.Mock) = jest.fn();
    (UserService.prototype.resetPassword as jest.Mock) = jest.fn();
    (UserService.prototype.changePassword as jest.Mock) = jest.fn();
    (UserService.prototype.getSanitizedUser as jest.Mock) = jest.fn();
  });

  describe("register", () => {
    test("should register user successfully with DTO validation", async () => {
      const mockValidatedData = {
        fullName: "Test User",
        email: "test@user.com",
        phoneNumber: "1234567890",
        password: "pass123",
        address: "Addr",
        isAdmin: false,
      };
      (CreateUserDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        body: mockValidatedData,
        file: { filename: "profile.jpg" } as any,
      };

      const mockUser = { id: "user123", fullName: "Test User" };
      (UserService.prototype.createUser as jest.Mock).mockResolvedValue(
        mockUser,
      );

      await controller.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(CreateUserDTO.safeParse).toHaveBeenCalledWith(mockValidatedData);
      expect(UserService.prototype.createUser).toHaveBeenCalled();
      expect(statusFn).toHaveBeenCalledWith(201);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "User registered successfully.",
        user: mockUser,
      });
    });

    test("should return 400 for validation error", async () => {
      const mockError = { errors: [{ path: ["email"], message: "Invalid" }] };
      (CreateUserDTO.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: mockError,
      });

      mockRequest = { body: {}, file: undefined };

      await controller.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({ errors: mockError });
    });
  });

  describe("loginUser", () => {
    test("should login successfully with DTO validation", async () => {
      const mockValidatedData = { email: "test@user.com", password: "pass123" };
      (LoginUserDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { body: mockValidatedData };
      const userRaw = {
        _id: "user123",
        role: "User",
        isAdmin: false,
        password: "hashed",
      };
      (UserService.prototype.getUserRawByEmail as jest.Mock).mockResolvedValue(
        userRaw,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("token123");
      (UserService.prototype.getSanitizedUser as jest.Mock).mockReturnValue({
        id: "user123",
      });

      process.env.JWT_SECRET = "secret";

      await controller.loginUser(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(LoginUserDTO.safeParse).toHaveBeenCalledWith(mockValidatedData);
      expect(UserService.prototype.getUserRawByEmail).toHaveBeenCalledWith(
        "test@user.com",
      );
      expect(bcrypt.compare).toHaveBeenCalledWith("pass123", "hashed");
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "user123", role: "User", isAdmin: false },
        "secret",
        { expiresIn: "1h" },
      );
      expect(statusFn).toHaveBeenCalledWith(200);
    });

    test("should return 401 for wrong password", async () => {
      const mockValidatedData = { email: "test@user.com", password: "wrong" };
      (LoginUserDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = { body: mockValidatedData };
      const userRaw = { _id: "user123", password: "hashed" };
      (UserService.prototype.getUserRawByEmail as jest.Mock).mockResolvedValue(
        userRaw,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await controller.loginUser(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });
  });

  describe("getMyProfile", () => {
    test("should get my profile", async () => {
      mockRequest = { user: { id: "user123" } as any };
      const user = { id: "user123", fullName: "Test" };
      (UserService.prototype.getUserById as jest.Mock).mockResolvedValue(user);

      await controller.getMyProfile(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(UserService.prototype.getUserById).toHaveBeenCalledWith("user123");
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({ success: true, profile: user });
    });
  });

  describe("editMyProfile", () => {
    test("should edit my profile with DTO validation", async () => {
      const mockValidatedData = { fullName: "New Name" };
      (EditUserDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        user: { id: "user123" } as any,
        body: { fullName: "New Name" },
        file: { filename: "new.jpg" } as any,
      };

      const updated = { id: "user123", fullName: "New Name" };
      (UserService.prototype.updateUser as jest.Mock).mockResolvedValue(
        updated,
      );

      await controller.editMyProfile(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(EditUserDTO.safeParse).toHaveBeenCalledWith({
        fullName: "New Name",
      });
      expect(UserService.prototype.updateUser).toHaveBeenCalledWith("user123", {
        fullName: "New Name",
        profilePicture: "uploads/profiles/new.jpg",
      });
      expect(statusFn).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllUsers", () => {
    test("should get all users with pagination", async () => {
      mockRequest = { query: { page: "2", limit: "5" } };
      const users = [{ id: "user1" }, { id: "user2" }];
      (UserService.prototype.getAllUsers as jest.Mock).mockResolvedValue(users);

      await controller.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(UserService.prototype.getAllUsers).toHaveBeenCalledWith(2, 5);
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({ success: true, count: 2, users });
    });
  });

  describe("changePassword", () => {
    test("should change password with DTO validation", async () => {
      const mockValidatedData = { currentPassword: "old", newPassword: "new" };
      (ChangePasswordDTO.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidatedData,
      });

      mockRequest = {
        user: { id: "user123" } as any,
        body: { currentPassword: "old", newPassword: "new" },
      };

      (UserService.prototype.changePassword as jest.Mock).mockResolvedValue(
        undefined,
      );

      await controller.changePassword(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(ChangePasswordDTO.safeParse).toHaveBeenCalledWith({
        currentPassword: "old",
        newPassword: "new",
      });
      expect(UserService.prototype.changePassword).toHaveBeenCalledWith(
        "user123",
        "old",
        "new",
      );
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: "Password changed successfully",
      });
    });

    test("should return 401 if no user", async () => {
      mockRequest = { user: undefined as any, body: {} };
      await controller.changePassword(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized",
      });
    });
  });
});
