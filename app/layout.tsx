import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./brand.css";
import "./theme-a.css";
export const metadata: Metadata = {
    title: "ONUR Task Manager",
    description: "Jamoa loyihalari va vazifalarini boshqarish maydoni.",
    icons: {
        icon: "/onur-mark.png",
        shortcut: "/onur-mark.png",
    },
};
export const viewport: Viewport = { themeColor: "#EEEBE2" };
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="uz">
      <body className="antialiased">{children}</body>
    </html>);
}
