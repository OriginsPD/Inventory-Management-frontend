"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    UserPlus,
    Mail,
    Phone,
    Trash2,
    Edit,
    Eye,
    User,
    Fingerprint,
    Calendar,
    Briefcase,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Loader2,
    Users
} from "lucide-react"
import { SortableHeader } from "@/components/ui/sortable-header"
import { TableActions } from "@/components/ui/table-actions"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { fetchCustomers, createCustomer, deleteCustomer, updateCustomer } from "@/lib/api"
import { Customer } from "@/types/customers"
import { useToast } from "@/hooks/use-toast"
import { cn, formatDate } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().min(5, { message: "Phone number is required." }).optional().or(z.literal('')),
})

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "" },
  })

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (editingCustomer) {
      editForm.reset({
        name: editingCustomer.name,
        email: editingCustomer.email || "",
        phone: editingCustomer.phone || "",
      })
    }
  }, [editingCustomer, editForm])

  useEffect(() => {
    if (!isAddOpen) {
      form.reset()
    }
  }, [isAddOpen, form])

  async function loadCustomers() {
    try {
      const data = await fetchCustomers()
      setCustomers(data)
    } catch (err: any) {
      toast({ title: "Error", description: "Could not load customers.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const created = await createCustomer(values as any)
      setCustomers((prev) => [created, ...prev])
      form.reset()
      setIsAddOpen(false)
      toast({ title: "Success", description: "Customer registered." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  async function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (!editingCustomer) return
    try {
      const updated = await updateCustomer(editingCustomer.id, values as any)
      setCustomers((prev) => prev.map(c => c.id === updated.id ? updated : c))
      setEditingCustomer(null)
      toast({ title: "Updated", description: "Customer details updated." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteCustomer(deleteId)
      setCustomers((prev) => prev.filter((c) => c.id !== deleteId))
      toast({ title: "Removed", description: "Customer deleted successfully." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setDeleteId(null)
    }
  }

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      size: 200,
      header: ({ column }) => <SortableHeader column={column} label="Customer" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                {(row.getValue("name") as string).charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-foreground">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      id: "contact",
      size: 220,
      header: "Contact Details",
      cell: ({ row }) => {
        const email = row.original.email
        const phone = row.original.phone
        return (
            <div className="space-y-1">
                {email && (
                    <div className="flex items-center text-xs text-zinc-500">
                        <Mail className="w-3 h-3 mr-1.5 opacity-70 text-primary" /> {email}
                    </div>
                )}
                {phone && (
                    <div className="flex items-center text-xs text-zinc-500">
                        <Phone className="w-3 h-3 mr-1.5 opacity-70 text-primary" /> {phone}
                    </div>
                )}
            </div>
        )
      }
    },
    {
      accessorKey: "createdAt",
      size: 120,
      header: ({ column }) => <SortableHeader column={column} label="Joined" />,
      cell: ({ row }) => <div className="text-zinc-400 text-xs">{formatDate(row.getValue("createdAt"))}</div>,
    },
    {
      id: "actions",
      size: 60,
      enableResizing: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const customer = row.original
        return (
          <TableActions actions={[
            { icon: Eye, label: "View customer", onClick: () => setViewingCustomer(customer) },
            { icon: Edit, label: "Edit customer", onClick: () => setEditingCustomer(customer) },
            { icon: Trash2, label: "Delete customer", onClick: () => setDeleteId(customer.id), variant: "destructive" },
          ]} />
        )
      },
    },
  ]

  const table = useReactTable({
    data: customers,
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
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <Card className="border-border shadow-md">
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-muted-foreground text-zinc-500">Manage your client base and their contact information.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="shadow-md font-bold h-11 px-6">
              <UserPlus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" /> New Customer
              </DialogTitle>
              <DialogDescription>Register a new client entity in the system ledger.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full Name / Company Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation" className="bg-muted/30 border-border h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Primary Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="billing@acme.com" className="bg-muted/30 border-border h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Direct Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" className="bg-muted/30 border-border h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-14 font-bold text-lg shadow-xl shadow-primary/10">
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {form.formState.isSubmitting ? 'Registering...' : 'Register Customer'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-border shadow-md overflow-hidden bg-card flex flex-col h-[650px]">
        <CardHeader className="bg-muted/30 border-b border-border py-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Active Client Registry
                </CardTitle>
                <div className="relative w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search by name..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="pl-8 bg-card border-border h-9 text-sm"
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
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
                  <TableCell colSpan={columns.length}>
                    <EmptyState icon={<Users size={44} />} title="No customers found" description="Add your first customer using the button above." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <div className="text-xs text-zinc-500">
                Total Clients: <span className="font-bold text-foreground">{customers.length}</span>
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

      {/* View Detail Modal */}
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <Briefcase className="w-6 h-6 text-primary"/> Customer Profile
            </DialogTitle>
            <DialogDescription>Full contact and registration history.</DialogDescription>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-2xl">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20">
                        {viewingCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">{viewingCustomer.name}</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                            <Fingerprint className="w-3 h-3 text-primary"/> System ID: {viewingCustomer.id.substring(0, 8)}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                        <div className="p-2 bg-primary/5 rounded-lg">
                            <Mail className="w-4 h-4 text-primary"/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Verified Email</span>
                            <span className="text-sm font-medium text-foreground">{viewingCustomer.email || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                        <div className="p-2 bg-primary/5 rounded-lg">
                            <Phone className="w-4 h-4 text-primary"/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Primary Contact</span>
                            <span className="text-sm font-medium text-foreground">{viewingCustomer.phone || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-muted/20 border border-dashed border-border rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chronological Metadata</h4>
                        <Calendar className="w-4 h-4 text-zinc-400"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                            <span className="text-zinc-400 block text-[10px] uppercase font-bold">Created At</span>
                            <span className="text-foreground font-mono">{new Date(viewingCustomer.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-zinc-400 block text-[10px] uppercase font-bold">Last Activity</span>
                            <span className="text-foreground font-mono">{new Date(viewingCustomer.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Purge Customer Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this customer? This action is immutable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold">
              Execute Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="w-6 h-6 text-primary" /> Edit Profile
            </DialogTitle>
            <DialogDescription>Update contact parameters for this client entity.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full Name / Entity</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-muted/30 border-border h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contact Email</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-muted/30 border-border h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Direct Phone</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-muted/30 border-border h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-4 border-t border-border">
                <Button type="submit" disabled={editForm.formState.isSubmitting} className="w-full h-14 font-bold text-lg shadow-xl shadow-primary/10">
                  {editForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editForm.formState.isSubmitting ? 'Saving...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
