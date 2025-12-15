// src/dtos/user.dto.ts
import { z } from "zod";
import { UserSchema } from "../types/user.type";

export const CreateUserDTO = UserSchema.pick({
  fullName: true,
  username: true,
  email: true,
  phoneNumber: true,
  password: true,
  confirmPassword: true,
  isAdmin: true,
  location: true,
});

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const LoginUserDTO = UserSchema.pick({
  username: true,
  password: true,
});

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

export const EditUserDTO = UserSchema.pick({
  fullName: true,
  username: true,
  email: true,
  phoneNumber: true,
  location: true,
});

export type EditUserDTO = z.infer<typeof EditUserDTO>;
