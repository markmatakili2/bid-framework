export type SubmissionType = 'assessment' | 'consultation' | 'implementation';

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  preferredTime?: string;
  timeline?: string;
  budget?: string;
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
  userAgent?: string;
}

export interface DashboardStats {
  total: number;
  assessments: number;
  consultations: number;
  implementations: number;
  last24h: number;
  last7d: number;
}
