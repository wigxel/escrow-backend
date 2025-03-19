import { z } from "zod";

export const passwordValidator = z
  .string()
  .min(6, { message: "Password too short" })
  .max(100, { message: "Password too long" });

export const bvnValidator = z
  .string({ required_error: "BVN is required" })
  .length(11, "BVN must be exactly 11 digits")
  .regex(/^\d+$/, "BVN must be numeric");

export const phoneValidator = z
  .string({
    required_error: "Phone number required",
  })
  .min(11);

export const emailValidator = z
  .string({
    required_error: "Email address required",
  })
  .email();

export const amountValidator = z
  .number({
    coerce: true,
    required_error: "Amount is required",
  })
  .min(1);

export const usernameValidator = z
  .string({
    required_error: "Username required",
  })
  .min(3, { message: "Username too short" })
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username must contain only letters, numbers and underscores",
  );

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
    firstName: z
      .string({ required_error: "First name is required" })
      .min(3)
      .max(20),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(3)
      .max(20),
    email: z
      .string({
        required_error: "Email address required",
      })
      .email(),
    password: passwordValidator,
    phone: phoneValidator,
    // @question Why is this here?
    // profilePicture: z.string().optional(),
    hasBusiness: z.boolean(),
    businessName: z
      .string({ required_error: "Business name required" })
      .min(3, { message: "Business must be a minimum of 3 characters" })
      .nullish(),
    referralSourceId: z.number({
      coerce: true,
      required_error: "Referral required",
    }),
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
  email: z.string().email(),
  otp: z.string().length(6),
});

export const sendEmailDto = z.object({
  identifier: z.union([z.string().email(), phoneValidator]),
});

export const passwordResetDto = z.object({
  password: passwordValidator,
  email: z.string().email(),
  otp: z.string().length(6),
});

export const passwordChangeDto = z.object({
  oldPassword: passwordValidator,
  newPassword: passwordValidator,
});

export const loginDto = z.object({
  phone: z.string().min(1, "Phone is required").optional(),
  email: z.string().email().min(1, "Email is required").optional(),
  password: passwordValidator,
});

export const accountStatementRules = z.object({
  type: z
    .enum(["escrow.deposit", "wallet.deposit", "wallet.withdraw"], {
      message: `please provide of the following 'escrow.deposit', 'wallet.deposit', 'wallet.withdraw'`,
    })
    .optional(),
});
