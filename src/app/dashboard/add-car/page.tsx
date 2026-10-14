import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Header, Footer } from "@/components/platform/Shell";
import { AddCar } from "@/components/platform/AddCar";
export default async function Page() {
  const s = await getServerSession(authOptions);
  if (!s) redirect("/login");
  if (s.user.role !== "SELLER") redirect("/dashboard");
  return (
    <div className="platform light-site">
      <Header />
      <main className="account-form-wrap wide">
        <AddCar />
      </main>
      <Footer />
    </div>
  );
}
