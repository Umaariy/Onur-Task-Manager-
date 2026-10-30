import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./brand.css";
import "./theme-a.css";
import "./theme-b.css";
import PwaRegister from "./pwa-register";
export const metadata: Metadata = {
    title: "ONUR Task Manager",
    description: "Jamoa loyihalari va vazifalarini boshqarish maydoni.",
    applicationName: "ONUR Tasks",
    icons: {
        icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    appleWebApp: { capable: true, title: "ONUR Tasks", statusBarStyle: "default" },
    formatDetection: { telephone: false },
};
export const viewport: Viewport = {
    themeColor: [{ media: "(prefers-color-scheme: light)", color: "#EEEBE2" }, { media: "(prefers-color-scheme: dark)", color: "#121311" }],
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="uz" data-design={process.env.OTM_DESIGN === "b" ? "b" : "a"}>
      <body className="antialiased">{children}<PwaRegister /></body>
    </html>);
}
