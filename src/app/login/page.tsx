import { AuthForm } from "@/components/platform/AuthForm";
import { emailReady } from "@/lib/email";
export default function Page() {
  return <AuthForm emailConfigured={emailReady()} />;
}
