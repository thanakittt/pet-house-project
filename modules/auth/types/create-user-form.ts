export type CreateUserForm = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender: string;
  birthDate: string;
  role: string;
};

export type CreateStaffForm = {
  userId: string;
  nickname: string;
  gender: string;
  birthDate: string;
};
