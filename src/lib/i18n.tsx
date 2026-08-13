"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "es" | "en";

const english: Record<string, string> = {
  "Remesas": "Remittances",
  "Cómo funciona": "How it works",
  "Ayuda": "Help",
  "Ingresar": "Log in",
  "Crear cuenta": "Create account",
  "Remesas + Stablecoins, una sola cuenta": "Remittances + Stablecoins, one account",
  "Tu dinero, con una ruta más clara.": "Your money, on a clearer path.",
  "Envía remesas con confianza. Y, si tu cuenta está habilitada, cambia USD a USDT o USDC sin salir de Patzi.": "Send remittances with confidence. If your account is eligible, exchange USD for USDT or USDC without leaving Patzi.",
  "Enviar dinero": "Send money",
  "Conocer Patzi Stable": "Explore Patzi Stable",
  "Cuenta verificada": "Verified account",
  "Comprobantes PDF": "PDF receipts",
  "Tarifas visibles": "Transparent fees",
  "Sabes exactamente lo que pagas.": "Know exactly what you pay.",
  "Seguimiento real": "Live tracking",
  "Cada operación tiene un estado claro.": "Every transaction has a clear status.",
  "Soporte humano": "Human support",
  "Personas reales cuando las necesitas.": "Real people when you need them.",
  "Remesas internacionales": "International remittances",
  "Envía desde España. Ellos reciben en Venezuela o Perú.": "Send from Spain. They receive in Venezuela or Peru.",
  "Elige el corredor, calcula con la tasa Patzi y revisa cuánto recibe tu destinatario antes de crear la remesa.": "Choose a corridor, calculate with the Patzi rate and review what your recipient gets before creating the transfer.",
  "Envías EUR": "Send EUR",
  "Reciben VES": "Receive VES",
  "Reciben PEN": "Receive PEN",
  "Tasa de respaldo disponible": "Fallback rate available",
  "Calcula tu envío": "Calculate your transfer",
  "SERVICIO PRINCIPAL": "MAIN SERVICE",
  "Tipo de cambio visible": "Visible exchange rate",
  "Entrega estimada · hoy": "Estimated delivery · today",
  "Acceso habilitado": "Access enabled",
  "NUEVO": "NEW",
  "Estado del dinero": "Money status",
  "Comprobante y wallet verificados": "Receipt and wallet verified",
  "Comprobante": "Receipt",
  "Tasa en tiempo real": "Live exchange rate",
  "Tasa de respaldo": "Fallback rate",
  "Tasas actualizadas en tiempo real": "Rates updated in real time",
  "mercado": "market",
  "paralelo": "parallel",
  "oficial": "official",
  "Tú envías": "You send",
  "Ellos reciben": "They receive",
  "Tasa Patzi": "Patzi rate",
  "Margen incluido": "Margin included",
  "Comisión": "Fee",
  "Sin comisión adicional": "No additional fee",
  "No disponible": "Unavailable",
  "Actualizando tasa": "Updating rate",
  "No pudimos cargar las tasas. Inténtalo de nuevo.": "We couldn't load the rates. Please try again.",
  "Tasas no disponibles": "Rates unavailable",
  "Monto que envías": "Amount you send",
  "Monto que recibe el destinatario": "Amount the recipient gets",
  "Moneda de envío": "Sending currency",
  "Moneda de recepción": "Receiving currency",
  "Seleccionar moneda de envío": "Select sending currency",
  "Seleccionar moneda de recepción": "Select receiving currency",
  "España": "Spain",
  "EE. UU.": "United States",
  "Venezuela": "Venezuela",
  "Perú": "Peru",
  "Continuar envío": "Continue transfer",
  "Corredor activo": "Active corridor",
  "Nuevo servicio": "New service",
  "CUENTAS APTAS": "ELIGIBLE ACCOUNTS",
  "USD entra.": "USD comes in.",
  "Stablecoins salen.": "Stablecoins go out.",
  "Tú transfieres USD a la cuenta asignada, subes el comprobante y nosotros enviamos USDT o USDC a tu wallet verificada.": "You transfer USD to the assigned account, upload the receipt, and we send USDT or USDC to your verified wallet.",
  "Comisión fija": "Fixed fee",
  "Red ERC-20": "ERC-20 network",
  "Solo habilitados": "Eligible users only",
  "Cambio verificado": "Verified exchange",
  "Comisión Patzi (10%)": "Patzi fee (10%)",
  "Tú recibes": "You receive",
  "Red de entrega": "Delivery network",
  "Solicitar acceso": "Request access",
  "Control total": "Full control",
  "Mis operaciones": "My transactions",
  "Remesas y Stable en un solo historial": "Remittances and Stable in one history",
  "Referencia": "Reference",
  "Servicio": "Service",
  "Envías": "You send",
  "Recibes": "You receive",
  "Estado": "Status",
  "Remesa": "Remittance",
  "Stable": "Stable",
  "Enviaste USD": "USD sent",
  "Pago verificado": "Payment verified",
  "Recibes USDT": "You receive USDT",
  "Hola, Ana": "Hello, Ana",
  "Actividad reciente": "Recent activity",
  "Cada envío tiene una historia.": "Every transfer has a story.",
  "Mira tus remesas y cambios, comprobantes, wallet y hash de transacción.": "See your remittances and exchanges, receipts, wallet and transaction hash.",
  "Esperando pago": "Awaiting payment",
  "Verificando comprobante": "Verifying receipt",
  "Pago recibido": "Payment received",
  "Preparando stablecoin": "Preparing stablecoin",
  "Completada": "Completed",
  "Próximamente": "Coming soon",
  "Patzi irá contigo.": "Patzi will go with you.",
  "Una futura app para remesas, Stable y toda tu actividad. La web ya funciona hoy; la app es el siguiente paso.": "A future app for remittances, Stable and all your activity. The web works today; the app is the next step.",
  "APP PATZI · EN DESARROLLO": "PATZI APP · IN DEVELOPMENT",
  "Identidad verificada": "Verified identity",
  "Protegemos el acceso al servicio Stable.": "We protect access to the Stable service.",
  "Wallet y red confirmadas": "Verified wallet and network",
  "Validamos Ethereum ERC-20 antes del envío.": "We validate Ethereum ERC-20 before delivery.",
  "Revisión transparente": "Transparent review",
  "El comprobante y cada estado quedan registrados.": "The receipt and every status are recorded.",
  "Preguntas frecuentes": "Frequently asked questions",
  "¿Qué es Patzi Stable?": "What is Patzi Stable?",
  "¿Cómo funciona el envío de USD?": "How does sending USD work?",
  "¿Puedo elegir entre USDT y USDC?": "Can I choose between USDT and USDC?",
  "¿Dónde coloco mi wallet?": "Where do I enter my wallet?",
  "¿Cuánto tarda la revisión?": "How long does the review take?",
  "Toda la información, cuenta asignada, comprobante, wallet y estado aparecen dentro de tu operación.": "All information, assigned account, receipt, wallet and status appear inside your transaction.",
  "Empieza con una remesa.": "Start with a remittance.",
  "Es rápido, claro y seguro.": "It is fast, clear and secure.",
  "Una ruta más clara para mover tu dinero.": "A clearer path to move your money.",
  "Productos": "Products",
  "Compañía": "Company",
  "Quiénes somos": "About us",
  "Trabajo con nosotros": "Careers",
  "Centro de ayuda": "Help center",
  "Contáctanos": "Contact us",
  "Legal": "Legal",
  "Términos y condiciones": "Terms and conditions",
  "Aviso de privacidad": "Privacy notice",
  "Todos los derechos reservados.": "All rights reserved.",
  "Bienvenido de nuevo": "Welcome back",
  "Inicia sesión en Patzi": "Log in to Patzi",
  "Accede a tus remesas, operaciones Stable y comprobantes.": "Access your remittances, Stable transactions and receipts.",
  "Correo electrónico": "Email address",
  "Contraseña": "Password",
  "¿La olvidaste?": "Forgot it?",
  "Iniciar sesión": "Log in",
  "Verificando acceso...": "Checking access...",
  "¿Primera vez?": "First time?",
  "¿No tienes una cuenta?": "Don't have an account?",
  "Nueva cuenta": "New account",
  "Crea tu espacio en Patzi": "Create your Patzi account",
  "Comienza con remesas. El acceso Stable se habilita después de verificar tu cuenta.": "Start with remittances. Stable access is enabled after your account is verified.",
  "Nombre completo": "Full name",
  "Teléfono": "Phone",
  "(opcional)": "(optional)",
  "Confirmar contraseña": "Confirm password",
  "Creando tu cuenta...": "Creating your account...",
  "¿Ya tienes una cuenta?": "Already have an account?",
  "Recuperar acceso": "Recover access",
  "Restablece tu contraseña": "Reset your password",
  "Te enviaremos un enlace seguro si el correo está registrado en Patzi.": "We will send a secure link if the email is registered with Patzi.",
  "Enviar enlace": "Send link",
  "Enviando enlace...": "Sending link...",
  "Volver a iniciar sesión": "Back to login",
  "Nuevo acceso": "New access",
  "Crea una nueva contraseña": "Create a new password",
  "Nueva contraseña": "New password",
  "Guardar contraseña": "Save password",
  "Actualizando...": "Updating...",
  "Tu cuenta Patzi": "Your Patzi account",
  "Tu dinero sigue una ruta segura.": "Your money follows a secure path.",
  "Remesas y operaciones Stable, con cada comprobante, wallet y estado en un solo lugar.": "Remittances and Stable transactions, with every receipt, wallet and status in one place.",
  "Identidad protegida": "Protected identity",
  "Estados en tiempo real": "Live statuses",
  "Acceso protegido": "Protected access",
  "Volver al inicio": "Back to home",
  "Resumen": "Overview",
  "Todas": "All",
  "Clientes": "Customers",
  "Cuentas receptoras": "Receiving accounts",
  "Tasas y comisiones": "Rates and fees",
  "Comprobantes": "Receipts",
  "Verificación KYC": "KYC verification",
  "Conciliación": "Reconciliation",
  "Auditoría": "Audit",
  "Configuración": "Settings",
  "Centro operativo": "Operations center",
  "Cerrar sesión": "Log out",
  "Cerrar menú": "Close menu",
  "Inicio": "Home",
  "Operaciones": "Transactions",
  "Destinatarios": "Recipients",
  "Remitentes USD": "USD Senders",
  "Wallets": "Wallets",
  "Abrir menú": "Open menu",
  "Notificaciones": "Notifications",
  "Buscar operaciones o referencias": "Search transactions or references",
  "Buscar referencia, cliente o wallet": "Search reference, customer or wallet",
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("patzi-language");
      if (saved === "en" || saved === "es") Promise.resolve().then(() => setLanguageState(saved));
    } catch {
      // Some iOS mail browsers and private sessions block localStorage.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem("patzi-language", language);
    } catch {
      // The language still works for the current session without persistence.
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (text) => language === "en" ? english[text] ?? text : text,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
