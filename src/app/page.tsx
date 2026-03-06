import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Corridors from "@/components/landing/Corridors";
import Features from "@/components/landing/Features";
import RatesTable from "@/components/landing/RatesTable";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Corridors />
      <Features />
      <RatesTable />

      <section className="py-24 bg-gradient-to-br from-emerald-500 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para enviar tu primer transferencia?
          </h2>
          <p className="text-emerald-100 text-xl mb-10">
            Únete a más de 12,000 personas que ya confían en Patzi.
            Tu primera transferencia con tarifa reducida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8">
              <Link href="/auth/register">
                Crear cuenta gratis <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
              <Link href="/auth/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
