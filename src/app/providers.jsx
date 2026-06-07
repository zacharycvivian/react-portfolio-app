'use client'
import { ThemeProvider } from 'next-themes'
import { ReactivityProvider } from '@/components/ReactivityProvider'


export function Providers({ children }) {
  return (
    <ThemeProvider>
      <ReactivityProvider>{children}</ReactivityProvider>
    </ThemeProvider>
  )
}
