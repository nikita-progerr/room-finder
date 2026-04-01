import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Поиск аудиторий — СарФТИ НИЯУ МИФИ",
  description: "Найдите свободную аудиторию в реальном времени",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏫</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans antialiased" style={{ background: "#0f172a" }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              borderRadius: "12px",
              backdropFilter: "blur(16px)",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#0f172a" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#0f172a" } },
          }}
        />
      </body>
    </html>
  );
}
