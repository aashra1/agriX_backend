// src/types/user.type.ts
import { z } from "zod";

export const UserSchema = z.object({
  _id: z.string().optional(),
  fullName: z.string(),
  username: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  password: z.string(),
  confirmPassword: z.string().optional(),
  location: z.string().optional(),
  isAdmin: z.boolean().optional(),
  role: z.enum(["User", "Admin"]).optional(),
});

export type User = z.infer<typeof UserSchema>;
