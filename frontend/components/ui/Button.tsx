import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase transition-colors disabled:pointer-events-none disabled:opacity-50",
          "h-12 px-6 py-2 border-heavy",
          variant === "default" && "bg-black text-[#e8e8e8] hover:bg-[#222]",
          variant === "outline" && "bg-transparent text-black hover:bg-black hover:text-[#e8e8e8]",
          variant === "ghost" && "border-transparent bg-transparent text-black hover:bg-black hover:text-[#e8e8e8]",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
