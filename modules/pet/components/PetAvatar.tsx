import Image from "next/image";
import PetTypeBadge from "./PetTypeBadge";

interface PetAvatarProps {
  imageUrl: string | null;
  name: string;
  type: string | null | undefined;
}

export function PetAvatar({ imageUrl, name, type }: PetAvatarProps) {
  if (imageUrl) {
    return (
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
        <Image
          src={imageUrl}
          alt={`รูปสัตว์เลี้ยง ${name}`}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
    );
  }

  return <PetTypeBadge type={type} display="tile" />;
}
