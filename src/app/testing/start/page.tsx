"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Activity, ClipboardCheck, User, ShieldCheck } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchDevices, startDeviceTest } from "@/lib/api"
import { Device } from "@/types/devices"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  deviceId: z.string().min(1, { message: "Please select a device." }),
  handedTo: z.string().min(2, { message: "Recipient name is required." }),
  authCode: z.string().optional(),
})

export default function StartTestPage() {
  const [eligibleDevices, setEligibleDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: "",
      handedTo: "",
      authCode: "",
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedDevices = await fetchDevices()
        setEligibleDevices(fetchedDevices.filter(d => d.status === 'IN_STOCK' || d.status === 'DISPATCHED'))
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load devices.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await startDeviceTest(values as any)
      toast({ title: "Test Initialized", description: "The device has been moved to technical testing." })
      form.reset()
      
      const updatedDevices = await fetchDevices()
      setEligibleDevices(updatedDevices.filter(d => d.status === 'IN_STOCK' || d.status === 'DISPATCHED'))
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse text-zinc-500 uppercase tracking-widest font-bold text-xs">Initializing Quality Module...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Technical QC Start</h1>
        <p className="text-muted-foreground">Initiate a quality control session for a physical asset.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="border border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/50">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Activity className="w-5 h-5 text-zinc-400" /> Test Initialization
              </CardTitle>
              <CardDescription>Assign a unit to a technician for assessment.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="deviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Device</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-border">
                              <SelectValue placeholder="Select by IMEI" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eligibleDevices.map(device => (
                              <SelectItem key={device.id} value={device.id}>
                                {device.imei} ({(device as any).modelName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="handedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Technician Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" className="border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="authCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auth Code (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="QC-XXXX" className="border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                    disabled={eligibleDevices.length === 0}
                  >
                    Authorize & Begin Test
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
            <Card className="border border-border shadow-sm bg-muted">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">QC Protocol</CardTitle>
                </CardHeader>
                <CardContent className="text-[11px] text-zinc-600 space-y-3 leading-relaxed">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Visual inspection of chassis and ports.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Battery health within threshold.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Display dead pixel scan.</span>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 rounded-xl border border-border flex items-center gap-3 bg-card">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-none mb-1">Supervisor</p>
                    <p className="text-sm font-semibold text-foreground leading-none tracking-tight">Internal Auditor</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}



