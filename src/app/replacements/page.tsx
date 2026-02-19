'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RefreshCw, Loader2, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

import { fetchDevices, createDeviceReplacement } from '@/lib/api';
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
  oldDeviceId: z.string().uuid('Please select the original device'),
  newDeviceId: z.string().uuid('Please select the replacement device'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  replacementDate: z.string().optional(),
}).refine((data) => data.oldDeviceId !== data.newDeviceId, {
  message: "Old and new device cannot be the same",
  path: ["newDeviceId"],
});

export default function ReplacementPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldDeviceId: '',
      newDeviceId: '',
      reason: '',
      replacementDate: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    async function loadDevices() {
      try {
        const fetchedDevices = await fetchDevices();
        setDevices(fetchedDevices);
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
      const payload = {
        ...values,
        replacementDate: values.replacementDate ? new Date(values.replacementDate).toISOString() : undefined,
      };

      await createDeviceReplacement(payload as any);
      
      toast({
        title: "Replacement Successful",
        description: "Old device status set to REPLACED, new device set to DISPATCHED.",
      });
      
      form.reset({
        oldDeviceId: '',
        newDeviceId: '',
        reason: '',
        replacementDate: new Date().toISOString().slice(0, 16),
      });

      const fetchedDevices = await fetchDevices();
      setDevices(fetchedDevices);
    } catch (err: any) {
      toast({
        title: "Replacement Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  const inStockDevices = devices.filter(d => d.status === 'IN_STOCK');
  const replaceableDevices = devices.filter(d => d.status !== 'REPLACED');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <RefreshCw className="h-8 w-8 text-zinc-600" />
          Device Replacement Workflow
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Execute an atomic swap between an active asset and new stock.
        </p>
      </div>

      <Card className="border-border shadow-lg bg-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-400" />
            <div>
              <CardTitle className="text-xl">Atomic Asset Swap</CardTitle>
              <CardDescription>
                Ensure both devices are correctly identified before confirming.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="oldDeviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold uppercase tracking-wider text-zinc-500">Old Asset (Current)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 border-border bg-muted/20">
                            <SelectValue placeholder="Select asset to retire..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {replaceableDevices.map((device) => (
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
                  name="newDeviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold uppercase tracking-wider text-zinc-500">New Asset (Replacement)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 border-border bg-muted/20">
                            <SelectValue placeholder="Select IN_STOCK unit..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inStockDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.imei} (IN STOCK)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-sm font-bold uppercase tracking-wider text-zinc-500">Reason for Swap</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Technical fault, hardware upgrade, or periodic replacement..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="replacementDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold uppercase tracking-wider text-zinc-500">Execution Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="h-12 border-border bg-muted/20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Protocol Note</p>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      This operation is irreversible. The old device will be marked as REPLACED and the new device will automatically transition to DISPATCHED.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-xl font-bold bg-primary hover:bg-primary/90" 
                disabled={form.formState.isSubmitting || inStockDevices.length === 0}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Executing Swap...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-3 h-6 w-6" />
                    Execute Asset Replacement
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-muted/30 rounded-xl border border-border flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 mt-1" />
          <div>
            <h4 className="font-bold text-foreground">Status: Active Stock</h4>
            <p className="text-sm text-zinc-500 mt-1">{inStockDevices.length} units available for replacement.</p>
          </div>
        </div>
        <div className="p-6 bg-muted/30 rounded-xl border border-border flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-blue-400 mt-1" />
          <div>
            <h4 className="font-bold text-foreground">Operational Safety</h4>
            <p className="text-sm text-zinc-500 mt-1">Both asset histories will be cross-linked automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
