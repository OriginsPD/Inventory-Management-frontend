"use client"

import Link from "next/link"
import { 
  ShieldCheck, 
  ArrowRight, 
  Package, 
  Activity, 
  Zap, 
  History, 
  Globe, 
  Lock,
  BarChart3,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

export default function WelcomePage() {
  const { data: session } = authClient.useSession();
  const nextPath = session ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-20 py-10 animate-in fade-in duration-700 bg-background">
      
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-4xl px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest animate-bounce">
          <Zap className="w-3 h-3 fill-primary" />
          Enterprise Intelligence v1.0
        </div>
        
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
          The Future of <span className="text-primary italic">Hardware</span> <br />
          Logistics is Atomic.
        </h1>
        
        <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-medium">
          IMS Pro provides deterministic tracking, real-time QC heuristics, and 
          immutable audit ledgers for enterprise hardware fleets.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 group" asChild>
            <Link href={nextPath}>
              {session ? "Return to Terminal" : "Initialize Session"} 
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          {!session && (
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl border-border hover:bg-muted/50" asChild>
                <Link href="/signup">
                Create Account
                </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
        {[
          {
            title: "Turbo-Ingestion",
            desc: "Mass register hardware via vision-based camera scanning or high-speed hardware nodes.",
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
          },
          {
            title: "Deterministic QC",
            desc: "Pass/Fail heuristics with technician-linked session history for zero-defect field readiness.",
            icon: Activity,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
          },
          {
            title: "Immutable Audit",
            desc: "Every vibration in the inventory is logged to an immutable ledger for absolute accountability.",
            icon: ShieldCheck,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
          }
        ].map((feature, i) => (
          <Card key={i} className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors group">
            <CardContent className="p-8 space-y-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", feature.bg)}>
                <feature.icon className={cn("w-6 h-6", feature.color)} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Nav Section */}
      <div className="w-full max-w-6xl space-y-6 px-4 pb-20">
        <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <Globe className="w-4 h-4" /> System Shortcuts
            </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { name: "Global Reporting", href: "/reports", icon: BarChart3 },
                { name: "Client Registry", href: "/customers", icon: Users },
                { name: "Movement History", href: "/dispatch/history", icon: History },
                { name: "Security Audit", href: "/audit", icon: Lock },
            ].map((link) => (
                <Link key={link.name} href={link.href} className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                    <div className="p-2 bg-card rounded-lg border border-border group-hover:text-primary transition-colors">
                        <link.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-zinc-600 group-hover:text-foreground">{link.name}</span>
                </Link>
            ))}
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
    </div>
  )
}
