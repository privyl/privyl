// Detector names come from the library in English. The site shows them in the visitor's language.
// Works in the browser and on the server.

import type { Locale } from "./dictionaries";

const pt: Record<string, string> = {
  Email: "E-mail",
  "Payment card": "Cartão de pagamento",
  Phone: "Telefone",
  "IP address": "Endereço IP",
  "AWS access key": "Chave de acesso AWS",
  "GitHub token": "Token do GitHub",
  "Anthropic API key": "Chave de API da Anthropic",
  "OpenAI API key": "Chave de API da OpenAI",
  "Stripe key": "Chave da Stripe",
  "Slack token": "Token do Slack",
  "Google API key": "Chave de API do Google",
  "JSON Web Token": "JSON Web Token",
  "Private key": "Chave privada",
  "Password or secret": "Senha ou segredo",
  "Pix key": "Chave Pix",
  "Vehicle plate": "Placa de veículo",
  "Phone (BR)": "Telefone (BR)",
};

/** The detector label in the visitor's language (unknown labels stay as they are). */
export function detectorLabel(label: string, lang: Locale): string {
  return lang === "pt" ? (pt[label] ?? label) : label;
}

/** Same, for a list of highlighted segments. */
export function localizeSegments<T extends { label?: string }>(segments: T[], lang: Locale): T[] {
  return segments.map((s) => (s.label ? { ...s, label: detectorLabel(s.label, lang) } : s));
}
