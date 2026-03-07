"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Globe, DollarSign, Save, Upload, Trash2, ImageIcon, Zap } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

export default function AdminSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [config, setConfig] = useState({
    platform_name: "Patzi",
    support_email: "soporte@patzi.net",
    max_transfer_unverified: "500",
    max_transfer_verified: "10000",
    maintenance_mode: false,
    new_registrations: true,
    express_transfers: true,
    email_notifications: true,
    kyc_required: false,
  });

  const update = (field: string, value: string | boolean) =>
    setConfig((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => {
        if (d.logoUrl) setPreviewUrl(d.logoUrl);
        if (d.platformName) setConfig((p) => ({ ...p, platform_name: d.platformName }));
      })
      .catch(() => {});
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("El logo no puede superar 2 MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes (PNG, JPG, SVG, WebP)"); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `logo/patzi-logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("brand")
        .upload(path, file, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      const { data: { publicUrl } } = supabase.storage.from("brand").getPublicUrl(path);
      setPreviewUrl(publicUrl);
      await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: publicUrl }),
      });
      toast.success("Logo guardado en la base de datos");
    } catch (err) {
      toast.error(`Error subiendo logo: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await fetch("/api/brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo_url: "" }),
    });
    toast.info("Logo eliminado — se usará el logo por defecto");
  };

  const handleSave = async () => {
    await fetch("/api/brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform_name: config.platform_name }),
    });
    toast.success("Configuración guardada en la base de datos");
  };

  return (
    <>
      <Header title="Configuración del sistema" subtitle="Parámetros globales de la plataforma" />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-2xl">

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Logo de la plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Logo Patzi" width={80} height={80} className="object-contain w-full h-full p-1" unoptimized />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[9px] text-slate-400">Default</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {previewUrl ? "Logo personalizado activo" : "Usando logo por defecto"}
                </p>
                <p className="text-xs text-slate-400 mb-3">PNG, JPG, SVG o WebP · Máx. 2 MB · Recomendado: 200×60 px</p>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {uploading ? "Procesando..." : previewUrl ? "Cambiar logo" : "Subir logo"}
                  </Button>
                  {previewUrl && (
                    <Button type="button" size="sm" variant="outline" onClick={handleRemoveLogo} className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre de la plataforma</Label>
              <Input value={config.platform_name} onChange={(e) => update("platform_name", e.target.value)} className="mt-1.5 h-10" />
            </div>
            <div>
              <Label>Email de soporte</Label>
              <Input value={config.support_email} onChange={(e) => update("support_email", e.target.value)} className="mt-1.5 h-10" type="email" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Modo mantenimiento</p>
                <p className="text-xs text-slate-500">Desactiva el acceso a todos los usuarios excepto admin</p>
              </div>
              <Switch checked={config.maintenance_mode} onCheckedChange={(v) => { update("maintenance_mode", v); toast.info(v ? "Modo mantenimiento activado" : "Modo mantenimiento desactivado"); }} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Nuevos registros</p>
                <p className="text-xs text-slate-500">Permitir que nuevos usuarios se registren</p>
              </div>
              <Switch checked={config.new_registrations} onCheckedChange={(v) => update("new_registrations", v)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" /> Límites de transferencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Límite sin KYC (€/mes)</Label>
                <Input
                  type="number"
                  value={config.max_transfer_unverified}
                  onChange={(e) => update("max_transfer_unverified", e.target.value)}
                  className="mt-1.5 h-10"
                  min="0"
                />
              </div>
              <div>
                <Label>Límite con KYC (€/mes)</Label>
                <Input
                  type="number"
                  value={config.max_transfer_verified}
                  onChange={(e) => update("max_transfer_verified", e.target.value)}
                  className="mt-1.5 h-10"
                  min="0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Requerir KYC para enviar</p>
                <p className="text-xs text-slate-500">Los usuarios deben verificar identidad antes de cualquier envío</p>
              </div>
              <Switch checked={config.kyc_required} onCheckedChange={(v) => update("kyc_required", v)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> Funcionalidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Transferencias Express</p>
                <p className="text-xs text-slate-500">Habilitar la opción de envío express en minutos</p>
              </div>
              <Switch checked={config.express_transfers} onCheckedChange={(v) => update("express_transfers", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Notificaciones por email</p>
                <p className="text-xs text-slate-500">Enviar emails automáticos a usuarios sobre sus transferencias</p>
              </div>
              <Switch checked={config.email_notifications} onCheckedChange={(v) => update("email_notifications", v)} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold h-11">
          <Save className="w-4 h-4 mr-2" /> Guardar configuración
        </Button>
      </div>
    </>
  );
}
