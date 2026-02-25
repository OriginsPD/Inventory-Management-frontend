'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RefreshCw, Loader2, ArrowRightLeft, CheckCircle2, Search, X, Calendar as CalendarIcon, ShieldCheck } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const [oldAssetSearchTerm, setOldAssetSearchTerm] = useState("");
  const [newAssetSearchTerm, setNewAssetSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldDeviceId: '',
      newDeviceId: '',
      reason: '',
      replacementDate: new Date().toISOString(),
    },
  });

  const oldDeviceId = form.watch("oldDeviceId");
  const newDeviceId = form.watch("newDeviceId");

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

  const replaceableDevices = useMemo(() => {
    return devices.filter(d => 
        d.status !== 'REPLACED' && 
        d.identifier.toLowerCase().includes(oldAssetSearchTerm.toLowerCase())
    ).slice(0, 50);
  }, [devices, oldAssetSearchTerm]);

  const inStockDevices = useMemo(() => {
    return devices.filter(d => 
        d.status === 'IN_STOCK' && 
        d.identifier.toLowerCase().includes(newAssetSearchTerm.toLowerCase())
    ).slice(0, 50);
  }, [devices, newAssetSearchTerm]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        replacementDate: values.replacementDate || undefined,
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
        replacementDate: new Date().toISOString(),
      });
      setOldAssetSearchTerm("");
      setNewAssetSearchTerm("");

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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-5 w-[450px]" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <RefreshCw className="h-8 w-8 text-primary" />
          Device Replacement Workflow
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Execute an atomic swap between an active asset and new stock.
        </p>
      </div>

      <Card className="border-border shadow-lg bg-card overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary opacity-50" />
            <div>
              <CardTitle className="text-xl font-bold">Atomic Asset Swap</CardTitle>
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
                
                {/* Old Asset Selection */}
                <div className="space-y-4">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Old Asset (Current)</FormLabel>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder="Search by ID / IMEI..." 
                            className="pl-10 h-10 border-border bg-muted/10 mb-2"
                            value={oldAssetSearchTerm}
                            onChange={(e) => setOldAssetSearchTerm(e.target.value)}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="oldDeviceId"
                        render={({ field }) => (
                            <FormItem>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={oldAssetSearchTerm ? "" : field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-12 border-border bg-muted/10">
                                            <SelectValue placeholder={oldAssetSearchTerm ? `Matching: ${replaceableDevices.length}` : "Select asset to retire..."} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {replaceableDevices.length === 0 ? (
                                            <div className="p-2 text-xs text-center text-zinc-500">No matching assets</div>
                                        ) : (
                                            replaceableDevices.map(d => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.identifier} ({d.status})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {oldDeviceId && (
                        <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/10 rounded-lg animate-in fade-in zoom-in-95">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-xs font-mono font-bold text-primary">
                                To Retire: {devices.find(d => d.id === oldDeviceId)?.identifier}
                            </span>
                            <button type="button" onClick={() => form.setValue("oldDeviceId", "")} className="ml-auto hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* New Asset Selection */}
                <div className="space-y-4">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">New Asset (Replacement)</FormLabel>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder="Search by ID / IMEI..." 
                            className="pl-10 h-10 border-border bg-muted/10 mb-2"
                            value={newAssetSearchTerm}
                            onChange={(e) => setNewAssetSearchTerm(e.target.value)}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="newDeviceId"
                        render={({ field }) => (
                            <FormItem>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={newAssetSearchTerm ? "" : field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-12 border-border bg-muted/10">
                                            <SelectValue placeholder={newAssetSearchTerm ? `Matching: ${inStockDevices.length}` : "Select IN_STOCK unit..."} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {inStockDevices.length === 0 ? (
                                            <div className="p-2 text-xs text-center text-zinc-500">No matching assets</div>
                                        ) : (
                                            inStockDevices.map(d => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.identifier} (IN STOCK)
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {newDeviceId && (
                        <div className="flex items-center gap-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg animate-in fade-in zoom-in-95">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-mono font-bold text-emerald-600">
                                To Issue: {devices.find(d => d.id === newDeviceId)?.identifier}
                            </span>
                            <button type="button" onClick={() => form.setValue("newDeviceId", "")} className="ml-auto hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Reason for Swap</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Execution Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full bg-muted/30 border-border pl-3 text-left font-normal h-12",
                                            !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? (
                                            format(new Date(field.value), "PPP")
                                        ) : (
                                            <span>Pick execution date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString())}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20">
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">Protocol Note</p>
                    <p className="text-xs text-zinc-500 leading-relaxed italic">
                      This operation is irreversible. The old device will be marked as REPLACED and the new device will automatically transition to DISPATCHED.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 text-xl font-bold shadow-lg shadow-primary/20" 
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
        <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-4 transition-all hover:bg-emerald-500/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mt-1" />
          <div>
            <h4 className="font-bold text-foreground">Fleet Readiness</h4>
            <p className="text-sm text-zinc-500 mt-1">{inStockDevices.length} units available for immediate replacement.</p>
          </div>
        </div>
        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4 transition-all hover:bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary mt-1" />
          <div>
            <h4 className="font-bold text-foreground">Operational Safety</h4>
            <p className="text-sm text-zinc-500 mt-1">Both asset histories will be cross-linked in the audit trail.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

