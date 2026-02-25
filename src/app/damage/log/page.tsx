'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle, Loader2, CheckCircle2, Search, X } from 'lucide-react';

import { fetchDevices, createDeviceDamage } from '@/lib/api';
import { Device } from '@/types/devices';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  deviceId: z.string().uuid('Please select a valid device'),
  issueDescription: z.string().min(5, 'Description must be at least 5 characters'),
  reportedBy: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  reportedDate: z.string().optional(),
});

export default function LogDamagePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: '',
      issueDescription: '',
      reportedBy: '',
      reportedDate: new Date().toISOString().slice(0, 16),
    },
  });

  const selectedDeviceId = form.watch("deviceId");

  useEffect(() => {
    async function loadDevices() {
      try {
        const fetchedDevices = await fetchDevices();
        // Filter out already replaced or damaged devices if needed, 
        // but typically any device can be reported as damaged.
        setDevices(fetchedDevices.filter(d => d.status !== 'REPLACED'));
      } catch (err: any) {
        toast({
          title: "Error loading devices",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadDevices();
  }, [toast]);

  const filteredDevices = useMemo(() => {
    return devices.filter(d => 
        d.identifier.toLowerCase().includes(assetSearchTerm.toLowerCase())
    ).slice(0, 50);
  }, [devices, assetSearchTerm]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Convert local datetime-local string to ISO if present
      const payload = {
        ...values,
        reportedDate: values.reportedDate ? new Date(values.reportedDate).toISOString() : undefined,
        reportedBy: values.reportedBy || undefined,
      };

      await createDeviceDamage(payload as any);
      
      toast({
        title: "Damage Logged",
        description: "The device status has been updated to DAMAGED.",
      });
      
      form.reset({
        deviceId: '',
        issueDescription: '',
        reportedBy: '',
        reportedDate: new Date().toISOString().slice(0, 16),
      });
      setAssetSearchTerm("");

      // Refresh list
      const fetchedDevices = await fetchDevices();
      setDevices(fetchedDevices.filter(d => d.status !== 'REPLACED'));
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-5 w-[450px]" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-primary" />
          Log Device Damage
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Report technical anomalies or physical damage to assets.
        </p>
      </div>

      <Card className="border-border shadow-md bg-card">
        <CardHeader className="bg-muted/20 border-b border-border">
          <CardTitle className="text-xl font-bold">Anomaly Report</CardTitle>
          <CardDescription>
            This action will move the device status to DAMAGED and create an audit entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Device Selection</FormLabel>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder="Search by ID / IMEI..." 
                            className="pl-10 h-10 border-border bg-muted/10 mb-2"
                            value={assetSearchTerm}
                            onChange={(e) => setAssetSearchTerm(e.target.value)}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="deviceId"
                        render={({ field }) => (
                            <FormItem>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={assetSearchTerm ? "" : field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-12 border-border bg-muted/10">
                                            <SelectValue placeholder={assetSearchTerm ? `Matching: ${filteredDevices.length}` : "Select asset..."} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredDevices.length === 0 ? (
                                            <div className="p-2 text-xs text-center text-zinc-500">No matching assets</div>
                                        ) : (
                                            filteredDevices.map(d => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.identifier} ({(d as any).modelName})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedDeviceId && (
                        <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/10 rounded-lg animate-in fade-in zoom-in-95">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-xs font-mono font-bold text-primary">
                                Selected: {devices.find(d => d.id === selectedDeviceId)?.identifier}
                            </span>
                            <button type="button" onClick={() => form.setValue("deviceId", "")} className="ml-auto hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                <FormField
                  control={form.control}
                  name="reportedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Reported By</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Technician Name" 
                          className="h-12 border-border bg-muted/30" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="issueDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Detailed Description of Issue</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Please provide details about the damage or malfunction..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportedDate"
                render={({ field }) => (
                  <FormItem className="max-w-[240px]">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Incident Date/Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        className="h-12 border-border bg-muted/30" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Defaults to current time.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold shadow-lg shadow-destructive/10" 
                variant="destructive"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging Anomaly...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Record Damage Report
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="bg-primary/5 p-6 rounded-xl border border-dashed border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Operational Protocol</h4>
            <p className="text-sm text-zinc-500 mt-1">
              Logged damage entries are permanently recorded in the audit trail. 
              The technical team will be notified of this status change for immediate assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
