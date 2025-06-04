import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { Slide, ToastContainer } from "react-toastify";
import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";

const geistSans = Geist({
   variable: "--font-geist-sans",
   subsets: ["latin"]
});

const geistMono = Geist_Mono({
   variable: "--font-geist-mono",
   subsets: ["latin"]
});

export const metadata: Metadata = {
   title: "TruSpace"
};

export default async function RootLayout({
   children
}: Readonly<{
   children: React.ReactNode;
}>) {
   const locale = await getLocale();
   const messages = await getMessages();

   return (
      <html lang={locale} suppressHydrationWarning>
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
         >
            <ThemeProvider
               attribute="class"
               defaultTheme="system"
               enableSystem
               disableTransitionOnChange
            >
               <ToastContainer
                  position="bottom-right"
                  autoClose={5000}
                  hideProgressBar
                  newestOnTop={false}
                  closeOnClick={false}
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                  transition={Slide}
               />
               <NextIntlClientProvider messages={messages}>
                  <WorkspaceProvider>
                     <DocumentsProvider>{children}</DocumentsProvider>
                  </WorkspaceProvider>
               </NextIntlClientProvider>
            </ThemeProvider>
         </body>
      </html>
   );
}
