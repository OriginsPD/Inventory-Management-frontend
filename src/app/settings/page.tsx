"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, ShieldCheck, Palette, Bell, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your account preferences and system configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-2 bg-orange-50 text-primary">
                <Palette className="w-4 h-4" /> Appearance
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-zinc-500">
                <Bell className="w-4 h-4" /> Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-zinc-500">
                <Lock className="w-4 h-4" /> Security
            </Button>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" /> Visual Identity
                    </CardTitle>
                    <CardDescription>Customize how IMS Pro looks on your device.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Theme Mode</Label>
                        <div className="grid grid-cols-3 gap-4">
                            {themeOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTheme(opt.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all active:scale-95",
                                        theme === opt.id 
                                            ? "border-primary bg-primary/5 text-primary shadow-sm" 
                                            : "border-border bg-muted/10 text-zinc-500 hover:border-zinc-400"
                                    )}
                                >
                                    <opt.icon className="w-6 h-6" />
                                    <span className="text-xs font-bold uppercase">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-border flex items-start gap-4">
                        <ShieldCheck className="w-5 h-5 text-zinc-400 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground uppercase">Adaptive Interface</p>
                            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                                Changing the theme mode applies instantly across all modules. 
                                System mode follows your operating system&apos;s global preference.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card opacity-60 grayscale cursor-not-allowed">
                <CardHeader>
                    <CardTitle className="text-xl">Enterprise Branding</CardTitle>
                    <CardDescription>Custom logo and organization color presets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-20 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Locked for Admin Review</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
