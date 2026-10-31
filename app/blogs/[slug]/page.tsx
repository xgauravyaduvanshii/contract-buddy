import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getPost, posts } from "@/lib/posts";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div>
      <Container className="py-12">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blogs
        </Link>
      </Container>

      <article className="pb-20">
        <Container>
          <div
            className={`relative flex h-56 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br ${post.gradient} sm:h-72`}
          >
            <div className="absolute inset-0 bg-dotted-sm text-white/20" />
            <span className="relative rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
              {post.category}
            </span>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {post.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {post.date}
              </span>
              <span>· {post.readTime}</span>
            </div>

            <div className="mt-8 space-y-5 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              {post.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-12 rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center text-white">
              <h3 className="text-xl font-semibold">
                Ready to send your first contract?
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-brand-100">
                Create a free account and turn this project into a signed
                agreement today.
              </p>
              <Button
                href="/signup"
                className="mt-5 !bg-white !text-brand-700 hover:!bg-brand-50"
              >
                Get started free
              </Button>
            </div>
          </div>
        </Container>
      </article>

      <Container className="pb-24">
        <h2 className="text-xl font-semibold tracking-tight">Keep reading</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {related.map((p) => (
            <Link
              key={p.slug}
              href={`/blogs/${p.slug}`}
              className="group rounded-3xl border border-zinc-200/70 bg-white/70 p-6 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <p className="text-xs text-zinc-500">{p.category}</p>
              <h3 className="mt-2 font-semibold group-hover:text-brand-600">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {p.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
