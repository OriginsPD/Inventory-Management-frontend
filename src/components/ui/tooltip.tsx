"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Simple CSS-only tooltip — no Radix dependency needed.
 * Wraps children in a relative container; `TooltipContent` appears on hover.
 */

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const Tooltip = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative inline-flex group", className)}>{children}</div>
)

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { ref, ...props })
  }
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
      "pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150",
      "px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap shadow-lg",
      className
    )}
    {...props}
  >
    {children}
    {/* Arrow */}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
  </div>
))
TooltipContent.displayName = "TooltipContent"

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
