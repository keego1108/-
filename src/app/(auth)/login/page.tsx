import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-[18px] font-medium text-[var(--text-primary)] mb-6 text-center">
        ログイン
      </h1>
      <AuthForm mode="login" />
    </div>
  );
}
