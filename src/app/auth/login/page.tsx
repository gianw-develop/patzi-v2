"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/user-store";
import { useBrandStore } from "@/lib/brand-store";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { logoUrl, platformName } = useBrandStore();
  useEffect(() => setMounted(true), []);
  const effectiveLogo = mounted ? logoUrl : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser, full_name } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    const ADMIN_EMAILS = ["admin@patzi.com", "giancarlosweill@gmail.com"];
    if (ADMIN_EMAILS.includes(email) && password.length >= 6) {
      setUser({ full_name: full_name || "Admin", email });
      toast.success("Bienvenido, Admin");
      router.push("/admin");
    } else if (email && password.length >= 6) {
      if (!full_name) {
        const namePart = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        setUser({ full_name: namePart, email });
      }
      toast.success("Sesión iniciada correctamente");
      router.push("/dashboard");
    } else {
      setError("Email o contraseña incorrectos.");
    }
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
            <CardTitle className="text-2xl font-bold text-slate-800">Iniciar sesión</CardTitle>
            <CardDescription>Accede a tu cuenta para enviar dinero</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="#" className="text-xs text-blue-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-semibold"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              ¿No tienes cuenta?{" "}
              <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
                Crear cuenta gratis
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
