import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start justify-between px-4 md:px-8 pt-6 pb-3">
      <div>
        <h1 className="text-[20px] font-medium text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "success";
}) {
  const bg =
    tone === "neutral"
      ? "bg-[var(--surface-1)]"
      : tone === "danger"
      ? "bg-[var(--danger-bg)]"
      : tone === "warning"
      ? "bg-[var(--warning-bg)]"
      : "bg-[var(--success-bg)]";
  const text =
    tone === "neutral"
      ? "text-[var(--text-secondary)]"
      : tone === "danger"
      ? "text-[var(--danger)]"
      : tone === "warning"
      ? "text-[var(--warning)]"
      : "text-[var(--success)]";
  const valueColor = tone === "neutral" ? "text-[var(--text-primary)]" : text;

  return (
    <div className={`rounded-[8px] p-3 ${bg}`}>
      <p className={`text-[12px] mb-1 ${text}`}>{label}</p>
      <p className={`text-[22px] font-medium ${valueColor}`}>{value}</p>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "success" | "accent";
}) {
  const styles: Record<string, string> = {
    neutral: "bg-[var(--surface-1)] text-[var(--text-secondary)]",
    danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
    success: "bg-[var(--success-bg)] text-[var(--success)]",
    accent: "bg-[var(--accent-bg)] text-[var(--accent)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[12px] ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-12 rounded-[8px] bg-[var(--brand)] text-[var(--on-brand)] text-[15px] font-medium flex items-center justify-center gap-2 hover:bg-[var(--brand-hover)] active:scale-[0.98] transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-12 rounded-[8px] border border-[var(--border-strong)] text-[var(--text-primary)] text-[15px] flex items-center justify-center gap-2 hover:bg-[var(--surface-1)] active:scale-[0.98] transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
