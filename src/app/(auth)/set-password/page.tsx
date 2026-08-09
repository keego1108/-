import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SetPasswordForm from "@/components/SetPasswordForm";

export default async function SetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-[18px] font-medium text-[var(--text-primary)] mb-2 text-center">
        パスワードを設定
      </h1>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 text-center">
        次回からこのパスワードでログインできます。
      </p>
      <SetPasswordForm />
    </div>
  );
}
