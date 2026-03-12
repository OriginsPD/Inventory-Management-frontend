"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { RotateCcw, Package, Calendar, User, Loader2, ChevronDown, ChevronUp, ChevronsUpDown, Search, PackageSearch } from "lucide-react"
import { SortableHeader } from "@/components/ui/sortable-header"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { fetchDevices, fetchRmaRecords, createRmaRecord } from "@/lib/api"
import { Device } from "@/types/devices"
import { RmaRecord } from "@/types/rma"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

const formSchema = z.object({
  deviceIdentifier: z.string().min(1, "Device identifier is required"),
  reason: z.string().min(1, "Reason is required"),
  vendorReference: z.string().optional(),
  returnedBy: z.string().min(1, "Returned by is required"),
  rmaDate: z.string().min(1, "RMA date is required"),
})

export default function RmaPage() {
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [rmaRecords, setRmaRecords] = useState<RmaRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceIdentifier: "",
      reason: "",
      vendorReference: "",
      returnedBy: "",
      rmaDate: new Date().toISOString().slice(0, 16),
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [devices, records] = await Promise.all([fetchDevices(), fetchRmaRecords()])
        setAllDevices(devices)
        setRmaRecords(records)
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const device = allDevices.find(d => d.identifier === values.deviceIdentifier)
    if (!device) {
      toast({ title: "Device Not Found", description: `No device with identifier "${values.deviceIdentifier}" found.`, variant: "destructive" })
      return
    }
    try {
      const created = await createRmaRecord({
        deviceId: device.id,
        reason: values.reason,
        vendorReference: values.vendorReference || undefined,
        returnedBy: values.returnedBy,
        rmaDate: new Date(values.rmaDate).toISOString(),
      })
      setRmaRecords(prev => [created, ...prev])
      toast({ title: "RMA Created", description: "Device has been marked as RMA." })
      form.reset({
        deviceIdentifier: "",
        reason: "",
        vendorReference: "",
        returnedBy: "",
        rmaDate: new Date().toISOString().slice(0, 16),
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const columns: ColumnDef<RmaRecord>[] = [
    {
      accessorKey: "deviceId",
      size: 160,
      header: "Device",
      cell: ({ row }) => {
        const device = allDevices.find(d => d.id === row.getValue("deviceId"))
        return (
          <div className="flex items-center gap-2">
            <Package className="w-3 h-3 text-primary opacity-50" />
            <span className="font-mono text-xs font-bold">{device?.identifier || (row.getValue("deviceId") as string).substring(0, 8)}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "reason",
      size: 200,
      header: "Reason",
      cell: ({ row }) => <span className="text-xs text-foreground">{row.getValue("reason")}</span>
    },
    {
      accessorKey: "vendorReference",
      size: 140,
      header: "Vendor Ref",
      cell: ({ row }) => <span className="text-xs text-zinc-500">{row.getValue("vendorReference") || "—"}</span>
    },
    {
      accessorKey: "returnedBy",
      size: 140,
      header: "Returned By",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <User className="w-3 h-3 opacity-50" /> {row.getValue("returnedBy")}
        </div>
      )
    },
    {
      accessorKey: "rmaDate",
      size: 120,
      header: ({ column }) => <SortableHeader column={column} label="RMA Date" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <Calendar className="w-3 h-3 opacity-50" />
          {formatDate(row.getValue("rmaDate"))}
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: rmaRecords,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    initialState: { pagination: { pageSize: 10 } },
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-4 w-[450px]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Skeleton className="h-[500px] w-full" />
        <Skeleton className="lg:col-span-2 h-[600px] w-full" />
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <RotateCcw className="h-8 w-8 text-primary" /> RMA Workflow
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage device returns and vendor RMA submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <Card className="border-border shadow-md bg-card sticky top-24">
            <CardHeader className="bg-muted/20 border-b border-border">
              <CardTitle className="text-xl">Log RMA</CardTitle>
              <CardDescription>Submit a device for vendor return.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="deviceIdentifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Device IMEI / Identifier</FormLabel>
                        <FormControl>
                          <Input placeholder="Scan or enter IMEI..." className="h-11 border-border bg-muted/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Reason for Return</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-border bg-muted/10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Describe the issue..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendorReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vendor Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. RMA-2024-001" className="h-11 border-border bg-muted/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="returnedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Returned By</FormLabel>
                        <FormControl>
                          <Input placeholder="Staff name..." className="h-11 border-border bg-muted/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rmaDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">RMA Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" className="h-11 border-border bg-muted/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 font-bold" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                    ) : (
                      <><RotateCcw className="mr-2 h-5 w-5" /> Submit RMA</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border shadow-md bg-card overflow-hidden flex flex-col h-[700px]">
            <CardHeader className="pb-4 border-b border-border bg-muted/10">
              <CardTitle className="text-xl">RMA History</CardTitle>
              <CardDescription>All device return and vendor RMA submissions.</CardDescription>
            </CardHeader>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="h-12 py-2">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-border/40">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <EmptyState icon={<PackageSearch size={44} />} title="No RMA records found" description="Submit an RMA using the form on the left." />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">
                Total Records: {rmaRecords.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 text-xs font-bold">
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 text-xs font-bold">
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
