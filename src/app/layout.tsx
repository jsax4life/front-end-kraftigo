import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700"],
});

const local = localFont({
  src: "./fonts/Garet-Heavy.otf",
  variable: "--font-gerat",
});

const local2 = localFont({
  src: "./fonts/QurovaDEMO-Regular.otf",
  variable: "--font-qurova",
});

export const metadata: Metadata = {
  title: "Kraftigo",
  description: "An artisian booking website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${local.variable} ${local2.variable} antialiased`}
      >
        <main className="w-full min-h-screen bg-white">
          {children}
        </main>
      </body>
    </html>
  );
}
