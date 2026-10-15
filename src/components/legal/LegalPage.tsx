import Link from "next/link";
import Footer from "@/components/landing/Footer";

export const LEGAL_LAST_UPDATED = "15 October 2026";
export const SUPPORT_EMAIL = "support@printmydoc.app";

type Section = { id: string; title: string; body: React.ReactNode };

export default function LegalPage({ title, intro, sections }: { title: string; intro: React.ReactNode; sections: Section[] }) {
  return (
    <main>
      <nav className="border-b border-base-700/60 sticky top-0 bg-base-950/90 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Print<span className="text-accent-400">MyDoc</span>
          </Link>
          <Link href="/" className="text-sm text-base-500 hover:text-ink transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <header className="mb-10 max-w-3xl">
          <span className="badge bg-accent-500/15 text-accent-400 mb-4 inline-block">Legal</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{title}</h1>
          <p className="text-sm text-base-500 mb-5">Last updated: {LEGAL_LAST_UPDATED}</p>
          <div className="text-base-500 leading-relaxed">{intro}</div>
        </header>

        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-500 mb-3">On this page</p>
              <ol className="flex flex-col gap-2 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-base-500 hover:text-ink transition-colors">
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <article className="max-w-3xl flex flex-col gap-9">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold mb-3">
                  {i + 1}. {s.title}
                </h2>
                <div className="text-base-500 leading-relaxed flex flex-col gap-3">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </div>

      <Footer />
    </main>
  );
}
