import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { TranslationHelperLanguage } from "./dictionary-sources";

export type CloudTranslationText = {
  id: string;
  title: string;
  language: TranslationHelperLanguage;
  content: string;
  sourceFilename: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CloudTranslationTextInput = {
  id?: string | null;
  title: string;
  language: TranslationHelperLanguage;
  content: string;
  sourceFilename?: string | null;
};

type TranslationTextRow = {
  id: string;
  title: string;
  language: string;
  content: string;
  source_filename: string | null;
  created_at: string;
  updated_at: string;
};

function client() {
  if (!supabase) throw new Error("Cloud accounts are not configured.");
  return supabase as unknown as SupabaseClient;
}

function toCloudText(row: TranslationTextRow): CloudTranslationText {
  return {
    id: row.id,
    title: row.title,
    language: row.language === "greek" ? "greek" : "latin",
    content: row.content,
    sourceFilename: row.source_filename,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCloudTranslationTexts(user: User | null, limit = 30) {
  if (!user || !supabase) return [] as CloudTranslationText[];
  const { data, error } = await client()
    .from("translation_texts")
    .select("id,title,language,content,source_filename,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as TranslationTextRow[]).map(toCloudText);
}

export async function saveCloudTranslationText(user: User | null, input: CloudTranslationTextInput) {
  if (!user) throw new Error("Sign in to save this text to your cloud account.");
  const title = input.title.trim() || "Untitled reading";
  const content = input.content.trim();
  if (!content) throw new Error("There is no text to save.");
  const updatedAt = new Date().toISOString();
  const payload = {
    user_id: user.id,
    title,
    language: input.language,
    content,
    source_filename: input.sourceFilename ?? null,
    updated_at: updatedAt,
  };

  if (input.id) {
    const { data, error } = await client()
      .from("translation_texts")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("id,title,language,content,source_filename,created_at,updated_at")
      .single();
    if (error) throw error;
    return toCloudText(data as TranslationTextRow);
  }

  const { data, error } = await client()
    .from("translation_texts")
    .insert(payload)
    .select("id,title,language,content,source_filename,created_at,updated_at")
    .single();
  if (error) throw error;
  return toCloudText(data as TranslationTextRow);
}

export async function deleteCloudTranslationText(user: User | null, id: string) {
  if (!user) throw new Error("Sign in to manage cloud texts.");
  const { error } = await client().from("translation_texts").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}
