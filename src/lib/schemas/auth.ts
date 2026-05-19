import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().trim().toLowerCase().email('Invalid email'),
	password: z.string().min(1, 'Password is required')
});

export const setupAccountSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	email: z.string().trim().toLowerCase().email('Invalid email'),
	password: z.string().min(1, 'Password is required'),
	confirm: z.string()
});

export const setupPasswordSchema = z.object({
	token: z.string().min(1, 'Invalid request'),
	password: z.string().min(1, 'Password is required'),
	confirm: z.string()
});

export const changePasswordSchema = z.object({
	current_password: z.string().min(1, 'Current password is required'),
	new_password: z.string().min(1, 'New password is required'),
	confirm_password: z.string()
});

export const updateProfileSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	current_password: z.string().optional().transform((v) => v || null),
	new_password: z.string().optional().transform((v) => v || null)
});
