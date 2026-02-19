"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Package, Trash2, Search, Filter, Edit, Eye, Smartphone, Hash, ShieldCheck, History } from "lucide-react"

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
} from "@/components/ui/dialog"
import { fetchDevices, createDevice, deleteDevice, fetchDeviceModels, updateDevice } from "@/lib/api"
import { Device } from "@/types/devices"
import { DeviceModel } from "@/types/device-models"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  imei: z.string().min(15, { message: "IMEI must be at least 15 digits." }),
  serialNumber: z.string().optional(),
  modelId: z.string().min(1, { message: "Please select a model." }),
})

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [models, setModels] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Modal states
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [viewingDevice, setViewingDevice] = useState<Device | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imei: "",
      serialNumber: "",
      modelId: "",
    },
  })

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [devicesData, modelsData] = await Promise.all([
          fetchDevices(),
          fetchDeviceModels(),
        ])
        setDevices(devicesData)
        setModels(modelsData)
      } catch (err: any) {
        toast({
          title: "Error",
          description: "Failed to load data.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toast])

  useEffect(() => {
    if (editingDevice) {
      editForm.reset({
        imei: editingDevice.imei,
        serialNumber: editingDevice.serialNumber || "",
        modelId: editingDevice.modelId,
      })
    }
  }, [editingDevice, editForm])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const created = await createDevice(values as any)
      setDevices((prev) => [created, ...prev])
      form.reset()
      toast({
        title: "Registered",
        description: `Device ${values.imei} registered successfully.`
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
      const updated = await updateDevice(editingDevice.id, values as any)
      setDevices((prev) => prev.map(d => d.id === updated.id ? updated : d))
      setEditingDevice(null)
      toast({
        title: "Updated",
        description: "Device information updated."
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
        description: "Device removed from inventory."
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

  const filteredDevices = devices.filter(d => 
    d.imei.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center animate-pulse">Loading devices...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
        <p className="text-muted-foreground">Monitor and manage individual physical assets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Add New Device</CardTitle>
            <CardDescription>Register a new unit into inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {models.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.brand} {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imei"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMEI</FormLabel>
                      <FormControl>
                        <Input placeholder="15-digit identifier" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Manufacturer serial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Register Device</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IMEI or Serial..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No units found.</TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono text-xs">{device.imei}</TableCell>
                      <TableCell>{(device as any).modelName || 'Unknown Model'}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          device.status === 'IN_STOCK' ? "bg-emerald-50 text-emerald-700" :
                          device.status === 'DISPATCHED' ? "bg-blue-50 text-blue-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {device.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewingDevice(device)}>
                            <Eye className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingDevice(device)}>
                            <Edit className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(device.id)}>
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* View Detail Dialog */}
      <Dialog open={!!viewingDevice} onOpenChange={(open) => !open && setViewingDevice(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600"/> Asset Intelligence
            </DialogTitle>
            <DialogDescription>Individual unit history and metadata.</DialogDescription>
          </DialogHeader>
          {viewingDevice && (
            <div className="space-y-6 py-4">
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl text-white">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status</span>
                        <span className="text-lg font-bold text-emerald-400">{viewingDevice.status.replace('_', ' ')}</span>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-slate-700" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Hash className="w-3 h-3"/> IMEI</span>
                        <span className="text-sm font-mono">{viewingDevice.imei}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Hash className="w-3 h-3"/> Serial</span>
                        <span className="text-sm font-mono">{viewingDevice.serialNumber || 'N/A'}</span>
                    </div>
                </div>

                <div className="p-4 border rounded-xl bg-muted/50 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Model Definition</span>
                        <span className="font-bold text-foreground">{(viewingDevice as any).modelName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Manufacturer</span>
                        <span className="font-bold text-foreground">{(viewingDevice as any).brand}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-3 h-3"/> Lifecycle
                    </h4>
                    <div className="text-xs text-slate-500 space-y-1">
                        <p>Registered on: {new Date(viewingDevice.createdAt).toLocaleString()}</p>
                        <p>Last activity: {new Date(viewingDevice.updatedAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the unit with this IMEI from active inventory. This action is permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDevice} onOpenChange={(open) => !open && setEditingDevice(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update serial number or assigned model.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.brand} {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="imei"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMEI</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2">Save Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}



