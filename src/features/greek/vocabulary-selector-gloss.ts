export function oneWordVocabularyGloss(meaning: string) {
  let value = meaning.trim();
  value = value.replace(/^\([^)]*\)\s*/u, "");
  value = value.split(/\s*[;,—]\s*/u, 1)[0]?.trim() ?? value;
  value = value.replace(/^[A-Za-z]{1,8}\.\s+/u, "");
  value = value.replace(/^to\s+/iu, "");
  if (/^be\s+\S+/iu.test(value)) value = value.replace(/^be\s+/iu, "");
  value = value.replace(/^(?:a|an|the)\s+/iu, "");
  const match = value.match(/[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*/u);
  return match?.[0] ?? value.split(/\s+/u)[0] ?? "";
}
