import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#ff7a1a]/20 text-[#ff7a1a] border border-[#ff7a1a]/30",
        secondary: "bg-[#211e1b] text-[#f5f0eb] border border-[#2a2420]",
        destructive: "bg-red-900/30 text-red-400 border border-red-800/30",
        outline: "border border-[#2a2420] text-[#8a7e74]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
