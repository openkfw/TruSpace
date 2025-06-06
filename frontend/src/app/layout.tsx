import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Script from "next/script";
import { Slide, ToastContainer } from "react-toastify";
import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";

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
         <head>
            <Script src="/runtime/config.js" strategy="beforeInteractive" />
         </head>
         <body
            className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
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
