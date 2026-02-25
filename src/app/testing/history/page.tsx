'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchDeviceTests, fetchDevices } from '@/lib/api';
import { DeviceTest } from '@/types/device-testing';
import { Device } from '@/types/devices';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckSquare, User, Calendar, Hash, ClipboardCheck, Info, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function TestHistoryPage() {
  const [deviceTests, setDeviceTests] = useState<DeviceTest[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDeviceTests, fetchedDevices] = await Promise.all([
          fetchDeviceTests(),
          fetchDevices(),
        ]);
        setDeviceTests(fetchedDeviceTests);
        setDevices(fetchedDevices);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getDeviceIdentifier = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.identifier : 'N/A';
  };

  const columns: ColumnDef<DeviceTest>[] = [
    {
        accessorKey: "id",
        header: "Session ID",
        cell: ({ row }) => <span className="font-mono text-[10px] text-zinc-500">{row.getValue("id")?.toString().substring(0, 8)}...</span>,
    },
    {
        accessorKey: "deviceId",
        header: "Asset Identifier",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                <Hash className="w-3 h-3 text-zinc-600" /> {getDeviceIdentifier(row.getValue("deviceId"))}
            </div>
        )
    },
    {
        accessorKey: "handedTo",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Handed To
                <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2 font-medium text-foreground">
                <User className="w-3 h-3 text-zinc-500" /> {row.getValue("handedTo")}
            </div>
        )
    },
    {
        accessorKey: "result",
        header: "Result",
        cell: ({ row }) => {
            const result = row.getValue("result") as string
            return (
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    result === 'PASS' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    result === 'FAIL' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    "bg-zinc-800 text-zinc-400 border border-zinc-700"
                )}>
                    {result || 'Pending'}
                </span>
            )
        }
    },
    {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
            <div className="flex items-start gap-2 text-sm text-zinc-500 max-w-[200px]">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50" />
                <span className="line-clamp-1 italic">{row.getValue("notes") || 'No comments'}</span>
            </div>
        )
    },
    {
        accessorKey: "testDate",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Test Date
                <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2 text-zinc-500 text-xs">
                <Calendar className="w-3 h-3" /> {new Date(row.getValue("testDate")).toLocaleDateString()}
            </div>
        ),
        meta: {
            className: "text-right"
        }
    }
  ]

  const table = useReactTable({
    data: deviceTests,
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
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>
      <Card className="border-border">
        <div className="p-0">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </Card>
    </div>
  );
  if (error) return <div className="p-8 text-red-500 font-bold bg-red-50 rounded-xl border border-red-100">Critical Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-zinc-600" />
            Technical QC History
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
            Historical log of asset quality control and technical certifications.
            </p>
        </div>
        <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
                placeholder="Filter sessions..."
                value={table.getState().globalFilter ?? ""}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
                className="pl-8 bg-card border-border h-9"
            />
        </div>
      </div>

      <Card className="border border-border shadow-md overflow-hidden bg-card flex flex-col h-[750px]">
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
                          <CheckSquare className="h-12 w-12" />
                          <p>No QC sessions recorded matching search.</p>
                      </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-bold">
                TOTAL_RECORDS: {deviceTests.length}
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
  );
}
