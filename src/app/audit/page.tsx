"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Shield, Clock, User, Activity, Hash, ChevronDown } from "lucide-react"
import { fetchAuditLogs } from "@/lib/api"
import { AuditLog } from "@/types/audit"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { Skeleton } from "@/components/ui/skeleton"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await fetchAuditLogs()
        setLogs(data)
      } catch (err: any) {
        toast({ title: "Error", description: "Could not retrieve audit history.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [toast])

  const columns: ColumnDef<AuditLog>[] = [
    {
        accessorKey: "performedAt",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                <Clock className="w-3 h-3 mr-1.5"/> Timestamp
                <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="text-foreground font-medium text-xs">{new Date(row.getValue("performedAt")).toLocaleDateString()}</span>
                <span className="text-[10px] text-zinc-400">{new Date(row.getValue("performedAt")).toLocaleTimeString()}</span>
            </div>
        )
    },
    {
        accessorKey: "performedBy",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                <User className="w-3 h-3 mr-1.5"/> Performed By
                <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => <span className="text-foreground font-bold text-xs">{row.getValue("performedBy")}</span>
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
            const action = row.getValue("action") as string
            return (
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase",
                    action === 'CREATE' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    action === 'DELETE' ? "bg-red-50 text-red-700 border border-red-100" :
                    "bg-muted text-zinc-600 border border-border"
                )}>
                    {action}
                </span>
            )
        }
    },
    {
        accessorKey: "entityName",
        header: "Entity Target",
        cell: ({ row }) => <span className="text-zinc-600 text-xs capitalize">{(row.getValue("entityName") as string).replace(/_/g, ' ')}</span>
    },
    {
        accessorKey: "entityId",
        header: "Target ID",
        cell: ({ row }) => (
            <span className="font-mono text-[10px] text-zinc-400 select-all uppercase">
                {row.getValue("entityId")?.toString().substring(0, 8)}...
            </span>
        )
    }
  ]

  const table = useReactTable({
    data: logs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
        pagination: {
            pageSize: 15
        }
    }
  })

  if (loading) return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <Card className="border-border">
        <div className="p-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">System Audit Trail</h1>
            <p className="text-muted-foreground text-zinc-500">Immutable record of all inventory and user activities.</p>
        </div>
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
                placeholder="Global activity search..."
                value={table.getState().globalFilter ?? ""}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
                className="pl-8 bg-card border-border"
            />
        </div>
      </div>

      <Card className="border border-border shadow-md overflow-hidden bg-card flex flex-col h-[750px]">
        <CardHeader className="bg-muted/30 border-b border-border py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Activity Ledger
            </CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12 py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-40 italic text-zinc-500">
                          <Activity className="h-12 w-12" />
                          <p>No activity records match your filter.</p>
                      </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-mono">
                ENTRY_COUNT: <span className="font-bold text-foreground">{logs.length}</span>
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 text-xs font-bold"
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 text-xs font-bold"
                >
                    Next
                </Button>
            </div>
        </div>
      </Card>
    </div>
  )
}
