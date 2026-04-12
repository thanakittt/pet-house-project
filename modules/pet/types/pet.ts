export type PetForm = {
  name: string;
  medicalNotes: string;
  petBreedId: string;
  customerId: string;
};

export type createPetForm = {
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
    type: string;
  };
};

export type updatePetForm = {
  petId: string;
  name: string;
  medicalNotes: string;
  petBreedId: string;
};

