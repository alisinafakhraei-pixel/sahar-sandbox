import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Inter, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeLab } from "@/components/theme-lab"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

/*
 * Plus Jakarta Sans stands in for Gilroy (the licensed face on formaloo.com)
 * as the display font; Inter carries body copy, same split as the live site.
 */
const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
})

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Formaloo",
  description:
    "Tell Formaloo OI what you want to fix in your workflow. Get a straight answer on how to build it, or hand it to the team that will.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        fontDisplay.variable,
        fontSans.variable,
        fontMono.variable
      )}
    >
      <body>
        <ThemeProvider>
          {children}
          <ThemeLab />
        </ThemeProvider>
      </body>
    </html>
  )
}
