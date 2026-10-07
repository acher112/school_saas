import { z } from 'zod';

export const pkPhoneRegex = /^((\+92)|(0092)|0)?3[0-9]{9}$/;
export const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export const step1Schema = z.object({
  school_name: z.string().min(3, "School name must be at least 3 characters"),
  slug: z.string().regex(slugRegex, "Subdomain must be 3-50 lowercase alphanumeric characters/hyphens"),
  school_type: z.enum(["private", "semi_government", "cambridge"]),
  board: z.enum(["bise_lahore", "fbise", "bise_rawalpindi", "bise_karachi", "cambridge_caie", "aga_khan"]),
  levels: z.enum(["playgroup_to_matric", "o_a_levels", "primary_only", "middle_school", "higher_secondary"]),
  gender_type: z.enum(["co_education", "boys_only", "girls_only"]),
  medium_of_instruction: z.enum(["english", "urdu", "bilingual"]),
});

export const step2Schema = z.object({
  contact_phone: z.string().regex(pkPhoneRegex, "Enter a valid Pakistani mobile number (e.g. 03001234567)"),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  address: z.string().optional(),
});

export const step3BaseSchema = z.object({
  admin_name: z.string().min(2, "Administrator full name is required"),
  admin_email: z.string().email("Valid email address is required"),
  admin_password: z.string().min(8, "Password must be at least 8 characters long"),
  admin_confirm_password: z.string().min(8, "Confirm password is required"),
});

export const step3Schema = step3BaseSchema.refine(
  data => data.admin_password === data.admin_confirm_password,
  {
    message: "Passwords do not match",
    path: ["admin_confirm_password"],
  }
);

export const step4Schema = z.object({
  brand_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid 6-digit hex color required"),
  brand_accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid 6-digit hex color required"),
  academic_year_name: z.string().min(4, "Academic year is required (e.g. 2026-2027)"),
  academic_year_start: z.string().min(8, "Start date is required"),
  academic_year_end: z.string().min(8, "End date is required"),
});

export const step5BaseSchema = z.object({
  terms_accepted: z.boolean(),
  invite_code: z.string().optional(),
});

export const step5Schema = step5BaseSchema.refine(
  data => data.terms_accepted === true,
  {
    message: "You must accept the Terms of Service and Privacy Policy",
    path: ["terms_accepted"],
  }
);

export const signupWizardSchema = step1Schema
  .merge(step2Schema)
  .merge(step3BaseSchema)
  .merge(step4Schema)
  .merge(step5BaseSchema)
  .refine(data => data.admin_password === data.admin_confirm_password, {
    message: "Passwords do not match",
    path: ["admin_confirm_password"],
  })
  .refine(data => data.terms_accepted === true, {
    message: "You must accept the Terms of Service and Privacy Policy",
    path: ["terms_accepted"],
  });

export type SignupWizardFormData = z.infer<typeof signupWizardSchema>;
