import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import SellerDashboard from '@/components/dashboard/SellerDashboard'
import { BuyerDashboard } from '@/components/dashboard/BuyerDashboard'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/dashboard')
  return <main className="min-h-screen bg-[#080a07] px-5 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl">
    {session.user.role === 'SELLER' ? <SellerDashboard /> : session.user.role === 'BUYER' ? <BuyerDashboard /> : <AdminDashboard />}
  </div></main>
}
