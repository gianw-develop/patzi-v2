import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Patzi — Remesas y stablecoins",
    short_name: "Patzi",
    description:
      "Gestiona remesas y operaciones de USD a USDT desde una sola cuenta.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7F2",
    theme_color: "#061827",
    lang: "es",
    icons: [
      {
        src: "/patzi-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
