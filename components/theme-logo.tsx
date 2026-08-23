import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

const LIGHT_MODE_LOGO_SRC = "/images/logo/2.png";
const DARK_MODE_LOGO_SRC = "/images/logo/light-logo.png";

type ThemeLogoProps = Omit<ImageProps, "src"> & {
  lightSrc?: ImageProps["src"];
  darkSrc?: ImageProps["src"];
};

export function ThemeLogo({
  lightSrc = LIGHT_MODE_LOGO_SRC,
  darkSrc = DARK_MODE_LOGO_SRC,
  alt,
  className,
  ...props
}: ThemeLogoProps) {
  return (
    <>
      <Image
        {...props}
        src={lightSrc}
        alt={alt}
        className={cn("dark:hidden", className)}
      />
      <Image
        {...props}
        src={darkSrc}
        alt={alt}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}
