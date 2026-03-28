import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "animate-scale-in inline-flex items-center justify-center rounded-full text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border border-primary/25 bg-primary text-primary-foreground shadow-card hover:-translate-y-0.5 hover:brightness-105",
        secondary:
          "border border-border bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/90",
        outline:
          "border-2 border-border bg-white/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost:
          "border border-transparent text-foreground hover:border-border/80 hover:bg-white/80"
      },
      size: {
        default: "h-12 px-6 py-2.5",
        sm: "h-11 px-5 text-sm",
        lg: "h-14 px-8 text-xl",
        icon: "h-12 w-12"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
