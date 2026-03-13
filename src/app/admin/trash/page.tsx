"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import {
  fetchTrashedDevices, restoreDevice, hardDeleteDevice,
  fetchTrashedCustomers, restoreCustomer, hardDeleteCustomer,
  fetchTrashedDeviceModels, restoreDeviceModel, hardDeleteDeviceModel,
} from "@/lib/api"
import { Device } from "@/types/devices"
import { Customer } from "@/types/customers"
import { DeviceModel } from "@/types/device-models"
import { Trash2, RotateCcw, Package, Users, Layers, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export default function TrashPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [trashedDevices, setTrashedDevices] = useState<Device[]>([])
  const [trashedCustomers, setTrashedCustomers] = useState<Customer[]>([])
  const [trashedModels, setTrashedModels] = useState<DeviceModel[]>([])

  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; label: string; type: 'device' | 'customer' | 'model' } | null>(null)

  useEffect(() => {
    if (!isPending && (session?.user as any)?.role !== 'SUPERADMIN') {
      router.replace('/dashboard')
    }
  }, [session, isPending, router])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [devices, customers, models] = await Promise.all([
        fetchTrashedDevices(),
        fetchTrashedCustomers(),
        fetchTrashedDeviceModels(),
      ])
      setTrashedDevices(devices)
      setTrashedCustomers(customers)
      setTrashedModels(models)
    } catch {
      toast({ title: "Error", description: "Could not load trash data.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!isPending && (session?.user as any)?.role === 'SUPERADMIN') {
      loadAll()
    }
  }, [session, isPending, loadAll])

  async function handleRestore(id: string, type: 'device' | 'customer' | 'model', label: string) {
    setActionId(id)
    try {
      if (type === 'device') {
        await restoreDevice(id)
        setTrashedDevices(prev => prev.filter(d => d.id !== id))
      } else if (type === 'customer') {
        await restoreCustomer(id)
        setTrashedCustomers(prev => prev.filter(c => c.id !== id))
      } else {
        await restoreDeviceModel(id)
        setTrashedModels(prev => prev.filter(m => m.id !== id))
      }
      toast({ title: "Restored", description: `"${label}" has been restored successfully.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to restore.", variant: "destructive" })
    } finally {
      setActionId(null)
    }
  }

  async function handleHardDelete() {
    if (!confirmTarget) return
    const { id, label, type } = confirmTarget
    setActionId(id)
    setConfirmTarget(null)
    try {
      if (type === 'device') {
        await hardDeleteDevice(id)
        setTrashedDevices(prev => prev.filter(d => d.id !== id))
      } else if (type === 'customer') {
        await hardDeleteCustomer(id)
        setTrashedCustomers(prev => prev.filter(c => c.id !== id))
      } else {
        await hardDeleteDeviceModel(id)
        setTrashedModels(prev => prev.filter(m => m.id !== id))
      }
      toast({ title: "Permanently Deleted", description: `"${label}" has been permanently removed.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete.", variant: "destructive" })
    } finally {
      setActionId(null)
    }
  }

  const EmptyState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center gap-3 py-16 text-zinc-400">
      <Trash2 className="h-10 w-10 opacity-30" />
      <p className="text-sm italic">No deleted {label} found.</p>
    </div>
  )

  const RowActions = ({ id, label, type }: { id: string; label: string; type: 'device' | 'customer' | 'model' }) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        disabled={actionId === id}
        onClick={() => handleRestore(id, type, label)}
      >
        <RotateCcw className="h-3 w-3 mr-1" /> Restore
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        disabled={actionId === id}
        onClick={() => setConfirmTarget({ id, label, type })}
      >
        <Trash2 className="h-3 w-3 mr-1" /> Delete Forever
      </Button>
    </div>
  )

  if (isPending || loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
      <Card className="border-border">
        <div className="p-0">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Trash2 className="h-8 w-8 text-primary" /> Trash & Restore
        </h1>
        <p className="text-muted-foreground text-zinc-500">
          View soft-deleted records. Restore items or permanently remove them.
        </p>
      </div>

      <Tabs defaultValue="devices">
        <TabsList className="mb-4">
          <TabsTrigger value="devices" className="flex items-center gap-1.5 text-xs font-bold">
            <Package className="h-3.5 w-3.5" /> Devices ({trashedDevices.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-1.5 text-xs font-bold">
            <Users className="h-3.5 w-3.5" /> Customers ({trashedCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-1.5 text-xs font-bold">
            <Layers className="h-3.5 w-3.5" /> Device Models ({trashedModels.length})
          </TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <Card className="border border-border shadow-md overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Deleted Devices
              </CardTitle>
            </CardHeader>
            {trashedDevices.length === 0 ? (
              <EmptyState label="devices" />
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Identifier</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Model</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Deleted</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trashedDevices.map((device) => (
                      <TableRow key={device.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs font-bold">{device.identifier}</TableCell>
                        <TableCell className="text-xs text-zinc-600">{device.modelName ?? '—'}</TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black uppercase bg-muted px-2 py-0.5 rounded text-zinc-600">
                            {device.assetType ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">
                          {device.deletedAt ? new Date(device.deletedAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <RowActions id={device.id} label={device.identifier} type="device" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card className="border border-border shadow-md overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Deleted Customers
              </CardTitle>
            </CardHeader>
            {trashedCustomers.length === 0 ? (
              <EmptyState label="customers" />
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Phone</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Deleted</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trashedCustomers.map((customer) => (
                      <TableRow key={customer.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-sm">{customer.name}</TableCell>
                        <TableCell className="text-xs text-zinc-500">{customer.phone ?? customer.email ?? '—'}</TableCell>
                        <TableCell className="text-xs text-zinc-400">
                          {customer.deletedAt ? new Date(customer.deletedAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <RowActions id={customer.id} label={customer.name} type="customer" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Device Models Tab */}
        <TabsContent value="models">
          <Card className="border border-border shadow-md overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Deleted Device Models
              </CardTitle>
            </CardHeader>
            {trashedModels.length === 0 ? (
              <EmptyState label="device models" />
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Model Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Type</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Deleted</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trashedModels.map((model) => (
                      <TableRow key={model.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-sm">{model.name}</TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black uppercase bg-muted px-2 py-0.5 rounded text-zinc-600">
                            {model.assetType}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">
                          {model.deletedAt ? new Date(model.deletedAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <RowActions id={model.id} label={model.name} type="model" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Permanently Delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{confirmTarget?.label}"</strong> from the database.
              This action <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
