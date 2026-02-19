"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Send, History, CheckCircle2 } from "lucide-react"

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
import { fetchDevices, fetchCustomers, createDispatch } from "@/lib/api"
import { Device } from "@/types/devices"
import { Customer } from "@/types/customers"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  deviceId: z.string().min(1, { message: "Please select a device." }),
  customerId: z.string().min(1, { message: "Please select a customer." }),
  location: z.string().min(2, { message: "Location is required." }),
})

export default function DispatchPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: "",
      customerId: "",
      location: "",
    },
  })

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createDispatch({
          ...values,
          dispatchDate: new Date().toISOString(),
          dispatchedBy: session?.user.name || "System User",
      } as any)
      toast({ title: "Dispatch Confirmed", description: "The asset has been successfully assigned." })
      router.push("/dispatch/history")
    } catch (err: any) {
      toast({ title: "Dispatch Failed", description: err.message, variant: "destructive" })
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Preparing dispatch terminal...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dispatch Asset</h1>
          <p className="text-muted-foreground">Assign a device to a customer and record the location.</p>
        </div>
        <Button variant="outline" size="sm" className="border-border" onClick={() => router.push('/dispatch/history')}>
          <History className="w-4 h-4 mr-2" /> View History
        </Button>
      </div>

      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-zinc-900 text-zinc-100">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="w-5 h-5 text-zinc-400" /> New Dispatch Record
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Verify device physical condition before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Select Device (Available Stock)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-border">
                          <SelectValue placeholder="Search by IMEI..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {devices.length === 0 ? (
                          <div className="p-2 text-sm text-center text-muted-foreground">No devices in stock</div>
                        ) : (
                          devices.map(device => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.imei} - {(device as any).modelName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Customer / Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-border">
                          <SelectValue placeholder="Select destination customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} {customer.email ? `(${customer.email})` : ''}
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
                    <FormLabel className="text-foreground font-semibold">Dispatch Location / Branch</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Downtown Office, Warehouse B" className="h-12 border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-all active:scale-[0.99]">
                Execute Dispatch
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted border border-border rounded-xl flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-5 h-5 text-zinc-400 mb-2" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Inventory Sync</span>
          </div>
          <div className="p-4 bg-muted border border-border rounded-xl flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-5 h-5 text-zinc-400 mb-2" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Status Update</span>
          </div>
          <div className="p-4 bg-muted border border-border rounded-xl flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-5 h-5 text-zinc-400 mb-2" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Audit Secure</span>
          </div>
      </div>
    </div>
  )
}



