"use client"

import { MoreHorizontal } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export interface TableAction {
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
  hidden?: boolean
}

interface TableActionsProps {
  actions: TableAction[]
}

export function TableActions({ actions }: TableActionsProps) {
  const visibleActions = actions.filter((a) => !a.hidden)
  if (visibleActions.length === 0) return null

  const standard = visibleActions.filter((a) => a.variant !== "destructive")
  const destructive = visibleActions.filter((a) => a.variant === "destructive")
  const hasBothGroups = standard.length > 0 && destructive.length > 0

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {standard.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onClick}
              className="cursor-pointer gap-2"
            >
              <action.icon className="h-4 w-4 text-zinc-400" />
              {action.label}
            </DropdownMenuItem>
          ))}
          {hasBothGroups && <DropdownMenuSeparator />}
          {destructive.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onClick}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
