export type SubmissionType = 'assessment' | 'consultation' | 'implementation' | 'feedback';

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  preferredTime?: string;
  timeline?: string;
  budget?: string;
}

export interface FeedbackPayload {
  name?: string;
  email?: string;
  message: string;
}

export interface AssessmentPayload {
  answers: Record<string, string>;
  scores: Record<string, number>;
  overallScore: number;
  maturityLevel: number;
  maturityLabel: string;
}

export interface Submission {
  id: string;
  sessionId: string;
  type: SubmissionType;
  createdAt: string;
  assessment?: AssessmentPayload;
  contact?: ContactInfo;
  feedback?: FeedbackPayload;
  userAgent?: string;
}

export interface DashboardStats {
  total: number;
  assessments: number;
  consultations: number;
  implementations: number;
  feedback: number;
  last24h: number;
  last7d: number;
}
