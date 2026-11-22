/** Serializable form of a vault. It contains real personal data: store it carefully. */
export interface VaultData {
  version: 1;
  entries: [placeholder: string, value: string][];
}

const PLACEHOLDER_RE = /^\[([A-Z][A-Z0-9]*)_(\d+)\]$/;

/**
 * Keeps the link between placeholders and real values.
 *
 * It lives only in memory. Privyl never sends it anywhere.
 * Reuse the same vault across a conversation so the same value always gets the same placeholder.
 */
export class Vault {
  // `#` fields are truly private: they cannot be read from outside the class.
  #valueToPlaceholder = new Map<string, string>();
  #placeholderToValue = new Map<string, string>();
  #counters = new Map<string, number>();

  /** Number of stored values. */
  get size(): number {
    return this.#placeholderToValue.size;
  }

  /** Real value for a placeholder such as `"[CPF_1]"`. */
  get(placeholder: string): string | undefined {
    return this.#placeholderToValue.get(placeholder);
  }

  /** Placeholder already assigned to a value, if any. */
  placeholderOf(value: string): string | undefined {
    return this.#valueToPlaceholder.get(value);
  }

  /** All tokens in use (for example `["CPF", "EMAIL"]`). */
  tokens(): string[] {
    return [...this.#counters.keys()];
  }

  /** Every `[placeholder, value]` pair, in insertion order. */
  entries(): [string, string][] {
    return [...this.#placeholderToValue.entries()];
  }

  /**
   * Returns the placeholder for `value`, creating a new one if needed.
   * `isTaken` lets the caller skip placeholders that already appear in the input text.
   */
  assign(
    token: string,
    value: string,
    isTaken: (placeholder: string) => boolean = () => false,
  ): string {
    const existing = this.#valueToPlaceholder.get(value);
    if (existing) return existing;

    let n = this.#counters.get(token) ?? 0;
    let placeholder: string;
    do {
      n += 1;
      placeholder = `[${token}_${n}]`;
    } while (this.#placeholderToValue.has(placeholder) || isTaken(placeholder));

    this.#counters.set(token, n);
    this.#valueToPlaceholder.set(value, placeholder);
    this.#placeholderToValue.set(placeholder, value);
    return placeholder;
  }

  toJSON(): VaultData {
    return { version: 1, entries: this.entries() };
  }

  /** Rebuilds a vault from `toJSON()`. Throws on anything malformed instead of guessing. */
  static fromJSON(data: VaultData): Vault {
    if (!data || data.version !== 1 || !Array.isArray(data.entries)) {
      throw new Error("Invalid vault data: expected { version: 1, entries: [...] }");
    }
    const vault = new Vault();
    for (const entry of data.entries as unknown[]) {
      if (!Array.isArray(entry) || entry.length !== 2) throw new Error("Invalid vault entry");
      const [placeholder, value] = entry as unknown[];
      if (typeof placeholder !== "string" || typeof value !== "string") {
        throw new Error("Invalid vault entry: placeholder and value must be strings");
      }
      const parsed = PLACEHOLDER_RE.exec(placeholder);
      if (!parsed) throw new Error(`Invalid placeholder in vault data: ${placeholder}`);
      if (vault.#placeholderToValue.has(placeholder) || vault.#valueToPlaceholder.has(value)) {
        throw new Error(`Duplicate entry in vault data: ${placeholder}`);
      }
      const token = parsed[1] as string;
      const n = Number(parsed[2]);
      vault.#valueToPlaceholder.set(value, placeholder);
      vault.#placeholderToValue.set(placeholder, value);
      vault.#counters.set(token, Math.max(n, vault.#counters.get(token) ?? 0));
    }
    return vault;
  }
}
