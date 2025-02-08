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

export const createUserDto = z
  .object({
    firstName: z.string().min(3).max(20),
    lastName: z.string().min(3).max(20),
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6).max(16),
    phone: z
      .string({
        required_error: "Phone number required",
      })
      .min(11),
    profilePicture: z.string().optional(),
    bvn: z
      .string()
      .length(11, "BVN must be exactly 11 digits")
      .regex(/^\d+$/, "BVN must be numeric"),
    hasBusiness: z.boolean(),
    businessName: z.string().min(3).optional(),
    referralSourceId: z.number({ coerce: true }),
  })
  .refine(
    (data) => {
      // Conditional validation: If hasBusiness is true, businessName must be provided
      if (data.hasBusiness && !data.businessName) {
        return false;
      }
      return true;
    },
    {
      message: "Business name is required if you have a Business",
      path: ["businessName"],
    },
  );

export const updateUserDto = z.object({
  firstName: z.string().min(3).max(20).optional(),
  lastName: z.string().min(3).max(20).optional(),
  address: z.string().min(3).optional(),
  state: z.string().min(3).optional(),
  lga: z.string().min(3).optional(),
  phone: z.string().min(5).startsWith("+").optional(),
  profilePicture: z.string().optional(),
});

export const verifyEmailDto = z.object({
  email:z.string().email(),
  otp: z.string().length(6),
});

export const sendEmailDto = z.object({
  email: z.string().email(),
});

export const passwordResetDto = z.object({
  password: z.string().min(6).max(16),
  email:z.string().email(),
  otp: z.string().length(6),
});

export const passwordChangeDto = z.object({
  oldPassword: z.string().min(6).max(16),
  newPassword: z.string().min(6).max(16),
})

export const loginDto = z.object({
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(6, "Password length too short"),
});
