"use client"

import { useState, useEffect } from "react"
import { fetchStatusDistributionReport, fetchInventoryByModelReport } from "@/lib/api"
import { StatusDistributionReport, InventoryByModelReport } from "@/types/reports"
import Link from "next/link"
import { 
  Package, 
  Send, 
  CheckSquare, 
  AlertTriangle, 
  PlusCircle,
  Activity
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export default function Home() {
  const [statusReport, setStatusReport] = useState<StatusDistributionReport[]>([])
  const [inventoryReport, setInventoryByModel] = useState<InventoryByModelReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [stat, inv] = await Promise.all([
          fetchStatusDistributionReport(),
          fetchInventoryByModelReport()
        ])
        setStatusReport(stat)
        setInventoryByModel(inv)
      } catch (err) {
        console.error("Failed to load dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const getCount = (status: string) => {
    return statusReport.find(s => s.status === status)?.count || 0
  }

  const totalAssets = statusReport.reduce((acc, curr) => acc + Number(curr.count), 0)

  if (loading) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>

  const stats = [
    { 
      label: "Total Assets", 
      value: totalAssets, 
      icon: Package, 
      color: "text-zinc-600", 
      bg: "bg-zinc-100",
      description: "All registered devices"
    },
    { 
      label: "In Stock", 
      value: getCount("IN_STOCK"), 
      icon: CheckSquare, 
      color: "text-zinc-600", 
      bg: "bg-zinc-100",
      description: "Available for dispatch"
    },
    { 
      label: "Dispatched", 
      value: getCount("DISPATCHED"), 
      icon: Send, 
      color: "text-zinc-600", 
      bg: "bg-zinc-100",
      description: "With customers"
    },
    { 
      label: "Damaged", 
      value: getCount("DAMAGED"), 
      icon: AlertTriangle, 
      color: "text-zinc-600", 
      bg: "bg-zinc-100",
      description: "Requires attention"
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Internal Inventory Command Center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {stat.label}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-600">{stat.value}</div>
              <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-tight">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inventory Core Breakdown</CardTitle>
              <CardDescription>Stock levels indexed by model definition.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href="/reports">Full Analysis</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="w-[300px] text-zinc-500 text-[10px] uppercase font-bold">Model</TableHead>
                  <TableHead className="text-zinc-500 text-[10px] uppercase font-bold">Brand</TableHead>
                  <TableHead className="text-right text-zinc-500 text-[10px] uppercase font-bold">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-zinc-400 italic">No inventory data available.</TableCell>
                  </TableRow>
                ) : (
                  inventoryReport.slice(0, 5).map((item) => (
                    <TableRow key={item.modelId} className="border-zinc-50">
                      <TableCell className="font-medium text-foreground">{item.modelName}</TableCell>
                      <TableCell className="text-zinc-500">{item.brand}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center min-w-8 h-6 rounded bg-zinc-100 text-zinc-600 text-xs font-bold px-2">
                          {item.totalStock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>System Actions</CardTitle>
            <CardDescription>Execute core inventory operations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button className="w-full justify-start gap-2 h-11 border-border hover:bg-muted" variant="outline" asChild>
              <Link href="/dispatch">
                <Send className="w-4 h-4 text-zinc-600" /> Dispatch Asset
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2 h-11 border-border hover:bg-muted" variant="outline" asChild>
              <Link href="/devices">
                <PlusCircle className="w-4 h-4 text-zinc-600" /> Register Stock
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2 h-11 border-border hover:bg-muted" variant="outline" asChild>
              <Link href="/testing/start">
                <Activity className="w-4 h-4 text-zinc-600" /> Technical QC
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2 h-11 border-border hover:bg-muted" variant="outline" asChild>
              <Link href="/damage/log">
                <AlertTriangle className="w-4 h-4 text-zinc-600" /> Report Anomaly
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




