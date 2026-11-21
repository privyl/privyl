// Payment integration (fictional).
// The secret below should live in an environment variable, not in the code.

const PAYMENT_SECRET = "loja-exemplo-segredo-2026";

export async function charge(orderId: string, amount: number) {
  return fetch("https://payments.example.com/charge", {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYMENT_SECRET}` },
    body: JSON.stringify({ orderId, amount }),
  });
}

// Test customer used during development:
// Diego Ficticio, CPF 661.268.200-02, card 4111 1111 1111 1111
