"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Plus, 
  Package, 
  Trash2, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Smartphone, 
  Hash, 
  ShieldCheck, 
  History, 
  FileUp,
  Scan,
  Loader2,
  ArrowRight,
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Wifi,
  Bell
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import { Html5QrcodeScanner } from "html5-qrcode"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Checkbox } from "@/components/ui/checkbox"
import { fetchDevices, createDevice, deleteDevice, fetchDeviceModels, updateDevice, refillStock } from "@/lib/api"
import { Device } from "@/types/devices"
import { DeviceModel } from "@/types/device-models"
import { cn, playBeep } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  identifier: z.string().min(1, { message: "Identifier is required." }),
  modelId: z.string().min(1, { message: "Please select a model." }),
  carrier: z.string().optional(),
  activationDate: z.string().optional(),
  planExpiryDate: z.string().optional(),
  firmwareVersion: z.string().optional(),
  hardwareRevision: z.string().optional(),
})

interface StagedDevice {
  identifier: string
  id: string
}

export default function DevicesPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      modelId: "",
      carrier: "",
      activationDate: "",
      planExpiryDate: "",
      firmwareVersion: "",
      hardwareRevision: "",
    },
  })

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      modelId: "",
      carrier: "",
      activationDate: "",
      planExpiryDate: "",
      firmwareVersion: "",
      hardwareRevision: "",
    },
  })

  const [devices, setDevices] = useState<Device[]>([])
  const [models, setModels] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Modal states
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isMassDeleteAlertOpen, setIsMassDeleteAlertOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [viewingDevice, setViewingDevice] = useState<Device | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isSingleEntryOpen, setIsSingleEntryOpen] = useState(false)
  const [isQuickSearchScanOpen, setIsQuickSearchScanOpen] = useState(false)
  
  // Data Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  // Import Specific State
  const [stagedDevices, setStagedDevices] = useState<StagedDevice[]>([])
  const [isProcessingImport, setIsProcessingImport] = useState(false)
  const [manualIdentifier, setManualIdentifier] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const manualInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedModelId = form.watch("modelId");
