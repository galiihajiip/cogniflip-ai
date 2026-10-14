import { Icon } from "@/app/_components/icon";
import { PageFrame } from "@/app/_components/states";

/** Text page in the Stitch card style (footer links have no dedicated Stitch screen). */
export function InfoPage({
  kicker,
  title,
  intro,
  sections,
}: {
  kicker: string;
  title: string;
  intro: string;
  sections: Array<{ icon: string; title: string; body: React.ReactNode }>;
}) {
  return (
    <PageFrame>
      <section className="rounded-3xl bg-surface-container-low p-6 sm:p-10">
        <p className="text-label-ui uppercase text-primary">{kicker}</p>
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-display-hero">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-body-lg text-on-surface-variant">
          {intro}
        </p>
      </section>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <section key={s.title} className="card space-y-3 p-6">
            <h2 className="flex items-center gap-3 text-headline-sm text-on-surface">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <Icon name={s.icon} />
              </span>
              {s.title}
            </h2>
            <div className="space-y-2 text-body-md text-on-surface">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}
