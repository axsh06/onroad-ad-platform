import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SellerDashboard from "@/components/dashboard/SellerDashboard";
import { BuyerDashboard } from "@/components/dashboard/BuyerDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Header, Footer, AccountActions } from "@/components/platform/Shell";
export default async function DashboardPage() {
  const s = await getServerSession(authOptions);
  if (!s?.user) redirect("/login");
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap">
        <AccountActions />
        {s.user.role === "SELLER" ? (
          <SellerDashboard />
        ) : s.user.role === "BUYER" ? (
          <BuyerDashboard />
        ) : (
          <AdminDashboard />
        )}
      </main>
      <Footer />
    </div>
  );
}
