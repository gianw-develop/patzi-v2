"use client";

import { useState, useRef } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, Upload, CheckCircle2, Clock, AlertCircle,
  User, Mail, Phone, Globe, Edit2, Save,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/user-store";

const KYC_STATUS = "not_submitted"; // Change to test different states

const KYC_CONFIG = {
  not_submitted: { label: "Sin verificar", color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle, progress: 20 },
  pending: { label: "En revisión", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, progress: 65 },
  approved: { label: "Verificado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, progress: 100 },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, progress: 30 },
};

export default function ProfilePage() {
  const [kycStatus, setKycStatus] = useState<keyof typeof KYC_CONFIG>(KYC_STATUS);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { full_name: storedName, email: storedEmail, phone: storedPhone } = useUserStore();
  const [profile, setProfile] = useState({
    full_name: storedName || "",
    email: storedEmail || "",
    phone: storedPhone || "",
    country: "",
    address: "",
  });
  const [draft, setDraft] = useState(profile);

  const update = (field: string, value: string) => setDraft((p) => ({ ...p, [field]: value }));

  const handleSaveProfile = () => {
    setProfile(draft);
    setEditMode(false);
    toast.success("Perfil actualizado correctamente");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 5 MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadDoc = async () => {
    if (!selectedFile) { toast.error("Selecciona un documento primero"); return; }
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setUploading(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setKycStatus("pending");
    toast.success("Documento enviado. Revisión en 24-48h.");
  };

  const kycCfg = KYC_CONFIG[kycStatus];
  const KycIcon = kycCfg.icon;

  const completionSteps = [
    { label: "Cuenta creada", done: !!storedEmail },
    { label: "Perfil completado", done: !!profile.phone && !!profile.country },
    { label: "Identidad verificada (KYC)", done: kycStatus === "approved" },
  ];
  const completionPercent = Math.round((completionSteps.filter((s) => s.done).length / completionSteps.length) * 100);

  return (
    <>
      <Header title="Perfil & Verificación KYC" subtitle="Gestiona tu información personal y verifica tu identidad" />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {profile.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-800">{profile.full_name}</h2>
                  <Badge className={`text-xs border ${kycCfg.color} flex items-center gap-1`}>
                    <KycIcon className="w-3 h-3" />
                    {kycCfg.label}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Perfil completado</p>
                <p className="text-2xl font-bold text-blue-900">{completionPercent}%</p>
              </div>
            </div>
            <Progress value={completionPercent} className="h-2" />
            <div className="flex flex-wrap gap-3 mt-3">
              {completionSteps.map((step) => (
                <div key={step.label} className={`flex items-center gap-1.5 text-xs ${step.done ? "text-emerald-600" : "text-slate-400"}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${step.done ? "fill-emerald-100" : ""}`} />
                  {step.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Información personal
              </CardTitle>
              {!editMode ? (
                <Button size="sm" variant="ghost" onClick={() => setEditMode(true)} className="text-blue-600">
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              ) : (
                <Button size="sm" onClick={handleSaveProfile} className="bg-blue-900 hover:bg-blue-800 text-white">
                  <Save className="w-3.5 h-3.5 mr-1" /> Guardar
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "full_name", label: "Nombre completo", icon: User, placeholder: "Tu nombre" },
                { key: "email", label: "Email", icon: Mail, placeholder: "tu@email.com" },
                { key: "phone", label: "Teléfono", icon: Phone, placeholder: "+34 000 000 000" },
                { key: "country", label: "País", icon: Globe, placeholder: "España" },
                { key: "address", label: "Dirección", icon: Globe, placeholder: "Tu dirección" },
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key}>
                  <Label className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                    <Icon className="w-3 h-3" /> {label}
                  </Label>
                  {editMode && key !== "email" ? (
                    <Input
                      value={draft[key as keyof typeof draft]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={placeholder}
                      className="h-9"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-800 py-1">
                      {profile[key as keyof typeof profile] || <span className="text-slate-400 italic">No configurado</span>}
                    </p>
                  )}
                </div>
              ))}
              {editMode && (
                <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setDraft(profile); }}>
                  Cancelar
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Verificación de identidad (KYC)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${kycStatus === "approved" ? "bg-emerald-50 border-emerald-200" : kycStatus === "pending" ? "bg-yellow-50 border-yellow-200" : kycStatus === "rejected" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                <KycIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${kycStatus === "approved" ? "text-emerald-600" : kycStatus === "pending" ? "text-yellow-600" : kycStatus === "rejected" ? "text-red-600" : "text-slate-500"}`} />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Estado: {kycCfg.label}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {kycStatus === "approved" && "Tu identidad ha sido verificada. Puedes enviar hasta €10,000 por mes."}
                    {kycStatus === "pending" && "Estamos revisando tus documentos. Recibirás una notificación en 24-48 horas."}
                    {kycStatus === "rejected" && "Tu documento fue rechazado. Por favor sube una imagen más clara y legible."}
                    {kycStatus === "not_submitted" && "Verifica tu identidad para aumentar tus límites y acceder a todas las funcionalidades."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Límites de envío</p>
                <div className="space-y-2">
                  {[
                    { label: "Sin verificar", limit: "€500/mes", active: kycStatus === "not_submitted" },
                    { label: "KYC básico", limit: "€2,500/mes", active: kycStatus === "pending" },
                    { label: "KYC verificado", limit: "€10,000/mes", active: kycStatus === "approved" },
                  ].map((tier) => (
                    <div key={tier.label} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${tier.active ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}>
                      <div className="flex items-center gap-2">
                        {tier.active && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        <span className={tier.active ? "font-semibold text-blue-800" : "text-slate-500"}>{tier.label}</span>
                      </div>
                      <span className={tier.active ? "font-bold text-blue-900" : "text-slate-400"}>{tier.limit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(kycStatus === "not_submitted" || kycStatus === "rejected") && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Subir documento de identidad</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="kyc-file-input"
                  />
                  <label
                    htmlFor="kyc-file-input"
                    className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      selectedFile
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-300 hover:border-blue-400"
                    }`}
                  >
                    {selectedFile ? (
                      <>
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-sm font-semibold text-emerald-700">{selectedFile.name}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {(selectedFile.size / 1024).toFixed(0)} KB · Listo para enviar
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 font-medium">DNI, Pasaporte o NIE</p>
                        <p className="text-xs text-slate-400 mt-1">Haz clic para seleccionar · JPG, PNG o PDF · máx. 5 MB</p>
                      </>
                    )}
                  </label>
                  <Button
                    onClick={handleUploadDoc}
                    disabled={uploading || !selectedFile}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white disabled:opacity-50"
                  >
                    {uploading ? "Enviando documento..." : selectedFile ? "Enviar documento" : "Selecciona un documento primero"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
