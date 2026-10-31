import Link from "next/link";
import { FileSignature } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30 transition-transform group-hover:scale-105">
        <FileSignature className="h-5 w-5" />
      </span>
      <span className="text-lg">
        Contract<span className="text-brand-600">Buddy</span>
      </span>
    </Link>
  );
}
