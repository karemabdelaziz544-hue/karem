import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export type LoginForm = z.infer<typeof LoginSchema>;

export const SignupSchema = z
  .object({
    name: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    phone: z.string().trim().min(10, 'رقم الهاتف غير صحيح'),
    gender: z.enum(['male', 'female']),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    confirmPassword: z.string().min(6, 'تأكيد كلمة المرور غير صحيح'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

export type SignupForm = z.infer<typeof SignupSchema>;

export const CreatePlanSchema = z.object({
  title: z.string().min(3, 'عنوان النظام يجب أن يكون 3 أحرف على الأقل'),
  userId: z.string().uuid('معرف المستخدم غير صحيح'),
});

export type CreatePlanForm = z.infer<typeof CreatePlanSchema>;

export const DailyLogSchema = z.object({
  waterCups: z.number().min(0).max(20),
  steps: z.number().min(0).optional(),
});

export type DailyLogForm = z.infer<typeof DailyLogSchema>;
