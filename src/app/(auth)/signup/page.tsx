import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-[18px] font-medium text-[var(--text-primary)] mb-6 text-center">
        アカウントを作成
      </h1>
      <AuthForm mode="signup" />
    </div>
  );
}
