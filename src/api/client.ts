import type { Answers, Scores } from '../types';
import { getSessionId } from './session';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  preferredTime?: string;
  timeline?: string;
  budget?: string;
}

export interface AssessmentPayload {
  answers: Answers;
  scores: Scores;
  overallScore: number;
  maturityLevel: number;
  maturityLabel: string;
}

export interface FeedbackPayload {
  name?: string;
  email?: string;
  message: string;
}

async function postSubmission(body: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: getSessionId(), ...body }),
    });
  } catch {
    // Non-blocking — assessment UX continues if API is unavailable
  }
}

export function submitAssessment(payload: AssessmentPayload): void {
  void postSubmission({ type: 'assessment', assessment: payload });
}

export function sendConsultation(contact: ContactPayload): void {
  void postSubmission({ type: 'consultation', contact });
}

export function sendImplementation(contact: ContactPayload): void {
  void postSubmission({ type: 'implementation', contact });
}

export function sendFeedback(feedback: FeedbackPayload): void {
  void postSubmission({ type: 'feedback', feedback });
}
