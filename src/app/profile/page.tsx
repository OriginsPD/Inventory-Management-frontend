"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { fetchAuditLogs } from "@/lib/api"
import { AuditLog } from "@/types/audit"
import { User, Mail, Shield, Clock, Activity, Hash, Smartphone, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadUserActivity() {
      if (!session?.user) return
      try {
        const allLogs = await fetchAuditLogs()
        // Filter logs where performedBy matches current user name or email
        const userActions = allLogs.filter(log => 
            log.performedBy === session.user.name || 
            log.performedBy === session.user.email ||
            log.performedBy === 'INVENTORY_OFFICER' // Temporary fallback for system assigned actions
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
                            <TableCell colSpan={4} className="h-64 text-center text-zinc-500 italic">
                                <div className="flex flex-col items-center gap-3 opacity-40">
                                    <Clock className="w-10 h-10" />
                                    <p>No recorded activity found for this account.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-medium text-xs">{new Date(log.performedAt).toLocaleDateString()}</span>
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
    </div>
  )
}
