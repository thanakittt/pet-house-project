export type CustomerForm = {
  nickname: string;
  walkInPhoneNumber: string;
  gender: string;
};

export type UpdateCustomerForm = {
  id: string;
  nickname?: string;
  walkInPhoneNumber?: string;
  gender?: string;
};
