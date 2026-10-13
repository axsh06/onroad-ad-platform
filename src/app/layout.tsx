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
      <head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" /></head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
