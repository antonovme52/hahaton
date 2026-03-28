import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center text-center rounded-full px-4 py-1.5 text-base font-semibold leading-snug transition-colors",
  {
    variants: {
      variant: {
        default: "border border-border bg-secondary text-secondary-foreground",
        outline: "border border-border bg-white/85 text-foreground shadow-sm",
        reward: "bg-pop-sun text-pop-ink",
        info: "bg-accent text-accent-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
