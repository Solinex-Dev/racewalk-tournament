import { cn } from "@/lib/utils";
import type { ImgHTMLAttributes } from "react";

const LOGO_SRC = "/logo-sneaker.png";

type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

/** Racewalk Tournament sneaker mark (PNG). */
export function Logo({ className, alt = "", ...props }: Readonly<LogoProps>) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("object-contain", className)}
      {...props}
    />
  );
}
