import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ClickJogos - Loja Oficial",
    description: "Produtos gamer com os melhores preços",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
