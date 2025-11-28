/**
 * Consultation Type - the type of consultation service
 */
export type ConsultationType = 'chat' | 'audio' | 'video';

/**
 * Chat Type - specific type of chat consultation
 */
export type ChatType = 'consultation' | 'scheduling' | null;

/**
 * Consultation Status
 */
export type ConsultationStatus =
  | 'active'
  | 'closed'
  | 'pending_scheduling'
  | 'scheduled'
  | 'completed';

/**
 * Create Consultation Request
 */
export interface CreateConsultationRequest {
  consultationType: ConsultationType;
  chatType?: ChatType;
  threadTitle: string;
}

/**
 * Create Consultation Response
 */
export interface CreateConsultationResponse {
  consultationId: string;
  threadNumber: number;
}

/**
 * Close Consultation Request
 */
export interface CloseConsultationRequest {
  consultationId: string;
  closingMessage: string;
}
