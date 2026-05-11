import { supabaseServer } from "@/lib/supabase-server";

export const SERVICE_IMAGE_STORAGE_BUCKET = "images";
export const MAX_SERVICE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const serviceImageFolderByType = {
  BEFORE: "before",
  AFTER: "after",
  ISSUE: "issue",
} as const;

const extensionByMimeType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ServiceImageType = keyof typeof serviceImageFolderByType;
type AllowedServiceImageMimeType = keyof typeof extensionByMimeType;

export type ServiceImageUploadResult = {
  publicUrl: string;
  storageKey: string;
};

export function isServiceImageType(value: string): value is ServiceImageType {
  return value in serviceImageFolderByType;
}

export function isAllowedServiceImageMimeType(
  value: string,
): value is AllowedServiceImageMimeType {
  return value in extensionByMimeType;
}

export function getServiceImageStorageKeyFromUrl(
  imageUrl: string | null,
): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    const bucketPrefix = `/storage/v1/object/public/${SERVICE_IMAGE_STORAGE_BUCKET}/`;

    if (!url.pathname.startsWith(bucketPrefix)) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(bucketPrefix.length));
  } catch {
    return null;
  }
}

function buildServiceImageStorageKey({
  appointmentId,
  petId,
  type,
  imageFile,
}: {
  appointmentId: string;
  petId: string;
  type: ServiceImageType;
  imageFile: File;
}) {
  const extension = extensionByMimeType[imageFile.type as AllowedServiceImageMimeType];
  const typeFolder = serviceImageFolderByType[type];

  return `appointments/${appointmentId}/pets/${petId}/service-images/${typeFolder}/${crypto.randomUUID()}.${extension}`;
}

export async function uploadServiceImageToStorage({
  appointmentId,
  petId,
  type,
  imageFile,
}: {
  appointmentId: string;
  petId: string;
  type: ServiceImageType;
  imageFile: File;
}): Promise<ServiceImageUploadResult> {
  // CODEMAP: storage path
  // input: appointmentId, petId, type ของรูป และ File จริงจาก form
  // processing: สร้าง key แบบเป็นชั้นตาม business object เพื่อไม่ให้ไฟล์กองอยู่ root bucket
  // output: public URL สำหรับแสดงรูป และ storageKey สำหรับลบไฟล์ภายหลัง
  const storageKey = buildServiceImageStorageKey({
    appointmentId,
    petId,
    type,
    imageFile,
  });

  const { error } = await supabaseServer.storage
    .from(SERVICE_IMAGE_STORAGE_BUCKET)
    .upload(storageKey, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (error) {
    console.error("uploadServiceImageToStorage error:", error);
    throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
  }

  const { data } = supabaseServer.storage
    .from(SERVICE_IMAGE_STORAGE_BUCKET)
    .getPublicUrl(storageKey);

  return {
    publicUrl: data.publicUrl,
    storageKey,
  };
}

export async function removeServiceImagesFromStorage(storageKeys: string[]) {
  if (storageKeys.length === 0) {
    return;
  }

  const { error } = await supabaseServer.storage
    .from(SERVICE_IMAGE_STORAGE_BUCKET)
    .remove(storageKeys);

  if (error) {
    console.error("removeServiceImagesFromStorage error:", error);
  }
}
