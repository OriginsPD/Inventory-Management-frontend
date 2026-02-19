"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  fetchInventoryByModelReport, 
  fetchStatusDistributionReport, 
  fetchDispatchReportSummary, 
  fetchDamageReportSummary,
  fetchDevices,
  fetchCustomers
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
  CheckCircle2
} from "lucide-react"

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
import * as XLSX from 'xlsx'

type ReportType = "inventory" | "status" | "dispatch" | "damage"

export default function ReportsPage() {
  const [inventoryReport, setInventoryByModel] = useState<InventoryByModelReport[]>([])
  const [statusReport, setStatusDistribution] = useState<StatusDistributionReport[]>([])
  const [dispatchReport, setDispatchSummary] = useState<DispatchReportSummary[]>([])
  const [damageReport, setDamageSummary] = useState<DamageReportSummary[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  
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
        const [inv, stat, disp, dmg, devices, customers] = await Promise.all([
          fetchInventoryByModelReport(),
          fetchStatusDistributionReport(),
          fetchDispatchReportSummary(),
          fetchDamageReportSummary(),
          fetchDevices(),
          fetchCustomers()
        ])
        setInventoryByModel(inv)
        setStatusDistribution(stat)
        setDispatchSummary(disp)
        setDamageSummary(dmg)
        setAllDevices(devices)
        setAllCustomers(customers)
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
            DeviceID: d.deviceId
        };
    });
    exportToExcel(dataToExport, `Selected_Movement_Log_${new Date().getTime()}`);
  };

  const handleExportAll = () => {
    const dataToExport = dispatchReport.map(d => {
        const cust = allCustomers.find(c => c.id === d.customerId);
        return {
            Date: new Date(d.dispatchDate).toLocaleDateString(),
            Recipient: cust?.name || 'Unknown',
            Location: d.location || 'Central Warehouse',
            Dispatcher: d.dispatchedBy,
            DeviceID: d.deviceId
        };
    });
    exportToExcel(dataToExport, `Full_Movement_Log_${new Date().getTime()}`);
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
        return <div className="text-zinc-600 font-medium">{cust?.name || "Loading..."}</div>;
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
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-600 hover:text-foreground"
            onClick={() => setSelectedReport({ type: "dispatch", data: row.original })}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
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
                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">IMEI</TableHead>
                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">Serial</TableHead>
                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDevices
                .filter(d => d.modelId === selectedReport.data.modelId)
                .map(device => (
                  <TableRow key={device.id} className="border-border/40">
                    <TableCell className="font-mono text-xs">{device.imei}</TableCell>
                    <TableCell className="text-xs">{device.serialNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase">
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
        const device = allDevices.find(d => d.id === selectedReport.data.deviceId)
        return (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600"><User className="w-3 h-3"/> Recipient</CardDescription>
                  <CardTitle className="text-base text-zinc-600">{customer?.name || 'Unknown'}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-500">
                  {customer?.email}<br/>{customer?.phone}
                </CardContent>
              </Card>
              <Card className="bg-muted border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600"><Package className="w-3 h-3"/> Asset</CardDescription>
                  <CardTitle className="text-base text-zinc-600">{device?.imei || 'Unknown'}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-500">
                  {(device as any)?.modelName}<br/>{device?.serialNumber}
                </CardContent>
              </Card>
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
              <p className="text-sm text-foreground font-medium leading-relaxed">"{selectedReport.data.issueDescription}"</p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-sm px-1">
              <div>
                <span className="block font-bold text-zinc-600 uppercase text-[10px] mb-1">Asset IMEI</span>
                <span className="font-mono text-foreground">{damagedDevice?.imei}</span>
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

  if (loading) return <div className="p-8 text-center animate-pulse">Analyzing reports...</div>

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Intelligence Reports</h1>
          <p className="text-muted-foreground text-lg">Inventory and asset lifecycle analysis.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportSelected} className="border-border bg-card">
                <Download className="w-4 h-4 mr-2" /> Export Selected
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll} className="border-border bg-card">
                <Download className="w-4 h-4 mr-2" /> Export All
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
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                    placeholder="Filter records..."
                    value={(table.getColumn("customerId")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("customerId")?.setFilterValue(event.target.value)
                    }
                    className="pl-10 h-10 border-border bg-card w-full md:w-[250px]"
                />
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
