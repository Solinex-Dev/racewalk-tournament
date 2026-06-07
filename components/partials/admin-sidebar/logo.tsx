import { cn } from "@/lib/utils";
import type { ImgHTMLAttributes } from "react";
// App icon logo (full-colour, transparent bg) — added under app/. Static import
// so the bundler serves it with a hashed URL (no need to move it to public/).
import logoIcon from "@/app/android-chrome-192x192.png";

type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

/** Racewalk Tournament app logo (PNG). Full-colour — do NOT apply `invert`. */
export function Logo({ className, alt = "", ...props }: Readonly<LogoProps>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional: small static logo via a generic <img> wrapper; next/image's API doesn't fit
    <img
      src={logoIcon.src}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("object-contain", className)}
      {...props}
    />
  );
}
