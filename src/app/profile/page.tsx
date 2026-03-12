"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authClient } from "@/lib/auth-client"
import { fetchAuditLogs } from "@/lib/api"
import { AuditLog } from "@/types/audit"
import { User, Mail, Shield, Clock, Activity, Smartphone, Loader2, Edit } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { EmptyState } from "@/components/ui/empty-state"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [isEditOpen, setIsEditOpen] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  useEffect(() => {
    async function loadUserActivity() {
      if (!session?.user) return
      try {
        const result = await fetchAuditLogs({ limit: 50 })
        const allLogs = result.data
        const userActions = allLogs.filter(log =>
            log.performedBy === session.user.name ||
            log.performedBy === session.user.email ||
            log.performedBy === 'INVENTORY_OFFICER'
        )
        setLogs(userActions)
      } catch (err) {
        toast({ title: "Error", description: "Failed to load activity history.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    if (!sessionPending) {
        loadUserActivity()
    }
  }, [session, sessionPending, toast])

  const openEditDialog = () => {
    form.reset({
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    })
    setIsEditOpen(true)
  }

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await (authClient as any).updateUser({ name: values.name, email: values.email })
      toast({ title: "Profile Updated", description: "Your profile information has been saved." })
      setIsEditOpen(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update profile.", variant: "destructive" })
    }
  }

  if (sessionPending || loading) return (
    <div className="max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
    </div>
  )

  if (!session) return <div className="p-8 text-center text-zinc-500 italic">Unauthorized access. Please sign in.</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Profile Card */}
      <Card className="border-border shadow-md bg-card overflow-hidden rounded-2xl">
        <div className="h-24 bg-primary/10 border-b border-border" />
        <CardContent className="relative pt-0 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12">
                <div className="w-32 h-32 bg-primary rounded-2xl border-4 border-card flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                    {session.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 pb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{session.user.name}</h1>
                    <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                            <Mail className="w-4 h-4" /> {session.user.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-primary text-sm font-bold uppercase tracking-widest">
                            <Shield className="w-4 h-4" /> {(session.user as any).role || 'Viewer'}
                        </div>
                    </div>
                </div>
                <Button variant="outline" onClick={openEditDialog} className="border-border font-bold">
                    <Edit className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Activity Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-foreground">Personal Activity Ledger</h2>
                <p className="text-sm text-zinc-500">History of all inventory mutations performed by your account.</p>
            </div>
            <div className="bg-muted px-4 py-2 rounded-lg border border-border">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter mr-2 text-primary">Lifetime Actions</span>
                <span className="text-lg font-bold text-foreground">{logs.length}</span>
            </div>
        </div>

        <Card className="border-border shadow-sm bg-card overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6 py-4 text-[10px] uppercase font-bold text-zinc-500">Time-Stamp</TableHead>
                        <TableHead className="py-4 text-[10px] uppercase font-bold text-zinc-500">Action Type</TableHead>
                        <TableHead className="py-4 text-[10px] uppercase font-bold text-zinc-500">Target Entity</TableHead>
                        <TableHead className="pr-6 py-4 text-right text-[10px] uppercase font-bold text-zinc-500">Resource ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4}>
                                <EmptyState icon={<Clock size={44} />} title="No recorded activity" description="Your account actions will appear here once you make changes." />
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-medium text-xs">{formatDate(log.performedAt)}</span>
                                        <span className="text-[10px] text-zinc-400">{new Date(log.performedAt).toLocaleTimeString()}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase border",
                                        log.action === 'CREATE' || log.action.includes('REFILL') ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                        log.action === 'DELETE' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                        "bg-primary/10 text-primary border-primary/20"
                                    )}>
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-3 h-3 text-zinc-400" />
                                        <span className="text-zinc-600 text-xs capitalize font-medium">{log.entityName.replace(/_/g, ' ')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="pr-6 py-4 text-right">
                                    <span className="font-mono text-[10px] text-zinc-400 uppercase select-all">
                                        {log.entityId || 'BATCH_OP'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
            <DialogDescription>Update your name and email address.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Full Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your full name"
                        className="bg-muted/30 border-border"
                        {...field}
                      />
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
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Email Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="bg-muted/30 border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 font-bold mt-4"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
