// __tests__/unit/middleware/authGuard.test.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  authGuard,
  authGuardAdmin,
  authGuardBusiness,
} from "../../../middleware/authGuard";

jest.mock("jsonwebtoken");

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockRequest = { headers: {} };
    mockResponse = { status: statusFn, json: jsonFn };
    mockNext = jest.fn();
    jest.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
  });

  describe("authGuard", () => {
    test("should return 401 if authorization header missing", () => {
      authGuard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Authorization header missing!",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 if token missing", () => {
      mockRequest.headers = { authorization: "Bearer " };

      authGuard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Token missing!",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should set user and call next for valid token", () => {
      mockRequest.headers = { authorization: "Bearer validtoken" };
      const decoded = {
        id: "user123",
        role: "User",
        permissions: ["read"],
        isAdmin: false,
      };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      authGuard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith("validtoken", "testsecret");
      expect(mockRequest.user).toEqual({
        id: "user123",
        role: "User",
        permissions: ["read"],
        isAdmin: false,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(statusFn).not.toHaveBeenCalled();
    });

    test("should set user with businessId if present", () => {
      mockRequest.headers = { authorization: "Bearer validtoken" };
      const decoded = {
        id: "biz123",
        role: "Business",
        businessId: "biz123",
      };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      authGuard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        id: "biz123",
        role: "Business",
        businessId: "biz123",
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test("should return 401 if token invalid", () => {
      mockRequest.headers = { authorization: "Bearer invalidtoken" };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      authGuard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Invalid token!",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authGuardAdmin", () => {
    test("should return 401 if authorization header missing", () => {
      authGuardAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Authorization header missing!",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 if token missing", () => {
      mockRequest.headers = { authorization: "Bearer " };

      authGuardAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Token missing!",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 403 if user is not admin", () => {
      mockRequest.headers = { authorization: "Bearer validtoken" };
      const decoded = {
        id: "user123",
        role: "User",
        isAdmin: false,
      };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      authGuardAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.user).toEqual({
        id: "user123",
        role: "User",
        isAdmin: false,
      });
      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Permission denied! Admins only.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should call next for admin user", () => {
      mockRequest.headers = { authorization: "Bearer validtoken" };
      const decoded = {
        id: "admin123",
        role: "Admin",
        isAdmin: true,
      };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      authGuardAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.user).toEqual({
        id: "admin123",
        role: "Admin",
        isAdmin: true,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(statusFn).not.toHaveBeenCalled();
    });

    test("should handle businessId for admin", () => {
      mockRequest.headers = { authorization: "Bearer validtoken" };
      const decoded = {
        id: "admin123",
        role: "Admin",
        isAdmin: true,
        businessId: "biz123",
      };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      authGuardAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.user).toEqual({
        id: "admin123",
        role: "Admin",
        isAdmin: true,
        businessId: "biz123",
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test("should return 401 if token invalid", () => {
      mockRequest.headers = { authorization: "Bearer invalidtoken" };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      authGuardAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Invalid token!",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authGuardBusiness", () => {
    test("should return 401 if no user data", () => {
      mockRequest.user = undefined;

      authGuardBusiness(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized! No user data found.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 403 if user is not business", () => {
      mockRequest.user = {
        id: "user123",
        role: "User",
      };

      authGuardBusiness(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith({
        success: false,
        message: "Access denied! Only business users allowed.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should call next for business user", () => {
      mockRequest.user = {
        id: "biz123",
        role: "Business",
        businessId: "biz123",
      };

      authGuardBusiness(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusFn).not.toHaveBeenCalled();
    });
  });
});
