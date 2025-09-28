import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1a472a] text-white [a&]:hover:bg-[#1a472a]/90",
        secondary:
          "border-emerald-900 bg-emerald-600 text-emerald-100 [a&]:hover:bg-[#2d5a2d]/90",
        accent:
          "border-transparent bg-[#4a7c59] text-white [a&]:hover:bg-[#4a7c59]/90",
        destructive:
          "border-transparent bg-emerald-600 text-white [a&]:hover:bg-emerald-700",
        outline:
          "border-emerald-600 text-emerald-700 bg-transparent [a&]:hover:bg-emerald-50",
        muted:
          "border-transparent bg-muted text-muted-foreground [a&]:hover:bg-muted/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
