import { supabaseServer } from "@/lib/supabase-server";

export const PET_PROFILE_IMAGE_STORAGE_BUCKET = "images";
export const MAX_PET_PROFILE_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const extensionByMimeType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AllowedPetProfileImageMimeType = keyof typeof extensionByMimeType;

export type PetProfileImageUploadResult = {
  publicUrl: string;
  storageKey: string;
};

export function isAllowedPetProfileImageMimeType(
  value: string,
): value is AllowedPetProfileImageMimeType {
  return value in extensionByMimeType;
}

export function getPetProfileImageStorageKeyFromUrl(
  imageUrl: string | null,
): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    const bucketPrefix = `/storage/v1/object/public/${PET_PROFILE_IMAGE_STORAGE_BUCKET}/`;

    if (!url.pathname.startsWith(bucketPrefix)) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(bucketPrefix.length));
  } catch {
    return null;
  }
}

function buildPetProfileImageStorageKey({
  petId,
  imageFile,
}: {
  petId: string;
  imageFile: File;
}) {
  const extension =
    extensionByMimeType[imageFile.type as AllowedPetProfileImageMimeType];

  return `pets/${petId}/profile/${crypto.randomUUID()}.${extension}`;
}

export async function uploadPetProfileImageToStorage({
  petId,
  imageFile,
}: {
  petId: string;
  imageFile: File;
}): Promise<PetProfileImageUploadResult> {
  const storageKey = buildPetProfileImageStorageKey({ petId, imageFile });

  const { error } = await supabaseServer.storage
    .from(PET_PROFILE_IMAGE_STORAGE_BUCKET)
    .upload(storageKey, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (error) {
    console.error("uploadPetProfileImageToStorage error:", error);
    throw new Error("อัปโหลดรูปสัตว์เลี้ยงไม่สำเร็จ");
  }

  const { data } = supabaseServer.storage
    .from(PET_PROFILE_IMAGE_STORAGE_BUCKET)
    .getPublicUrl(storageKey);

  return {
    publicUrl: data.publicUrl,
    storageKey,
  };
}

export async function removePetProfileImagesFromStorage(
  storageKeys: string[],
) {
  if (storageKeys.length === 0) {
    return;
  }

  const { error } = await supabaseServer.storage
    .from(PET_PROFILE_IMAGE_STORAGE_BUCKET)
    .remove(storageKeys);

  if (error) {
    console.error("removePetProfileImagesFromStorage error:", error);
  }
}
