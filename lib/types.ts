export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Note {
  id: string;
  user_id: string;
  raw_text: string;
  summary: string | null;
  target_date: string | null;
  time_of_day: TimeOfDay | null;
  category: string | null;
  category_updated_at: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  user_id: string;
  question: string;
  answer: string | null;
  relevant_note_ids: string[];
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  question_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  relevant_note_ids: string[];
  created_at: string;
}

/** How a related note stands in relation to the draft it was matched against. */
export type NoteRelationType = 'supports' | 'extends' | 'contradicts' | 'question';

export interface RelevanceResult {
  note_id: string;
  relevance_score: number;
  relation_type: NoteRelationType;
  explanation: string;
}

/**
 * How much of the note corpus actually got searched. When an agent fails both
 * of its attempts its notes go unread, and the user is told rather than being
 * shown a silently incomplete result.
 */
export interface RelevanceCoverage {
  notes_searched: number;
  notes_total: number;
  complete: boolean;
}

export interface RelevantNotesResponse {
  results: RelevanceResult[];
  coverage: RelevanceCoverage;
}
