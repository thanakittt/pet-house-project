import { UserWithRole } from "better-auth/plugins";

export type AuthSignupProvider = "email" | "google" | "line" | "unknown";

// phoneNumber เป็น optional ตาม schema จริง — อาจเป็น null หรือ undefined ได้
export type AuthUser = UserWithRole & {
  phoneNumber?: string | null;
  hasLineConnection?: boolean;
  signupProvider?: AuthSignupProvider;
};

export type AuthUserWithProfile = AuthUser & {
  gender?: "MALE" | "FEMALE" | "UNSPECIFIED" | undefined;
  birthDate?: string | null | undefined;
};
