import { UserWithRole } from "better-auth/plugins";

export type AuthUser = UserWithRole & { phoneNumber: string };

export type AuthUserWithProfile = AuthUser & {
  gender?: "MALE" | "FEMALE" | "UNSPECIFIED" | undefined;
  birthDate?: string | null | undefined;
};
