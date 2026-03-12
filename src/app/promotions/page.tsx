'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Loader2, Star, Package, Calendar, User, Eye, Search, X, ChevronDown, Trash2 } from 'lucide-react';
import { TableActions } from '@/components/ui/table-actions';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { fetchDevices, fetchPromotions, createPromotion, deletePromotion } from '@/lib/api';
import { Device } from '@/types/devices';
import { Promotion } from '@/types/promotions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  deviceIds: z.array(z.string()).min(1, 'Select at least one asset'),
  promotionType: z.string().min(3, 'Promotion type must be at least 3 characters'),
  approvedBy: z.string().min(2, 'Name must be at least 2 characters'),
  promotionDate: z.string().optional(),
});

export default function PromotionsPage() {
  const [inStockDevices, setInStockDevices] = useState<Device[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceIds: [],
      promotionType: '',
      approvedBy: '',
      promotionDate: new Date().toISOString().slice(0, 16),
    },
  });

  const selectedDeviceIds = form.watch("deviceIds");

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedDevices, fetchedPromos] = await Promise.all([
          fetchDevices(),
          fetchPromotions(),
        ]);
        setAllDevices(fetchedDevices);
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

  const filteredAvailableDevices = useMemo(() => {
    return inStockDevices.filter(d => 
        !selectedDeviceIds.includes(d.id) && 
        d.identifier.toLowerCase().includes(assetSearchTerm.toLowerCase())
    ).slice(0, 50);
  }, [inStockDevices, selectedDeviceIds, assetSearchTerm]);

  const toggleDevice = (id: string) => {
    const current = form.getValues("deviceIds");
    if (current.includes(id)) {
      form.setValue("deviceIds", current.filter(x => x !== id));
    } else {
      form.setValue("deviceIds", [...current, id]);
    }
    setAssetSearchTerm("");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const promotionDate = values.promotionDate ? new Date(values.promotionDate).toISOString() : undefined;
      
      // Process each device
      for (const deviceId of values.deviceIds) {
          const created = await createPromotion({
              deviceId,
              promotionType: values.promotionType,
              approvedBy: values.approvedBy,
              promotionDate
          } as any);
          setPromotions(prev => [created, ...prev]);
      }
      
      toast({
        title: "Promotions Recorded",
        description: `${values.deviceIds.length} assets updated to PROMOTIONAL.`,
      });
      
      form.reset({
        deviceIds: [],
        promotionType: '',
        approvedBy: '',
        promotionDate: new Date().toISOString().slice(0, 16),
      });

      const updatedDevices = await fetchDevices();
      setAllDevices(updatedDevices);
      setInStockDevices(updatedDevices.filter(d => d.status === 'IN_STOCK'));
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deletePromotion(deleteId);
      setPromotions(prev => prev.filter(p => p.id !== deleteId));
      toast({ title: "Deleted", description: "Promotion record removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  const columns: ColumnDef<Promotion>[] = [
    {
        accessorKey: "deviceId",
        header: "Asset Record",
        cell: ({ row }) => {
            const identifier = allDevices.find(d => d.id === row.getValue("deviceId"))?.identifier || row.getValue("deviceId")?.toString().substring(0, 13) + '...';
            return (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/50 rounded border border-border/50">
                        <Package className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-mono text-xs text-zinc-500 uppercase">{identifier}</span>
                </div>
            );
        }
    },
    {
        accessorKey: "promotionType",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Type
                <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => <span className="font-bold text-foreground">{row.getValue("promotionType")}</span>
    },
    {
        accessorKey: "approvedBy",
        header: "Approver",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-zinc-500">
                <User className="w-3 h-3 opacity-50" /> {row.getValue("approvedBy")}
            </div>
        )
    },
    {
        accessorKey: "promotionDate",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Date
                <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2 text-zinc-400 text-xs">
                <Calendar className="w-3 h-3 opacity-50" /> {new Date(row.getValue("promotionDate") || row.original.createdAt).toLocaleDateString()}
            </div>
        ),
        meta: {
            className: "text-right"
        }
    },
    {
        id: "actions",
        size: 60,
        enableResizing: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
            <TableActions actions={[
                { icon: Trash2, label: "Delete promotion", onClick: () => setDeleteId(row.original.id), variant: "destructive" },
            ]} />
        )
    }
  ]

  const table = useReactTable({
    data: promotions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
        pagination: {
            pageSize: 10
        }
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-4 w-[450px]" />
          </div>
          <Skeleton className="h-16 w-[200px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Skeleton className="h-[500px] w-full" />
          <Skeleton className="lg:col-span-2 h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Star className="h-8 w-8 text-primary" />
            Promotions Tracking
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage assets allocated for demos, influencers, or promotional campaigns.
          </p>
        </div>
        <div className="bg-muted/30 px-6 py-4 rounded-xl border border-border/50 text-right hidden md:block">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Stock Readiness</p>
            <p className="text-2xl font-bold text-primary">{inStockDevices.length} <span className="text-sm font-medium text-zinc-400 italic">Units available</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
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
                  
                  <div className="space-y-4">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset Selection</FormLabel>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder="Search by IMEI..." 
                            className="pl-10 h-10 border-border bg-muted/10 mb-2"
                            value={assetSearchTerm}
                            onChange={(e) => setAssetSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select onValueChange={toggleDevice} value="">
                        <SelectTrigger className="h-12 border-border bg-muted/10">
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

                    <div className="flex flex-wrap gap-2 pt-2">
                        {selectedDeviceIds.map(id => {
                            const device = inStockDevices.find(d => d.id === id);
                            return (
                                <div key={id} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-bold font-mono">
                                    {device?.identifier}
                                    <button type="button" onClick={() => toggleDevice(id)} className="hover:text-destructive text-primary">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="promotionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Allocation Type</FormLabel>
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
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Internal Approval By</FormLabel>
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
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Transfer Date</FormLabel>
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

        <div className="lg:col-span-2 space-y-6 flex flex-col h-[800px]">
          <Card className="border-border shadow-md bg-card overflow-hidden flex flex-col flex-1">
            <CardHeader className="pb-4 border-b border-border bg-muted/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-xl">Promotional Asset History</CardTitle>
                    <CardDescription>A comprehensive log of all promotional transitions.</CardDescription>
                </div>
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search promotions..."
                        value={table.getState().globalFilter ?? ""}
                        onChange={(e) => table.setGlobalFilter(e.target.value)}
                        className="pl-8 bg-card border-border h-9"
                    />
                </div>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="h-12 py-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-border/40">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-40 italic text-zinc-500">
                            <Star className="h-12 w-12" />
                            <p>No promotional records found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">
                    History Nodes: {promotions.length}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 text-xs font-bold"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 text-xs font-bold"
                    >
                        Next
                    </Button>
                </div>
            </div>
          </Card>

          <div className="p-6 bg-primary/5 rounded-xl border border-dashed border-primary/20 flex items-start gap-4">
            <Star className="h-6 w-6 text-primary mt-1" />
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Promotion Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this promotional record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
