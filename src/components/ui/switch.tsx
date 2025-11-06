import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    showText?: boolean
  }
>(({ className, showText = true, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input relative",
      showText && "w-16", // Make wider when showing text
      className
    )}
    {...props}
    ref={ref}
  >
    {showText && (
      <>
        <span className="absolute left-1.5 text-[10px] font-medium text-primary-foreground data-[state=unchecked]:opacity-0 transition-opacity">
          ON
        </span>
        <span className="absolute right-1.5 text-[10px] font-medium text-muted-foreground data-[state=checked]:opacity-0 transition-opacity">
          OFF
        </span>
      </>
    )}
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 relative z-10",
        showText && "data-[state=checked]:translate-x-10" // Adjust for wider switch
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
