'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    fetchDispatches, 
    fetchDevices, 
    fetchCustomers, 
    fetchDispatchItems, 
    deleteDispatch, 
    updateDispatch,
    API_BASE_URL
} from '@/lib/api';
import { Dispatch } from '@/types/dispatches';
import { Device } from '@/types/devices';
import { Customer } from '@/types/customers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    History, 
    MapPin, 
    User, 
    Calendar, 
    Hash, 
    Package, 
    FileText, 
    Eye, 
    Trash2, 
    Edit, 
    Info, 
    CheckCircle2, 
    ArrowRight,
    Loader2,
    Search,
    ChevronDown
} from 'lucide-react';

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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const editFormSchema = z.object({
  location: z.string().min(2, { message: "Location is required." }),
  signOffPath: z.string().optional(),
});

export default function DispatchHistoryPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  // Modal States
  const [viewingDispatch, setViewingDispatch] = useState<Dispatch | null>(null);
  const [viewingItems, setViewingItems] = useState<Device[]>([]);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  
  const [editingDispatch, setEditingDispatch] = useState<Dispatch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingDispatch) {
      editForm.reset({
        location: editingDispatch.location || "",
        signOffPath: (editingDispatch as any).signOffPath || "",
      });
    }
  }, [editingDispatch, editForm]);

  async function loadData() {
    try {
      const [fetchedDispatches, fetchedDevices, fetchedCustomers] = await Promise.all([
        fetchDispatches(),
        fetchDevices(),
        fetchCustomers(),
      ]);
      setDispatches(fetchedDispatches);
      setDevices(fetchedDevices);
      setCustomers(fetchedCustomers);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to sync with logistics engine.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleViewDetails = async (dispatch: Dispatch) => {
    setViewingDispatch(dispatch);
    setIsItemsLoading(true);
    try {
        const items = await fetchDispatchItems(dispatch.id);
        setViewingItems(items);
    } catch (err) {
        toast({ title: "Fetch Failed", description: "Could not retrieve bundle contents.", variant: "destructive" });
    } finally {
        setIsItemsLoading(false);
    }
  };

  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    if (!editingDispatch) return;
    try {
        const updated = await updateDispatch(editingDispatch.id, values);
        setDispatches(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
        setEditingDispatch(null);
        toast({ title: "Update Successful", description: "Dispatch parameters modified." });
    } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
        await deleteDispatch(deleteId);
        setDispatches(prev => prev.filter(d => d.id !== deleteId));
        toast({ title: "Dispatch Revoked", description: "Record removed and assets reverted to stock." });
    } catch (err: any) {
        toast({ title: "Revoke Failed", description: err.message, variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setDeleteId(null);
    }
  };

  const getDeviceIdentifier = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.identifier : 'N/A';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'N/A';
  };

  const columns: ColumnDef<Dispatch>[] = [
    {
        accessorKey: "id",
        header: "Dispatch ID",
        cell: ({ row }) => <span className="font-mono text-[10px] text-zinc-500 uppercase">{row.getValue("id")?.toString().substring(0, 8)}</span>,
    },
    {
        accessorKey: "deviceId",
        header: "Primary Asset",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                <Hash className="w-3 h-3 text-primary opacity-50" /> {getDeviceIdentifier(row.getValue("deviceId"))}
            </div>
        )
    },
    {
        accessorKey: "customerId",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Recipient
                <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => <span className="font-bold text-foreground">{getCustomerName(row.getValue("customerId"))}</span>,
    },
    {
        accessorKey: "dispatchDate",
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
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Calendar className="w-3 h-3" /> {new Date(row.getValue("dispatchDate")).toLocaleDateString()}
            </div>
        )
    },
    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => <span className="text-xs text-zinc-500">{row.getValue("location") || 'N/A'}</span>
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const dispatch = row.original
            return (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-primary" onClick={() => handleViewDetails(dispatch)}>
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-primary" onClick={() => setEditingDispatch(dispatch)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => setDeleteId(dispatch.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    }
  ]

  const table = useReactTable({
    data: dispatches,
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

  if (loading) return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>
      <Card className="border-border">
        <div className="p-0">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Dispatch History
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
            Complete record of all outbound asset movements.
            </p>
        </div>
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
                placeholder="Search history..."
                value={table.getState().globalFilter ?? ""}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
                className="pl-8 bg-card border-border"
            />
        </div>
      </div>

      <Card className="border-border shadow-md bg-card overflow-hidden flex flex-col h-[650px]">
        <div className="flex-1 overflow-auto">
            <Table>
            <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                    {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12">
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
                    <TableRow
                    key={row.id}
                    className="border-border/40 hover:bg-muted/30 transition-colors"
                    >
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-40 italic text-zinc-500">
                            <History className="h-12 w-12" />
                            <p>No dispatch records match your search.</p>
                        </div>
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <div className="text-xs text-zinc-500">
                Logged Sessions: <span className="font-bold text-foreground">{dispatches.length}</span>
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

      {/* View Details Modal */}
      <Dialog open={!!viewingDispatch} onOpenChange={(open) => !open && setViewingDispatch(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <Info className="w-6 h-6 text-primary"/> Dispatch Intelligence
            </DialogTitle>
            <DialogDescription>Full bundle breakdown and recipient metadata.</DialogDescription>
          </DialogHeader>
          {viewingDispatch && (
            <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 border border-border rounded-2xl">
                        <User className="w-4 h-4 text-primary mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Recipient</span>
                        <span className="font-bold text-foreground">{getCustomerName(viewingDispatch.customerId)}</span>
                    </div>
                    <div className="p-4 bg-muted/30 border border-border rounded-2xl">
                        <MapPin className="w-4 h-4 text-primary mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Destination</span>
                        <span className="font-bold text-foreground">{viewingDispatch.location || 'N/A'}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Bundle Contents</h4>
                        <Badge variant="outline" className="text-[10px] font-mono">ID: {viewingDispatch.id.substring(0, 8)}</Badge>
                    </div>
                    <div className="border border-border rounded-2xl overflow-hidden bg-muted/10">
                        {isItemsLoading ? (
                            <div className="p-8 flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="text-xs text-zinc-500 font-medium">Indexing bundle nodes...</span>
                            </div>
                        ) : (
                            <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                                {viewingItems.map(item => (
                                    <div key={item.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <Package className="w-3 h-3 text-primary" />
                                            </div>
                                            <span className="font-mono text-xs font-bold text-foreground">{item.identifier}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Verified</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-primary/5 border border-dashed border-primary/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase">Logistics Signature</span>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between bg-card p-3 border border-border rounded-xl">
                            <div>
                                <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Reference / Proof</span>
                                {viewingDispatch.signOffPath?.startsWith('FILE: ') ? (
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold text-foreground">{viewingDispatch.signOffPath.replace('FILE: ', '')}</span>
                                    </div>
                                ) : (
                                    <span className="text-foreground font-mono font-bold">{viewingDispatch.signOffPath || 'N/A'}</span>
                                )}
                            </div>
                            {viewingDispatch.signOffPath?.startsWith('FILE: ') && (
                                <Button 
                                    size="sm" 
                                    className="h-8 text-[10px] font-bold uppercase tracking-widest px-4"
                                    onClick={() => {
                                        const filename = viewingDispatch.signOffPath?.replace('FILE: ', '') || 'proof.pdf';
                                        window.open(`${API_BASE_URL}/proof/${filename}`, '_blank');
                                    }}
                                >
                                    View PDF Proof
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                        <div>
                            <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Dispatched By</span>
                            <span className="text-foreground font-bold">{viewingDispatch.dispatchedBy}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">System Timestamp</span>
                            <span className="text-foreground font-mono">{new Date(viewingDispatch.dispatchDate).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingDispatch} onOpenChange={(open) => !open && setEditingDispatch(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Adjust Dispatch Metadata</DialogTitle>
            <DialogDescription>Modify destination or reference proof parameters.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Destination Location</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-muted/30 border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <FileText className="w-3 h-3"/> Digital Sign-off Proof
                </FormLabel>
                <div className="grid grid-cols-1 gap-4">
                    <FormField
                        control={editForm.control}
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
                                {editForm.watch("signOffPath")?.startsWith("FILE: ") 
                                    ? editForm.watch("signOffPath")?.replace("FILE: ", "") 
                                    : "Upload New PDF Sign-off..."}
                            </span>
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        editForm.setValue("signOffPath", `FILE: ${file.name}`);
                                        toast({ title: "Document Staged", description: `${file.name} ready for update.` });
                                    }
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2 ml-1">Maximum file size: 5MB</p>
                    </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-bold mt-4">
                Update Logistics Record
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Revoke Dispatch Bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the history record and **automatically revert all assets in this bundle back to IN_STOCK status**. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
                disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke & Revert Assets"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "outline", className?: string }) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border",
            variant === "outline" ? "border-border text-zinc-500" : "bg-primary/10 text-primary border-primary/20",
            className
        )}>
            {children}
        </span>
    );
}
