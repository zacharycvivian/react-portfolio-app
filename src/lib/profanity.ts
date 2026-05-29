let cachedWords: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;

export async function loadBannedWords(): Promise<string[]> {
  if (cachedWords) return cachedWords;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/NaughtyWords.txt")
    .then((r) => r.text())
    .then((text) => {
      cachedWords = text
        .split(/\r?\n/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      return cachedWords;
    })
    .catch(() => {
      fetchPromise = null;
      return [];
    });
  return fetchPromise;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function filterProfanity(text: string, bannedWords: string[]): { filtered: string; hadProfanity: boolean } {
  let result = text;
  let hadProfanity = false;
  for (const word of bannedWords) {
    if (!word) continue;
    const escaped = escapeRegExp(word);
    // \b word boundaries prevent "assassin" from matching "ass"
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    if (regex.test(result)) {
      hadProfanity = true;
      result = result.replace(regex, "*".repeat(word.length));
    }
  }
  return { filtered: result, hadProfanity };
}
