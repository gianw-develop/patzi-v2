"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 12000, suffix: "+", label: "Usuarios registrados", decimals: 0 },
  { value: 5, suffix: "M+", prefix: "€", label: "Enviados en transferencias", decimals: 0 },
  { value: 2, suffix: "", label: "Países de destino", decimals: 0 },
  { value: 30, suffix: " min", label: "Tiempo promedio de entrega", decimals: 0 },
];

function useCountUp(target: number, decimals: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(parseFloat(current.toFixed(decimals)));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [active, target, decimals]);
  return count;
}

function StatCard({ value, suffix, prefix, label, decimals, active }: {
  value: number; suffix: string; prefix?: string; label: string; decimals: number; active: boolean;
}) {
  const count = useCountUp(value, decimals, active);
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tabular-nums">
        {prefix ?? ""}{decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-blue-300 text-sm font-medium">{label}</p>
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 bg-blue-950" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
