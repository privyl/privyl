// Splits a text into plain parts and highlighted parts, for the before/after views.
// Works in the browser and on the server.

import type { Finding } from "privyl";

export interface Segment {
  text: string;
  /** Detector label when this part is personal data or a placeholder. */
  label?: string;
}

/** The original text, with detected values marked. */
export function rawSegments(text: string, findings: readonly Finding[]): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const f of findings) {
    if (f.start > cursor) out.push({ text: text.slice(cursor, f.start) });
    out.push({ text: text.slice(f.start, f.end), label: f.label });
    cursor = f.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

/** The masked text, with placeholders marked. `findings` must come from the same mask call. */
export function maskedSegments(
  text: string,
  findings: readonly Finding[],
  original: string,
): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const f of findings) {
    if (f.start > cursor) out.push({ text: original.slice(cursor, f.start) });
    out.push({ text: f.placeholder, label: f.label });
    cursor = f.end;
  }
  if (cursor < original.length) out.push({ text: original.slice(cursor) });
  // Sanity check: the segments must rebuild the masked text exactly.
  return out.map((s) => s.text).join("") === text ? out : [{ text }];
}
