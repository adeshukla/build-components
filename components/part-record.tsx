import Link from "next/link";
import { partBySlug } from "@/lib/parts";
import type { RegistrySlug } from "@/lib/registry";
import { problemEmail } from "@/lib/site";
import results from "@/lib/test-results.json";
import { changesOf } from "@/lib/versions";

/*
 * Under a part's editor (D90): what has changed in it, version by version; what its last test run found,
 * as written by scripts/test-results.mjs; and a way to report a problem with the version in hand.
 */

type Run = { ranOn: string; commit: string; browsers: { [browser: string]: { passed: number; failed: number } } };

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-10-04" as "4 October 2026", by hand: Intl differs between the server and browsers. */
const sayDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${months[month - 1]} ${year}`;
};
const browserNames: { [browser: string]: string } = { chromium: "Chromium", webkit: "WebKit (Safari's engine)", iphone: "iPhone, emulated" };

export function PartRecord({ slug }: { slug: RegistrySlug }) {
  const name = partBySlug(slug).name;
  const changes = changesOf(slug);
  const version = changes[0].version;
  const record = (results as { [slug: string]: Run })[slug];
  const subject = `Problem with ${name} ${version}`;
  const body = "What I did:\n\nWhat I expected:\n\nWhat happened instead:\n\nBrowser and device:\n";

  return (
    <div className="page-wrap grid-gap grid pb-[clamp(3rem,6vw,5rem)] md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section id="changes" aria-labelledby="changes-heading" className="scroll-mt-6 rounded-2xl border border-rule bg-paper p-6">
        <h2 id="changes-heading" className="font-display text-3xl leading-none">
          Changes
        </h2>
        <p className="mt-2 text-sm text-ink-muted">{`This is ${version}. A copy you took names its version on its first line.`}</p>
        <ol className="mt-5 grid gap-4">
          {changes.map((change) => (
            <li key={change.version} className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <p className="font-mono text-sm">
                {change.version}
                <span className="block text-xs text-ink-muted">{sayDate(change.date)}</span>
              </p>
              <p className="text-sm text-pretty">
                <span className="font-medium">{{ first: "Released.", added: "Added.", fixed: "Fixed." }[change.kind]}</span>
                {change.note && ` ${change.note}`}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid-gap grid content-start">
        <section aria-labelledby="tested-heading" className="rounded-2xl border border-rule bg-paper p-6">
          <h2 id="tested-heading" className="font-display text-3xl leading-none">
            Last test run
          </h2>
          {record ? (
            <>
              <p className="mt-2 text-sm text-ink-muted">{`${sayDate(record.ranOn)}, at commit ${record.commit}: this part's own tests, in both outputs.`}</p>
              <ul className="mt-4 grid gap-2 text-sm">
                {Object.entries(record.browsers).map(([browser, counts]) => (
                  <li key={browser} className="flex flex-wrap justify-between gap-x-4">
                    <span>{browserNames[browser] ?? browser}</span>
                    <span className="font-mono">
                      {counts.failed === 0 ? `${counts.passed} passed` : `${counts.failed} failed, ${counts.passed} passed`}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">No run recorded for this part yet.</p>
          )}
          <p className="mt-4 text-sm">
            <Link href="/tested" className="underline decoration-rule-strong underline-offset-3 hover:decoration-accent">
              What every part is tested for
            </Link>
          </p>
        </section>

        <section aria-labelledby="problem-heading" className="rounded-2xl border border-rule bg-paper p-6">
          <h2 id="problem-heading" className="font-display text-3xl leading-none">
            Found a problem?
          </h2>
          <p className="mt-2 text-sm text-pretty text-ink-muted">Write to us: the subject already names the part and this version.</p>
          <p className="mt-4 text-sm">
            <a
              href={`mailto:${problemEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="underline decoration-rule-strong underline-offset-3 hover:decoration-accent"
            >
              {`Report a problem with ${name}`}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
