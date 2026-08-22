export type SetupProfileData = {
  nickname: string;
  walkInPhoneNumber: string;
  gender: "MALE" | "FEMALE" | "UNSPECIFIED";
  birthDate?: string;
};