import {
  UserRepository,
  IUserRepository,
} from "../repositories/user.repository";
import { User } from "../types/user.type";
import bcrypt from "bcrypt";

const userRepository: IUserRepository = new UserRepository();

export class UserService {
  private sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    const { password, __v, ...safeUser } = userObj;
    return safeUser;
  }

  public getSanitizedUser(user: any) {
    return this.sanitizeUser(user);
  }

  createUser = async (user: User) => {
    const existByEmail = await userRepository.findByEmail(user.email);
    if (existByEmail) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const { _id, ...userData } = { ...user, password: hashedPassword };

    const createdUser = await userRepository.createUser(userData);
    return this.sanitizeUser(createdUser);
  };

  updateUser = async (userId: string, updatedData: Partial<User>) => {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");

    const { _id, ...data } = updatedData;

    const updatedUser = await userRepository.updateUser(userId, data);

    if (!updatedUser) throw new Error("Failed to update user");

    return this.sanitizeUser(updatedUser);
  };

  getAllUsers = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const users = await userRepository.getAllUsers(skip, limit);
    return users.map((u) => this.sanitizeUser(u));
  };

  getUserById = async (userId: string) => {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  };

  // Add this new method specifically for Login
  getUserRawByEmail = async (email: string) => {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");
    return user;
  };

  getUserByEmail = async (email: string) => {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  };

  deleteUser = async (userId: string) => {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");

    await userRepository.deleteUser(userId);
    return { message: "User deleted successfully" };
  };
}
