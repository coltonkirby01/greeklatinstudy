import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { DictionaryMatch, TranslationHelperLanguage } from "./dictionary-sources";
import type { TranslationVocabEntry } from "./translation-vocab-model";

const selection = "id,language,surface_form,headword,definition,source,source_ref,created_at,updated_at";

type TranslationVocabRow = {
  id: string;
  language: string;
  surface_form: string;
  headword: string;
  definition: string;
  source: string;
  source_ref: string | null;
  created_at: string;
  updated_at: string;
};

function client() {
  if (!supabase) throw new Error("Cloud accounts are not configured.");
  return supabase as unknown as SupabaseClient;
}

function toEntry(row: TranslationVocabRow): TranslationVocabEntry {
  return {
    id: row.id,
    language: row.language === "greek" ? "greek" : "latin",
    surfaceForm: row.surface_form,
    headword: row.headword,
    definition: row.definition,
    source: row.source,
    sourceRef: row.source_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTranslationVocabEntries(user: User | null, language: TranslationHelperLanguage) {
  if (!user || !supabase) return [] as TranslationVocabEntry[];
  const { data, error } = await client()
    .from("translation_vocab_cards")
    .select(selection)
    .eq("user_id", user.id)
    .eq("language", language)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as TranslationVocabRow[]).map(toEntry);
}

export async function saveTranslationVocabEntry(
  user: User | null,
  language: TranslationHelperLanguage,
  surfaceForm: string,
  match: DictionaryMatch,
) {
  if (!user) throw new Error("Sign in to save vocabulary to your account.");
  const updatedAt = new Date().toISOString();
  const payload = {
    user_id: user.id,
    language,
    surface_form: surfaceForm.trim(),
    headword: match.headword.trim(),
    definition: match.definition.trim(),
    source: match.source.trim() || "Translation Helper source",
    source_ref: match.sourceRef?.trim() || null,
    updated_at: updatedAt,
  };
  const { data, error } = await client()
    .from("translation_vocab_cards")
    .upsert(payload, { onConflict: "user_id,language,headword,definition,source" })
    .select(selection)
    .single();
  if (error) throw error;
  return toEntry(data as TranslationVocabRow);
}

export async function deleteTranslationVocabEntry(user: User | null, id: string) {
  if (!user) throw new Error("Sign in to manage saved vocabulary.");
  const { error } = await client()
    .from("translation_vocab_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}
