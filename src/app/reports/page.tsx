"use client"

import { useState, useEffect, useMemo } from "react"
import {
  fetchInventoryByModelReport,
  fetchStatusDistributionReport,
  fetchDispatchReportSummary,
  fetchDamageReportSummary,
  fetchDevices,
  fetchCustomers,
  fetchTestingSummary,
  fetchReplacementsSummary,
  fetchDispatchItems
} from "@/lib/api"
import { 
  InventoryByModelReport, 
  StatusDistributionReport, 
  DispatchReportSummary, 
  DamageReportSummary 
} from "@/types/reports"
import { Device } from "@/types/devices"
import { Customer } from "@/types/customers"
import { 
  BarChart3, 
  Package, 
  Send, 
  AlertTriangle, 
  ChevronRight, 
  Info,
  Calendar,
  User,
  MapPin,
  ClipboardList,
  Eye,
  Download,
  Search,
  CheckCircle2,
  FileText,
  FileSpreadsheet
} from "lucide-react"
import { TableActions } from "@/components/ui/table-actions"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import * as XLSX from 'xlsx'

type ReportType = "inventory" | "status" | "dispatch" | "damage"

const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || 'IMS';

export default function ReportsPage() {
  const [inventoryReport, setInventoryByModel] = useState<InventoryByModelReport[]>([])
  const [statusReport, setStatusDistribution] = useState<StatusDistributionReport[]>([])
  const [dispatchReport, setDispatchSummary] = useState<DispatchReportSummary[]>([])
  const [damageReport, setDamageSummary] = useState<DamageReportSummary[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [testingSummary, setTestingSummary] = useState<any>(null)
  const [replacementsSummary, setReplacementsSummary] = useState<any[]>([])
  const [dispatchItems, setDispatchItems] = useState<any[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Date range filter state
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<{ type: ReportType, data: any } | null>(null)

  // Data Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  
  const { toast } = useToast()

  useEffect(() => {
    async function loadReports() {
      try {
        const [inv, stat, disp, dmg, devices, customers, testing, replacements] = await Promise.all([
          fetchInventoryByModelReport(),
          fetchStatusDistributionReport(),
          fetchDispatchReportSummary(),
          fetchDamageReportSummary(),
          fetchDevices(),
          fetchCustomers(),
          fetchTestingSummary(),
          fetchReplacementsSummary(),
        ])
        setInventoryByModel(inv)
        setStatusDistribution(stat)
        setDispatchSummary(disp)
        setDamageSummary(dmg)
        setAllDevices(devices)
        setAllCustomers(customers)
        setTestingSummary(testing)
        setReplacementsSummary(replacements)
      } catch (err: any) {
        toast({
          title: "Failed to load reports",
          description: err.message,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [toast])

  const handleDateFilter = async () => {
    try {
      const disp = await fetchDispatchReportSummary(startDate || undefined, endDate || undefined)
      setDispatchSummary(disp)
    } catch (err: any) {
      toast({ title: "Filter Error", description: err.message, variant: "destructive" })
    }
  }

  const totalDevices = statusReport.reduce((acc, curr) => acc + Number(curr.count), 0)

  // Excel Export Logic
  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: `Report saved as ${fileName}.xlsx`,
    });
  };

  const handleExportSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast({
        title: "No rows selected",
        description: "Please select records to export, or use 'Export All'.",
        variant: "destructive"
      });
      return;
    }
    const dataToExport = selectedRows.map(row => {
        const d = row.original as any;
        const cust = allCustomers.find(c => c.id === d.customerId);
        return {
            Date: new Date(d.dispatchDate).toLocaleDateString(),
            Recipient: cust?.name || 'Unknown',
            Location: d.location || 'Central Warehouse',
            Dispatcher: d.dispatchedBy,
            Assets: d.items || 'Single Item',
            Reference: d.signOffPath || 'N/A'
        };
    });
    exportToExcel(dataToExport, `Selected_Movement_Log_${new Date().getTime()}`);
  };

  const handleMasterExport = () => {
    // 1. Prepare Inventory Tab
    const inventoryData = inventoryReport.map(item => ({
        'Hardware Model': item.modelName,
        'Brand': item.brand,
        'Asset Type': allDevices.find(d => d.modelId === item.modelId)?.modelName ? // Fallback if needed
                      allDevices.find(d => d.modelId === item.modelId)?.brand : 'Unknown', 
        'Min Threshold': item.minStock,
        'Actual Stock': item.totalStock,
        'Status': item.totalStock <= item.minStock ? 'CRITICAL' : 'OPTIMAL'
    }));

    // 2. Prepare Movement Log Tab
    const movementData = dispatchReport.map(d => {
        const cust = allCustomers.find(c => c.id === d.customerId);
        return {
            'Dispatch Date': new Date(d.dispatchDate).toLocaleDateString(),
            'Recipient Name': cust?.name || 'Unknown',
            'Facility Location': d.location || 'Central Warehouse',
            'Dispatcher': d.dispatchedBy,
            'Bundle Assets': d.items || 'Primary ID Only',
            'Digital Reference': d.signOffPath || 'N/A'
        };
    });

    // 3. Prepare Anomaly Tab
    const anomalyData = damageReport.map(dmg => {
        const dev = allDevices.find(d => d.id === dmg.deviceId);
        return {
            'Report Date': new Date(dmg.reportedDate || "").toLocaleDateString(),
            'Asset Identifier': dev?.identifier || 'Unknown',
            'Issue Description': dmg.issueDescription,
            'Logged By': dmg.reportedBy || 'System'
        };
    });

    const wb = XLSX.utils.book_new();
    
    const wsInv = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, wsInv, "Inventory Summary");

    const wsMov = XLSX.utils.json_to_sheet(movementData);
    XLSX.utils.book_append_sheet(wb, wsMov, "Movement Logs");

    const wsDmg = XLSX.utils.json_to_sheet(anomalyData);
    XLSX.utils.book_append_sheet(wb, wsDmg, "Anomaly Reports");

    XLSX.writeFile(wb, `${ORG_NAME}_Master_Export_${new Date().getTime()}.xlsx`);
    
    toast({
      title: "Master Export Complete",
      description: "Generated multi-tab workbook for review.",
    });
  };

  // Data Table Columns Configuration
  const columns: ColumnDef<DispatchReportSummary>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] border-zinc-400"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] border-zinc-400"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "dispatchDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="font-medium text-foreground">
          {new Date(row.getValue("dispatchDate")).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: "customerId",
      header: "Recipient",
      cell: ({ row }) => {
        const cust = allCustomers.find(c => c.id === row.getValue("customerId"));
        if (!cust) return <Skeleton className="h-4 w-24" />;
        return <div className="text-zinc-600 font-medium">{cust.name}</div>;
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center text-zinc-500 text-xs">
          <MapPin className="w-3 h-3 mr-1 opacity-50" />
          {row.getValue("location") || "Central Warehouse"}
        </div>
      ),
    },
    {
      id: "actions",
      size: 60,
      enableResizing: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <TableActions actions={[
          {
            icon: Eye,
            label: "View report",
            onClick: async () => {
              setSelectedReport({ type: "dispatch", data: row.original });
              setIsLoadingItems(true);
              try {
                const items = await fetchDispatchItems(row.original.id);
                setDispatchItems(items);
              } catch {
                setDispatchItems([]);
              } finally {
                setIsLoadingItems(false);
              }
            },
          },
        ]} />
      ),
    },
  ], [allCustomers]);

  const table = useReactTable({
    data: dispatchReport,
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
  })

  const renderDetailContent = () => {
    if (!selectedReport) return null

    switch (selectedReport.type) {
      case "inventory":
        return (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">ID / Identifier</TableHead>
                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDevices
                .filter(d => d.modelId === selectedReport.data.modelId)
                .map(device => (
                  <TableRow key={device.id} className="border-border/40">
                    <TableCell className="font-mono text-xs">{device.identifier}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-zinc-600 uppercase">
                        {device.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )
      case "dispatch":
        const customer = allCustomers.find(c => c.id === selectedReport.data.customerId)
        return (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600"><User className="w-3 h-3"/> Recipient</CardDescription>
                  <CardTitle className="text-base text-zinc-600 font-bold">{customer?.name || 'Unknown'}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-500">
                  {customer?.email}<br/>{customer?.phone}
                </CardContent>
              </Card>
              <Card className="bg-muted border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600"><FileText className="w-3 h-3"/> Logistics Ref</CardDescription>
                  <CardTitle className="text-base text-zinc-600 font-mono font-bold">{selectedReport.data.signOffPath || 'NO_REF'}</CardTitle>
                </CardHeader>
                <CardContent className="text-[10px] text-zinc-500 uppercase font-bold">
                  Digital Signature Stored
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Package className="w-3 h-3"/> Bundle Node Breakdown
                </h4>
                {isLoadingItems ? (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex justify-center">
                    <span className="text-xs text-zinc-500">Loading items...</span>
                  </div>
                ) : dispatchItems.length > 0 ? (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-1 max-h-32 overflow-y-auto">
                    {dispatchItems.map((item: any) => (
                      <p key={item.id} className="text-sm font-mono font-bold text-primary">
                        {item.identifier}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                    <p className="text-sm font-mono font-bold text-primary break-all leading-relaxed">
                        {selectedReport.data.items || 'Primary Asset Record Only'}
                    </p>
                  </div>
                )}
            </div>

            <div className="space-y-3 px-1">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-zinc-600" />
                <span className="font-bold text-foreground w-24">Date:</span>
                <span className="text-zinc-500">{new Date(selectedReport.data.dispatchDate).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-zinc-600" />
                <span className="font-bold text-foreground w-24">Location:</span>
                <span className="text-zinc-500">{selectedReport.data.location || 'Not Specified'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-zinc-600" />
                <span className="font-bold text-foreground w-24">Dispatcher:</span>
                <span className="text-zinc-500">{selectedReport.data.dispatchedBy}</span>
              </div>
            </div>
          </div>
        )
      case "damage":
        const damagedDevice = allDevices.find(d => d.id === selectedReport.data.deviceId)
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted border border-border rounded-lg">
              <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Issue Description</h4>
              <p className="text-sm text-foreground font-medium leading-relaxed">&quot;{selectedReport.data.issueDescription}&quot;</p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-sm px-1">
              <div>
                <span className="block font-bold text-zinc-600 uppercase text-[10px] mb-1">Asset Identifier</span>
                <span className="font-mono text-foreground">{damagedDevice?.identifier}</span>
              </div>
              <div>
                <span className="block font-bold text-zinc-600 uppercase text-[10px] mb-1">Reported Date</span>
                <span className="text-foreground">{new Date(selectedReport.data.reportedDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block font-bold text-zinc-600 uppercase text-[10px] mb-1">Reported By</span>
                <span className="text-foreground">{selectedReport.data.reportedBy || 'Unknown'}</span>
              </div>
            </div>
          </div>
        )
      default:
        return <p>No details available for this report type.</p>
    }
  }

  if (loading) return (
    <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div className="space-y-2">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-4 w-[400px]" />
            </div>
            <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-2xl" />
    </div>
  )

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Intelligence Reports</h1>
          <p className="text-muted-foreground text-lg">Inventory and asset lifecycle analysis.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportSelected} className="border-border bg-card">
                <Download className="w-4 h-4 mr-2" /> Export Selection
            </Button>
            <Button variant="default" size="sm" onClick={handleMasterExport} className="shadow-lg shadow-primary/20 font-bold">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Master Master Export
            </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-sm bg-zinc-900 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">Total Active Assets</CardDescription>
            <CardTitle className="text-4xl font-bold text-zinc-600">{totalDevices}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-zinc-500 font-medium">
              <Package className="w-3 h-3 mr-1 opacity-50" /> System-wide count
            </div>
          </CardContent>
        </Card>
        {statusReport.map((stat) => (
          <Card key={stat.status} className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="capitalize font-bold text-[10px] text-zinc-500 tracking-widest">
                {stat.status.replace(/_/g, ' ')}
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-zinc-600">
                {stat.count}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${(Number(stat.count) / totalDevices) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory By Model Breakdown */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-zinc-600" /> Inventory by Model
            </CardTitle>
            <CardDescription>Select a definition to view individual units.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {inventoryReport.map((item) => (
                <div 
                  key={item.modelId} 
                  className="group cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors flex flex-col"
                  onClick={() => setSelectedReport({ type: "inventory", data: item })}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-foreground">{item.brand} {item.modelName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 font-bold bg-muted px-2 py-0.5 rounded text-xs">{item.totalStock}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-zinc-400 h-full group-hover:bg-primary transition-colors" 
                      style={{ width: `${(Number(item.totalStock) / totalDevices) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Damage Logs Breakdown */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-zinc-600" /> Recent Anomaly Reports
            </CardTitle>
            <CardDescription>Reported hardware issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {damageReport.slice(0, 5).map((dmg) => (
                <div 
                  key={dmg.id} 
                  className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors group"
                  onClick={() => setSelectedReport({ type: "damage", data: dmg })}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-white">{dmg.issueDescription}</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                      ID: {dmg.id.substring(0, 8)} • {dmg.reportedDate ? new Date(dmg.reportedDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Info className="w-4 h-4 text-zinc-600 group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QC Testing Summary Card */}
      {testingSummary && (
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-zinc-600" /> QC Testing Summary
            </CardTitle>
            <CardDescription>Pass/fail breakdown for device testing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-2xl font-bold text-emerald-700">{testingSummary.passCount}</p>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mt-1">Pass</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-2xl font-bold text-red-700">{testingSummary.failCount}</p>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mt-1">Fail</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-2xl font-bold text-primary">{testingSummary.passRate}%</p>
                <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replacement History Table */}
      {replacementsSummary.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-zinc-600" /> Replacement History
            </CardTitle>
            <CardDescription>Recent device replacements.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-500 py-3">Old Device</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-500 py-3">New Device</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-500 py-3">Reason</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-500 py-3">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replacementsSummary.slice(0, 10).map((r: any) => (
                  <TableRow key={r.id} className="border-border/40 hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{r.oldDeviceId?.substring(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">{r.newDeviceId?.substring(0, 8)}...</TableCell>
                    <TableCell className="text-xs text-zinc-500">{r.reason}</TableCell>
                    <TableCell className="text-xs text-zinc-400">{r.replacementDate ? new Date(r.replacementDate).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Movement Log - Data Table Implementation */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="w-5 h-5 text-zinc-600" /> Movement Log Intelligence
              </CardTitle>
              <CardDescription>Advanced data grid with multi-select and filtering.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 border-border bg-card w-[150px] text-xs"
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 border-border bg-card w-[150px] text-xs"
                placeholder="End date"
              />
              <Button size="sm" onClick={handleDateFilter} className="h-9 font-bold text-xs">Filter</Button>
              <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                      placeholder="Filter records..."
                      value={(table.getColumn("customerId")?.getFilterValue() as string) ?? ""}
                      onChange={(event) =>
                          table.getColumn("customerId")?.setFilterValue(event.target.value)
                      }
                      className="pl-10 h-10 border-border bg-card w-full md:w-[200px]"
                  />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-none">
            <Table>
              <TableHeader className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 py-4">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-border/40 hover:bg-muted/50 transition-colors"
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
                    <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500 italic">
                      No matching intelligence records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <div className="flex-1 text-sm text-zinc-500">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border bg-card"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border bg-card"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail View Modal */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[600px] border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <ClipboardList className="w-5 h-5 text-zinc-600" />
              {selectedReport?.type === 'inventory' ? 'Asset Inventory' : 
               selectedReport?.type === 'dispatch' ? 'Dispatch Certification' : 'Internal Anomaly Log'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Detailed system record analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-1 border-t border-border mt-2">
            {renderDetailContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
