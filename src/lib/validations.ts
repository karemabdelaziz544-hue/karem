import { z } from 'zod';

// Login Validation Schema
export const LoginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
export type LoginForm = z.infer<typeof LoginSchema>;

// Signup Validation Schema
export const SignupSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(['client', 'doctor', 'admin']).default('client'),
});
export type SignupForm = z.infer<typeof SignupSchema>;

// Create Plan Schema (For Admin/Doctor)
export const CreatePlanSchema = z.object({
  title: z.string().min(3, "عنوان النظام يجب أن يكون 3 أحرف على الأقل"),
  userId: z.string().uuid("معرف المستخدم غير صحيح"),
});
export type CreatePlanForm = z.infer<typeof CreatePlanSchema>;

// Daily Log Input Schema
export const DailyLogSchema = z.object({
  waterCups: z.number().min(0).max(20),
  steps: z.number().min(0).optional(),
});
export type DailyLogForm = z.infer<typeof DailyLogSchema>;
