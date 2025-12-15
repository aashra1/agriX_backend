// src/repositories/user.repository.ts
import { UserModel, IUser } from "../model/user.model";
import { User } from "../types/user.type";

export interface IUserRepository {
  getAllUsers(skip?: number, limit?: number): Promise<IUser[]>;
  getUserById(userId: string): Promise<IUser | null>;
  getUserByUsername(username: string): Promise<IUser | null>;
  findByEmailOrUsername(email: string, username: string): Promise<IUser | null>;
  createUser(user: Partial<IUser>): Promise<IUser>;
  updateUser(userId: string, updatedData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(userId: string): Promise<IUser | null>;
}

export class UserRepository implements IUserRepository {
  async getAllUsers(skip: number = 0, limit: number = 10) {
    return UserModel.find().skip(skip).limit(limit).exec();
  }

  async getUserById(userId: string) {
    return UserModel.findById(userId).exec();
  }

  async getUserByUsername(username: string) {
    return UserModel.findOne({ username }).exec();
  }

  async findByEmailOrUsername(email: string, username: string) {
    return UserModel.findOne({ $or: [{ email }, { username }] }).exec();
  }

  async createUser(user: Partial<IUser>) {
    const newUser = new UserModel(user);
    return newUser.save();
  }

  async updateUser(userId: string, updatedData: Partial<IUser>) {
    return UserModel.findByIdAndUpdate(userId, updatedData, { new: true }).exec();
  }

  async deleteUser(userId: string) {
    return UserModel.findByIdAndDelete(userId).exec();
  }
}
