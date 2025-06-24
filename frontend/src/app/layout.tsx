import { Slide, ToastContainer } from "react-toastify";

import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { GeistMono } from "geist/font/mono"; // eslint-disable-line import/no-unresolved
import { GeistSans } from "geist/font/sans"; // eslint-disable-line import/no-unresolved

import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { UserProvider } from "@/contexts/UserContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

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
                  <UserProvider>
                     <WorkspaceProvider>
                        <DocumentsProvider>{children}</DocumentsProvider>
                     </WorkspaceProvider>
                  </UserProvider>
               </NextIntlClientProvider>
            </ThemeProvider>
         </body>
      </html>
   );
}
