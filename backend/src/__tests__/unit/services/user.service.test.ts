import { UserService } from "../../../services/user.service";
import { UserRepository } from "../../../repositories/user.repository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../../../repositories/user.repository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("UserService Unit Tests", () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
    mockRepo = new UserRepository() as jest.Mocked<UserRepository>;
    (service as any).userRepository = mockRepo;
  });

  test("createUser - should create new user", async () => {
    const mockUser = { email: "test@test.com", password: "pass" };
    mockRepo.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
    mockRepo.createUser.mockResolvedValue({
      _id: "123",
      toObject: () => ({}),
    } as any);
    const result = await service.createUser(mockUser as any);
    expect(result).toBeDefined();
  });

  test("createUser - should throw if email exists", async () => {
    mockRepo.findByEmail.mockResolvedValue({ _id: "123" } as any);
    await expect(service.createUser({ email: "test" } as any)).rejects.toThrow(
      "User with this email already exists",
    );
  });

  test("getUserById - should return sanitized user", async () => {
    const mockUser = { _id: "123", toObject: () => ({ _id: "123" }) };
    mockRepo.getUserById.mockResolvedValue(mockUser as any);
    const result = await service.getUserById("123");
    expect(result).toBeDefined();
  });

  test("getUserById - should throw if not found", async () => {
    mockRepo.getUserById.mockResolvedValue(null);
    await expect(service.getUserById("123")).rejects.toThrow("User not found");
  });

  test("changePassword - should change password", async () => {
    const mockUser = { _id: "123", password: "hashedOld" };
    mockRepo.getUserById.mockResolvedValue(mockUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedNew");
    mockRepo.updateUser.mockResolvedValue({} as any);
    await service.changePassword("123", "old", "new");
    expect(mockRepo.updateUser).toHaveBeenCalled();
  });

  test("changePassword - should throw if wrong password", async () => {
    mockRepo.getUserById.mockResolvedValue({ password: "hashed" } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.changePassword("123", "wrong", "new")).rejects.toThrow(
      "Current password is incorrect",
    );
  });
});
