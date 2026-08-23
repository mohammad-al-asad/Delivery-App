import { z } from "zod";

// Base user schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["Admin", "User", "Rider"]),
  password: z.string(),
});

// Schema for updating user (other roles) — role and cluster omitted, all optional
export const UpdateUserSchemaForOtherRoles = UserSchema.omit({
  role: true,
}).partial();

// Schema for creating user — phoneNumber, address, profileImage omitted, cluster optional
export const CreateUserSchema = UserSchema;
