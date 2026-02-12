import { z } from "zod";
import { UserSchema } from "../types/user.type";

export const CreateUserDTO = UserSchema.pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  password: true,
  isAdmin: true,
  address: true,
  profilePicture: true,
});

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const LoginUserDTO = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

export const EditUserDTO = UserSchema.pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  address: true,
  profilePicture: true,
}).partial();

export type EditUserDTO = z.infer<typeof EditUserDTO>;

export const ChangePasswordDTO = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordDTOType = z.infer<typeof ChangePasswordDTO>;
