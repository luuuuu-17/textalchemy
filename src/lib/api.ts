export type AlchemyResponse = {
  reply: string;
};

const API_BASE = import.meta.env.VITE_ALCHEMY_API_BASE ?? "";
export async function fetchAlchemyText(input: string, seedChars: string[]): Promise<string> {
  const response = await fetch(`${API_BASE}/api/alchemy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input, seedChars }),
  });

  if (!response.ok) {
    throw new Error("Alchemy request failed");
  }

  const data = (await response.json()) as AlchemyResponse;
  return data.reply;
}

