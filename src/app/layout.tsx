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
        className={`${poppins.variable} ${local.variable} antialiased 
          w-full min-h-screen flex items-center justify-center
        `}
      >
        <main
          className="
            w-full               
            h-screen             
            max-w-md             
            bg-white   
            opacity-100          
            rotate-0             
            overflow-y-auto      
            shadow-2xl           
            relative             
          "
        >
          {children}
        </main>
      </body>
    </html>
  );
}
