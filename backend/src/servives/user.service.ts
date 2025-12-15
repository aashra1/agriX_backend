// src/services/user.service.ts
import { UserRepository, IUserRepository } from "../repositories/user.repository";
import { User } from "../types/user.type";

const userRepository: IUserRepository = new UserRepository();

export class UserService {
  createUser = async (user: User) => {
    const existByEmailOrUsername = await userRepository.findByEmailOrUsername(user.email, user.username);
    if (existByEmailOrUsername) {
      throw new Error("User with this email or username already exists");
    }
    const { _id, confirmPassword, ...userData } = user;

    return userRepository.createUser(userData);
  };

  updateUser = async (userId: string, updatedData: Partial<User>) => {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");

    // Strip _id if present
    const { _id, confirmPassword, ...data } = updatedData;

    return userRepository.updateUser(userId, data);
  };

  getAllUsers = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    return userRepository.getAllUsers(skip, limit);
  };

  getUserById = async (userId: string) => {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");
    return user;
  };

  getUserByUsername = async (username: string) => {
    return userRepository.getUserByUsername(username);
  };

  deleteUser = async (userId: string) => {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");
    return userRepository.deleteUser(userId);
  };
}
