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
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Send,
    MessageSquare,
    BadgeCheck
} from 'lucide-react';
import { SortableHeader } from '@/components/ui/sortable-header';
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn, formatDate } from '@/lib/utils';

const editFormSchema = z.object({
  location: z.string().min(2, { message: "Location is required." }),
  subscriptionType: z.enum(["B2C", "B2B"]).optional(),
  installationDate: z.string().optional(),
  signOffPath: z.string().optional(),
  notes: z.string().optional(),
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
        subscriptionType: (editingDispatch.subscriptionType as "B2C" | "B2B" | undefined) ?? undefined,
        installationDate: editingDispatch.installationDate
          ? new Date(editingDispatch.installationDate).toISOString().split('T')[0]
          : "",
        signOffPath: editingDispatch.signOffPath || "",
        notes: editingDispatch.notes || "",
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
        const updated = await updateDispatch(editingDispatch.id, {
          ...values,
          installationDate: values.installationDate
            ? new Date(values.installationDate).toISOString()
            : undefined,
        });
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
        size: 90,
        header: "ID",
        cell: ({ row }) => <span className="font-mono text-[10px] text-zinc-500 uppercase">{row.getValue("id")?.toString().substring(0, 8)}</span>,
    },
    {
        accessorKey: "deviceId",
        size: 160,
        header: "Primary Asset",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                <Hash className="w-3 h-3 text-primary opacity-50" /> {getDeviceIdentifier(row.getValue("deviceId"))}
            </div>
        )
    },
    {
        accessorKey: "customerId",
        size: 160,
        header: ({ column }) => <SortableHeader column={column} label="Recipient" />,
        cell: ({ row }) => <span className="font-bold text-foreground">{getCustomerName(row.getValue("customerId"))}</span>,
    },
    {
        accessorKey: "dispatchDate",
        size: 120,
        header: ({ column }) => <SortableHeader column={column} label="Date" />,
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Calendar className="w-3 h-3" /> {formatDate(row.getValue("dispatchDate"))}
            </div>
        )
    },
    {
        accessorKey: "location",
        size: 160,
        header: "Location",
        cell: ({ row }) => <span className="text-xs text-zinc-500">{row.getValue("location") || 'N/A'}</span>
    },
    {
        id: "actions",
        size: 60,
        enableResizing: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
            const dispatch = row.original
            return (
                <TableActions actions={[
                    { icon: Eye, label: "View dispatch", onClick: () => handleViewDetails(dispatch) },
                    { icon: Edit, label: "Edit dispatch", onClick: () => setEditingDispatch(dispatch) },
                    { icon: Trash2, label: "Delete dispatch", onClick: () => setDeleteId(dispatch.id), variant: "destructive" },
                ]} />
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
                    className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(row.original)}
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

      {/* Dispatch Detail Sheet */}
      <Sheet open={!!viewingDispatch} onOpenChange={(open) => !open && setViewingDispatch(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[460px] overflow-y-auto p-0">
          {viewingDispatch && (
            <>
              {/* Header */}
              <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Dispatch Record</span>
                    <SheetTitle className="font-mono text-lg font-bold text-foreground">{viewingDispatch.id.substring(0, 8).toUpperCase()}</SheetTitle>
                    <div className="text-xs text-zinc-500">{formatDate(viewingDispatch.dispatchDate, { includeTime: true })}</div>
                  </div>
                  <div className="shrink-0 px-2.5 py-1 rounded text-[10px] font-black tracking-tighter uppercase border bg-primary/10 text-primary border-primary/20">
                    DISPATCHED
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Dispatch Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Dispatch Info</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Recipient</span>
                      <span className="text-sm font-bold text-foreground">{getCustomerName(viewingDispatch.customerId)}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Destination</span>
                      <span className="text-sm font-bold text-foreground">{viewingDispatch.location || '—'}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Subscription Type</span>
                      <span className="text-sm font-bold text-foreground">{viewingDispatch.subscriptionType || '—'}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Installation Date</span>
                      <span className="text-sm font-bold text-foreground">
                        {viewingDispatch.installationDate ? formatDate(viewingDispatch.installationDate) : '—'}
                      </span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl border border-border col-span-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Dispatched By</span>
                      <span className="text-sm font-bold text-foreground">{viewingDispatch.dispatchedBy}</span>
                    </div>
                    {viewingDispatch.notes && (
                      <div className="p-3 bg-muted/30 rounded-xl border border-border col-span-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Notes
                        </span>
                        <span className="text-sm text-foreground whitespace-pre-wrap">{viewingDispatch.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bundle Contents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bundle Contents</h4>
                    {!isItemsLoading && (
                      <span className="text-[10px] font-bold text-zinc-500">{viewingItems.length} asset{viewingItems.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden bg-muted/10">
                    {isItemsLoading ? (
                      <div className="p-8 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-xs text-zinc-500 font-medium">Loading bundle...</span>
                      </div>
                    ) : viewingItems.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500 italic">No items in this bundle.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {viewingItems.map(item => (
                          <div key={item.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-primary/10 rounded-lg">
                                <Package className="w-3 h-3 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-mono text-xs font-bold text-foreground">{item.identifier}</span>
                                <span className="text-[9px] text-zinc-500 uppercase font-bold">{(item as any).assetType?.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sign-off */}
                {viewingDispatch.signOffPath && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sign-off Proof</h4>
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-xl">
                      {viewingDispatch.signOffPath.startsWith('FILE: ') ? (
                        <>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-foreground">{viewingDispatch.signOffPath.replace('FILE: ', '')}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] font-bold"
                            onClick={() => {
                              const filename = viewingDispatch.signOffPath?.replace('FILE: ', '') || 'proof.pdf';
                              window.open(`${API_BASE_URL}/proof/${filename}`, '_blank');
                            }}
                          >
                            View PDF
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm font-mono font-bold text-foreground">{viewingDispatch.signOffPath}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-border flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 font-bold"
                    onClick={() => { setViewingDispatch(null); setEditingDispatch(viewingDispatch); }}
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Metadata
                  </Button>
                  <Button
                    variant="destructive"
                    className="font-bold"
                    onClick={() => { setViewingDispatch(null); setDeleteId(viewingDispatch.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="subscriptionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Subscription Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/30 border-border">
                            <SelectValue placeholder="B2C / B2B" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="B2C">B2C</SelectItem>
                          <SelectItem value="B2B">B2B</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="installationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Installation Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-muted/30 border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Notes / Comments</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-muted/30 border-border resize-none min-h-[80px]" placeholder="Operational notes..." />
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
