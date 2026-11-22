import { describe, expect, it } from "vitest";
import { br } from "./br/index.js";
import { createShield, Vault } from "./core/index.js";
import { global } from "./global/index.js";
import { createFaker } from "./testing/index.js";

const shield = createShield({ detectors: [...global, ...br] });

describe("global + br", () => {
  it("matches the README example", () => {
    const { text, vault } = shield.mask("Cliente CPF 529.982.247-25, email joao@example.com");
    expect(text).toBe("Cliente CPF [CPF_1], email [EMAIL_1]");

    const aiResponse = "Pronto! O cliente [CPF_1] vai receber o boleto em [EMAIL_1].";
    expect(shield.unmask(aiResponse, vault)).toBe(
      "Pronto! O cliente 529.982.247-25 vai receber o boleto em joao@example.com.",
    );
  });

  it("prefers the Brazilian phone detector for +55 numbers", () => {
    const [finding] = shield.mask("ligue +55 11 98765-4321").findings;
    expect(finding?.type).toBe("br.phone");
  });

  it("round-trips a long generated document", () => {
    const faker = createFaker(2026);
    const lines: string[] = [];
    for (let i = 0; i < 200; i++) {
      lines.push(
        `${faker.name()};${faker.cpf()};${faker.email()};${faker.phoneBr()};` +
          `CEP ${faker.cep()};${faker.card()};${faker.ipv4()}`,
      );
    }
    const input = lines.join("\n");
    const { text, vault, findings } = shield.mask(input);

    expect(findings.length).toBe(200 * 6);
    expect(text).not.toMatch(/@example\.com|\d{3}\.\d{3}\.\d{3}-\d{2}/);
    expect(shield.unmask(text, vault)).toBe(input);
  });

  it("keeps a conversation consistent with a shared vault", () => {
    const vault = new Vault();
    const turn1 = shield.mask("Meu CPF é 529.982.247-25", { vault });
    const turn2 = shield.mask("Confirma o CPF 529.982.247-25 e o e-mail ana@example.com?", {
      vault,
    });
    expect(turn1.text).toBe("Meu CPF é [CPF_1]");
    expect(turn2.text).toBe("Confirma o CPF [CPF_1] e o e-mail [EMAIL_1]?");
  });
});
