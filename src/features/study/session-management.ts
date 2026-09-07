import type { DeckProgressEnvelope, ReviewRecord } from "./types";

export type ManagedSession = {
  id: string;
  language: "Greek" | "Latin";
  sources: string[];
  startedAt: number;
  lastReviewedAt: number;
  reviews: number;
  name?: string;
  inferred?: boolean;
  reviewIds?: string[];
};

export type SessionMutation = {
  envelope: DeckProgressEnvelope;
  changed: boolean;
  reviewIds: string[];
};

type SessionReview = {
  language: "Greek" | "Latin";
  source: string;
  review: ReviewRecord;
};

const SESSION_DECKS = {
  Greek: ["greek-i", "alpha-omega-lesson3-vocab", "alpha-omega-lesson3-grammar"],
  Latin: ["dickinson-latin-core", "henle-part1-forms"],
} as const;

export function sessionDeckIdsForLanguage(language: "Greek" | "Latin") {
  return [...SESSION_DECKS[language]];
}

function deckLanguage(deckId: string): "Greek" | "Latin" {
  return deckId.startsWith("greek-") || deckId.startsWith("alpha-omega-") ? "Greek" : "Latin";
}

function sourceLabel(deckId: string, studyKey: string) {
  if (deckId === "greek-i") return "Lessons 1–2";
  if (deckId === "alpha-omega-lesson3-vocab") return "Lesson 3 Vocabulary";
  if (deckId === "alpha-omega-lesson3-grammar") return "Lesson 3 Grammar";
  if (deckId === "dickinson-latin-core") return "Dickinson Vocabulary";
  if (deckId === "henle-part1-forms") return studyKey.startsWith("chart") ? "Henle Whole Charts" : "Henle Grammar Forms";
  return deckId;
}

export function sessionCustomNameFromReviews(reviews: Array<Pick<ReviewRecord, "sessionName" | "reviewedAt">>) {
  let latest: { name: string; reviewedAt: number } | null = null;
  for (const review of reviews) {
    const name = review.sessionName?.trim();
    if (!name) continue;
    if (!latest || review.reviewedAt >= latest.reviewedAt) latest = { name, reviewedAt: review.reviewedAt };
  }
  return latest?.name;
}

function summarizeChronologicalSession(id: string, language: "Greek" | "Latin", entries: SessionReview[], inferred: boolean): ManagedSession {
  const sources: string[] = [];
  const reviewIds: string[] = [];
  let startedAt = Number.POSITIVE_INFINITY;
  let lastReviewedAt = 0;
  let latestName: { name: string; reviewedAt: number } | null = null;

  for (const entry of entries) {
    if (!sources.includes(entry.source)) sources.push(entry.source);
    const review = entry.review;
    reviewIds.push(review.id);
    startedAt = Math.min(startedAt, review.sessionStartedAt ?? review.reviewedAt);
    lastReviewedAt = Math.max(lastReviewedAt, review.reviewedAt);
    const name = review.sessionName?.trim();
    if (name && (!latestName || review.reviewedAt >= latestName.reviewedAt)) latestName = { name, reviewedAt: review.reviewedAt };
  }

  return {
    id,
    language,
    sources,
    startedAt,
    lastReviewedAt,
    reviews: entries.length,
    name: latestName?.name,
    inferred,
    reviewIds,
  };
}

export function collectManagedSessions(envelopes: Record<string, DeckProgressEnvelope | null>) {
  const reviewsByLanguage: Record<"Greek" | "Latin", SessionReview[]> = { Greek: [], Latin: [] };
  for (const [deckId, envelope] of Object.entries(envelopes)) {
    if (!envelope) continue;
    const language = deckLanguage(deckId);
    const target = reviewsByLanguage[language];
    for (const [studyKey, mode] of Object.entries(envelope.modes)) {
      const source = sourceLabel(deckId, studyKey);
      for (const progress of Object.values(mode.cards)) {
        for (const review of progress.history) {
          if (review.activityKind === "warmup" || review.statsExcluded) continue;
          target.push({ language, source, review });
        }
      }
    }
  }

  const sessions: ManagedSession[] = [];
  for (const language of ["Greek", "Latin"] as const) {
    const languageReviews = reviewsByLanguage[language].sort((a, b) => a.review.reviewedAt - b.review.reviewedAt);
    const explicit = new Map<string, SessionReview[]>();
    const legacy: SessionReview[] = [];
    for (const entry of languageReviews) {
      const sessionId = entry.review.sessionId;
      if (!sessionId) {
        legacy.push(entry);
        continue;
      }
      const entries = explicit.get(sessionId);
      if (entries) entries.push(entry);
      else explicit.set(sessionId, [entry]);
    }

    for (const [id, entries] of explicit) sessions.push(summarizeChronologicalSession(id, language, entries, false));

    let inferredIndex = 0;
    let bucket: SessionReview[] = [];
    const closeBucket = () => {
      if (!bucket.length) return;
      sessions.push(summarizeChronologicalSession(`legacy-${language}-${inferredIndex++}`, language, bucket, true));
      bucket = [];
    };
    for (const entry of legacy) {
      const previous = bucket.at(-1)?.review;
      if (previous && entry.review.reviewedAt - previous.reviewedAt > 30 * 60_000) closeBucket();
      bucket.push(entry);
    }
    closeBucket();
  }

  return sessions.sort((a, b) => b.startedAt - a.startedAt || b.lastReviewedAt - a.lastReviewedAt);
}

