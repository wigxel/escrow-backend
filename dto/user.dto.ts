import { z } from "zod";
import { memberRole } from "~/migrations/schema";

export const addressSchema = z.object({
  address: z.string().min(3),
  state: z.string().min(3),
  country: z
    .string({
      required_error: "Country required",
    })
    .min(3),
});

export const createUserDto = z.object({
  firstName: z.string().min(3).max(20),
  lastName: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6).max(16),
  phone: z
    .string({
      required_error: "Phone number required",
    })
    .min(5)
    .startsWith("+"),
  profilePicture: z.string().optional(),
  role: z.enum(memberRole.enumValues),
});

export const updateUserDto = z.object({
  firstName: z.string().min(3).max(20).optional(),
  lastName: z.string().min(3).max(20).optional(),
  address: z.string().min(3).optional(),
  state: z.string().min(3).optional(),
  country: z.string().min(3).optional(),
  phone: z.string().min(5).startsWith("+").optional(),
  profilePicture: z.string().optional(),
});

export const verifyEmailDto = z.object({
  otp: z.string().length(6),
});

export const sendEmailDto = z.object({
  email: z.string().email(),
}).parse;

export const passwordResetDto = z.object({
  password: z.string().min(6).max(16),
  otp: z.string().length(6),
});

export const passwordChangeDto = z.object({
  password: z.string(),
  newPassword: z.string().min(6).max(16),
}).parse;

export const loginDto = z.object({
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(6, "Password length too short"),
});
