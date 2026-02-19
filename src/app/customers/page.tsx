"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserPlus, Mail, Phone, Trash2, Edit, Eye, User, Fingerprint, Calendar, Briefcase } from "lucide-react"

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

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().min(5, { message: "Phone number is required." }).optional().or(z.literal('')),
})

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
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

  if (loading) return <div className="p-8 text-center animate-pulse">Loading customers...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-muted-foreground text-slate-500">Manage your client base and their contact information.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
              <UserPlus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Customer</DialogTitle>
              <DialogDescription>Add a new individual or business to the database.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name / Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="billing@acme.com" {...field} />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-2">Save Customer</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px] pl-6 font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Contact Details</TableHead>
                <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-slate-400">
                    No customers registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-xs text-slate-500">
                            <Mail className="w-3 h-3 mr-1.5 opacity-70" /> {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-xs text-slate-500">
                            <Phone className="w-3 h-3 mr-1.5 opacity-70" /> {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setViewingCustomer(customer)}
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingCustomer(customer)}
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteId(customer.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Detail Modal */}
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600"/> Customer Profile
            </DialogTitle>
            <DialogDescription>Full contact and registration history.</DialogDescription>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {viewingCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">{viewingCustomer.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1"><Fingerprint className="w-3 h-3"/> ID: {viewingCustomer.id.substring(0, 8)}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Mail className="w-4 h-4 text-blue-500"/>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                            <span className="text-sm">{viewingCustomer.email || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Phone className="w-4 h-4 text-blue-500"/>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                            <span className="text-sm">{viewingCustomer.phone || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata</h4>
                        <Calendar className="w-4 h-4 text-slate-600"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-slate-500 block mb-1">Created At</span>
                            <span>{new Date(viewingCustomer.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block mb-1">Updated At</span>
                            <span>{new Date(viewingCustomer.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this customer? This will also affect their history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update contact information.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2">Save Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}



