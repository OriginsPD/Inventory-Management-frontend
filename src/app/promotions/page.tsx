'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Loader2, Star, CheckCircle2, Package, Calendar, User, Eye } from 'lucide-react';

import { fetchDevices, fetchPromotions, createPromotion } from '@/lib/api';
import { Device } from '@/types/devices';
import { Promotion } from '@/types/promotions';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  deviceId: z.string().uuid('Please select an active device'),
  promotionType: z.string().min(3, 'Promotion type must be at least 3 characters'),
  approvedBy: z.string().min(2, 'Name must be at least 2 characters'),
  promotionDate: z.string().optional(),
});

export default function PromotionsPage() {
  const [inStockDevices, setInStockDevices] = useState<Device[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: '',
      promotionType: '',
      approvedBy: '',
      promotionDate: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDevices, fetchedPromos] = await Promise.all([
          fetchDevices(),
          fetchPromotions(),
        ]);
        setInStockDevices(fetchedDevices.filter(d => d.status === 'IN_STOCK'));
        setPromotions(fetchedPromos);
      } catch (err: any) {
        toast({
          title: "Error loading promotions data",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        promotionDate: values.promotionDate ? new Date(values.promotionDate).toISOString() : undefined,
      };

      const created = await createPromotion(payload as any);
      setPromotions(prev => [created, ...prev]);
      
      toast({
        title: "Promotion Recorded",
        description: "Device status updated to PROMOTIONAL.",
      });
      
      form.reset({
        deviceId: '',
        promotionType: '',
        approvedBy: '',
        promotionDate: new Date().toISOString().slice(0, 16),
      });

      const updatedDevices = await fetchDevices();
      setInStockDevices(updatedDevices.filter(d => d.status === 'IN_STOCK'));
    } catch (err: any) {
      toast({
        title: "Action Failed",
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
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Star className="h-8 w-8 text-zinc-600" />
            Promotions Tracking
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage assets allocated for demos, influencers, or promotional campaigns.
          </p>
        </div>
        <div className="bg-muted/30 px-6 py-4 rounded-xl border border-border/50 text-right hidden md:block">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Stock Readiness</p>
            <p className="text-2xl font-bold text-zinc-600">{inStockDevices.length} <span className="text-sm font-medium text-zinc-400 italic">Units available</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <Card className="border-border shadow-md bg-card sticky top-24">
            <CardHeader className="bg-muted/20 border-b border-border">
              <CardTitle className="text-xl">Allocate Promotion</CardTitle>
              <CardDescription>
                Assign active stock to a promotional status.
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
                        <FormLabel>Select Active Stock</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-border bg-muted/20">
                              <SelectValue placeholder="Search by IMEI..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inStockDevices.map((device) => (
                              <SelectItem key={device.id} value={device.id}>
                                {device.imei} (IN_STOCK)
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
                    name="promotionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocation Type</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Influencer Gift, Showroom Demo" 
                            className="h-12 border-border bg-muted/20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="approvedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Approval By</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Name of approver" 
                            className="h-12 border-border bg-muted/20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="promotionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer Date</FormLabel>
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

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold" 
                    disabled={form.formState.isSubmitting || inStockDevices.length === 0}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Allocating...
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-5 w-5" />
                        Mark as Promotional
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-md bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Promotional Asset History</CardTitle>
                <CardDescription>A comprehensive log of all promotional transitions.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <Eye className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 py-4 text-[10px] uppercase font-bold text-zinc-500">Asset Record</TableHead>
                    <TableHead className="py-4 text-[10px] uppercase font-bold text-zinc-500">Type</TableHead>
                    <TableHead className="py-4 text-[10px] uppercase font-bold text-zinc-500">Approver</TableHead>
                    <TableHead className="pr-6 py-4 text-right text-[10px] uppercase font-bold text-zinc-500">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center text-zinc-500 italic">No promotional moves recorded.</TableCell>
                    </TableRow>
                  ) : (
                    promotions.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50 transition-colors border-border/50">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted/50 rounded border border-border/50">
                              <Package className="w-4 h-4 text-zinc-600" />
                            </div>
                            <span className="font-mono text-xs text-zinc-500 uppercase">{p.deviceId.substring(0, 13)}...</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-foreground">{p.promotionType}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <User className="w-3 h-3 opacity-50" /> {p.approvedBy}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-zinc-400">
                            <Calendar className="w-3 h-3 opacity-50" /> {new Date(p.promotionDate || p.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="p-6 bg-muted/20 rounded-xl border border-dashed border-border flex items-start gap-4">
            <Star className="h-6 w-6 text-zinc-400 mt-1" />
            <div>
                <h4 className="font-bold text-foreground">Strategic Inventory Note</h4>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                    Promotional units are excluded from active sellable stock calculations. 
                    They retain full serial history for warranty and tracking purposes within the core intelligence engine.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
