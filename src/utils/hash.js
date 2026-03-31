export async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function shortHash(h) {
  return h.slice(0, 7);
}

export async function agentHash(name, colorKey, ts) {
  return sha256(`${name}::${colorKey}::${ts}::${Math.random()}`);
}
