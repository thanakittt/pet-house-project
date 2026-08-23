import { supabaseServer } from "@/lib/supabase-server";

const ANNOUNCEMENT_IMAGE_BUCKET = "images";
const ANNOUNCEMENT_IMAGE_FOLDER = "announcements";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AnnouncementImageUploadResult =
  | {
      success: true;
      publicUrl: string;
      storageKey: string;
    }
  | {
      success: false;
      error: string;
    };

const extensionByMimeType: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> =
  {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

function isAllowedImageType(
  value: string,
): value is (typeof ALLOWED_IMAGE_TYPES)[number] {
  return ALLOWED_IMAGE_TYPES.includes(
    value as (typeof ALLOWED_IMAGE_TYPES)[number],
  );
}

export function getAnnouncementImageFile(formData: FormData): File | null {
  const imageFile = formData.get("imageFile");

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return null;
  }

  return imageFile;
}

export function shouldRemoveAnnouncementImage(formData: FormData): boolean {
  return formData.get("removeImage") === "true";
}

export async function uploadAnnouncementImage({
  announcementId,
  imageFile,
}: {
  announcementId: string;
  imageFile: File;
}): Promise<AnnouncementImageUploadResult> {
  // validate ไฟล์ฝั่ง server อีกชั้นเสมอ เพราะ client validation ถูก bypass ได้
  if (!isAllowedImageType(imageFile.type)) {
    return {
      success: false,
      error: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WebP เท่านั้น",
    };
  }

  if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      success: false,
      error: "ขนาดรูปภาพต้องไม่เกิน 5MB",
    };
  }

  const extension = extensionByMimeType[imageFile.type];
  const storageKey = `${ANNOUNCEMENT_IMAGE_FOLDER}/${announcementId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabaseServer.storage
    .from(ANNOUNCEMENT_IMAGE_BUCKET)
    .upload(storageKey, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("uploadAnnouncementImage error:", uploadError);

    return {
      success: false,
      error: "อัปโหลดรูปภาพไม่สำเร็จ",
    };
  }

  const { data } = supabaseServer.storage
    .from(ANNOUNCEMENT_IMAGE_BUCKET)
    .getPublicUrl(storageKey);

  return {
    success: true,
    publicUrl: data.publicUrl,
    storageKey,
  };
}

export function getAnnouncementStorageKeyFromUrl(
  imageUrl: string | null,
): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    const bucketPrefix = `/storage/v1/object/public/${ANNOUNCEMENT_IMAGE_BUCKET}/`;

    if (!url.pathname.startsWith(bucketPrefix)) {
      return null;
    }

    const storageKey = decodeURIComponent(url.pathname.slice(bucketPrefix.length));

    // ลบเฉพาะไฟล์ที่ระบบ announcement เป็นคนสร้าง เพื่อไม่เผลอลบรูปของ module อื่นใน bucket เดียวกัน
    if (!storageKey.startsWith(`${ANNOUNCEMENT_IMAGE_FOLDER}/`)) {
      return null;
    }

    return storageKey;
  } catch {
    return null;
  }
}

export async function removeAnnouncementImageByStorageKey(
  storageKey: string | null,
) {
  if (!storageKey) {
    return;
  }

  const { error } = await supabaseServer.storage
    .from(ANNOUNCEMENT_IMAGE_BUCKET)
    .remove([storageKey]);

  if (error) {
    console.error("removeAnnouncementImageByStorageKey error:", error);
  }
}
