"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/user-store";
import { useBrandStore } from "@/lib/brand-store";

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { logoUrl, platformName } = useBrandStore();
  useEffect(() => setMounted(true), []);
  const effectiveLogo = mounted ? logoUrl : null;
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { setUser } = useUserStore();

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const passwordStrength = () => {
    const p = form.password;
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength();
  const strengthLabels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const strengthColors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (!agreed) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setUser({ full_name: form.full_name, email: form.email, phone: form.phone });
    toast.success("¡Cuenta creada! Bienvenido a Patzi.");
    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            {effectiveLogo ? (
              <Image src={effectiveLogo} alt="logo" width={140} height={48} className="object-contain max-h-12" />
            ) : (
              <>
                <div className="w-10 h-10 bg-blue-800 border border-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-2xl font-bold text-white">{mounted ? (platformName || "Patzi") : "Patzi"}</span>
              </>
            )}
          </Link>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-slate-800">Crear cuenta gratis</CardTitle>
            <CardDescription>Únete a miles de personas que ya envían con Patzi</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  placeholder="María García López"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+34 612 345 678"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                    minLength={8}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Fortaleza: <span className="font-medium">{strengthLabels[strength]}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={form.confirm_password}
                    onChange={(e) => update("confirm_password", e.target.value)}
                    required
                    className={`h-11 pr-10 ${form.confirm_password && form.password !== form.confirm_password ? "border-red-400" : ""}`}
                  />
                  {form.confirm_password && form.password === form.confirm_password && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-900"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  Acepto los{" "}
                  <Link href="#" className="text-blue-600 hover:underline">términos y condiciones</Link>{" "}
                  y la{" "}
                  <Link href="#" className="text-blue-600 hover:underline">política de privacidad</Link>{" "}
                  de Patzi.
                </span>
              </label>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-semibold"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center mt-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
