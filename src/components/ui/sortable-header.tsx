"use client"

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import type { Column } from "@tanstack/react-table"

interface SortableHeaderProps {
  column: Column<any, unknown>
  label: string
}

export function SortableHeader({ column, label }: SortableHeaderProps) {
  return (
    <button
      className="flex items-center gap-1 group text-left"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      {column.getIsSorted() === 'asc' ? (
        <ChevronUp className="h-3.5 w-3.5 text-primary" />
      ) : column.getIsSorted() === 'desc' ? (
        <ChevronDown className="h-3.5 w-3.5 text-primary" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
      )}
    </button>
  )
}
