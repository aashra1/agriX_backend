import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../types/user.type";
import {
  CreateUserDTO,
  LoginUserDTO,
  EditUserDTO,
  ChangePasswordDTO,
} from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import fs from "fs";

const userService = new UserService();

export class UserController {
  register = async (req: Request, res: Response) => {
    try {
      const validation = CreateUserDTO.safeParse(req.body);
      if (!validation.success) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ errors: validation.error });
      }

      const { fullName, email, phoneNumber, password, isAdmin, address } =
        validation.data;
      const role = isAdmin ? "Admin" : "User";

      const profilePicture = req.file
        ? `uploads/profiles/${req.file.filename}`
        : undefined;

      const newUser: User = {
        fullName,
        email,
        phoneNumber,
        password,
        address,
        isAdmin: isAdmin || false,
        role,
        profilePicture,
      };

      const createdUser = await userService.createUser(newUser);
      return res.status(201).json({
        success: true,
        message: `${role} registered successfully.`,
        user: createdUser,
      });
    } catch (error: any) {
      // If database save fails, delete the uploaded file
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  loginUser = async (req: Request, res: Response) => {
    try {
      const validation = LoginUserDTO.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const { email, password } = validation.data;

      // Use the new Raw method to get the password for comparison
      const userRaw = await userService.getUserRawByEmail(email);

      const isMatched = await bcrypt.compare(password, userRaw.password);

      if (!isMatched) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const payload = {
        id: userRaw._id,
        role: userRaw.role,
        isAdmin: userRaw.isAdmin,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
      });

      // Sanitize the raw user before returning it in the response
      const safeUser = userService.getSanitizedUser(userRaw);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: safeUser,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  getUserProfile = async (req: Request, res: Response) => {
    try {
      const user = await userService.getUserById(req.params.userId);
      res.status(200).json({ success: true, profile: user });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  editUserProfile = async (req: Request, res: Response) => {
    try {
      const validation = EditUserDTO.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }
      const updateData: Partial<User> = { ...validation.data };

      if (req.file) {
        updateData.profilePicture = `uploads/profiles/${req.file.filename}`;
      }

      const updatedUser = await userService.updateUser(
        req.params.userId,
        updateData,
      );

      res.status(200).json({ success: true, updatedUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  deleteUserAccount = async (req: Request, res: Response) => {
    try {
      await userService.deleteUser(req.params.userId);
      res.status(200).json({ success: true, message: "User deleted" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const users = await userService.getAllUsers(page, limit);
      res.status(200).json({ success: true, count: users.length, users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  sendResetPasswordEmail = async (req: Request, res: Response) => {
    try {
      const email = req.body.email;
      const user = await userService.sendResetPasswordEmail(email);
      return res.status(200).json({
        success: true,
        data: user,
        message: "If the email is registered, a reset link has been sent.",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const { newPassword } = req.body;
      await userService.resetPassword(token, newPassword);
      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully.",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  changePassword = async (req: Request, res: Response) => {
    try {
      const validation = ChangePasswordDTO.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const { currentPassword, newPassword } = validation.data;
      const userId = (req as any).user?.id; // From auth middleware

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      await userService.changePassword(userId, currentPassword, newPassword);

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to change password",
      });
    }
  };
}
