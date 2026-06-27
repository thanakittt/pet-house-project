"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CameraIcon, PawPrintIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

interface PetImageUploadFieldProps {
  imageFile: File | null;
  currentImageUrl?: string | null;
  removeCurrentImage?: boolean;
  onImageFileChange: (file: File | null) => void;
  onRemoveCurrentImageChange?: (remove: boolean) => void;
}

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

export function PetImageUploadField({
  imageFile,
  currentImageUrl,
  removeCurrentImage = false,
  onImageFileChange,
  onRemoveCurrentImageChange,
}: PetImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const displayedImageUrl = useMemo(() => {
    if (imageFile && previewUrl) {
      return previewUrl;
    }

    if (currentImageUrl && !removeCurrentImage) {
      return currentImageUrl;
    }

    return null;
  }, [currentImageUrl, imageFile, previewUrl, removeCurrentImage]);

  const handleClearImage = () => {
    onImageFileChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    setPreviewUrl(null);

    if (currentImageUrl && !previewUrl) {
      onRemoveCurrentImageChange?.(true);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    if (!file) {
      setPreviewUrl(null);
      onImageFileChange(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    onRemoveCurrentImageChange?.(false);
    onImageFileChange(file);
  };

  const handleChooseImage = () => {
    onRemoveCurrentImageChange?.(false);
    inputRef.current?.click();
  };

  return (
    <Field>
      <FieldLabel>รูปสัตว์เลี้ยง</FieldLabel>
      <div className="flex items-center gap-4">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {displayedImageUrl ? (
            <Image
              src={displayedImageUrl}
              alt="รูปสัตว์เลี้ยง"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={previewUrl !== null}
            />
          ) : (
            <PawPrintIcon className="size-9 text-muted-foreground" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleChooseImage}>
              <CameraIcon className="size-4" />
              เลือกรูป
            </Button>
            {displayedImageUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearImage}
              >
                <XIcon className="size-4" />
                ลบรูป
              </Button>
            )}
          </div>
          <FieldDescription>
            รองรับ JPG, PNG หรือ WebP ไม่เกิน 4MB
          </FieldDescription>
        </div>
      </div>
      <Input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          handleFileChange(file);
        }}
      />
    </Field>
  );
}
