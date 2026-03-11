"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { fetchUsers, updateUserRole } from "@/lib/api"
import { User } from "@/types/users"
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
import { UserCog, ChevronDown, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const ROLES = ['ADMIN', 'INVENTORY_OFFICER', 'VIEWER'] as const

const roleBadgeClass = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-red-50 text-red-700 border border-red-100'
    case 'INVENTORY_OFFICER': return 'bg-blue-50 text-blue-700 border border-blue-100'
    default: return 'bg-muted text-zinc-600 border border-border'
  }
}

export default function UserManagementPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  useEffect(() => {
    if (!isPending && (session?.user as any)?.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!isPending && (session?.user as any)?.role === 'ADMIN') {
      loadUsers()
    }
  }, [session, isPending])

  async function loadUsers() {
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err: any) {
      toast({ title: "Error", description: "Could not load users.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId)
    try {
      const updated = await updateUserRole(userId, newRole)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      toast({ title: "Role Updated", description: `User role changed to ${newRole}.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name <ChevronDown className="ml-2 h-3 w-3" />
        </Button>
      ),
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
      accessorKey: "email",
      header: () => <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</span>,
      cell: ({ row }) => <span className="text-xs text-zinc-500">{row.getValue("email")}</span>,
    },
    {
      accessorKey: "role",
      header: () => <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Role</span>,
      cell: ({ row }) => {
        const user = row.original
        const isUpdating = updatingId === user.id
        return (
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase",
              roleBadgeClass(user.role || 'VIEWER')
            )}>
              {user.role || 'VIEWER'}
            </span>
            <Select
              value={user.role || 'VIEWER'}
              onValueChange={(val) => handleRoleChange(user.id, val)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 w-[160px] border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
    },
    {
      accessorKey: "createdAt",
      header: () => <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Joined</span>,
      cell: ({ row }) => (
        <span className="text-xs text-zinc-400">{new Date(row.getValue("createdAt")).toLocaleDateString()}</span>
      ),
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 15 } },
  })

  if (isPending || loading) return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <Card className="border-border">
        <div className="p-0">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <UserCog className="h-8 w-8 text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground text-zinc-500">Manage system users and their role assignments.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
            className="pl-8 bg-card border-border"
          />
        </div>
      </div>

      <Card className="border border-border shadow-md overflow-hidden bg-card flex flex-col h-[650px]">
        <CardHeader className="bg-muted/30 border-b border-border py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> System Users ({users.length})
          </CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12 py-2">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-border/40 hover:bg-muted/30 transition-colors">
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
                      <UserCog className="h-12 w-12" />
                      <p>No users found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Total Users: <span className="font-bold text-foreground">{users.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 text-xs font-bold">
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 text-xs font-bold">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
