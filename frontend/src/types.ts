/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin_institucional' | 'admision' | 'categorizacion' | 'medico' | 'paciente';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  healthCenter?: string;
  unit?: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  communicationPreference: string;
  ctaCode: string;
  rut?: string;
  birthDate?: string;
  prevision?: string;
  address?: string;
  cesfam?: string;
  phone?: string;
  allergies?: string[];
  bloodType?: string;
  conditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    allowSos: boolean;
    allowUpdates: boolean;
  };
}

export type SessionStatus =
  | 'pending_consent'
  | 'active'
  | 'in_admission'
  | 'in_triage'
  | 'in_medical_care'
  | 'waiting_interpreter'
  | 'closed'
  | 'cancelled'
  | 'expired';

export interface MedicalSession {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  communicationPreference: string;
  organizationId: string;
  healthCenterId: string;
  unitId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  currentStage: string;
  createdBy: string;
  closedBy?: string;
  closureReason?: string;
  summary?: string;
}

export type ConsentType =
  | 'start_care'
  | 'basic_data'
  | 'clinical_data'
  | 'location'
  | 'contacts'
  | 'share_with_contacts'
  | 'camera'
  | 'microphone'
  | 'visual_assistance'
  | 'interpreter'
  | 'video_call';

export interface ConsentRequest {
  id: string;
  sessionId: string;
  consentType: ConsentType;
  title: string;
  description: string;
  status: 'pending' | 'granted' | 'rejected' | 'revoked';
  requestedAt: string;
  respondedAt?: string;
}

export type MessageType =
  | 'text'
  | 'quick_message'
  | 'pictogram'
  | 'speech_to_text'
  | 'text_to_speech'
  | 'gesture_prediction'
  | 'system';

export type MessageOrigin =
  | 'patient'
  | 'admission'
  | 'triage'
  | 'doctor'
  | 'interpreter'
  | 'system';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'patient' | 'staff' | 'system';
  senderId?: string;
  senderName: string;
  messageType: MessageType;
  body: string;
  origin: MessageOrigin;
  status: 'sent' | 'delivered' | 'read';
  sentAt: string;
  confirmedByPatientAt?: string;
  pictogramPath?: string;
  confidence?: number; // for gesture predictions
}

export interface Pictogram {
  id: string;
  categoryId: string;
  title: string;
  phrase: string;
  iconName: string; // Lucide icon mapping
  speechText: string;
  isActive: boolean;
  colorClass: string;
}

export interface PictogramCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface QuickMessage {
  id: string;
  phrase: string;
  iconName: string;
  category: string;
}

export interface VitalSigns {
  id: string;
  sessionId: string;
  recordedBy: string;
  systolicPressure: number;
  diastolicPressure: number;
  temperature: number;
  oxygenSaturation: number;
  heartRate: number;
  respiratoryRate: number;
  painLevel: number;
  measuredAt: string;
  notes?: string;
}

export interface TriageRecord {
  id: string;
  sessionId: string;
  recordedBy: string;
  triageLevel: 'C1' | 'C2' | 'C3' | 'C4' | 'C5';
  triageLevelName: string;
  colorHex: string;
  symptoms: string[];
  observations: string;
  completedAt: string;
}

export interface ClinicalNote {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  noteType: 'impression' | 'diagnosis' | 'treatment' | 'medication' | 'indication' | 'discharge_summary';
  content: string;
  status: 'draft' | 'signed';
  signedAt?: string;
  version: number;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  sessionId: string;
  eventType: string;
  actorName: string;
  description: string;
  occurredAt: string;
  iconName: string;
}
