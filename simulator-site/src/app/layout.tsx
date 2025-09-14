import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fretotvs - Simulador de Catraca',
  description: 'Simulador de catraca para controle de acesso',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-100">
        {children}
      </body>
    </html>
  )
}