export function automaticManagedSessionName(session: ManagedSession, formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })) {
  const focus = session.sources.length === 1 ? session.sources[0] : session.sources.length === 2 ? session.sources.join(" + ") : "Mixed study";
  return `${session.language} · ${focus} · ${formatter.format(session.startedAt)}`;
}

export function displayManagedSessionName(session: ManagedSession) {
  return session.name?.trim() || automaticManagedSessionName(session);
}

function mutateReviewsInEnvelope(
  envelope: DeckProgressEnvelope,
  matches: (review: ReviewRecord) => boolean,
  mutate: (review: ReviewRecord) => ReviewRecord,
  now: number,
): SessionMutation {
  const next = structuredClone(envelope);
  let changed = false;
  const reviewIds: string[] = [];

  for (const mode of Object.values(next.modes)) {
    let modeChanged = false;
    for (const progress of Object.values(mode.cards)) {
      progress.history = progress.history.map((review) => {
        if (!matches(review)) return review;
        changed = true;
        modeChanged = true;
        reviewIds.push(review.id);
        return mutate(review);
      });
    }
    if (modeChanged) mode.updatedAt = Math.max(mode.updatedAt, now);
  }

  if (changed) next.updatedAt = Math.max(next.updatedAt, now);
  return { envelope: next, changed, reviewIds: [...new Set(reviewIds)] };
}

function excludeSessionReviewsInEnvelope(
  envelope: DeckProgressEnvelope,
  matches: (review: ReviewRecord) => boolean,
  now: number,
): SessionMutation {
  const mutation = mutateReviewsInEnvelope(
    envelope,
    matches,
    (review) => {
      const { sessionId: _sessionId, sessionStartedAt: _sessionStartedAt, sessionName: _sessionName, ...learningReview } = review;
      return { ...learningReview, statsExcluded: true };
    },
    now,
  );
  if (!mutation.changed) return mutation;
  const sessionDeletedReviewIds = [...new Set([...(mutation.envelope.sessionDeletedReviewIds ?? []), ...mutation.reviewIds])];
  return { ...mutation, envelope: { ...mutation.envelope, sessionDeletedReviewIds } };
}

export function renameSessionInEnvelope(envelope: DeckProgressEnvelope, sessionId: string, name: string, now = Date.now()): SessionMutation {
  return mutateReviewsInEnvelope(
    envelope,
    (review) => review.sessionId === sessionId && review.activityKind !== "warmup",
    (review) => ({ ...review, sessionName: name }),
    now,
  );
}

export function renameReviewsInEnvelope(envelope: DeckProgressEnvelope, reviewIds: readonly string[], name: string, now = Date.now()): SessionMutation {
  const ids = new Set(reviewIds);
  return mutateReviewsInEnvelope(
    envelope,
    (review) => ids.has(review.id) && review.activityKind !== "warmup" && !review.statsExcluded,
    (review) => ({ ...review, sessionName: name }),
    now,
  );
}

export function deleteSessionFromEnvelope(envelope: DeckProgressEnvelope, sessionId: string, now = Date.now()): SessionMutation {
  const mutation = excludeSessionReviewsInEnvelope(
    envelope,
    (review) => review.sessionId === sessionId && review.activityKind !== "warmup",
    now,
  );
  if (!mutation.changed) return mutation;
  const deletedSessionIds = [...new Set([...(mutation.envelope.deletedSessionIds ?? []), sessionId])];
  return { ...mutation, envelope: { ...mutation.envelope, deletedSessionIds } };
}

export function deleteReviewsFromEnvelope(envelope: DeckProgressEnvelope, reviewIds: readonly string[], now = Date.now()): SessionMutation {
  const ids = new Set(reviewIds);
  return excludeSessionReviewsInEnvelope(
    envelope,
    (review) => ids.has(review.id) && review.activityKind !== "warmup" && !review.statsExcluded,
    now,
  );
}

// Backward-compatible export used by Stats. Deleting a session now removes its
// session/Stats identity while preserving the underlying review evidence used by
// mastery, scheduling, response-time memory, and adaptive learning.
export const deleteReviewsFromStatsInEnvelope = deleteReviewsFromEnvelope;