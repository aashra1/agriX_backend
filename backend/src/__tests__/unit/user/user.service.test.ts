// src/__tests__/unit/user/user.service.test.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserService } from "../../../services/user.service";
import { HttpError } from "../../../error/http-error";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../../config/email", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../../../repositories/user.repository", () => {
  const repoMock = {
    findByEmail: jest.fn(),
    getUserById: jest.fn(),
    getUserByEmail: jest.fn(),
    getAllUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  return {
    UserRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

import { UserRepository } from "../../../repositories/user.repository";
import { sendEmail } from "../../../config/email";

const mockUserRepoMethods = (
  jest.requireMock("../../../repositories/user.repository") as any
).__mockRepo;
const mockSendEmail = sendEmail as jest.Mock;
const hashMock = bcrypt.hash as jest.Mock;
const compareMock = bcrypt.compare as jest.Mock;
const jwtSignMock = jwt.sign as jest.Mock;
const jwtVerifyMock = jwt.verify as jest.Mock;

describe("UserService Unit Tests", () => {
  let service: UserService;
  let repoMock: any;

  const makeUserDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "user123",
      fullName: overrides.fullName ?? "Test User",
      email: overrides.email ?? "test@example.com",
      password: overrides.password ?? "hashedPassword123",
      phoneNumber: overrides.phoneNumber ?? "1234567890",
      role: overrides.role ?? "User",
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
    process.env.CLIENT_URL = "http://localhost:3000";

    service = new UserService();
    repoMock = mockUserRepoMethods;
  });

  describe("createUser", () => {
    test("should create user successfully", async () => {
      const userData = {
        fullName: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "9876543210",
      };

      repoMock.findByEmail.mockResolvedValue(null);
      hashMock.mockResolvedValue("hashedPassword123");

      const createdUser = makeUserDoc({
        ...userData,
        password: "hashedPassword123",
      });

      repoMock.createUser.mockResolvedValue(createdUser);

      const result = await service.createUser(userData as any);

      expect(repoMock.findByEmail).toHaveBeenCalledWith("john@example.com");
      expect(hashMock).toHaveBeenCalledWith("password123", 10);
      expect(repoMock.createUser).toHaveBeenCalledWith({
        fullName: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phoneNumber: "9876543210",
      });
      expect(result).toEqual(
        expect.not.objectContaining({ password: "hashedPassword123", __v: 0 }),
      );
    });

    test("should throw if user with email already exists", async () => {
      const userData = {
        fullName: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "9876543210",
      };

      const existingUser = makeUserDoc({ email: "john@example.com" });
      repoMock.findByEmail.mockResolvedValue(existingUser);

      await expect(service.createUser(userData as any)).rejects.toThrow(
        "User with this email already exists",
      );

      expect(repoMock.findByEmail).toHaveBeenCalledWith("john@example.com");
      expect(repoMock.createUser).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    const userId = "user123";

    test("should update user successfully", async () => {
      const existingUser = makeUserDoc({
        _id: userId,
        fullName: "Old Name",
        phoneNumber: "1111111111",
      });

      const updateData = {
        fullName: "New Name",
        phoneNumber: "2222222222",
      };

      repoMock.getUserById.mockResolvedValue(existingUser);

      const updatedUser = makeUserDoc({
        ...existingUser,
        fullName: "New Name",
        phoneNumber: "2222222222",
      });

      repoMock.updateUser.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateData);

      expect(repoMock.getUserById).toHaveBeenCalledWith(userId);
      expect(repoMock.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(result).toEqual(
        expect.not.objectContaining({ password: "hashedPassword123", __v: 0 }),
      );
    });

    test("should throw if user not found", async () => {
      repoMock.getUserById.mockResolvedValue(null);

      await expect(
        service.updateUser(userId, { fullName: "New Name" }),
      ).rejects.toThrow("User not found");

      expect(repoMock.getUserById).toHaveBeenCalledWith(userId);
      expect(repoMock.updateUser).not.toHaveBeenCalled();
    });

    test("should throw if update fails", async () => {
      const existingUser = makeUserDoc({ _id: userId });
      repoMock.getUserById.mockResolvedValue(existingUser);
      repoMock.updateUser.mockResolvedValue(null);

      await expect(
        service.updateUser(userId, { fullName: "New Name" }),
      ).rejects.toThrow("Failed to update user");
    });
  });

  describe("getAllUsers", () => {
    test("should return all users with pagination", async () => {
      const users = [
        makeUserDoc({ _id: "user1", fullName: "User 1" }),
        makeUserDoc({ _id: "user2", fullName: "User 2" }),
        makeUserDoc({ _id: "user3", fullName: "User 3" }),
      ];

      repoMock.getAllUsers.mockResolvedValue(users);

      const result = await service.getAllUsers(2, 5);

      expect(repoMock.getAllUsers).toHaveBeenCalledWith(5, 5);
      expect(result).toHaveLength(3);
      expect(result[0]).not.toHaveProperty("password");
      expect(result[0]).not.toHaveProperty("__v");
    });

    test("should use default pagination values", async () => {
      const users = [makeUserDoc({})];
      repoMock.getAllUsers.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(repoMock.getAllUsers).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual([
        expect.not.objectContaining({ password: "hashedPassword123", __v: 0 }),
      ]);
    });

    test("should return empty array if no users found", async () => {
      repoMock.getAllUsers.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe("getUserById", () => {
    const userId = "user123";

    test("should return user by id", async () => {
      const user = makeUserDoc({ _id: userId });
      repoMock.getUserById.mockResolvedValue(user);

      const result = await service.getUserById(userId);

      expect(repoMock.getUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(
        expect.not.objectContaining({ password: "hashedPassword123", __v: 0 }),
      );
    });

    test("should throw if user not found", async () => {
      repoMock.getUserById.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("getUserRawByEmail", () => {
    const email = "test@example.com";

    test("should return raw user by email", async () => {
      const user = makeUserDoc({ email });
      repoMock.findByEmail.mockResolvedValue(user);

      const result = await service.getUserRawByEmail(email);

      expect(repoMock.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(user);
    });

    test("should throw if user not found", async () => {
      repoMock.findByEmail.mockResolvedValue(null);

      await expect(service.getUserRawByEmail(email)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("getUserByEmail", () => {
    const email = "test@example.com";

    test("should return sanitized user by email", async () => {
      const user = makeUserDoc({ email });
      repoMock.findByEmail.mockResolvedValue(user);

      const result = await service.getUserByEmail(email);

      expect(repoMock.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(
        expect.not.objectContaining({ password: "hashedPassword123", __v: 0 }),
      );
    });

    test("should throw if user not found", async () => {
      repoMock.findByEmail.mockResolvedValue(null);

      await expect(service.getUserByEmail(email)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("deleteUser", () => {
    const userId = "user123";

    test("should delete user successfully", async () => {
      const user = makeUserDoc({ _id: userId });
      repoMock.getUserById.mockResolvedValue(user);
      repoMock.deleteUser.mockResolvedValue(user);

      const result = await service.deleteUser(userId);

      expect(repoMock.getUserById).toHaveBeenCalledWith(userId);
      expect(repoMock.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: "User deleted successfully" });
    });

    test("should throw if user not found", async () => {
      repoMock.getUserById.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(
        "User not found",
      );
      expect(repoMock.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe("sendResetPasswordEmail", () => {
    const email = "test@example.com";

    test("should send reset password email successfully", async () => {
      const user = makeUserDoc({ _id: "user123", email });

      repoMock.getUserByEmail.mockResolvedValue(user);
      jwtSignMock.mockReturnValue("reset-token-123");
      mockSendEmail.mockResolvedValue(true);

      const result = await service.sendResetPasswordEmail(email);

      expect(repoMock.getUserByEmail).toHaveBeenCalledWith(email);
      expect(jwtSignMock).toHaveBeenCalledWith(
        { id: "user123" },
        "testsecret",
        { expiresIn: "1h" },
      );
      expect(mockSendEmail).toHaveBeenCalledWith(
        email,
        "Password Reset",
        expect.stringContaining("reset-token-123"),
      );
      expect(result).toEqual(user);
    });

    test("should throw if email not provided", async () => {
      await expect(service.sendResetPasswordEmail()).rejects.toThrow(
        new HttpError(400, "Email is required"),
      );
    });

    test("should throw if user not found", async () => {
      repoMock.getUserByEmail.mockResolvedValue(null);

      await expect(service.sendResetPasswordEmail(email)).rejects.toThrow(
        new HttpError(404, "User not found"),
      );
    });
  });

  describe("resetPassword", () => {
    const token = "reset-token-123";
    const newPassword = "newPassword123";

    test("should reset password successfully", async () => {
      const decoded = { id: "user123" };
      const user = makeUserDoc({ _id: "user123" });

      jwtVerifyMock.mockReturnValue(decoded);
      repoMock.getUserById.mockResolvedValue(user);
      hashMock.mockResolvedValue("newHashedPassword123");
      repoMock.updateUser.mockResolvedValue({
        ...user,
        password: "newHashedPassword123",
      });

      const result = await service.resetPassword(token, newPassword);

      expect(jwtVerifyMock).toHaveBeenCalledWith(token, "testsecret");
      expect(repoMock.getUserById).toHaveBeenCalledWith("user123");
      expect(hashMock).toHaveBeenCalledWith(newPassword, 10);
      expect(repoMock.updateUser).toHaveBeenCalledWith("user123", {
        password: "newHashedPassword123",
      });
      expect(result).toEqual(user);
    });

    test("should throw if token or newPassword not provided", async () => {
      await expect(service.resetPassword()).rejects.toThrow(
        new HttpError(400, "Invalid or expired token"),
      );
    });

    test("should throw if token is invalid", async () => {
      jwtVerifyMock.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        new HttpError(400, "Invalid or expired token"),
      );
    });

    test("should throw if user not found", async () => {
      const decoded = { id: "user123" };
      jwtVerifyMock.mockReturnValue(decoded);
      repoMock.getUserById.mockResolvedValue(null);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        new HttpError(400, "Invalid or expired token"),
      );
    });
  });

  describe("changePassword", () => {
    const userId = "user123";
    const currentPassword = "currentPass123";
    const newPassword = "newPass123";

    test("should change password successfully", async () => {
      const user = makeUserDoc({
        _id: userId,
        password: "hashedCurrentPassword",
      });

      repoMock.getUserById.mockResolvedValue(user);
      compareMock.mockResolvedValue(true);
      hashMock.mockResolvedValue("hashedNewPassword");
      repoMock.updateUser.mockResolvedValue({
        ...user,
        password: "hashedNewPassword",
      });

      const result = await service.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      expect(repoMock.getUserById).toHaveBeenCalledWith(userId);
      expect(compareMock).toHaveBeenCalledWith(
        currentPassword,
        "hashedCurrentPassword",
      );
      expect(hashMock).toHaveBeenCalledWith(newPassword, 10);
      expect(repoMock.updateUser).toHaveBeenCalledWith(userId, {
        password: "hashedNewPassword",
      });
      expect(result).toEqual({ message: "Password changed successfully" });
    });

    test("should throw if user not found", async () => {
      repoMock.getUserById.mockResolvedValue(null);

      await expect(
        service.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow("User not found");
    });

    test("should throw if current password is incorrect", async () => {
      const user = makeUserDoc({
        _id: userId,
        password: "hashedCurrentPassword",
      });

      repoMock.getUserById.mockResolvedValue(user);
      compareMock.mockResolvedValue(false);

      await expect(
        service.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow("Current password is incorrect");

      expect(compareMock).toHaveBeenCalledWith(
        currentPassword,
        "hashedCurrentPassword",
      );
      expect(hashMock).not.toHaveBeenCalled();
      expect(repoMock.updateUser).not.toHaveBeenCalled();
    });
  });
});
