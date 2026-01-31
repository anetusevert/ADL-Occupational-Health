/**
 * Report Workshop Types
 * Type definitions for the report generation workflow
 */

// Queue item status
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Queue item from API
export interface QueueItem {
  id: string;
  iso_code: string;
  country_name: string;
  topic: string;
  status: QueueItemStatus;
  queue_position?: number;
  created_at?: string;
  updated_at?: string;
}

// Queue status response from API
export interface QueueStatusResponse {
  processing_count: number;
  pending_count: number;
  queue_items: QueueItem[];
}

// Generation response from API
export interface GenerationResponse {
  success: boolean;
  iso_code: string;
  country_name: string;
  topic: string;
  report: DeepDiveReport | null;
  error: string | null;
  generation_time_seconds: number;
}

// Deep dive report structure
export interface DeepDiveReport {
  id?: string;
  iso_code: string;
  topic: string;
  country_name?: string;
  status: string;
  strategy_name?: string;
  executive_summary?: string;
  strategic_narrative?: string;
  key_findings?: KeyFinding[];
  strengths?: SWOTItem[];
  weaknesses?: SWOTItem[];
  opportunities?: SWOTItem[];
  threats?: SWOTItem[];
  strategic_recommendations?: Recommendation[];
  generated_at?: string;
}

export interface KeyFinding {
  title: string;
  description: string;
  severity?: string;
  category?: string;
}

export interface SWOTItem {
  title: string;
  description: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority?: string;
  timeframe?: string;
}

// Country with topic statuses
export interface CountryWithStatus {
  iso_code: string;
  country_name: string;
  completed_topics: number;
  total_topics: number;
  topics?: TopicStatus[];
}

export interface TopicStatus {
  topic_id: string;
  topic_name: string;
  status: QueueItemStatus;
}

// Topic option for selection
export interface TopicOption {
  id: string;
  name: string;
  category: string;
}

// Generation state for UI
export interface GenerationState {
  isGenerating: boolean;
  currentItem: QueueItem | null;
  startTime: number | null;
  elapsedSeconds: number;
}

// Status message for notifications
export interface StatusMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
