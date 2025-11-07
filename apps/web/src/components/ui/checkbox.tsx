import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <div className="relative inline-flex">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "checked:bg-primary checked:text-primary-foreground",
            "cursor-pointer",
            className
          )}
          onChange={handleChange}
          {...props}
        />
        <Check 
          className={cn(
            "absolute left-0 top-0 h-4 w-4 text-primary-foreground pointer-events-none opacity-0",
            "peer-checked:opacity-100"
          )} 
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }