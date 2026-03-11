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
  ShieldCheck, 
  FileUp,
  Loader2,
  ArrowRight,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Wifi,
  Bell,
  Layers,
  Link,
  MoreHorizontal,
  Info,
  Fingerprint,
  Calendar as CalendarIcon
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

import { fetchDevices, createDevice, deleteDevice, fetchDeviceModels, updateDevice, refillStock, bulkUploadRelationships, fetchDeviceRelationships } from "@/lib/api"
import { Device, BulkUploadReport, RefillReport } from "@/types/devices"
import { DeviceModel } from "@/types/device-models"
import { cn, playBeep, sanitizeIMEI } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const formSchema = z.object({
  identifier: z.string().min(1, { message: "Identifier is required." }),
  modelId: z.string().min(1, { message: "Please select a model." }),
  carrier: z.string().optional(),
  activationDate: z.string().optional(),
  planExpiryDate: z.string().optional(),
  firmwareVersion: z.string().optional(),
  hardwareRevision: z.string().optional(),
  pairedDeviceId: z.string().optional(),
})

interface StagedDevice {
  identifier: string
  id: string
  pairedIdentifier?: string
}

export default function DevicesPage() {
  const mainForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      modelId: "",
      carrier: "",
      activationDate: "",
      planExpiryDate: "",
      firmwareVersion: "",
      hardwareRevision: "",
      pairedDeviceId: "",
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
      pairedDeviceId: "",
    },
  })

  const { toast } = useToast()
  const [devices, setDevices] = useState<Device[]>([])
  const [models, setModels] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isMassDeleteAlertOpen, setIsMassDeleteAlertOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [viewingDevice, setViewingDevice] = useState<Device | null>(null)
  const [relationships, setRelationships] = useState<any[]>([])
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [batchMode, setBatchMode] = useState<'INGEST' | 'LINK'>('INGEST')
  const [isSingleEntryOpen, setIsSingleEntryOpen] = useState(false)

  // Data Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  // Import Specific State
  const [stagedDevices, setStagedDevices] = useState<StagedDevice[]>([])
  const [stagedLinks, setStagedLinks] = useState<{ primaryIdentifier: string, linkedIdentifier: string, id: string }[]>([])
  const [isProcessingImport, setIsProcessingImport] = useState(false)
  const [manualIdentifier, setManualIdentifier] = useState("")

  // Link Tab State
  const [createMissing, setCreateMissing] = useState(false)
  const [defaultPrimaryModelId, setDefaultPrimaryModelId] = useState("")
  const [defaultLinkedModelId, setDefaultLinkedModelId] = useState("")
  const [uploadReport, setUploadReport] = useState<BulkUploadReport | null>(null)
  const [refillReport, setRefillReport] = useState<RefillReport | null>(null)

  const manualInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Form Watchers
  const selectedModelId = mainForm.watch("modelId");
  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId), [selectedModelId, models]);

  const editModelId = editForm.watch("modelId");
  const selectedEditModel = useMemo(() => models.find(m => m.id === editModelId), [editModelId, models]);

  const potentialPairingDevices = useMemo(() => {
    if (!selectedEditModel) return [];
    const type = selectedEditModel.assetType;
    let compatibleTypes: string[] = [];
    if (type === 'TRACKER') compatibleTypes = ['SIM', 'PANIC_BUTTON', 'FUEL_SENSOR'];
    else if (type === 'SIM') compatibleTypes = ['TRACKER', 'DASH_CAM'];
    else if (type === 'DASH_CAM') compatibleTypes = ['SIM', 'SD_CARD', 'TRACKER'];
    else if (type === 'SD_CARD') compatibleTypes = ['DASH_CAM'];
    else if (type === 'PANIC_BUTTON') compatibleTypes = ['TRACKER'];
    else if (type === 'FUEL_SENSOR') compatibleTypes = ['TRACKER'];
    else compatibleTypes = ['TRACKER', 'SIM', 'DASH_CAM'];
    return devices.filter(d => {
        const model = models.find(m => m.id === d.modelId);
        return model && compatibleTypes.includes(model.assetType) && d.id !== editingDevice?.id;
    });
  }, [selectedEditModel, devices, models, editingDevice]);

  // Effects
  useEffect(() => { loadData() }, [])

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
        pairedDeviceId: editingDevice.pairedDeviceId || "",
      })
    }
  }, [editingDevice, editForm])

  useEffect(() => {
    if (isImportModalOpen) {
      setTimeout(() => manualInputRef.current?.focus(), 150);
    } else {
      setStagedDevices([]);
      setStagedLinks([]);
      setManualIdentifier("");
      setCreateMissing(false);
      setDefaultPrimaryModelId("");
      setDefaultLinkedModelId("");
      setUploadReport(null);
      setRefillReport(null);
      mainForm.reset();
    }
  }, [isImportModalOpen, mainForm]);

  useEffect(() => {
    if (!isSingleEntryOpen) {
        mainForm.reset();
    }
  }, [isSingleEntryOpen, mainForm]);

  useEffect(() => {
    if (viewingDevice) {
        fetchDeviceRelationships(viewingDevice.id)
            .then(setRelationships)
            .catch(err => console.error("Failed to fetch relationships", err));
    } else {
        setRelationships([]);
    }
  }, [viewingDevice]);

  async function loadData() {
    try {
      const [fetchedDevices, fetchedModels] = await Promise.all([
        fetchDevices(),
        fetchDeviceModels(),
      ])
      setDevices(fetchedDevices)
      setModels(fetchedModels)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const addManualIdentifier = () => {
    const sanitized = sanitizeIMEI(manualIdentifier);
    if (!sanitized) return;
    if (stagedDevices.find(d => d.identifier === sanitized)) {
        toast({ title: "Duplicate", description: "This ID is already staged.", variant: "destructive" })
        setManualIdentifier("")
        setTimeout(() => manualInputRef.current?.focus(), 10);
        return
    }
    playBeep();
    setStagedDevices((prev) => [{ identifier: sanitized, id: crypto.randomUUID() }, ...prev])
    setManualIdentifier("")
    setTimeout(() => manualInputRef.current?.focus(), 10);
  }

  async function processImport() {
    if (stagedDevices.length === 0) return
    const sId = mainForm.getValues("modelId")
    if (!sId) {
      toast({ title: "Validation Error", description: "Select a model for the bulk batch.", variant: "destructive" })
      return
    }
    setIsProcessingImport(true)
    try {
      const values = mainForm.getValues();
      const report = await refillStock({
        modelId: sId,
        identifiers: stagedDevices.map(d => d.identifier),
        pairedIdentifiers: stagedDevices.map(d => d.pairedIdentifier || ""),
        carrier: values.carrier || undefined,
        activationDate: values.activationDate ? new Date(values.activationDate).toISOString() : undefined,
        planExpiryDate: values.planExpiryDate ? new Date(values.planExpiryDate).toISOString() : undefined,
        firmwareVersion: values.firmwareVersion || undefined,
        hardwareRevision: values.hardwareRevision || undefined,
      })
      setRefillReport(report);
      await loadData()
      setStagedDevices([])
      toast({ title: "Operation Complete", description: `Processed ${report.totalRows} identifiers. ${report.devicesCreated} created, ${report.rowsSkipped} skipped.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsProcessingImport(false)
    }
  }

  async function processLinkage() {
    if (stagedLinks.length === 0) return;
    setIsProcessingImport(true);
    try {
        const payload = {
            relationships: stagedLinks.map(l => ({
                primaryIdentifier: l.primaryIdentifier,
                linkedIdentifier: l.linkedIdentifier,
            })),
            createMissing,
            ...(createMissing && defaultPrimaryModelId ? { defaultPrimaryModelId } : {}),
            ...(createMissing && defaultLinkedModelId ? { defaultLinkedModelId } : {}),
        };
        const report = await bulkUploadRelationships(payload);
        setUploadReport(report);
        await loadData();
        setStagedLinks([]);
        toast({ title: "Bulk Upload Complete", description: `Created ${report.relationshipsCreated} relationships.` });
    } catch (err: any) {
        toast({ title: "Linkage Failed", description: err.message, variant: "destructive" });
    } finally {
        setIsProcessingImport(false);
    }
  }

  const onDropLinks = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: "binary" })
      const parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[]
      const newLinks = parsedData.map((row) => ({
          primaryIdentifier: String(row["tracker_imei"] || row["IMEI"] || row["identifier"] || "").trim(),
          linkedIdentifier: String(row["sim_iccid"] || row["ICCID"] || row["linked_identifier"] || "").trim(),
          id: crypto.randomUUID(),
      })).filter((l) => l.primaryIdentifier.length >= 3 && l.linkedIdentifier.length >= 3)
      setStagedLinks((prev) => [...newLinks, ...prev])
    }
    reader.readAsBinaryString(file)
  }

  const { getRootProps: getLinkDropProps, getInputProps: getLinkInputProps, isDragActive: isLinkDragActive } = useDropzone({
    onDrop: onDropLinks,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] },
    multiple: false,
  })

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: "binary" })
      const parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[]
      const newDevices = parsedData.map((row) => ({
          identifier: String(row.IMEI || row.identifier || row.imei || "").trim(),
          id: crypto.randomUUID(),
      })).filter((d) => d.identifier.length >= 3)
      setStagedDevices((prev) => [...newDevices, ...prev])
    }
    reader.readAsBinaryString(file)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] },
    multiple: false,
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = { ...values, pairedDeviceId: values.pairedDeviceId === "none" ? null : (values.pairedDeviceId || undefined) };
      const created = await createDevice(payload as any)
      setDevices((prev) => [created, ...prev])
      mainForm.reset()
      setIsSingleEntryOpen(false)
      toast({ title: "Registered", description: `Device ${values.identifier} registered.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  async function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (!editingDevice) return
    try {
      const payload = { ...values, pairedDeviceId: values.pairedDeviceId === "none" ? null : (values.pairedDeviceId || undefined) };
      const updated = await updateDevice(editingDevice.id, payload as any)
      setDevices((prev) => prev.map(d => d.id === updated.id ? updated : d))
      setEditingDevice(null)
      toast({ title: "Updated", description: "Device record updated." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteDevice(deleteId)
      setDevices((prev) => prev.filter((d) => d.id !== deleteId))
      toast({ title: "Deleted", description: "Asset removed." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setDeleteId(null)
    }
  }

  async function handleMassDelete() {
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id)
    try {
      for (const id of selectedIds) await deleteDevice(id)
      setDevices(prev => prev.filter(d => !selectedIds.includes(d.id)))
      setRowSelection({})
      setIsMassDeleteAlertOpen(false)
      toast({ title: "Mass Deletion", description: `Purged ${selectedIds.length} assets.` })
    } catch (err: any) {
      toast({ title: "Partial Success", description: "Some deletions failed.", variant: "destructive" })
    }
  }

  const columns: ColumnDef<Device>[] = [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />,
    },
    { accessorKey: "identifier", header: "Asset ID / IMEI", cell: ({ row }) => <div className="font-mono text-xs font-bold">{row.getValue("identifier")}</div> },
    { accessorKey: "assetType", header: "Type", cell: ({ row }) => <div className="text-[10px] font-bold text-zinc-400">{row.getValue("assetType")}</div> },
    { accessorKey: "modelName", header: "Hardware Model", cell: ({ row }) => <div className="font-medium">{row.getValue("modelName")}</div> },
    { accessorKey: "brand", header: "Manufacturer", cell: ({ row }) => <div className="text-zinc-500 text-xs">{row.getValue("brand")}</div> },
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
      accessorKey: "pairedDeviceId",
      header: "Linkage",
      cell: ({ row }) => {
        const pairedId = row.getValue("pairedDeviceId");
        return pairedId ? <Link className="w-3 h-3 text-primary" /> : <X className="w-3 h-3 text-zinc-300" />;
      },
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        if (filterValue === "paired") return !!value;
        if (filterValue === "unpaired") return !value;
        return true;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const device = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] bg-card border-border shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setViewingDevice(device)} className="cursor-pointer">
                  <Eye className="mr-2 h-3.5 w-3.5 text-primary" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingDevice(device)} className="cursor-pointer">
                  <Edit className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                  <span>Edit Details</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteId(device.id)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  <span>Delete Asset</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    state: { sorting, columnFilters, rowSelection },
    initialState: { pagination: { pageSize: 8 } },
  })

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
        <Skeleton className="h-[400px] w-full shadow-sm rounded-2xl" />
        <Skeleton className="lg:col-span-3 h-[600px] w-full shadow-sm rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" /> Asset Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">Real-time control over physical inventory nodes.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border hover:bg-muted/50 font-bold">
                <FileUp className="mr-2 h-4 w-4" /> Batch Operations
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[850px] bg-card border-border overflow-y-auto max-h-[90vh]">
              <DialogHeader className="pb-6 border-b border-border">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <FileUp className="h-6 w-6 text-primary" /> Bulk Asset Operation
                </DialogTitle>
                <DialogDescription>Upload an Excel/CSV file to batch register assets or establish relationships.</DialogDescription>
              </DialogHeader>

              <div className="py-6">
                <Tabs defaultValue="INGEST" onValueChange={(v) => setBatchMode(v as 'INGEST' | 'LINK')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="INGEST" className="font-bold text-xs uppercase tracking-widest"><Package className="mr-2 h-4 w-4" /> Ingest Assets</TabsTrigger>
                    <TabsTrigger value="LINK" className="font-bold text-xs uppercase tracking-widest"><Link className="mr-2 h-4 w-4" /> Link Devices</TabsTrigger>
                  </TabsList>

                  {/* === INGEST TAB === */}
                  <TabsContent value="INGEST">
                    <Form {...mainForm}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Step 1: Target Model</label>
                                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter bg-primary/10 text-primary border-none">Required</Badge>
                                </div>
                                <FormField control={mainForm.control} name="modelId" render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-muted/30 border-border font-bold h-12">
                                                    <SelectValue placeholder="Assign Model to this Operation..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {models.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.brand} {m.name} ({m.assetType})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />

                                {selectedModelId && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                        {selectedModel?.assetType === 'SIM' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField control={mainForm.control} name="carrier" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Carrier</FormLabel>
                                                        <FormControl><Input placeholder="Digicel / Flow" className="bg-muted/30 border-border h-9 text-xs" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={mainForm.control} name="planExpiryDate" render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Plan Expiry</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full bg-muted/30 border-border pl-3 text-left font-normal h-9 text-xs", !field.value && "text-muted-foreground")}>{field.value ? format(new Date(field.value), "PP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-3 w-3 opacity-50" /></Button></FormControl></PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date?.toISOString())} initialFocus /></PopoverContent>
                                                        </Popover>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField control={mainForm.control} name="firmwareVersion" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Firmware</FormLabel><FormControl><Input placeholder="e.g. v2.1.0" className="bg-muted/30 border-border h-9 text-xs" {...field} /></FormControl></FormItem>
                                            )} />
                                            <FormField control={mainForm.control} name="hardwareRevision" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-500">Hardware Rev</FormLabel><FormControl><Input placeholder="e.g. Rev B" className="bg-muted/30 border-border h-9 text-xs" {...field} /></FormControl></FormItem>
                                            )} />
                                        </div>

                                        <div className="pt-4 border-t border-border mt-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Step 2: Source File</label>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const ws = XLSX.utils.aoa_to_sheet([['IMEI']]);
                                                    const wb = XLSX.utils.book_new();
                                                    XLSX.utils.book_append_sheet(wb, ws, 'Devices');
                                                    XLSX.writeFile(wb, 'device_import_template.xlsx');
                                                  }}
                                                  className="text-[9px] text-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                                                >
                                                  Download Template
                                                </button>
                                            </div>

                                            <div {...getRootProps()} className={cn("border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer mb-4", isDragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-border hover:border-zinc-400 hover:bg-muted/30")}>
                                                <input {...getInputProps()} />
                                                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"><FileUp className="h-5 w-5 text-primary" /></div>
                                                <p className="text-xs font-bold text-foreground">Drop Excel/CSV here</p>
                                            </div>

                                            <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card px-2 text-zinc-500 font-bold">Or Hardware Scanner</span></div></div>
                                            <div className="flex gap-2">
                                                <Input ref={manualInputRef} placeholder="Rapid Scan IMEI..." value={manualIdentifier} onChange={(e) => setManualIdentifier(sanitizeIMEI(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && addManualIdentifier()} className="bg-muted/30 border-border font-mono text-xs focus:ring-2 focus:ring-primary/50" />
                                                <Button variant="outline" size="icon" onClick={addManualIdentifier} className="shrink-0 border-border" title="Add Manually"><Plus className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!selectedModelId && (
                                    <div className="h-48 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-muted/5 animate-in fade-in duration-500">
                                        <Layers className="w-8 h-8 text-zinc-300 mb-2" />
                                        <p className="text-xs text-zinc-500 font-medium">Please select a hardware model to unlock bulk processing features.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col h-[500px]">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    Staging Queue ({stagedDevices.length})
                                </h4>
                                {stagedDevices.length > 0 && (
                                    <button onClick={() => setStagedDevices([])} className="text-[10px] text-red-500 font-bold hover:underline">Clear Queue</button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 border border-border rounded-xl p-2 bg-muted/10">
                                {stagedDevices.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic text-xs gap-2"><Package className="h-8 w-8 opacity-20" /><span>No assets staged</span></div>
                                ) : (
                                    stagedDevices.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl group animate-in slide-in-from-right-2 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs font-bold text-foreground">{d.identifier}</span>
                                                <span className="text-[9px] text-zinc-400 uppercase font-black tracking-tighter">Creation Pending</span>
                                            </div>
                                            <button onClick={() => setStagedDevices(prev => prev.filter(x => x.id !== d.id))}><X className="w-4 h-4 text-zinc-400 hover:text-red-500 transition-colors" /></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-6">
                                <Button
                                    className="w-full font-bold h-14 text-lg shadow-xl shadow-primary/20"
                                    disabled={stagedDevices.length === 0 || isProcessingImport || !selectedModelId}
                                    onClick={processImport}
                                >
                                    {isProcessingImport ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                                    Authorize {stagedDevices.length} Assets
                                </Button>
                                <p className="text-[9px] text-zinc-400 text-center mt-3 uppercase font-bold tracking-widest italic">Action will be executed as an atomic system transaction</p>
                            </div>
                        </div>
                      </div>
                    </Form>
                  </TabsContent>

                  {/* === LINK TAB === */}
                  <TabsContent value="LINK">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Options</label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border border-border rounded-xl bg-muted/10">
                            <Checkbox
                              id="createMissing"
                              checked={createMissing}
                              onCheckedChange={(checked) => setCreateMissing(!!checked)}
                            />
                            <div className="grid gap-1">
                              <label htmlFor="createMissing" className="text-xs font-bold text-foreground cursor-pointer">Create missing devices</label>
                              <p className="text-[10px] text-zinc-500">Auto-create devices not found in system, then link them.</p>
                            </div>
                          </div>
                        </div>

                        {createMissing && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Default Models for New Devices</label>
                            <div className="space-y-3">
                              <div>
                                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Primary Device Model</label>
                                <Select value={defaultPrimaryModelId} onValueChange={setDefaultPrimaryModelId}>
                                  <SelectTrigger className="bg-muted/30 border-border font-bold h-10 text-xs">
                                    <SelectValue placeholder="Model for primary devices..." />
                                  </SelectTrigger>
                                  <SelectContent>{models.map(m => (<SelectItem key={m.id} value={m.id}>{m.brand} {m.name} ({m.assetType})</SelectItem>))}</SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Linked Device Model</label>
                                <Select value={defaultLinkedModelId} onValueChange={setDefaultLinkedModelId}>
                                  <SelectTrigger className="bg-muted/30 border-border font-bold h-10 text-xs">
                                    <SelectValue placeholder="Model for linked devices..." />
                                  </SelectTrigger>
                                  <SelectContent>{models.map(m => (<SelectItem key={m.id} value={m.id}>{m.brand} {m.name} ({m.assetType})</SelectItem>))}</SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Source File</label>
                          <div {...getLinkDropProps()} className={cn("border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer", isLinkDragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-border hover:border-zinc-400 hover:bg-muted/30")}>
                            <input {...getLinkInputProps()} />
                            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"><Link className="h-5 w-5 text-primary" /></div>
                            <p className="text-xs font-bold text-foreground">Drop Relationship File</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Relationship Queue ({stagedLinks.length})</h4>
                          {stagedLinks.length > 0 && (<button onClick={() => setStagedLinks([])} className="text-[10px] text-red-500 font-bold hover:underline">Clear Queue</button>)}
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 border border-border rounded-xl p-2 bg-muted/10">
                          {stagedLinks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic text-xs gap-2"><Link className="h-8 w-8 opacity-20" /><span>No relationships staged</span></div>
                          ) : (
                            stagedLinks.map((l) => (
                              <div key={l.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl group animate-in slide-in-from-right-2 shadow-sm">
                                <div className="flex flex-col"><div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-foreground">{l.primaryIdentifier}</span><ArrowRight className="w-3 h-3 text-primary" /><span className="font-mono text-xs font-bold text-primary">{l.linkedIdentifier}</span></div></div>
                                <button onClick={() => setStagedLinks(prev => prev.filter(x => x.id !== l.id))}><X className="w-4 h-4 text-zinc-400 hover:text-red-500 transition-colors" /></button>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="pt-6">
                          <Button className="w-full font-bold h-14 text-lg shadow-xl shadow-primary/10" disabled={stagedLinks.length === 0 || isProcessingImport || (createMissing && (!defaultPrimaryModelId || !defaultLinkedModelId))} onClick={processLinkage}>
                            {isProcessingImport ? <Loader2 className="animate-spin mr-2" /> : <Link className="mr-2" />} Link {stagedLinks.length} Pairs
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isSingleEntryOpen} onOpenChange={setIsSingleEntryOpen}>
            <DialogTrigger asChild><Button className="font-bold shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> Single Entry</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border overflow-y-auto max-h-[90vh]">
              <DialogHeader className="pb-4 border-b border-border">
                <DialogTitle className="text-xl font-bold">Manual Registration</DialogTitle>
                <DialogDescription>Register a single unique asset in the system ledger.</DialogDescription>
              </DialogHeader>
              <Form {...mainForm}>
                <form onSubmit={mainForm.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <FormField control={mainForm.control} name="identifier" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Identifier (IMEI/SN)</FormLabel>
                        <FormControl><Input placeholder="Enter IMEI or SN" className="bg-muted/30 border-border h-11" {...field} onChange={(e) => { const sanitized = sanitizeIMEI(e.target.value); field.onChange(sanitized); }} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={mainForm.control} name="modelId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl><SelectTrigger className="bg-muted/30 border-border h-11"><SelectValue placeholder="Select device model" /></SelectTrigger></FormControl>
                          <SelectContent>{models.map((model) => (<SelectItem key={model.id} value={model.id}>{model.brand} {model.name} ({model.assetType})</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />

                  {selectedModel?.assetType === 'SIM' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 border-t border-border pt-6">
                        <FormField control={mainForm.control} name="carrier" render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Carrier</FormLabel><FormControl><Input placeholder="Digicel / Flow" className="bg-muted/30 border-border h-11" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        <FormField control={mainForm.control} name="planExpiryDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan Expiry</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full bg-muted/30 border-border pl-3 text-left font-normal h-11", !field.value && "text-muted-foreground")}>{field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date?.toISOString())} disabled={(date) => date < new Date("1900-01-01")} initialFocus /></PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                    <FormField control={mainForm.control} name="firmwareVersion" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Firmware</FormLabel><FormControl><Input placeholder="v1.0.0" className="bg-muted/30 border-border h-11" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    <FormField control={mainForm.control} name="hardwareRevision" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Revision</FormLabel><FormControl><Input placeholder="Rev A" className="bg-muted/30 border-border h-11" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                  </div>

                  <div className="pt-6 border-t border-border">
                    <Button type="submit" className="w-full h-14 font-bold text-lg shadow-xl shadow-primary/10">Complete Registration</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 h-fit border-border shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> Active Filters</CardTitle>
            <button onClick={() => table.resetColumnFilters()} className="text-[10px] font-bold uppercase text-zinc-400 hover:text-primary">Clear All</button>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Global Search</label>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" /><Input ref={searchInputRef} placeholder="IMEI, SN, Identifier..." value={(table.getColumn("identifier")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("identifier")?.setFilterValue(sanitizeIMEI(event.target.value))} className="pl-8 border-border bg-muted/20" /></div>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Model</label><Select value={(table.getColumn("modelName")?.getFilterValue() as string) ?? "all"} onValueChange={(value) => table.getColumn("modelName")?.setFilterValue(value === "all" ? "" : value)}><SelectTrigger className="border-border bg-muted/20"><SelectValue placeholder="All Models" /></SelectTrigger><SelectContent><SelectItem value="all">All Models</SelectItem>{Array.from(new Set(devices.map(d => d.modelName))).sort().map(name => (<SelectItem key={name} value={name || ""}>{name}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Category</label><Select value={(table.getColumn("assetType")?.getFilterValue() as string) ?? "all"} onValueChange={(value) => table.getColumn("assetType")?.setFilterValue(value === "all" ? "" : value)}><SelectTrigger className="border-border bg-muted/20"><SelectValue placeholder="All Types" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{Array.from(new Set(devices.map(d => d.assetType))).sort().map(type => (<SelectItem key={type} value={type || ""}>{type}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status Quick-Filter</label>
                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)}>
                    <SelectTrigger className="border-border bg-muted/20"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All States</SelectItem><SelectItem value="IN_STOCK">In Stock</SelectItem><SelectItem value="DISPATCHED">Dispatched</SelectItem><SelectItem value="DAMAGED">Damaged</SelectItem><SelectItem value="TESTING">Testing</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Linkage State</label>
                <Select value={(table.getColumn("pairedDeviceId")?.getFilterValue() as string) ?? "all"} onValueChange={(value) => table.getColumn("pairedDeviceId")?.setFilterValue(value === "all" ? "" : value)}>
                    <SelectTrigger className="border-border bg-muted/20"><SelectValue placeholder="Link status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      <SelectItem value="paired">Linked Only</SelectItem>
                      <SelectItem value="unpaired">Unlinked Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="pt-4 border-t border-border flex justify-between items-center text-xs"><span className="text-zinc-500">Filtered View:</span><span className="font-bold text-foreground">{table.getFilteredRowModel().rows.length} / {devices.length}</span></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border shadow-md bg-card overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id} className="hover:bg-transparent border-none">{headerGroup.headers.map((header) => (<TableHead key={header.id} className="h-12">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                    <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-border/40 hover:bg-muted/30 transition-colors">{row.getVisibleCells().map((cell) => (<TableCell key={cell.id} className="py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))
                    ) : (<TableRow><TableCell colSpan={columns.length} className="h-64 text-center"><div className="flex flex-col items-center gap-3 opacity-40 italic text-zinc-500"><Package className="h-12 w-12" /><p>No assets found matching the current search criteria.</p></div></TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
            <div className="p-4 border-t border-border bg-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                    {Object.keys(rowSelection).length > 0 && (<div className="flex items-center gap-2 animate-in slide-in-from-left-2"><span className="font-bold text-primary">{Object.keys(rowSelection).length} selected</span><Button variant="destructive" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest px-3" onClick={() => setIsMassDeleteAlertOpen(true)}><Trash2 className="w-3 h-3 mr-1.5" /> Purge Selection</Button></div>)}
                    <span className="text-zinc-500">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="border-border bg-card font-bold h-8">Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="border-border bg-card font-bold h-8">Next</Button>
                </div>
            </div>
        </Card>
      </div>

      <Dialog open={!!viewingDevice} onOpenChange={(open) => !open && setViewingDevice(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border overflow-y-auto max-h-[90vh]">
          <DialogHeader className="pb-6 border-b border-border"><DialogTitle className="flex items-center gap-2 text-2xl font-bold"><Smartphone className="w-6 h-6 text-primary"/> Asset Profile</DialogTitle></DialogHeader>
          {viewingDevice && (
            <div className="space-y-6 py-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl">
                    <div className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Record</span><div className="flex items-center gap-2"><span className="text-lg font-mono font-bold text-foreground tracking-wider">{viewingDevice.identifier}</span></div></div>
                    <Badge>{viewingDevice.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card border border-border rounded-2xl"><Package className="w-4 h-4 text-primary mb-2 opacity-50" /><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Model Name</span><span className="font-bold text-foreground">{viewingDevice.modelName}</span></div>
                    <div className="p-4 bg-card border border-border rounded-2xl"><ShieldCheck className="w-4 h-4 text-primary mb-2 opacity-50" /><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Manufacturer</span><span className="font-bold text-foreground">{viewingDevice.brand}</span></div>
                </div>
                {relationships.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Physical Associations</h4>
                        <div className="grid grid-cols-1 gap-2">{relationships.map((rel) => (<div key={rel.id} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-xl"><div className="flex flex-col"><span className="font-mono text-xs font-bold text-foreground">{rel.identifier}</span><span className="text-[9px] text-primary uppercase font-black tracking-tighter">{rel.modelName}</span></div><Link className="w-3 h-3 text-primary opacity-40" /></div>))}</div>
                    </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDevice} onOpenChange={(open) => !open && setEditingDevice(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader className="pb-6 border-b border-border"><DialogTitle className="text-2xl font-bold flex items-center gap-2"><Edit className="w-6 h-6 text-primary" /> Edit Asset Profile</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-6">
              <FormField control={editForm.control} name="identifier" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset ID / IMEI</FormLabel><FormControl><Input {...field} className="bg-muted/30 border-border h-11" onChange={(e) => { const sanitized = sanitizeIMEI(e.target.value); field.onChange(sanitized); }} /></FormControl></FormItem>
                )} />
              <FormField control={editForm.control} name="modelId" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Model</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}><FormControl><SelectTrigger className="bg-muted/30 border-border h-11"><SelectValue placeholder="Select device model" /></SelectTrigger></FormControl><SelectContent>{models.map((model) => (<SelectItem key={model.id} value={model.id}>{model.brand} {model.name} ({model.assetType})</SelectItem>))}</SelectContent></Select></FormItem>
                )} />
              <Button type="submit" className="w-full h-14 font-bold text-lg shadow-xl shadow-primary/10">Save Profile Updates</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!uploadReport || !!refillReport} onOpenChange={() => { setUploadReport(null); setRefillReport(null); }}>
        <AlertDialogContent className="bg-card border-border rounded-2xl shadow-2xl border-primary/20">
          <AlertDialogHeader><AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> Bulk Processing Report</AlertDialogTitle></AlertDialogHeader>
          {(uploadReport || refillReport) && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-border"><p className="text-2xl font-black text-foreground">{(uploadReport || refillReport)?.totalRows}</p><p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Total Rows</p></div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-2xl font-black text-emerald-600">{(uploadReport?.relationshipsCreated || 0) + (uploadReport?.devicesCreated || 0) + (refillReport?.devicesCreated || 0)}</p><p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest">Success</p></div>
              </div>
              {(uploadReport || refillReport)?.errors && (uploadReport || refillReport)!.errors.length > 0 && (
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-red-500">Processing Exceptions ({(uploadReport || refillReport)?.errors.length})</label><ScrollArea className="h-32 w-full rounded-xl border border-red-500/20 bg-red-500/5 p-3"><div className="space-y-2">{(uploadReport || refillReport)?.errors.map((err, i) => (<div key={i} className="text-[10px] text-red-600 font-medium flex items-start gap-2 leading-tight"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5 opacity-70" /><span>{err}</span></div>))}</div></ScrollArea></div>
              )}
            </div>
          )}
          <AlertDialogFooter><AlertDialogAction className="w-full font-bold h-11 rounded-xl">Dismiss Report</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl"><AlertDialogHeader><AlertDialogTitle className="text-xl font-bold">Confirm Deletion</AlertDialogTitle><AlertDialogDescription>This action is immutable.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">Confirm Purge</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMassDeleteAlertOpen} onOpenChange={setIsMassDeleteAlertOpen}>
        <AlertDialogContent className="bg-card border-border rounded-2xl"><AlertDialogHeader><AlertDialogTitle className="text-xl font-bold text-red-600">Mass Asset Purge</AlertDialogTitle><AlertDialogDescription>You are about to permanently delete **{Object.keys(rowSelection).length} assets**.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold">Abort</AlertDialogCancel><AlertDialogAction onClick={handleMassDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">Execute Purge</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
