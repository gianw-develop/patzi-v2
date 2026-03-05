"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Moon, Lock, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useThemeStore } from "@/lib/theme-store";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email_transfers: true,
    email_promotions: false,
    push_transfers: true,
    push_rates: false,
  });
  const { darkMode, setDarkMode } = useThemeStore();
  const [twoFA, setTwoFA] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveNotifications = () => toast.success("Preferencias de notificaciones guardadas");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) { toast.error("Las contraseñas no coinciden"); return; }
    if (passwords.new.length < 8) { toast.error("La contraseña debe tener mínimo 8 caracteres"); return; }
    setSavingPass(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSavingPass(false);
    setPasswords({ current: "", new: "", confirm: "" });
    toast.success("Contraseña actualizada correctamente");
  };

  return (
    <>
      <Header title="Configuración" subtitle="Personaliza tu experiencia en Patzi" />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-2xl">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" /> Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "email_transfers", label: "Email: Estado de transferencias", desc: "Recibe emails cuando cambie el estado de tus envíos" },
              { key: "email_promotions", label: "Email: Promociones y novedades", desc: "Ofertas especiales y actualizaciones de Patzi" },
              { key: "push_transfers", label: "Push: Estado de transferencias", desc: "Notificaciones en el navegador para tus envíos" },
              { key: "push_rates", label: "Push: Alertas de tasas", desc: "Aviso cuando las tasas cambien significativamente" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <Switch
                  checked={notifications[key as keyof typeof notifications]}
                  onCheckedChange={(v) => setNotifications((p) => ({ ...p, [key]: v }))}
                />
              </div>
            ))}
            <Button size="sm" onClick={handleSaveNotifications} className="bg-blue-900 hover:bg-blue-800 text-white mt-2">
              Guardar preferencias
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-600" /> Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Modo oscuro</p>
                <p className="text-xs text-slate-500">Activa el tema oscuro en la aplicación</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={(v) => { setDarkMode(v); toast.success(v ? "Modo oscuro activado" : "Modo claro activado"); }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" /> Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Autenticación de dos factores (2FA)</p>
                <p className="text-xs text-slate-500">Protege tu cuenta con una capa adicional de seguridad</p>
              </div>
              <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); toast.success(v ? "2FA activado" : "2FA desactivado"); }} />
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">Cambiar contraseña</p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <Label>Contraseña actual</Label>
                  <Input type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" className="mt-1.5 h-10" required />
                </div>
                <div>
                  <Label>Nueva contraseña</Label>
                  <Input type="password" value={passwords.new} onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} placeholder="Mínimo 8 caracteres" className="mt-1.5 h-10" required minLength={8} />
                </div>
                <div>
                  <Label>Confirmar nueva contraseña</Label>
                  <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} placeholder="Repite la contraseña" className="mt-1.5 h-10" required />
                </div>
                <Button type="submit" size="sm" disabled={savingPass} className="bg-blue-900 hover:bg-blue-800 text-white">
                  {savingPass ? "Actualizando..." : "Cambiar contraseña"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-red-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Zona de peligro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">Eliminar cuenta</p>
                <p className="text-xs text-red-600 mt-0.5 mb-3">
                  Esta acción es irreversible. Se eliminarán todos tus datos, billeteras y historial de transferencias.
                </p>
                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => toast.error("Función no disponible en modo demo")}>
                  Eliminar mi cuenta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
