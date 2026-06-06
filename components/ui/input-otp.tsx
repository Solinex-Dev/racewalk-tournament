"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";

import { cn } from "@/lib/utils";

type InputOTPProps = React.ComponentPropsWithoutRef<typeof OTPInput> & {
  containerClassName?: string;
};

const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  InputOTPProps
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    // Secret codes are alphanumeric (A–Z, 2–9). input-otp defaults inputMode to
    // "numeric", which makes mobile keyboards show digits only and hide letters.
    // Force a text (uppercase) keyboard here; still overridable via {...props}.
    inputMode="text"
    autoCapitalize="characters"
    spellCheck={false}
    containerClassName={cn(
      "flex items-center justify-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSeparator = React.forwardRef<
  React.ComponentRef<"hr">,
  React.ComponentPropsWithoutRef<"hr">
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    aria-hidden="true"
    className={cn("mx-1 h-px w-4 border-0 bg-slate-700/60", className)}
    {...props}
  />
));
InputOTPSeparator.displayName = "InputOTPSeparator";

type InputOTPSlotProps = React.ComponentPropsWithoutRef<"div"> & {
  index: number;
};

const InputOTPSlot = React.forwardRef<
  React.ComponentRef<"div">,
  InputOTPSlotProps
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];

  const hasFakeCaret = slot.hasFakeCaret;
  const isActive = slot.isActive;
  const char = slot.char;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-12 w-10 items-center justify-center rounded-xl border text-base font-medium transition-colors",
        "border-slate-700 bg-slate-900 text-slate-100",
        "shadow-[0_0_0_1px_rgba(15,23,42,0.7)]",
        "data-[active=true]:border-slate-100 data-[active=true]:shadow-[0_0_0_1px_rgba(248,250,252,0.9)]",
        "data-[active=true]:bg-slate-800",
        "data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-slate-400",
        "sm:h-14 sm:w-11 sm:text-lg",
        className,
      )}
      data-active={isActive ? "true" : "false"}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 animate-caret-blink bg-slate-100" />
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };


