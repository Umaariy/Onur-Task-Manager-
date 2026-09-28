import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";
export const metadata: Metadata = {
    title: "ONUR Task Manager",
    description: "Jamoa loyihalari va vazifalarini boshqarish maydoni.",
    themeColor: "#35BE49",
    other: {
        "codex-preview": "development",
    },
    icons: {
        icon: "/onur-mark.png",
        shortcut: "/onur-mark.png",
    },
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="uz">
      <body className="antialiased">{children}</body>
    </html>);
}
