"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
    Plus, 
    Package, 
    Trash2, 
    Edit, 
    Eye, 
    Calendar, 
    Tag, 
    Info, 
    Search, 
    ChevronDown 
} from "lucide-react"

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

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchDeviceModels, createDeviceModel, deleteDeviceModel, updateDeviceModel } from "@/lib/api"
import { DeviceModel } from "@/types/device-models"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Model name must be at least 2 characters.",
  }),
  brand: z.string().min(2, {
    message: "Brand must be at least 2 characters.",
  }),
  category: z.string().optional(),
  assetType: z.enum(['TRACKER', 'SIM', 'PERIPHERAL', 'DASH_CAM', 'SD_CARD', 'PANIC_BUTTON', 'FUEL_SENSOR', 'KEYFOB', 'TRAVEL_ADAPTER']),
  minStock: z.number().min(0, { message: "Minimum stock cannot be negative." }),
})

export default function DeviceModelsPage() {
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null)
  const [viewingModel, setViewingModel] = useState<DeviceModel | null>(null)

  // Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "",
      assetType: "TRACKER",
      minStock: 0,
    },
  })

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', brand: '', category: '', assetType: 'TRACKER', minStock: 0 },
  })

  useEffect(() => {
    loadDeviceModels()
  }, [])

  useEffect(() => {
    if (editingModel) {
      editForm.reset({
        name: editingModel.name,
        brand: editingModel.brand,
        category: editingModel.category || "",
        assetType: editingModel.assetType,
        minStock: editingModel.minStock || 0,
      })
    }
  }, [editingModel, editForm])

  useEffect(() => {
    if (!isAddOpen) {
      form.reset()
    }
  }, [isAddOpen, form])

  async function loadDeviceModels() {
    try {
      const data = await fetchDeviceModels()
      setDeviceModels(data)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const created = await createDeviceModel(values as any)
      setDeviceModels((prev) => [...prev, created])
      form.reset()
      setIsAddOpen(false)
      toast({
        title: "Success",
        description: "Device model created successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  async function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (!editingModel) return
    try {
      const updated = await updateDeviceModel(editingModel.id, values as any)
      setDeviceModels((prev) => prev.map(m => m.id === updated.id ? updated : m))
      setEditingModel(null)
      toast({
        title: "Success",
        description: "Device model updated successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteDeviceModel(deleteId)
      setDeviceModels((prev) => prev.filter((m) => m.id !== deleteId))
      toast({
        title: "Deleted",
        description: "Device model removed successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  const columns: ColumnDef<DeviceModel>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Model Name
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-bold text-foreground text-sm">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "brand",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Manufacturer
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-zinc-500 text-sm">{row.getValue("brand")}</div>,
    },
    {
      accessorKey: "assetType",
      header: "Classification",
      cell: ({ row }) => {
        const type = row.getValue("assetType") as string
        return (
            <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase border",
                type === 'TRACKER' ? "bg-blue-50 text-blue-600 border-blue-200" :
                type === 'SIM' ? "bg-amber-50 text-amber-600 border-amber-200" :
                "bg-zinc-100 text-zinc-500 border-zinc-200"
            )}>
                {type}
            </span>
        )
      }
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div className="text-zinc-400 text-xs">{row.getValue("category") || "General"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const model = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewingModel(model)}
              className="text-zinc-400 hover:text-primary h-8 w-8"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingModel(model)}
              className="text-zinc-400 hover:text-primary h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(model.id)}
              className="text-zinc-400 hover:text-destructive h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: deviceModels,
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
            pageSize: 10
        }
    }
  })

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] w-full shadow-sm rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-[500px] w-full shadow-sm rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Models</h1>
          <p className="text-muted-foreground">
            Manage the types of devices available in your inventory.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> New Model
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Model</DialogTitle>
              <DialogDescription>Create a new device model definition.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Model Name</FormLabel>
                      <FormControl>
                        <Input placeholder="iPhone 15 Pro" className="bg-muted/30 border-border h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Brand / Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="Apple" className="bg-muted/30 border-border h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Classification</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/30 border-border h-11">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TRACKER">TRACKER (IMEI)</SelectItem>
                          <SelectItem value="SIM">SIM CARD (ICCID)</SelectItem>
                          <SelectItem value="PERIPHERAL">PERIPHERAL (SN)</SelectItem>
                          <SelectItem value="DASH_CAM">DASH CAM</SelectItem>
                          <SelectItem value="SD_CARD">SD CARD</SelectItem>
                          <SelectItem value="PANIC_BUTTON">PANIC BUTTON</SelectItem>
                          <SelectItem value="FUEL_SENSOR">FUEL SENSOR</SelectItem>
                          <SelectItem value="KEYFOB">KEYFOB</SelectItem>
                          <SelectItem value="TRAVEL_ADAPTER">TRAVEL_ADAPTER</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Industry Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Smartphone" className="bg-muted/30 border-border h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Minimum Stock Threshold</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10" 
                          className="bg-muted/30 border-border h-11"
                          {...field} 
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        The system will alert when stock levels drop below this number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 mt-4 font-bold shadow-lg shadow-primary/10">Create Model Blueprint</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit border-none shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Architecture
            </CardTitle>
            <CardDescription>Blueprints for individual hardware assets.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="p-4 bg-muted/20 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-zinc-500 leading-relaxed italic">
                      &quot;Model definitions act as the blueprints for individual assets. Ensure type and thresholds are accurate for system heuristics.&quot;
                  </p>
              </div>
          </CardContent>
        </Card>

        {/* Advanced Data Table */}
        <Card className="lg:col-span-2 border-border shadow-md bg-card overflow-hidden flex flex-col h-[600px]">
          <CardHeader className="bg-muted/20 border-b border-border py-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Model Definitions
                </CardTitle>
                <div className="relative w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-zinc-400" />
                    <Input
                        placeholder="Filter models..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="pl-8 h-8 text-xs bg-card border-border"
                    />
                </div>
            </div>
          </CardHeader>
          
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="h-10 py-2">
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
                      data-state={row.getIsSelected() && "selected"}
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
                            <Package className="h-12 w-12" />
                            <p>No model definitions found.</p>
                        </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-2 border-t border-border bg-muted/10 flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 text-xs font-bold"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 text-xs font-bold"
            >
              Next
            </Button>
          </div>
        </Card>
      </div>

      {/* View Detail Modal */}
      <Dialog open={!!viewingModel} onOpenChange={(open) => !open && setViewingModel(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Info className="w-5 h-5 text-primary"/> Model Details
            </DialogTitle>
            <DialogDescription>Full technical specification for this device type.</DialogDescription>
          </DialogHeader>
          {viewingModel && (
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Brand</span>
                        <span className="font-semibold text-foreground">{viewingModel.brand}</span>
                    </div>
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Model</span>
                        <span className="font-semibold text-foreground">{viewingModel.name}</span>
                    </div>
                </div>
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-primary block mb-1">Classification</span>
                        <span className="text-sm font-bold text-primary tracking-tight">{viewingModel.assetType}</span>
                    </div>
                    <Tag className="w-4 h-4 text-primary opacity-50"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Category</span>
                        <span className="font-semibold text-foreground">{viewingModel.category || "General"}</span>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block mb-1">Stock Margin</span>
                        <span className="font-bold text-amber-700">{viewingModel.minStock} Units</span>
                    </div>
                </div>
                <div className="p-3 border border-border rounded-lg space-y-2 bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3 text-emerald-500"/> Created: {new Date(viewingModel.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3 text-primary"/> Last Updated: {new Date(viewingModel.updatedAt).toLocaleString()}
                    </div>
                </div>
                <div className="p-2 bg-muted/10 border border-border border-dashed rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Internal Reference ID</span>
                    <span className="text-[10px] text-zinc-500 break-all font-mono">{viewingModel.id}</span>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is immutable. This will permanently purge the device model and all associated metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold">
              Purge Model
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Model Profile</DialogTitle>
            <DialogDescription>Make changes to the device model blueprint.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Model Name</FormLabel>
                    <FormControl>
                      <Input className="bg-muted/30 border-border h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Brand / Manufacturer</FormLabel>
                    <FormControl>
                      <Input className="bg-muted/30 border-border h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Industry Category</FormLabel>
                    <FormControl>
                      <Input className="bg-muted/30 border-border h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Minimum Stock Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        className="bg-muted/30 border-border h-11"
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 mt-4 font-bold shadow-lg shadow-primary/10">Save Blueprint Updates</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
