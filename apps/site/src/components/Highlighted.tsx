import type { Segment } from "@/lib/highlight";

/** Renders text with personal data (red) or placeholders (blue) highlighted. */
export function Highlighted({ segments, tone }: { segments: Segment[]; tone: "alert" | "sky" }) {
  const style =
    tone === "alert"
      ? "bg-alert/15 text-[#ff8a8c] ring-1 ring-alert/30"
      : "bg-sky/15 text-sky ring-1 ring-sky/30";
  return (
    <>
      {segments.map((s, i) =>
        s.label ? (
          <mark key={i} title={s.label} className={`rounded px-1 ${style}`}>
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
