import * as React from "react";

import { cn } from "@/lib/utils";

export type FloatingInputProps = Omit<React.ComponentProps<"input">, "placeholder"> & {
  label: string;
};

/** Подпись на линии рамки: половина над инпутом + bg-card рвёт обводку */
const labelOverBorder =
  "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-card peer-focus:px-2 peer-focus:text-sm peer-focus:font-semibold peer-focus:text-pop-ink peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:rounded peer-[:not(:placeholder-shown)]:bg-card peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-pop-ink peer-[&:autofill]:top-0 peer-[&:autofill]:-translate-y-1/2 peer-[&:autofill]:rounded peer-[&:autofill]:bg-card peer-[&:autofill]:px-2 peer-[&:autofill]:text-sm peer-[&:autofill]:font-semibold peer-[&:autofill]:text-pop-ink peer-[&:-webkit-autofill]:top-0 peer-[&:-webkit-autofill]:-translate-y-1/2 peer-[&:-webkit-autofill]:rounded peer-[&:-webkit-autofill]:bg-card peer-[&:-webkit-autofill]:px-2 peer-[&:-webkit-autofill]:text-sm peer-[&:-webkit-autofill]:font-semibold peer-[&:-webkit-autofill]:text-pop-ink";

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, id, label, type = "text", disabled, ...props }, ref) => {
    return (
      <div className="relative mt-1">
        <input
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          placeholder=" "
          className={cn(
            "peer flex h-14 w-full rounded-2xl border-2 border-border bg-white/90 px-4 pb-2.5 pt-5 text-base text-pop-ink shadow-sm transition-[border-color,box-shadow] file:border-0 file:bg-transparent file:text-base file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-[0.875rem] top-1/2 z-10 -translate-y-1/2 rounded px-0 text-lg text-muted-foreground transition-[top,transform,font-size,padding,color,background-color,box-shadow] duration-200 ease-out peer-disabled:opacity-60",
            labelOverBorder
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
