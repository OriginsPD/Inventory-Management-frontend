"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchStatusDistributionReport, fetchInventoryByModelReport, fetchDevices, fetchStockTrend, fetchDispatchTrend } from "@/lib/api"
import { StatusDistributionReport, InventoryByModelReport } from "@/types/reports"
import { Device } from "@/types/devices"
import Link from "next/link"
import {
  Package,
  Send,
  CheckSquare,
  AlertTriangle,
  PlusCircle,
  Activity,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Wifi,
  History,
  ShieldCheck,
  AlertCircle,
  Bell,
  Info,
  BarChart2,
  PieChart as PieChartIcon,
  RefreshCw
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip as UITooltip, TooltipContent as UITooltipContent, TooltipProvider as UITooltipProvider, TooltipTrigger as UITooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts"

const COLORS = ["#f97316", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#64748b"];

export default function Home() {
  const [statusReport, setStatusReport] = useState<StatusDistributionReport[]>([])
  const [inventoryReport, setInventoryByModel] = useState<InventoryByModelReport[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [stockTrend, setStockTrend] = useState<any[]>([])
  const [dispatchTrend, setDispatchTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    async function loadStats() {
      try {
        const [stat, inv, devices, stkTrend, dspTrend] = await Promise.all([
          fetchStatusDistributionReport(),
          fetchInventoryByModelReport(),
          fetchDevices(),
          fetchStockTrend().catch(() => []),
          fetchDispatchTrend().catch(() => []),
        ])
        setStatusReport(stat)
        setInventoryByModel(inv)
        setAllDevices(devices)
        setStockTrend(Array.isArray(stkTrend) ? stkTrend : (stkTrend as any)?.rows || [])
        setDispatchTrend(Array.isArray(dspTrend) ? dspTrend : (dspTrend as any)?.rows || [])
      } catch (err) {
        console.error("Failed to load dashboard stats", err)
        setHasError(true)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const totalAssets = useMemo(() => {
    if (!Array.isArray(statusReport)) return 0;
    return statusReport.reduce((acc, curr) => acc + Number(curr.count || 0), 0);
  }, [statusReport]);
  
  const getCount = (status: string) => {
    if (!Array.isArray(statusReport)) return 0;
    return statusReport.find(s => s.status === status)?.count || 0
  }

  // Alerts & Notifications Logic
  const criticalModels = useMemo(() => {
      if (!Array.isArray(inventoryReport)) return [];
      return inventoryReport.filter(m => Number(m.totalStock || 0) <= Number(m.minStock || 0) && Number(m.minStock || 0) > 0);
  }, [inventoryReport]);

  const deactivatedSIMs = useMemo(() => {
      if (!Array.isArray(allDevices)) return [];
      return allDevices.filter(d => d.simPlanStatus === 'DEACTIVATED');
  }, [allDevices]);

  // Chart Data Formatting
  const statusData = useMemo(() => {
      if (!Array.isArray(statusReport)) return [];
      return statusReport.map(s => ({
          name: (s.status || 'UNKNOWN').replace('_', ' '),
          value: Number(s.count || 0)
      })).filter(s => s.value > 0);
  }, [statusReport]);

  const modelData = useMemo(() => {
      if (!Array.isArray(inventoryReport)) return [];
      return [...inventoryReport]
        .sort((a, b) => Number(b.totalStock || 0) - Number(a.totalStock || 0))
        .slice(0, 6)
        .map(m => ({
            name: m.modelName || 'Unknown',
            total: Number(m.totalStock || 0),
            min: Number(m.minStock || 0)
        }));
  }, [inventoryReport]);

  if (loading) return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    </div>
  )

  const anomalyCount = (getCount("DAMAGED") as number) + (getCount("FAIL") as number) + (getCount("RMA") as number)

  const stats = [
    { label: "Fleet Size", value: totalAssets, icon: Package, desc: "Global asset nodes", tooltip: undefined },
    { label: "Available", value: getCount("IN_STOCK"), icon: CheckSquare, desc: "Ready for field", tooltip: undefined },
    { label: "Field Deploy", value: getCount("DISPATCHED"), icon: Send, desc: "Active assignments", tooltip: undefined },
    { label: "Anomalies", value: anomalyCount, icon: AlertTriangle, desc: "Hardware failures", tooltip: "Devices with status DAMAGED, FAIL, or RMA" },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-primary" />
            Intelligence Terminal
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">System-wide inventory heuristics and real-time status.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-muted px-4 py-2 rounded-xl border border-border flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{(criticalModels.length + deactivatedSIMs.length)} Alerts active</span>
            </div>
            <Button size="lg" className="font-bold shadow-lg shadow-primary/20" asChild>
                <Link href="/dispatch">
                    <PlusCircle className="mr-2 h-5 w-5" /> Execute Dispatch
                </Link>
            </Button>
        </div>
      </div>

      <UITooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border shadow-md bg-card overflow-hidden transition-all hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                      <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                    {stat.tooltip && (
                      <UITooltip>
                        <UITooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
                        </UITooltipTrigger>
                        <UITooltipContent>
                          <p>{stat.tooltip}</p>
                        </UITooltipContent>
                      </UITooltip>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div className="text-4xl font-black text-foreground">{stat.value}</div>
                  <div className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10 uppercase tracking-tighter">
                      {stat.desc}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </UITooltipProvider>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1 border border-border">
                <TabsTrigger value="overview" className="px-6 font-bold uppercase text-[10px] tracking-widest">Analytics Overview</TabsTrigger>
                <TabsTrigger value="connectivity" className="px-6 font-bold uppercase text-[10px] tracking-widest">Connectivity Intelligence</TabsTrigger>
                <TabsTrigger value="alerts" className="px-6 font-bold uppercase text-[10px] tracking-widest flex gap-2">
                    Operational Alerts
                    {(criticalModels.length + deactivatedSIMs.length) > 0 && (
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                </TabsTrigger>
                <TabsTrigger value="trends" className="px-6 font-bold uppercase text-[10px] tracking-widest">Trends</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest hover:text-primary" asChild>
                <Link href="/reports">View detailed logs <ChevronRight className="ml-1 w-3 h-3"/></Link>
            </Button>
        </div>

        <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-2">
            {/* ... existing overview content ... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border shadow-md h-[450px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Stock distribution by Model</CardTitle>
                            <CardDescription>Primary hardware volume indexed against safety thresholds.</CardDescription>
                        </div>
                        <BarChart3 className="w-5 h-5 text-primary opacity-50" />
                    </CardHeader>
                    <CardContent className="h-[350px] pb-10">
                        {hasError ? (
                          <div className="flex items-center justify-center h-full gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Failed to load data</span>
                            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
                            </Button>
                          </div>
                        ) : modelData.length === 0 ? (
                          <EmptyState
                            icon={<BarChart2 size={40} />}
                            title="No model data available"
                            description="Add devices to see stock distribution by model."
                            className="h-full"
                          />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={modelData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{fill: '#94a3b8', fontSize: 10}}
                                />
                                <Tooltip
                                    cursor={{fill: 'rgba(0,0,0,0.04)'}}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                    }}
                                />
                                <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} />
                                <Bar dataKey="min" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md h-[450px] overflow-auto">
                    <CardHeader>
                        <CardTitle className="text-xl">Status Composition</CardTitle>
                        <CardDescription>Lifecycle state of global nodes.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {statusData.length === 0 ? (
                          <EmptyState
                            icon={<PieChartIcon size={36} />}
                            title="No status data"
                            description="Device status breakdown will appear here once assets are recorded."
                            className="h-full"
                          />
                        ) : (
                          <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ""}
                                        labelLine={false}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {statusData.map((s, i) => (
                                    <div key={s.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase truncate">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                          </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="connectivity" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-border shadow-md overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Global SIM Lifecycle Terminal</CardTitle>
                            <CardDescription>Real-time monitoring of carrier distribution and plan integrity.</CardDescription>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Active Links</p>
                                <p className="text-lg font-black text-foreground">{allDevices.filter(d => d.carrier).length}</p>
                            </div>
                            <div className="text-right border-l border-border pl-4">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Risk Level</p>
                                <p className="text-lg font-black text-amber-600">{deactivatedSIMs.length}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="pl-6 py-4 text-[10px] uppercase font-bold text-zinc-500">ICCID / Identifier</TableHead>
                                <TableHead className="py-4 text-[10px] uppercase font-bold text-zinc-500">Carrier</TableHead>
                                <TableHead className="py-4 text-[10px] uppercase font-bold text-zinc-500">Activation</TableHead>
                                <TableHead className="py-4 text-[10px] uppercase font-bold text-zinc-500">Plan Status</TableHead>
                                <TableHead className="pr-6 py-4 text-right text-[10px] uppercase font-bold text-zinc-500">Health Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allDevices.filter(d => d.carrier || d.msisdn).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-zinc-400 italic">No SIM-specialized metadata found in fleet.</TableCell>
                                </TableRow>
                            ) : (
                                allDevices.filter(d => d.carrier || d.msisdn).map(sim => {
                                    return (
                                        <TableRow key={sim.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                                            <TableCell className="pl-6 py-4 font-mono text-xs font-bold text-foreground uppercase">{sim.identifier}</TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <Wifi className="w-3 h-3 text-primary opacity-50" />
                                                    <span className="text-sm font-medium text-zinc-600">{sim.carrier || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-xs text-zinc-500">
                                                {sim.activationDate ? formatDate(sim.activationDate) : 'Pending'}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {sim.simPlanStatus ? (
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                                                        sim.simPlanStatus === 'ACTIVE'
                                                            ? "bg-green-50 text-green-700 border-green-200"
                                                            : "bg-red-50 text-red-600 border-red-200"
                                                    )}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", sim.simPlanStatus === 'ACTIVE' ? "bg-green-500" : "bg-red-500")} />
                                                        {sim.simPlanStatus}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-6 py-4 text-right">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                                                    sim.simPlanStatus === 'DEACTIVATED' ? "bg-red-50 text-red-600 border-red-200" :
                                                    sim.simPlanStatus === 'ACTIVE' ? "bg-green-50 text-green-700 border-green-200" :
                                                    "bg-zinc-50 text-zinc-500 border-zinc-200"
                                                )}>
                                                    {sim.simPlanStatus === 'DEACTIVATED' ? 'Deactivated' :
                                                     sim.simPlanStatus === 'ACTIVE' ? 'Active' : 'Unknown'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="alerts" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border shadow-md border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                        <div>
                            <CardTitle className="text-lg">Critical Stock Shortages</CardTitle>
                            <CardDescription>Models that have fallen below their safety margin.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {criticalModels.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400 italic text-sm border-2 border-dashed border-border rounded-xl">
                                All inventory levels within normal operating range.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {criticalModels.map(m => (
                                    <div key={m.modelId} className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                                        <div>
                                            <p className="font-bold text-foreground">{m.modelName}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{m.brand}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-red-600">{m.totalStock} <span className="text-[10px] text-zinc-400">/ min {m.minStock}</span></p>
                                            <Button size="sm" variant="link" className="h-auto p-0 text-primary font-bold text-[10px] uppercase" asChild>
                                                <Link href="/devices">Refill Stock</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 bg-amber-50 rounded-lg"><Wifi className="w-5 h-5 text-amber-600" /></div>
                        <div>
                            <CardTitle className="text-lg">Deactivated SIM Plans</CardTitle>
                            <CardDescription>SIM assets with a deactivated plan status requiring attention.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {deactivatedSIMs.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400 italic text-sm border-2 border-dashed border-border rounded-xl">
                                No SIM plans currently deactivated.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {deactivatedSIMs.map(sim => (
                                    <div key={sim.id} className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                                        <div>
                                            <p className="font-mono text-xs font-bold text-foreground">{sim.identifier}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{sim.carrier || 'Unknown Carrier'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase border bg-red-50 text-red-600 border-red-200">Deactivated</span>
                                            {sim.simPlanStatusChangedAt && (
                                                <p className="text-[10px] text-zinc-400 mt-1">Since: {formatDate(sim.simPlanStatusChangedAt)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="trends" className="animate-in fade-in slide-in-from-bottom-2">
          <Card className="border-border shadow-md h-[450px]">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Stock & Dispatch Trends
              </CardTitle>
              <CardDescription>Stock received vs dispatched over the last 12 months.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(() => {
                  const months = new Set<string>();
                  stockTrend.forEach((s: any) => months.add(s.month));
                  dispatchTrend.forEach((d: any) => months.add(d.month));
                  const stockMap = new Map(stockTrend.map((s: any) => [s.month, Number(s.total_received ?? 0)]));
                  const dispatchMap = new Map(dispatchTrend.map((d: any) => [d.month, Number(d.total_dispatched ?? 0)]));
                  return Array.from(months).sort().map(month => ({
                    month,
                    received: stockMap.get(month) ?? 0,
                    dispatched: dispatchMap.get(month) ?? 0,
                  }));
                })()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }} />
                  <Line type="monotone" dataKey="received" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} name="Stock Received" />
                  <Line type="monotone" dataKey="dispatched" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Dispatched" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border shadow-md">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" /> Rapid Action Workbench
                  </CardTitle>
                  <CardDescription>Shortcut to high-frequency maintenance tasks.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 border-border hover:border-primary group" asChild>
                      <Link href="/testing/start">
                          <Activity className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Bench QC</span>
                      </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 border-border hover:border-primary group" asChild>
                      <Link href="/devices">
                          <TrendingUp className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Rapid Refill</span>
                      </Link>
                  </Button>
              </CardContent>
          </Card>

          <div className="p-8 bg-primary/5 rounded-3xl border border-dashed border-primary/20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div>
                  <h4 className="text-xl font-bold text-foreground">Operational Growth</h4>
                  <p className="text-sm text-zinc-500 max-w-xs mt-2 italic leading-relaxed">
                      &quot;System throughput is optimized for rapid hardware cycles. Every scanned barcode strengthens the core intelligence ledger.&quot;
                  </p>
              </div>
          </div>
      </div>
    </div>
  )
}
