import { ImageResponse } from "next/og";

export const alt = "Patzi — Remesas y stablecoins, en una sola ruta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function PatziMark() {
  return (
    <svg width="70" height="70" viewBox="0 0 54 54">
      <defs>
        <linearGradient id="brand-surface" x1="4" y1="2" x2="50" y2="53">
          <stop stopColor="#173A56" />
          <stop offset="1" stopColor="#061523" />
        </linearGradient>
      </defs>
      <rect x="0.7" y="0.7" width="52.6" height="52.6" rx="15" fill="url(#brand-surface)" stroke="rgba(255,255,255,.2)" strokeWidth="1.4" />
      <path d="M14 15h17.5c6.9 0 11.5 4.3 11.5 10.1s-4.6 10-11.5 10H22v7" fill="none" stroke="#4DE2B5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 24v18h8V31h10.5" fill="none" stroke="#FF765B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="31" r="3.4" fill="#F5F7F2" stroke="#071A2D" strokeWidth="1.5" />
      <circle cx="14" cy="42" r="3.8" fill="#fff" />
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          color: "white",
          background: "#061827",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 520, right: -120, top: -230, background: "rgba(77,226,181,.14)" }} />
        <div style={{ position: "absolute", width: 380, height: 380, borderRadius: 380, left: 350, bottom: -300, background: "rgba(255,118,91,.12)" }} />

        <svg width="1200" height="260" viewBox="0 0 1200 260" style={{ position: "absolute", left: 0, bottom: 45 }}>
          <defs>
            <linearGradient id="flow" x1="40" y1="130" x2="1160" y2="130" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF765B" />
              <stop offset=".48" stopColor="#FF765B" />
              <stop offset=".54" stopColor="#4DE2B5" />
              <stop offset="1" stopColor="#4DE2B5" />
            </linearGradient>
          </defs>
          <path d="M30 180h205c95 0 83-100 178-100h284c95 0 83 100 178 100h295" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="16" strokeLinecap="round" />
          <path d="M30 180h205c95 0 83-100 178-100h284c95 0 83 100 178 100h295" fill="none" stroke="url(#flow)" strokeWidth="6" strokeLinecap="round" />
          <circle cx="604" cy="80" r="17" fill="#061827" stroke="#F5F7F2" strokeWidth="7" />
          <circle cx="604" cy="80" r="5" fill="#4DE2B5" />
        </svg>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "66px 70px", width: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <PatziMark />
            <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-2px" }}>Patzi</span>
          </div>
          <div style={{ display: "flex", marginTop: 64, fontSize: 17, letterSpacing: "2.6px", textTransform: "uppercase", color: "#4DE2B5", fontWeight: 700 }}>
            Remesas + Stablecoins
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 18, fontSize: 64, lineHeight: 1.02, letterSpacing: "-3.8px", fontWeight: 700 }}>
            <span>Tu dinero,</span>
            <span>con una ruta más clara.</span>
          </div>
          <div style={{ display: "flex", marginTop: 25, fontSize: 23, color: "rgba(255,255,255,.68)" }}>
            Remesas y cambio de USD a USDT.
          </div>
        </div>

        <div style={{ position: "absolute", right: 68, top: 96, display: "flex", flexDirection: "column", width: 350, padding: "30px", borderRadius: 30, background: "rgba(255,255,255,.96)", color: "#071A2D", boxShadow: "0 30px 80px rgba(0,0,0,.34)", transform: "rotate(2deg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, color: "#087F62", fontWeight: 700, letterSpacing: "1.5px" }}>PATZI STABLE</span>
            <span style={{ fontSize: 12, padding: "7px 11px", borderRadius: 20, background: "#DDF9F0", color: "#087F62", fontWeight: 700 }}>VERIFICADO</span>
          </div>
          <span style={{ marginTop: 33, fontSize: 15, color: "rgba(7,26,45,.5)" }}>Tú envías</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 7 }}>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-2px" }}>1,000.00</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>USD</span>
          </div>
          <div style={{ display: "flex", height: 1, background: "rgba(7,26,45,.1)", margin: "25px 0" }} />
          <span style={{ fontSize: 15, color: "rgba(7,26,45,.5)" }}>Tú recibes</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7 }}>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-2px" }}>900.00</span>
            <span style={{ fontSize: 16, padding: "9px 13px", borderRadius: 22, background: "#26A17B", color: "white", fontWeight: 700 }}>USDT</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, padding: "15px 17px", borderRadius: 16, background: "#EEF2FF", fontSize: 14 }}>
            <span style={{ color: "rgba(7,26,45,.52)" }}>Red de entrega</span>
            <span style={{ color: "#627EEA", fontWeight: 700 }}>Ethereum ERC-20</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
