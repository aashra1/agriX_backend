import jwt from "jsonwebtoken";
import { sendEmail } from "../config/email";
import {
  UserRepository,
  IUserRepository,
} from "../repositories/user.repository";
import { User } from "../types/user.type";
import bcrypt from "bcrypt";
import { HttpError } from "../error/http-error";

export class UserService {
  private userRepository: IUserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    const { password, __v, ...safeUser } = userObj;
    return safeUser;
  }

  public getSanitizedUser(user: any) {
    return this.sanitizeUser(user);
  }

  createUser = async (user: User) => {
    const existByEmail = await this.userRepository.findByEmail(user.email);
    if (existByEmail) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const { _id, ...userData } = { ...user, password: hashedPassword };

    const createdUser = await this.userRepository.createUser(userData);
    return this.sanitizeUser(createdUser);
  };

  updateUser = async (userId: string, updatedData: Partial<User>) => {
    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");

    const { _id, ...data } = updatedData;

    const updatedUser = await this.userRepository.updateUser(userId, data);

    if (!updatedUser) throw new Error("Failed to update user");

    return this.sanitizeUser(updatedUser);
  };

  getAllUsers = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const users = await this.userRepository.getAllUsers(skip, limit);
    return users.map((u) => this.sanitizeUser(u));
  };

  getUserById = async (userId: string) => {
    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  };

  getUserRawByEmail = async (email: string) => {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");
    return user;
  };

  getUserByEmail = async (email: string) => {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  };

  deleteUser = async (userId: string) => {
    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");

    await this.userRepository.deleteUser(userId);
    return { message: "User deleted successfully" };
  };

  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN!, {
      expiresIn: "1h",
    });
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    await sendEmail(user.email, "Password Reset", html);
    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError(400, "Token and new password are required");
      }
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET_TOKEN!);
      const userId = decoded.id;
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.updateUser(userId, {
        password: hashedPassword,
      });
      return user;
    } catch (error) {
      throw new HttpError(400, "Invalid or expired token");
    }
  }
}
