export type Customer = {
  id: string;
  nickname: string;
  walkInPhoneNumber: string | null;
  userName: string | null;
  userPhoneNumber: string | null;
  userId: string | null;
  createdAt: Date;
  gender: string | null;
};

export type CustomerSearchResult = {
  id: string;
  nickname: string;
  pets: {
    id: string;
    name: string;
    breed: {
      name: string;
      type: string;
    };
  }[];
};
