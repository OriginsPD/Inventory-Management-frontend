"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, ShieldCheck, Palette, Bell, Lock, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"

type Panel = 'appearance' | 'notifications' | 'security'

const NOTIF_KEYS = {
  stockAlert: 'notif_stock_alert',
  simExpiry: 'notif_sim_expiry',
  dispatchAlert: 'notif_dispatch_alert',
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [activePanel, setActivePanel] = useState<Panel>('appearance')
  const { toast } = useToast()

  // Notifications state
  const [stockAlert, setStockAlert] = useState(false)
  const [simExpiry, setSimExpiry] = useState(false)
  const [dispatchAlert, setDispatchAlert] = useState(false)

  // Security state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStockAlert(localStorage.getItem(NOTIF_KEYS.stockAlert) === 'true')
      setSimExpiry(localStorage.getItem(NOTIF_KEYS.simExpiry) === 'true')
      setDispatchAlert(localStorage.getItem(NOTIF_KEYS.dispatchAlert) === 'true')
    }
  }, [])

  useEffect(() => {
    if (activePanel === 'security') {
      loadSessions()
    }
  }, [activePanel])

  const toggleNotif = (key: keyof typeof NOTIF_KEYS, value: boolean, setter: (v: boolean) => void) => {
    setter(value)
    localStorage.setItem(NOTIF_KEYS[key], String(value))
  }

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const result = await (authClient as any).listSessions()
      setSessions(result?.data || [])
    } catch (err) {
      // ignore - listSessions may not be available in all configs
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "New password and confirm password do not match.", variant: "destructive" })
      return
    }
    setIsChangingPassword(true)
    try {
      await (authClient as any).changePassword({ currentPassword, newPassword })
      toast({ title: "Password Changed", description: "Your password has been updated successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to change password.", variant: "destructive" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await (authClient as any).revokeSession({ id: sessionId })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast({ title: "Session Revoked", description: "The session has been terminated." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to revoke session.", variant: "destructive" })
    }
  }

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
            <Button
              variant="ghost"
              className={cn("w-full justify-start gap-2", activePanel === 'appearance' ? "bg-orange-50 text-primary" : "text-zinc-500")}
              onClick={() => setActivePanel('appearance')}
            >
                <Palette className="w-4 h-4" /> Appearance
            </Button>
            <Button
              variant="ghost"
              className={cn("w-full justify-start gap-2", activePanel === 'notifications' ? "bg-orange-50 text-primary" : "text-zinc-500")}
              onClick={() => setActivePanel('notifications')}
            >
                <Bell className="w-4 h-4" /> Notifications
            </Button>
            <Button
              variant="ghost"
              className={cn("w-full justify-start gap-2", activePanel === 'security' ? "bg-orange-50 text-primary" : "text-zinc-500")}
              onClick={() => setActivePanel('security')}
            >
                <Lock className="w-4 h-4" /> Security
            </Button>
        </div>

        <div className="md:col-span-2 space-y-6">
          {activePanel === 'appearance' && (
            <>
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
            </>
          )}

          {activePanel === 'notifications' && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Notification Preferences
                </CardTitle>
                <CardDescription>Configure alert thresholds and notification events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    key: 'stockAlert' as const,
                    label: 'Low Stock Alerts',
                    description: 'Email alerts when stock falls below minimum threshold',
                    value: stockAlert,
                    setter: setStockAlert,
                  },
                  {
                    key: 'simExpiry' as const,
                    label: 'SIM Plan Expiry',
                    description: 'Notify when SIM plan expires within 30 days',
                    value: simExpiry,
                    setter: setSimExpiry,
                  },
                  {
                    key: 'dispatchAlert' as const,
                    label: 'New Customer Dispatch',
                    description: 'Alert on dispatch to a new customer',
                    value: dispatchAlert,
                    setter: setDispatchAlert,
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10">
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(item.key, !item.value, item.setter)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        item.value ? "bg-primary" : "bg-muted border border-border"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                        item.value ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-zinc-400 italic">Preferences are stored locally in your browser.</p>
              </CardContent>
            </Card>
          )}

          {activePanel === 'security' && (
            <>
              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" /> Change Password
                  </CardTitle>
                  <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-muted/30 border-border"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-muted/30 border-border"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-muted/30 border-border"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    className="w-full h-11 font-bold mt-2"
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : "Update Password"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Active Sessions
                  </CardTitle>
                  <CardDescription>Manage devices currently logged into your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSessions ? (
                    <div className="space-y-2">
                      {[1,2,3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic text-center py-4">No active sessions found or session listing not available.</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10">
                          <div>
                            <p className="text-xs font-bold text-foreground">{s.userAgent || 'Unknown Device'}</p>
                            <p className="text-[10px] text-zinc-500">{s.ipAddress || 'Unknown IP'} • Expires: {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeSession(s.id)}
                            className="h-8 text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
