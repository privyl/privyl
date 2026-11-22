// Runs Privyl over the dataset and compares what it found with the hand-made labels.
//
// A finding counts as correct (true positive) when it has the same type as a label and covers the
// whole labeled value. Covering only part of it is a mistake: the rest would leak to the AI.
// Everything else is a false positive (found, but not personal data) or a false negative
// (personal data that was missed or only partly hidden).

import { createShield } from "../packages/privyl/src/core/index.js";
import { br } from "../packages/privyl/src/br/index.js";
import { global } from "../packages/privyl/src/global/index.js";
import { ENTITY_TYPES, type BenchmarkRecord, type EntityType } from "./dataset.js";

export interface Score {
  /** Labels of this type in the dataset. */
  support: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  /** Of everything found, how much was right. */
  precision: number;
  /** Of all personal data, how much was found. */
  recall: number;
  /** Balance of precision and recall (harmonic mean). */
  f1: number;
}

export interface ErrorExample {
  kind: "false-positive" | "false-negative";
  type: string;
  recordId: string;
  text: string;
  /** The span that was wrongly found, or missed. */
  start: number;
  end: number;
}

export interface BenchmarkResults {
  version: string;
  records: number;
  cleanRecords: number;
  entities: number;
  overall: Score;
  byType: Record<EntityType, Score>;
  /** Clean records (only traps) where Privyl found something anyway. */
  cleanRecordsWithFindings: number;
  /** A few real mistakes per type, so the weaknesses are visible, not hidden. */
  errors: ErrorExample[];
}

const MAX_ERRORS_PER_TYPE = 3;
const round = (n: number) => Math.round(n * 10000) / 10000;

function score(support: number, tp: number, fp: number, fn: number): Score {
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return {
    support,
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
    precision: round(precision),
    recall: round(recall),
    f1: round(f1),
  };
}

/** True when the finding hides the whole labeled value. */
const covers = (finding: { start: number; end: number }, label: { start: number; end: number }) =>
  finding.start <= label.start && finding.end >= label.end;

export function evaluate(dataset: BenchmarkRecord[], version: string): BenchmarkResults {
  const detectors = [...global, ...br];
  const shield = createShield({ detectors });
  // A finding carries the detector id ("br.cpf"); its token ("CPF") is the type we compare.
  const tokenOf = new Map(detectors.map((d) => [d.id, d.token]));
  const counts = new Map<string, { support: number; tp: number; fp: number; fn: number }>();
  const count = (type: string) => {
    let c = counts.get(type);
    if (!c) counts.set(type, (c = { support: 0, tp: 0, fp: 0, fn: 0 }));
    return c;
  };
  const errors: ErrorExample[] = [];
  const addError = (e: ErrorExample) => {
    if (errors.filter((x) => x.type === e.type && x.kind === e.kind).length < MAX_ERRORS_PER_TYPE)
      errors.push(e);
  };
  let cleanRecordsWithFindings = 0;

  for (const record of dataset) {
    const { findings } = shield.mask(record.text);
    const matched = new Set<number>();
    if (record.entities.length === 0 && findings.length > 0) cleanRecordsWithFindings++;

    for (const f of findings) {
      const type = tokenOf.get(f.type) ?? f.type;
      const i = record.entities.findIndex(
        (e, idx) => !matched.has(idx) && e.type === type && covers(f, e),
      );
      if (i >= 0) {
        matched.add(i);
        count(type).tp++;
      } else {
        count(type).fp++;
        addError({
          kind: "false-positive",
          type,
          recordId: record.id,
          text: record.text,
          start: f.start,
          end: f.end,
        });
      }
    }
    record.entities.forEach((e, idx) => {
      count(e.type).support++;
      if (!matched.has(idx)) {
        count(e.type).fn++;
        addError({
          kind: "false-negative",
          type: e.type,
          recordId: record.id,
          text: record.text,
          start: e.start,
          end: e.end,
        });
      }
    });
  }

  const byType = {} as Record<EntityType, Score>;
  for (const type of ENTITY_TYPES) {
    const c = count(type);
    byType[type] = score(c.support, c.tp, c.fp, c.fn);
  }
  const all = [...counts.values()].reduce(
    (a, c) => ({
      support: a.support + c.support,
      tp: a.tp + c.tp,
      fp: a.fp + c.fp,
      fn: a.fn + c.fn,
    }),
    { support: 0, tp: 0, fp: 0, fn: 0 },
  );

  return {
    version,
    records: dataset.length,
    cleanRecords: dataset.filter((r) => r.entities.length === 0).length,
    entities: all.support,
    overall: score(all.support, all.tp, all.fp, all.fn),
    byType,
    cleanRecordsWithFindings,
    errors,
  };
}
