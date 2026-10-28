import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 shadow-xs",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 rounded-xl px-4 text-sm font-medium has-data-[icon=inline-end]:pe-3.5 has-data-[icon=inline-start]:ps-3.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-md px-2 text-[0.625rem] has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2.5 rounded-2xl px-5 text-sm font-semibold has-data-[icon=inline-end]:pe-4.5 has-data-[icon=inline-start]:ps-4.5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12 rounded-2xl [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
