export type PetForm = {
  name: string;
  medicalNotes: string;
  petBreedId: string;
  customerId: string;
};

export type CreatePetForm = {
  name: string;
  petType: string;
  medicalNotes: string;
  petBreedId: string;
};

export type Pet = {
  id: string;
  name: string;
  medicalNotes: string | null;
  petBreedId: string;
  breed: {
    name: string;
    id: string;
    type: "DOG" | "CAT";
    size: "S" | "M" | "L" | "ALL";
  };
};

export type UpdatePetForm = {
  petId: string;
  name: string;
  medicalNotes: string;
  petBreedId: string;
};

