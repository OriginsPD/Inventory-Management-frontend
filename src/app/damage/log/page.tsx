'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

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

const formSchema = z.object({
  deviceId: z.string().uuid('Please select a valid device'),
  issueDescription: z.string().min(5, 'Description must be at least 5 characters'),
  reportedBy: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  reportedDate: z.string().optional(),
});

export default function LogDamagePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-zinc-600" />
          Log Device Damage
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Report technical anomalies or physical damage to assets.
        </p>
      </div>

      <Card className="border-border shadow-md bg-card">
        <CardHeader>
          <CardTitle className="text-xl">Anomaly Report</CardTitle>
          <CardDescription>
            This action will move the device status to DAMAGED and create an audit entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="deviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Device</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-border bg-muted/30">
                            <SelectValue placeholder="Search by IMEI..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {devices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.imei} ({device.status})
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
                  name="reportedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reported By</FormLabel>
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
                    <FormLabel>Detailed Description of Issue</FormLabel>
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
                    <FormLabel>Incident Date/Time</FormLabel>
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
                className="w-full h-12 text-lg font-bold" 
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

      <div className="bg-muted/50 p-6 rounded-xl border border-border/50">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
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
