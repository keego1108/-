import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";

export default function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      <IconChevronLeft size={16} aria-hidden />
      戻る
    </Link>
  );
}