// ...
  // Keyboard Shortcut for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId), [selectedModelId, models]);

  const editModelId = editForm.watch("modelId");
  const selectedEditModel = useMemo(() => models.find(m => m.id === editModelId), [editModelId, models]);

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (editingDevice) {
      editForm.reset({
        identifier: editingDevice.identifier,
        modelId: editingDevice.modelId,
        carrier: editingDevice.carrier || "",
        activationDate: editingDevice.activationDate ? new Date(editingDevice.activationDate).toISOString().slice(0, 16) : "",
        planExpiryDate: editingDevice.planExpiryDate ? new Date(editingDevice.planExpiryDate).toISOString().slice(0, 16) : "",
        firmwareVersion: editingDevice.firmwareVersion || "",
        hardwareRevision: editingDevice.hardwareRevision || "",
      })
    }
  }, [editingDevice, editForm])

  // Autofocus manual input when modal opens or camera closes
  useEffect(() => {
    if (isImportModalOpen) {
      if (!showCamera) {
        setTimeout(() => manualInputRef.current?.focus(), 150);
      }
    } else {
      // Clear staged data when modal closes
      setStagedDevices([]);
      setManualIdentifier("");
      setShowCamera(false);
    }
  }, [isImportModalOpen, showCamera]);

  useEffect(() => {
    if (!isSingleEntryOpen) {
        form.reset();
    }
  }, [isSingleEntryOpen, form]);

  async function loadData() {
    try {
      const [fetchedDevices, fetchedModels] = await Promise.all([
        fetchDevices(),
        fetchDeviceModels(),
      ])
      setDevices(fetchedDevices)
      setModels(fetchedModels)
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

  const columns: ColumnDef<Device>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "identifier",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Asset ID / IMEI
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-mono text-xs font-bold text-foreground">{row.getValue("identifier")}</div>,
    },
    {
      accessorKey: "modelName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Hardware Model
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-foreground font-medium">{row.getValue("modelName")}</div>,
    },
    {
      accessorKey: "brand",
      header: "Manufacturer",
      cell: ({ row }) => <div className="text-zinc-500">{row.getValue("brand")}</div>,
    },
    {
      accessorKey: "status",
      header: "Current State",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase border",
            status === 'IN_STOCK' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
            status === 'DISPATCHED' ? "bg-primary/10 text-primary border-primary/20" :
            status === 'DAMAGED' ? "bg-red-50 text-red-600 border-red-200" :
            "bg-muted text-zinc-500 border-border"
          )}>
            {status.replace('_', ' ')}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const device = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewingDevice(device)}
              className="text-zinc-400 hover:text-primary h-8 w-8"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingDevice(device)}
              className="text-zinc-400 hover:text-primary h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(device.id)}
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
    data: devices,
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
        pageSize: 5,
      },
    },
  })

  // Camera Scanning Effect
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showCamera) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        if (decodedText) {
            let sanitized = decodedText.trim();
            if (sanitized.startsWith("'")) {
                sanitized = sanitized.substring(1);
            }
            setStagedDevices((prev) => {
                if (prev.find(d => d.identifier === sanitized)) {
                    // Quick visual feedback for duplicate could go here
                    return prev;
                }
                playBeep();
                toast({ 
                    title: "Turbo Scan Active", 
                    description: `Captured: ${sanitized}`,
                    className: "bg-primary text-primary-foreground font-bold" 
                });
                return [{ identifier: sanitized, id: crypto.randomUUID() }, ...prev];
            });
        }
      }, (error) => {
        // console.warn(error);
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [showCamera, toast]);

  // Quick Search Camera Effect
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isQuickSearchScanOpen) {
      scanner = new Html5QrcodeScanner(
        "quick-search-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        if (decodedText) {
            let sanitized = decodedText.trim();
            if (sanitized.startsWith("'")) {
                sanitized = sanitized.substring(1);
            }
            
            const found = devices.find(d => d.identifier.toLowerCase() === sanitized.toLowerCase());
            if (found) {
                playBeep();
                table.getColumn("identifier")?.setFilterValue(found.identifier);
                setIsQuickSearchScanOpen(false);
                toast({ 
                    title: "Asset Located", 
                    description: `Identified: ${found.identifier} (${found.modelName})`,
                    className: "bg-emerald-600 text-white font-bold" 
                });
            } else {
                toast({ 
                    title: "Not Found", 
                    description: `No asset matching ${sanitized} in database.`,
                    variant: "destructive"
                });
            }
        }
      }, (error) => {});
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [isQuickSearchScanOpen, devices, table, toast]);

  // Excel Parsing Logic
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: "binary" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const parsedData = XLSX.utils.sheet_to_json(sheet) as any[]

      const newDevices: StagedDevice[] = parsedData
        .map((row) => ({
          identifier: String(row.IMEI || row.imei || row.identifier || row.Identifier || "").trim(),
          id: crypto.randomUUID(),
        }))
        .filter((d) => d.identifier.length >= 5)

      setStagedDevices((prev) => [...newDevices, ...prev])
      toast({
        title: "File Processed",
        description: `Staged ${newDevices.length} assets for review.`,
      })
    }
    reader.readAsBinaryString(file)
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    multiple: false,
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        activationDate: values.activationDate || undefined,
        planExpiryDate: values.planExpiryDate || undefined,
        firmwareVersion: values.firmwareVersion || undefined,
        hardwareRevision: values.hardwareRevision || undefined,
      };
      const created = await createDevice(payload as any)
      setDevices((prev) => [created, ...prev])
      form.reset()
      setIsSingleEntryOpen(false)
      toast({
        title: "Registered",
        description: `Device ${values.identifier} registered successfully.`
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  async function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (!editingDevice) return
    try {
      const payload = {
        ...values,
        activationDate: values.activationDate || undefined,
        planExpiryDate: values.planExpiryDate || undefined,
        firmwareVersion: values.firmwareVersion || undefined,
        hardwareRevision: values.hardwareRevision || undefined,
      };
      const updated = await updateDevice(editingDevice.id, payload as any)
      setDevices((prev) => prev.map(d => d.id === updated.id ? updated : d))
      setEditingDevice(null)
      toast({
        title: "Updated",
        description: "Device record updated successfully."
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteDevice(deleteId)
      setDevices((prev) => prev.filter((d) => d.id !== deleteId))
      toast({
        title: "Deleted",
        description: "Asset removed from core database."
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setDeleteId(null)
    }
  }

  async function handleMassDelete() {
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id)
    try {
      for (const id of selectedIds) {
        await deleteDevice(id)
      }
      setDevices(prev => prev.filter(d => !selectedIds.includes(d.id)))
      setRowSelection({})
      setIsMassDeleteAlertOpen(false)
      toast({
        title: "Mass Deletion",
        description: `Successfully purged ${selectedIds.length} assets.`
      })
    } catch (err: any) {
      toast({
        title: "Partial Success",
        description: "Some deletions may have failed.",
        variant: "destructive"
      })
    }
  }

  async function processImport() {
    if (stagedDevices.length === 0) return
    
    const selectedModelId = form.getValues("modelId")
    if (!selectedModelId) {
      toast({ title: "Validation Error", description: "Select a model for the bulk batch.", variant: "destructive" })
      return
    }

    setIsProcessingImport(true)
    try {
      const values = form.getValues();
      await refillStock({
        modelId: selectedModelId,
        identifiers: stagedDevices.map(d => d.identifier),
        carrier: values.carrier || undefined,
        activationDate: values.activationDate ? new Date(values.activationDate).toISOString() : undefined,
        planExpiryDate: values.planExpiryDate ? new Date(values.planExpiryDate).toISOString() : undefined,
        firmwareVersion: values.firmwareVersion || undefined,
        hardwareRevision: values.hardwareRevision || undefined,
      })
      
      await loadData() // Reload everything
      setStagedDevices([])
      setIsImportModalOpen(false)
      toast({ title: "Import Successful", description: `Added ${stagedDevices.length} assets to stock.` })
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsProcessingImport(false)
    }
  }

  const addManualIdentifier = () => {
    let sanitized = manualIdentifier.trim();
    if (sanitized.startsWith("'")) {
      sanitized = sanitized.substring(1);
    }
    if (!sanitized) return;

    if (stagedDevices.find(d => d.identifier === sanitized)) {
        toast({ title: "Duplicate", description: "This ID is already staged.", variant: "destructive" })
        setManualIdentifier("") // Clear on failure
        setTimeout(() => manualInputRef.current?.focus(), 10);
        return
    }
    playBeep();
    setStagedDevices((prev) => [{ identifier: sanitized, id: crypto.randomUUID() }, ...prev])
    setManualIdentifier("")
    setTimeout(() => manualInputRef.current?.focus(), 10);
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="lg:col-span-3 h-[600px] w-full" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" />
            Asset Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">Real-time control over physical inventory nodes.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border hover:bg-muted/50 font-bold">
                <FileUp className="mr-2 h-4 w-4" /> Bulk Ingestion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <FileUp className="h-6 w-6 text-primary" /> Multi-Asset Ingestion
                </DialogTitle>
                <DialogDescription>Bulk upload via Excel or hardware/camera scanner.</DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                  {/* Left Side: Upload */}
                  <div className="space-y-4">
                      <div 
                          {...getRootProps()} 
                          className={cn(
                              "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
                              isDragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-border hover:border-zinc-400 hover:bg-muted/30"
                          )}
                      >
                          <input {...getInputProps()} />
                          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FileUp className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-foreground">Drop Excel/CSV here</p>
                          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Max 500 units per batch</p>
                      </div>

                      <div className="relative">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-zinc-500 font-bold">Or Hardware Scanner</span></div>
                      </div>

                      <div className="flex gap-2">
                          <Input 
                              ref={manualInputRef}
                              placeholder="Scan with Hardware..." 
                              value={manualIdentifier} 
                              onChange={(e) => setManualIdentifier(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addManualIdentifier()}
                              className="bg-muted/30 border-border font-mono text-xs focus:ring-2 focus:ring-primary/50"
                          />
                          <Button variant="outline" size="icon" onClick={addManualIdentifier} className="shrink-0 border-border" title="Add Manually">
                              <Plus className="h-4 w-4" />
                          </Button>
                          <Button 
                              variant="secondary" 
                              size="icon" 
                              className={cn("shrink-0", showCamera && "bg-primary text-primary-foreground")}
                              onClick={() => setShowCamera(!showCamera)}
                              title="Toggle Camera Scanner"
                          >
                              <Camera className="h-4 w-4" />
                          </Button>
                      </div>

                      {showCamera && (
                          <div className="rounded-xl overflow-hidden border border-border bg-black aspect-square">
                              <div id="reader" />
                          </div>
                      )}
                  </div>

                  {/* Right Side: Staging List */}
                  <div className="flex flex-col h-[400px]">
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Staging Area ({stagedDevices.length})</h4>
                          {stagedDevices.length > 0 && (
                              <button onClick={() => setStagedDevices([])} className="text-[10px] text-red-500 font-bold hover:underline">Clear All</button>
                          )}
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                          {stagedDevices.length === 0 ? (
                              <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-zinc-500 italic text-xs gap-2">
                                  <Package className="h-8 w-8 opacity-20" />
                                  <span>No assets staged</span>
                              </div>
                          ) : (
                              stagedDevices.map((d) => (
                                  <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-xl group animate-in slide-in-from-right-2">
                                      <span className="font-mono text-xs font-bold text-foreground">{d.identifier}</span>
                                      <button onClick={() => setStagedDevices(prev => prev.filter(x => x.id !== d.id))}>
                                          <X className="w-4 h-4 text-zinc-400 hover:text-red-500 transition-colors" />
                                      </button>
                                  </div>
                              ))
                          )}
                      </div>
                      <div className="pt-4 mt-auto space-y-3">
                          <FormField
                              control={form.control}
                              name="modelId"
                              render={({ field }) => (
                                  <FormItem>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                              <SelectTrigger className="bg-muted/30 border-border font-bold">
                                                  <SelectValue placeholder="Assign Model to Batch..." />
                                              </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                              {models.map(m => (
                                                  <SelectItem key={m.id} value={m.id}>{m.brand} {m.name} ({m.assetType})</SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  </FormItem>
                              )}
                          />

                          {selectedModel?.assetType === 'SIM' && (
                              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                  <FormField
                                      control={form.control}
                                      name="carrier"
                                      render={({ field }) => (
                                      <FormItem>
                                          <FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Carrier</FormLabel>
                                          <FormControl>
                                              <Input placeholder="Digicel / Flow" className="bg-muted/30 border-border h-9 text-xs" {...field} />
                                          </FormControl>
                                      </FormItem>
                                      )}
                                  />
                                                                  <FormField
                                                                      control={form.control}
                                                                      name="planExpiryDate"
                                                                      render={({ field }) => (
                                                                      <FormItem className="flex flex-col">
                                                                          <FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Plan Expiry</FormLabel>
                                                                          <Popover>
                                                                              <PopoverTrigger asChild>
                                                                                  <FormControl>
                                                                                      <Button
                                                                                          variant={"outline"}
                                                                                          className={cn(
                                                                                              "w-full bg-muted/30 border-border pl-3 text-left font-normal h-9 text-xs",
                                                                                              !field.value && "text-muted-foreground"
                                                                                          )}
                                                                                      >
                                                                                          {field.value ? (
                                                                                              format(new Date(field.value), "PP")
                                                                                          ) : (
                                                                                              <span>Pick date</span>
                                                                                          )}
                                                                                          <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                                                                      </Button>
                                                                                  </FormControl>
                                                                              </PopoverTrigger>
                                                                              <PopoverContent className="w-auto p-0" align="start">
                                                                                  <Calendar
                                                                                      mode="single"
                                                                                      selected={field.value ? new Date(field.value) : undefined}
                                                                                      onSelect={(date) => field.onChange(date?.toISOString())}
                                                                                      initialFocus
                                                                                  />
                                                                              </PopoverContent>
                                                                          </Popover>
                                                                      </FormItem>
                                                                      )}
                                                                  />                              </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                              <FormField
                                  control={form.control}
                                  name="firmwareVersion"
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Firmware</FormLabel>
                                      <FormControl>
                                          <Input placeholder="e.g. v2.1.0" className="bg-muted/30 border-border h-9 text-xs" {...field} />
                                      </FormControl>
                                  </FormItem>
                                  )}
                              />
                              <FormField
                                  control={form.control}
                                  name="hardwareRevision"
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Hardware Rev</FormLabel>
                                      <FormControl>
                                          <Input placeholder="e.g. Rev B" className="bg-muted/30 border-border h-9 text-xs" {...field} />
                                      </FormControl>
                                  </FormItem>
                                  )}
                              />
                          </div>

                          <Button 
                              className="w-full font-bold h-12" 
                              disabled={stagedDevices.length === 0 || isProcessingImport || !selectedModelId}
                              onClick={processImport}
                          >
                              {isProcessingImport ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                              Commit {stagedDevices.length} Assets
                          </Button>
                      </div>
                  </div>
                </div>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isSingleEntryOpen} onOpenChange={setIsSingleEntryOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Single Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Manual Registration</DialogTitle>
                <DialogDescription>Add a single unique asset to the inventory.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Identifier (IMEI/SN)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter 15-digit IMEI or SN" className="bg-muted/30 border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="modelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/30 border-border">
                              <SelectValue placeholder="Select device model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.brand} {model.name} ({model.assetType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedModel?.assetType === 'SIM' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <FormField
                            control={form.control}
                            name="carrier"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Carrier</FormLabel>
                                <FormControl>
                                    <Input placeholder="Digicel / Flow" className="bg-muted/30 border-border" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="planExpiryDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan Expiry</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full bg-muted/30 border-border pl-3 text-left font-normal h-11",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(new Date(field.value), "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date?.toISOString())}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firmwareVersion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Firmware</FormLabel>
                          <FormControl>
                            <Input placeholder="v1.0.0" className="bg-muted/30 border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hardwareRevision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Revision</FormLabel>
                          <FormControl>
                            <Input placeholder="Rev A" className="bg-muted/30 border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 font-bold mt-2">
                    Complete Registration
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <Card className="lg:col-span-1 h-fit border-border shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Active Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Global Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="IMEI, Model, Brand..."
                  value={(table.getColumn("identifier")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("identifier")?.setFilterValue(event.target.value)
                  }
                  className="pl-8 border-border bg-muted/20"
                />
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status Quick-Filter</label>
                <Select
                    onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)}
                >
                    <SelectTrigger className="border-border bg-muted/20">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        <SelectItem value="IN_STOCK">In Stock</SelectItem>
                        <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                        <SelectItem value="TESTING">Testing</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Filtered View:</span>
                    <span className="font-bold text-foreground">{table.getFilteredRowModel().rows.length} / {devices.length}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table Area */}
        <Card className="lg:col-span-3 border-border shadow-md bg-card overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="h-12">
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
                                <p>No assets found matching the current search criteria.</p>
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination & Mass Actions */}
            <div className="p-4 border-t border-border bg-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                    {Object.keys(rowSelection).length > 0 && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                            <span className="font-bold text-primary">{Object.keys(rowSelection).length} selected</span>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="h-7 text-[10px] font-bold uppercase tracking-widest px-3"
                                onClick={() => setIsMassDeleteAlertOpen(true)}
                            >
                                <Trash2 className="w-3 h-3 mr-1.5" /> Purge Selection
                            </Button>
                        </div>
                    )}
                    <span className="text-zinc-500">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="border-border bg-card font-bold h-8"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="border-border bg-card font-bold h-8"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </Card>
      </div>

      {/* Modals & Dialogs */}
      <Dialog open={!!viewingDevice} onOpenChange={(open) => !open && setViewingDevice(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <Smartphone className="w-6 h-6 text-primary"/> Asset Profile
            </DialogTitle>
            <DialogDescription>Full lifecycle data and current status indicators.</DialogDescription>
          </DialogHeader>
          {viewingDevice && (
            <div className="space-y-6 py-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Record</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-mono font-bold text-foreground tracking-wider">{viewingDevice.identifier}</span>
                        </div>
                    </div>
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase border",
                        viewingDevice.status === 'IN_STOCK' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                        {viewingDevice.status.replace('_', ' ')}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card border border-border rounded-2xl">
                        <Package className="w-4 h-4 text-primary mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Model Name</span>
                        <span className="font-bold text-foreground">{viewingDevice.modelName}</span>
                    </div>
                    <div className="p-4 bg-card border border-border rounded-2xl">
                        <ShieldCheck className="w-4 h-4 text-primary mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Manufacturer</span>
                        <span className="font-bold text-foreground">{viewingDevice.brand}</span>
                    </div>
                </div>

                {(viewingDevice.firmwareVersion || viewingDevice.hardwareRevision) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Firmware</span>
                            <span className="font-bold text-foreground">{viewingDevice.firmwareVersion || 'N/A'}</span>
                        </div>
                        <div className="p-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Revision</span>
                            <span className="font-bold text-foreground">{viewingDevice.hardwareRevision || 'N/A'}</span>
                        </div>
                    </div>
                )}

                {viewingDevice.carrier && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                            <Wifi className="w-4 h-4 text-primary mb-2 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Carrier</span>
                            <span className="font-bold text-foreground">{viewingDevice.carrier}</span>
                        </div>
                        {viewingDevice.planExpiryDate && (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                <Bell className="w-4 h-4 text-amber-500 mb-2 opacity-50" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Plan Expiry</span>
                                <span className="font-bold text-foreground">{new Date(viewingDevice.planExpiryDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Event Timeline</h4>
                    <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <div className="flex-1 text-xs">
                                <span className="font-bold text-foreground">Last Recorded Update</span>
                                <p className="text-zinc-500">{new Date(viewingDevice.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-zinc-300" />
                            <div className="flex-1 text-xs">
                                <span className="font-bold text-foreground">Initial Ingestion</span>
                                <p className="text-zinc-500">{new Date(viewingDevice.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action is immutable. The asset will be purged from the core intelligence engine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMassDeleteAlertOpen} onOpenChange={setIsMassDeleteAlertOpen}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">Mass Asset Purge</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete **{Object.keys(rowSelection).length} assets**. This cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleMassDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
              Execute Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingDevice} onOpenChange={(open) => !open && setEditingDevice(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Asset Profile</DialogTitle>
            <DialogDescription>Modify core parameters for this inventory node.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset ID / IMEI</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-muted/30 border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/30 border-border">
                          <SelectValue placeholder="Select device model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.brand} {model.name} ({model.assetType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedEditModel?.assetType === 'SIM' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <FormField
                        control={editForm.control}
                        name="carrier"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Carrier</FormLabel>
                            <FormControl>
                                <Input placeholder="Digicel / Flow" className="bg-muted/30 border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={editForm.control}
                        name="planExpiryDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan Expiry</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full bg-muted/30 border-border pl-3 text-left font-normal h-11",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(new Date(field.value), "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => field.onChange(date?.toISOString())}
                                        disabled={(date) =>
                                            date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firmwareVersion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Firmware</FormLabel>
                      <FormControl>
                        <Input placeholder="v1.0.0" className="bg-muted/30 border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="hardwareRevision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Revision</FormLabel>
                      <FormControl>
                        <Input placeholder="Rev A" className="bg-muted/30 border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-11 font-bold mt-4">Save Profile Updates</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
