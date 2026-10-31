export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-zinc-400">
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      or continue with
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

const pill =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white/70 text-sm font-medium text-foreground transition hover:border-brand-400 hover:text-brand-700 dark:border-zinc-700 dark:bg-transparent";

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/auth/social/google" className={pill}>
        Google
      </a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/auth/social/github" className={pill}>
        GitHub
      </a>
    </div>
  );
}
