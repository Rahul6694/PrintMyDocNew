import { SitePage, Lead, Note, Sec, ContactBox, LegalLinks } from "@/components/site/SitePage";
import { SUPPORT_EMAIL as SITE_SUPPORT_EMAIL } from "@/lib/site";

export const LEGAL_LAST_UPDATED = "15 October 2026";
export const SUPPORT_EMAIL = SITE_SUPPORT_EMAIL;

type Section = { id: string; title: string; body: React.ReactNode; tone?: "warn" | "accent" };

export default function LegalPage({
  title,
  intro,
  sections,
  eyebrow = "⚖️ Legal",
  note,
  tagline = "printmydoc.app",
  path,
  lastUpdated = LEGAL_LAST_UPDATED,
}: {
  title: string;
  intro: React.ReactNode;
  sections: Section[];
  eyebrow?: string;
  /** Short "in plain language" summary shown under the intro. */
  note?: React.ReactNode;
  tagline?: React.ReactNode;
  /** This page's route, so the footer link row can leave it out. */
  path?: string;
  lastUpdated?: string;
}) {
  return (
    <SitePage
      eyebrow={eyebrow}
      title={title}
      meta={[
        <>
          Last updated: <b className="text-ink">{lastUpdated}</b>
        </>,
        tagline,
      ]}
    >
      <Lead>{intro}</Lead>
      {note && <Note title="In plain language">{note}</Note>}

      <nav aria-label="On this page" className="rounded-2xl border border-base-700 bg-base-850 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-base-500 mb-2">On this page</p>
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-base-500 hover:text-accent-500 transition-colors">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <Sec key={s.id} id={s.id} n={i + 1} title={s.title} tone={s.tone}>
          {s.body}
        </Sec>
      ))}

      <ContactBox />
      <LegalLinks current={path} />
    </SitePage>
  );
}
