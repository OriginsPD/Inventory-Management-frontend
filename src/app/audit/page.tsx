"use client"

import { useState, useEffect } from "react"
import { Search, Shield, Clock, User, Activity, Hash } from "lucide-react"
import { fetchAuditLogs } from "@/lib/api"
import { AuditLog } from "@/types/audit"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await fetchAuditLogs()
        setLogs(data)
      } catch (err: any) {
        toast({ title: "Error", description: "Could not retrieve audit history.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [toast])

  const filteredLogs = logs.filter(log => 
    log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center animate-pulse">Retrieving system ledger...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Audit Trail</h1>
        <p className="text-muted-foreground text-zinc-500">Immutable record of all inventory and user activities.</p>
      </div>

      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/50 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-400" /> Activity Ledger
            </CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Filter by user, action, or entity..."
                className="pl-8 border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border">
                <TableHead className="pl-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Clock className="w-3 h-3"/> Timestamp</div>
                </TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><User className="w-3 h-3"/> Performed By</div>
                </TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Activity className="w-3 h-3"/> Action</div>
                </TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Entity Target</TableHead>
                <TableHead className="pr-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Hash className="w-3 h-3"/> Target ID</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-zinc-400 italic">
                    No matching activity records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-zinc-50 hover:bg-muted/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-xs">{new Date(log.performedAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(log.performedAt).toLocaleTimeString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-foreground font-bold text-xs">{log.performedBy}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase",
                        log.action === 'CREATE' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        log.action === 'DELETE' ? "bg-red-50 text-red-700 border border-red-100" :
                        "bg-zinc-100 text-zinc-600 border border-border"
                      )}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-zinc-600 text-xs capitalize">{log.entityName.replace(/_/g, ' ')}</span>
                    </TableCell>
                    <TableCell className="pr-6 py-4">
                      <span className="font-mono text-[10px] text-zinc-400 select-all uppercase">
                        {log.entityId?.substring(0, 8)}...
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}



