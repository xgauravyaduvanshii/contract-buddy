import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Practical guides on contracts, e-signatures and closing client work — written for developers, freelancers and agencies.",
};

const [featured, ...rest] = posts;

export default function BlogsPage() {
  return (
    <div>
      <PageHero
        eyebrow="Blogs"
        title="Field notes on closing client work"
        subtitle="Playbooks, clause tips and signature know-how to help you win projects and get paid."
      />

      <Container className="pb-24">
        {/* Featured */}
        <Link
          href={`/blogs/${featured.slug}`}
          className="group grid overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-white/70 shadow-sm backdrop-blur transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50 md:grid-cols-2"
        >
          <div
            className={`relative flex min-h-[240px] items-end bg-gradient-to-br ${featured.gradient} p-8`}
          >
            <div className="absolute inset-0 bg-dotted-sm text-white/20" />
            <span className="relative rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              Featured · {featured.category}
            </span>
          </div>
          <div className="flex flex-col justify-center p-8">
            <p className="text-sm text-zinc-500">
              {featured.date} · {featured.readTime}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight group-hover:text-brand-600">
              {featured.title}
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              {featured.excerpt}
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Read article <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="group flex flex-col rounded-3xl border border-zinc-200/70 bg-white/70 p-6 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div
                className={`mb-5 flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br ${post.gradient}`}
              >
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {post.category}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {post.date} · {post.readTime}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight group-hover:text-brand-600">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-300">
                {post.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                Read article <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
