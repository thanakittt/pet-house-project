"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from "next/image";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  children: React.ReactNode;
}

export default function ImageLightbox({
  src,
  alt = "Image",
  children,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        className="hover:opacity-80 w-full h-full transition-opacity cursor-pointer"
      >
        {children}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex justify-center items-center bg-transparent shadow-none p-0 border-none outline-none w-full max-w-none h-full"
        >
          <DialogTitle className="sr-only">ดูรูปภาพขนาดเต็ม</DialogTitle>

          <div className="relative flex justify-center items-center w-[95vw] h-[90vh]">
            <button
              onClick={() => setOpen(false)}
              className="-top-4 sm:-top-5 -right-4 sm:-right-5 z-60 absolute bg-black/60 hover:bg-black/90 shadow-2xl p-2 border border-white/20 rounded-full focus:outline-none text-white/90 hover:text-white transition-all"
            >
              <X className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>

            <Image
              src={src}
              alt={alt}
              fill
              className="shadow-2xl rounded-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
