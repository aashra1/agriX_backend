import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../types/user.type';
import { CreateUserDTO, LoginUserDTO, EditUserDTO } from '../dtos/user.dto';
import { UserService } from '../servives/user.service';

let userService = new UserService();

export class UserController {
  
  // Register new user/admin
  register = async (req: Request, res: Response) => {
    try {
      const validation = CreateUserDTO.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const { fullName, username, email, phoneNumber, password, confirmPassword, isAdmin, location } = validation.data;

      // Check if password matches
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Password and confirm password do not match." });
      }

      // Determine role
      const role = isAdmin ? "Admin" : "User";

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // FIX 1: Ensure strict type compliance
      // confirmPassword is mostly undefined here, or we simply don't pass it.
      // Since we made it optional in the Type, this works.
      const newUser: User = {
        fullName,
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        location,
        isAdmin: isAdmin || false,
        role,
        // We do NOT pass confirmPassword here, effectively stripping it
      };

      const createdUser = await userService.createUser(newUser);

      return res.status(201).json({
        success: true,
        message: `${role} registered successfully.`,
        user: createdUser,
      });

    } catch (error: any) {
      console.error("Register Error:", error.message);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  };

  // Login user/admin
  loginUser = async (req: Request, res: Response) => {
    try {
      const validation = LoginUserDTO.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const { username, password } = validation.data;

      const user = await userService.getUserByUsername(username);
      if (!user) return res.status(404).json({ success: false, message: "User does not exist." });

      const isMatched = await bcrypt.compare(password, user.password);
      if (!isMatched) return res.status(401).json({ success: false, message: "Invalid credentials." });

      // FIX 2: Ensure _id exists before signing.
      // Zod defines _id as optional (because it doesn't exist *before* creation), 
      // but it definitely exists *after* retrieval. 
      if (!user._id) {
         return res.status(500).json({ success: false, message: "User ID missing." });
      }

      const payload = { id: user._id, role: user.role, isAdmin: user.isAdmin || false };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });

      return res.status(200).json({
        success: true,
        message: `${user.role} logged in successfully.`,
        token,
        userData: user,
      });

    } catch (error: any) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  };

  // Get all users (paginated)
  getAllUsers = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const users = await userService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        message: "All users fetched successfully.",
        count: users.length,
        page,
        limit,
        users,
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };

  // Get single user profile
  getUserProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await userService.getUserById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found." });

      // FIX 3: Remove .toObject()
      // Since 'user' is already a plain object (from array), just destructure it directly.
      const { password, ...userProfile } = user; 

      res.status(200).json({ success: true, message: "User profile fetched successfully.", userProfile });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };

  // ... rest of the file (edit/delete) is fine
  editUserProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const validation = EditUserDTO.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const updatedUser = await userService.updateUser(userId, validation.data);

      if (!updatedUser) return res.status(404).json({ success: false, message: "User not found." });

      res.status(200).json({ success: true, message: "User profile updated successfully.", updatedUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };

  deleteUserAccount = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const deleted = await userService.deleteUser(userId);
      if (!deleted) return res.status(404).json({ success: false, message: "User not found." });

      res.status(200).json({ success: true, message: "User account deleted successfully." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };
}