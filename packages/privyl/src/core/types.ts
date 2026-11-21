/** Where a candidate match was found. Passed to `validate` and `confidence`. */
export interface MatchContext {
  /** The full input text. */
  text: string;
  /** Start index of the match (UTF-16 code units, like `String.prototype.slice`). */
  start: number;
  /** End index of the match (exclusive). */
  end: number;
}

/**
 * A Detector finds one kind of personal data (for example a Brazilian CPF).
 *
 * Detectors are plain objects, so anyone can write one for a new country.
 */
export interface Detector {
  /** Unique id, `<country>.<name>`. Example: `"br.cpf"`. */
  id: string;
  /** Human readable name. Example: `"CPF"`. */
  label: string;
  /** Placeholder token, uppercase letters and digits only. Example: `"CPF"` → `[CPF_1]`. */
  token: string;
  /** ISO country code in lowercase (`"br"`), or `"global"`. */
  country: string;
  /** Finds candidates. The whole match (`match[0]`) is the value that gets masked. */
  pattern: RegExp;
  /** Optional extra check, such as a check digit. Return `false` to discard the candidate. */
  validate?: (value: string, context: MatchContext) => boolean;
  /** How sure we are, from 0 to 1. Used to resolve overlaps. Default: `0.9`. */
  confidence?: number | ((value: string, context: MatchContext) => number);
}

/**
 * Something that was detected. It never contains the real value, so it is safe to log.
 */
export interface Finding {
  /** Detector id. Example: `"br.cpf"`. */
  type: string;
  label: string;
  country: string;
  /** Start index in the original text. */
  start: number;
  /** End index in the original text (exclusive). */
  end: number;
  confidence: number;
  /** The placeholder that replaced the value. Example: `"[CPF_1]"`. */
  placeholder: string;
}
