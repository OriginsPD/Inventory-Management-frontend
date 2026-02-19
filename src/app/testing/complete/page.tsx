"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ClipboardCheck, CheckCircle2, XCircle, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchDevices, fetchDeviceTests, completeDeviceTest } from "@/lib/api"
import { DeviceTest } from "@/types/device-testing"
import { Device } from "@/types/devices"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  testId: z.string().min(1, { message: "Please select a pending test." }),
  result: z.enum(["PASS", "FAIL"], {
    errorMap: () => ({ message: "Result is required." }),
  }),
  notes: z.string().optional(),
})

export default function CompleteTestPage() {
  const [pendingTests, setPendingTests] = useState<DeviceTest[]>([])
  const [testingDevices, setTestingDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testId: "",
      result: "PASS",
      notes: "",
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDevices, fetchedTests] = await Promise.all([
          fetchDevices(),
          fetchDeviceTests(),
        ])
        const devicesInTesting = fetchedDevices.filter(d => d.status === 'TESTING')
        setTestingDevices(devicesInTesting)
        
        const testsWithoutResult = fetchedTests.filter(
            (test) => devicesInTesting.some(device => device.id === test.deviceId) && !test.result
        )
        setPendingTests(testsWithoutResult)
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load test data.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await completeDeviceTest(values as any)
      toast({ title: "Verification Logged", description: "The test result has been recorded and device status updated." })
      form.reset()
      
      // Refresh data
      const [updatedDevices, updatedTests] = await Promise.all([
        fetchDevices(),
        fetchDeviceTests(),
      ])
      const devicesInTesting = updatedDevices.filter(d => d.status === 'TESTING')
      setTestingDevices(devicesInTesting)
      const testsWithoutResult = updatedTests.filter(
          (test) => devicesInTesting.some(device => device.id === test.deviceId) && !test.result
      )
      setPendingTests(testsWithoutResult)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const getDeviceImei = (deviceId: string) => {
    const device = testingDevices.find(d => d.id === deviceId)
    return device ? device.imei : 'Unknown'
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Accessing laboratory records...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Final QC Clearance</h1>
        <p className="text-muted-foreground">Submit final technical findings and release asset from testing.</p>
      </div>

      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-zinc-400" /> Technical Clearance
          </CardTitle>
          <CardDescription>Finalize the assessment for an active QC session.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="testId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Active Test Session</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-border h-12">
                          <SelectValue placeholder="Identify session by asset IMEI" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pendingTests.map(test => (
                          <SelectItem key={test.id} value={test.id}>
                            IMEI: {getDeviceImei(test.deviceId)} — Technician: {test.handedTo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Verdict</FormLabel>
                      <FormControl>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => field.onChange("PASS")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-14 rounded-xl border-2 transition-all",
                                    field.value === "PASS" 
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100" 
                                        : "bg-card border-border text-zinc-400 hover:border-border"
                                )}
                            >
                                <CheckCircle2 className={cn("w-5 h-5", field.value === "PASS" ? "text-emerald-600" : "text-zinc-200")} />
                                <span className="font-bold uppercase tracking-widest text-xs">Clearance</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => field.onChange("FAIL")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-14 rounded-xl border-2 transition-all",
                                    field.value === "FAIL" 
                                        ? "bg-red-50 border-red-500 text-red-700 shadow-sm shadow-red-100" 
                                        : "bg-card border-border text-zinc-400 hover:border-border"
                                )}
                            >
                                <XCircle className={cn("w-5 h-5", field.value === "FAIL" ? "text-red-600" : "text-zinc-200")} />
                                <span className="font-bold uppercase tracking-widest text-xs">Quarantine</span>
                            </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-center p-4 bg-muted rounded-xl border border-dashed border-border">
                    <p className="text-[10px] text-center text-zinc-400 font-medium leading-relaxed">
                        Assets marked as PASS will return to IN STOCK. <br/>
                        Assets marked as FAIL will be moved to DAMAGED.
                    </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-zinc-400"/> Technical Notes
                    </FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Detailed findings or reasons for failure..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all active:scale-[0.99]"
                disabled={pendingTests.length === 0}
              >
                Certify & Update Inventory
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}



