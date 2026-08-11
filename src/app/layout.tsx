import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ThemeProvider from "@/components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.patzi.net"),
  title: {
    default: "Patzi | Remesas y cambio de USD a USDT o USDC",
    template: "%s | Patzi",
  },
  description:
    "Envía remesas y, si tu cuenta está verificada, cambia USD por USDT o USDC en Ethereum ERC-20. Sigue cada operación desde un solo lugar.",
  applicationName: "Patzi",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/patzi-logo.svg", type: "image/svg+xml" }],
    shortcut: "/patzi-logo.svg",
  },
  openGraph: {
    title: "Patzi — Remesas y stablecoins, en una sola ruta",
    description:
      "Envía remesas y gestiona cambios de USD a USDT o USDC para cuentas verificadas, con seguimiento claro en cada etapa.",
    siteName: "Patzi",
    url: "https://www.patzi.net/",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patzi — Remesas y stablecoins, en una sola ruta",
    description:
      "Remesas y cambios de USD a USDT o USDC para cuentas verificadas, con seguimiento claro en cada etapa.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "financial services",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.patzi.net/#organization",
  name: "Patzi",
  url: "https://www.patzi.net/",
  logo: "https://www.patzi.net/patzi-logo.svg",
  description:
    "Plataforma digital para gestionar remesas y operaciones de USD a USDT o USDC en cuentas verificadas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="notranslate antialiased">
        <LanguageProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
