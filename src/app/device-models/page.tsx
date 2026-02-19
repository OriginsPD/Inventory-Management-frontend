"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Package, Trash2, Edit, Eye, Calendar, Tag, Info } from "lucide-react"

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
import { fetchDeviceModels, createDeviceModel, deleteDeviceModel, updateDeviceModel } from "@/lib/api"
import { DeviceModel } from "@/types/device-models"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Model name must be at least 2 characters.",
  }),
  brand: z.string().min(2, {
    message: "Brand must be at least 2 characters.",
  }),
  category: z.string().optional(),
})

export default function DeviceModelsPage() {
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Modal States
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null)
  const [viewingModel, setViewingModel] = useState<DeviceModel | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "",
    },
  })

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
      })
    }
  }, [editingModel, editForm])

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
      const created = await createDeviceModel(values)
      setDeviceModels((prev) => [...prev, created])
      form.reset()
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
      const updated = await updateDeviceModel(editingModel.id, values)
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

  if (loading) return <div className="p-8 text-center">Loading device models...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Models</h1>
          <p className="text-muted-foreground">
            Manage the types of devices available in your inventory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Add New Model
            </CardTitle>
            <CardDescription>Create a new device model definition.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name</FormLabel>
                      <FormControl>
                        <Input placeholder="iPhone 15 Pro" {...field} />
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
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="Apple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Smartphone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Create Model
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" /> Existing Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviceModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      No models found.
                    </TableCell>
                  </TableRow>
                ) : (
                  deviceModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium text-foreground">{model.name}</TableCell>
                      <TableCell>{model.brand}</TableCell>
                      <TableCell className="hidden md:table-cell">{model.category || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingModel(model)}
                            className="text-slate-400 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingModel(model)}
                            className="text-slate-400 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(model.id)}
                            className="text-slate-400 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* View Detail Modal */}
      <Dialog open={!!viewingModel} onOpenChange={(open) => !open && setViewingModel(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600"/> Model Details
            </DialogTitle>
            <DialogDescription>Full technical specification for this device type.</DialogDescription>
          </DialogHeader>
          {viewingModel && (
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Brand</span>
                        <span className="font-semibold text-foreground">{viewingModel.brand}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Model</span>
                        <span className="font-semibold text-foreground">{viewingModel.name}</span>
                    </div>
                </div>
                <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Category</span>
                        <span className="text-sm">{viewingModel.category || 'General'}</span>
                    </div>
                    <Tag className="w-4 h-4 text-slate-400"/>
                </div>
                <div className="p-3 border border-border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3"/> Created: {new Date(viewingModel.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3"/> Last Updated: {new Date(viewingModel.updatedAt).toLocaleString()}
                    </div>
                </div>
                <div className="text-[10px] text-slate-300 break-all font-mono">
                    UUID: {viewingModel.id}
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the device model.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Model
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>Make changes to the device model here.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Category</FormLabel>
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



