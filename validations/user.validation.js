import { z } from 'zod';

export const UserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, { message: "Name must be at least 2 characters" })
        .max(50, { message: "Name must be at most 50 characters" }),

    email: z
        .string()
        .trim()
        .email({ message: "Invalid email address" }),

    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/])[a-zA-Z\d!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/]{8,}$/,
            {
                message:
                    "Password must contain uppercase, lowercase, number, and special character",
            }
        ),

    avatarUrl: z
        .string()
        .url({ message: "Invalid URL" })
        .optional(), // avatarUrl can be optional if you want
});

export const LoginSchema = z.object({
    email: z
        .string()
        .trim()
        .email({ message: "Invalid email address" }),

    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" }),
});