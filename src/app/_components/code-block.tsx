/** Read-only code panel in the Stitch dark editor style, with line numbers. */
export function CodeBlock({
  code,
  filename,
  language,
  highlightLines = [],
}: {
  code: string;
  filename?: string;
  language?: string;
  highlightLines?: number[];
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <figure className="overflow-hidden rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-inner">
      {filename || language ? (
        <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-container" />
            <span className="h-2.5 w-2.5 rounded-full bg-tertiary-fixed-dim" />
            {filename ? (
              <span className="ml-2 font-mono text-label-code-sm text-surface-container-highest">
                {filename}
              </span>
            ) : null}
          </span>
          {language ? (
            <span className="font-mono text-label-code-sm text-surface-container-high">
              {language}
            </span>
          ) : null}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-label-code-lg leading-7">
        <code>
          {lines.map((line, i) => (
            <span
              key={i}
              className={`flex gap-4 rounded-md px-1 ${
                highlightLines.includes(i + 1) ? "bg-white/10" : ""
              }`}
            >
              <span className="w-6 shrink-0 select-none text-right text-outline">
                {i + 1}
              </span>
              <span className="whitespace-pre">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
