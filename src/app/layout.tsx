import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
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
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#333',
                  padding: '16px',
                  borderRadius: '8px',
                },
                success: {
                  iconTheme: {
                    primary: '#FF6600',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <main className="w-full min-h-screen bg-white">
              {children}
            </main>
          </GoogleOAuthProvider>
        ) : (
          <>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#333',
                  padding: '16px',
                  borderRadius: '8px',
                },
              }}
            />
            <main className="w-full min-h-screen bg-white">
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  );
}
