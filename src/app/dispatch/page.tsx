"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Send, History, CheckCircle2, X, Package, FileText, Plus, Search, Calendar, MessageSquare, HardHat, Globe } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchDevices, fetchCustomers, createDispatch } from "@/lib/api"
import { Device } from "@/types/devices"
import { Customer } from "@/types/customers"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn, playBeep, sanitizeIMEI } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  deviceIds: z.array(z.string()).min(1, { message: "Select at least one asset." }),
  customerId: z.string().min(1, { message: "Please select a customer." }),
  location: z.string().min(2, { message: "Location is required." }),
  subscriptionType: z.enum(["B2C", "B2B"]).optional(),
  subscriptionPlan: z.string().optional(),
  technicianAssigned: z.string().optional(),
  sourcePortal: z.string().optional(),
  targetPortal: z.string().optional(),
  installationDate: z.string().optional(),
  signOffPath: z.string().optional(),
  notes: z.string().optional(),
})

export default function DispatchPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [assetSearchTerm, setAssetSearchTerm] = useState("")
  const [hardwareScanValue, setHardwareScanValue] = useState("")
  const hardwareInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceIds: [],
      customerId: "",
      location: "",
      subscriptionType: undefined,
      subscriptionPlan: "",
      technicianAssigned: "",
      sourcePortal: "",
      targetPortal: "",
      installationDate: "",
      signOffPath: "",
      notes: "",
    },
  })

  const selectedDeviceIds = form.watch("deviceIds")

  useEffect(() => {
    async function loadData() {
      try {
        const [devicesData, customersData] = await Promise.all([
          fetchDevices(),
          fetchCustomers(),
        ])
        setDevices(devicesData.filter(d => d.status === 'IN_STOCK'))
        setCustomers(customersData)
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load dispatch data.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toast])

  const filteredAvailableDevices = useMemo(() => {
    return devices.filter(d => 
        !selectedDeviceIds.includes(d.id) && 
        d.identifier.toLowerCase().includes(assetSearchTerm.toLowerCase())
    ).slice(0, 50)
  }, [devices, selectedDeviceIds, assetSearchTerm])

  const toggleDevice = (id: string) => {
    const current = form.getValues("deviceIds")
    if (current.includes(id)) {
      form.setValue("deviceIds", current.filter(x => x !== id))
    } else {
      form.setValue("deviceIds", [...current, id])
    }
    setAssetSearchTerm("") // Clear search after selection
  }

  const handleHardwareScan = () => {
    const sanitized = sanitizeIMEI(hardwareScanValue);
    if (!sanitized) return;

    const device = devices.find(d => d.identifier.toLowerCase() === sanitized.toLowerCase())
    
    if (device) {
        if (selectedDeviceIds.includes(device.id)) {
            toast({ title: "Already Added", description: `Asset ${device.identifier} is already in the bundle.` })
        } else {
            playBeep()
            toggleDevice(device.id)
            toast({ 
                title: "Asset Added", 
                description: `Successfully added ${device.identifier} to bundle.`,
                className: "bg-primary text-primary-foreground font-bold" 
            })
        }
    } else {
        toast({ title: "Not Found", description: `Asset ${sanitized} not found in stock.`, variant: "destructive" })
    }
    setHardwareScanValue("")
    setTimeout(() => hardwareInputRef.current?.focus(), 10)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createDispatch({
          ...values,
          dispatchDate: new Date().toISOString(),
          installationDate: values.installationDate ? new Date(values.installationDate).toISOString() : undefined,
          dispatchedBy: session?.user.name || "System User",
      } as any)
      toast({ title: "Bundle Dispatched", description: `${values.deviceIds.length} assets have been successfully assigned.` })
      router.push("/dispatch/history")
    } catch (err: any) {
      toast({ title: "Dispatch Failed", description: err.message, variant: "destructive" })
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-4 w-[450px]" />
            </div>
            <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 h-[500px] w-full rounded-2xl" />
            <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Asset Bundling & Dispatch</h1>
          <p className="text-muted-foreground mt-1 text-lg">Group Trackers, SIMs, and Peripherals for customer delivery.</p>
        </div>
        <Button variant="outline" className="border-zinc-700" onClick={() => router.push('/dispatch/history')}>
          <History className="w-4 h-4 mr-2" /> Audit History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border shadow-md bg-card overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-zinc-500" /> Dispatch configuration
                </CardTitle>
                <CardDescription>Assemble the bundle and specify destination.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recipient Customer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 border-border bg-muted/10">
                                        <SelectValue placeholder="Search destination customer..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.name}
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
                                name="location"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Destination Branch / Facility</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g. Kingston HQ, Montego Bay Office" className="h-12 border-border bg-muted/10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="subscriptionType"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Subscription Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 border-border bg-muted/10">
                                            <SelectValue placeholder="B2C / B2B..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="B2C">B2C — Business to Consumer</SelectItem>
                                            <SelectItem value="B2B">B2B — Business to Business</SelectItem>
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subscriptionPlan"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sub Type / Plan</FormLabel>
                                        <FormControl>
                                        <Input placeholder="e.g. WGPS, Standard..." className="h-12 border-border bg-muted/10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="technicianAssigned"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                                            <HardHat className="w-3 h-3" /> Technician Assigned
                                        </FormLabel>
                                        <FormControl>
                                        <Input placeholder="Technician name..." className="h-12 border-border bg-muted/10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="installationDate"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Installation Date
                                        </FormLabel>
                                        <FormControl>
                                        <Input type="date" className="h-12 border-border bg-muted/10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="sourcePortal"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> Existing Portal
                                        </FormLabel>
                                        <FormControl>
                                        <Input placeholder="Current tracking portal..." className="h-12 border-border bg-muted/10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="targetPortal"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> Move To Portal
                                        </FormLabel>
                                        <FormControl>
                                        <Input placeholder="Target tracking portal..." className="h-12 border-border bg-muted/10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <FileText className="w-3 h-3"/> Digital Sign-off Proof
                                </FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="signOffPath"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                            <Input placeholder="Reference Number..." className="h-12 border-border bg-muted/10" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">Enter the physical sheet serial number.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <div className="relative group">
                                        <div className="h-12 border-2 border-dashed border-border rounded-md flex items-center justify-center bg-muted/5 group-hover:border-zinc-500 transition-colors px-4">
                                            <FileText className="w-4 h-4 text-zinc-500 mr-2" />
                                            <span className="text-xs text-zinc-500 font-medium truncate">
                                                Upload PDF Sign-off...
                                            </span>
                                            <input 
                                                type="file" 
                                                accept="application/pdf" 
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        form.setValue("signOffPath", `FILE: ${file.name}`);
                                                        toast({ title: "Document Staged", description: `${file.name} attached to dispatch.` });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-2 ml-1">Maximum file size: 5MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" /> Operational Notes / Comments
                                </FormLabel>
                                <FormControl>
                                <Textarea
                                    placeholder="Any remarks, GPRS config, portal instructions, or technician notes..."
                                    className="border-border bg-muted/10 resize-none min-h-[80px]"
                                    {...field}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-bold">
                            <Send className="w-5 h-5 mr-3" /> Confirm & Execute Dispatch
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="border-border shadow-md bg-card flex flex-col h-full">
                <CardHeader className="bg-muted/20 border-b border-border py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Bundle Contents ({selectedDeviceIds.length})</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 overflow-hidden flex flex-col">
                    <div className="space-y-4 mb-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hardware Scanner</label>
                            <div className="flex gap-2">
                                <Input 
                                    ref={hardwareInputRef}
                                    placeholder="Rapid Scan IMEI..." 
                                    className="h-10 border-border bg-primary/5 font-mono text-xs focus:ring-2 focus:ring-primary/50"
                                    value={hardwareScanValue}
                                    onChange={(e) => setHardwareScanValue(sanitizeIMEI(e.target.value))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleHardwareScan()}
                                />
                                <Button size="icon" variant="outline" className="shrink-0 h-10 w-10 border-border" onClick={handleHardwareScan}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card px-2 text-zinc-400 font-bold tracking-widest">Or Search List</span></div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input 
                                placeholder="Search by IMEI..." 
                                className="pl-10 h-10 border-border bg-muted/10"
                                value={assetSearchTerm}
                                onChange={(e) => setAssetSearchTerm(sanitizeIMEI(e.target.value))}
                            />
                        </div>
                        <Select onValueChange={toggleDevice} value="">
                            <SelectTrigger className="h-10 border-border bg-muted/10">
                                <SelectValue placeholder={assetSearchTerm ? `Matching: ${filteredAvailableDevices.length}` : "Select asset..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredAvailableDevices.length === 0 ? (
                                    <div className="p-2 text-xs text-center text-zinc-500">No matching assets</div>
                                ) : (
                                    filteredAvailableDevices.map(d => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.identifier} ({(d as any).modelName})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {selectedDeviceIds.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-border rounded-xl">
                                <Plus className="w-8 h-8 text-zinc-500 mb-2" />
                                <p className="text-[10px] font-bold uppercase text-zinc-500">Empty Bundle</p>
                            </div>
                        ) : (
                            selectedDeviceIds.map(id => {
                                const device = devices.find(d => d.id === id);
                                return (
                                    <div key={id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg group">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono font-bold text-foreground">{device?.identifier}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">{(device as any)?.modelName}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-destructive" onClick={() => toggleDevice(id)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/10 flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
          <div className="space-y-1">
              <h4 className="font-bold text-foreground">Multi-Asset Logic Active</h4>
              <p className="text-sm text-zinc-500 leading-relaxed italic">
                  Dispatching a bundle will automatically update all included assets to DISPATCHED status. 
                  This creates a unified movement log entry for the entire group, preserving relational integrity for SIMs and Trackers.
              </p>
          </div>
      </div>
    </div>
  )
}
