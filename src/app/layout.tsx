import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ONROAD — реклама на автомобилях',
  description:
    'Платформа, которая соединяет компании и владельцев автомобилей для размещения рекламы в городе.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
