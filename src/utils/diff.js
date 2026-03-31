export function computeDiff(a, b) {
  if (a === b) return [];
  const al = a.split("\n"), bl = b.split("\n"), r = [];
  const max = Math.max(al.length, bl.length);
  for (let i = 0; i < max; i++) {
    if (al[i] === undefined) r.push({ type: "add", text: bl[i] });
    else if (bl[i] === undefined) r.push({ type: "del", text: al[i] });
    else if (al[i] !== bl[i]) { r.push({ type: "del", text: al[i] }); r.push({ type: "add", text: bl[i] }); }
    else r.push({ type: "same", text: al[i] });
  }
  return r;
}

export function countChanges(diffLines) {
  return {
    adds: diffLines.filter(d => d.type === "add").length,
    dels: diffLines.filter(d => d.type === "del").length,
  };
}
