export interface Section {
  label: string;
  icon: string;
}

export interface StepOption {
  l: string;
  s?: string;
}

export type StepOptionItem = string | StepOption;

export interface StepBase {
  id: string;
  section: number;
  q: string;
  sub?: string;
  key: string;
}

export interface TextStep extends StepBase {
  type: 'text';
  ph?: string;
  optional?: boolean;
}

export interface OptionsStep extends StepBase {
  type: 'options';
  cols?: number;
  opts: StepOptionItem[];
}

export type Step = TextStep | OptionsStep;

export type Answers = Record<string, string>;

export interface Scores {
  ops: number;
  data: number;
  digital: number;
  infra: number;
  cx: number;
}

export interface Maturity {
  level: number;
  label: string;
}

export interface Urgency {
  label: string;
  cls: string;
}

export interface DimBadge {
  cls: string;
  bar: string;
}

export interface Finding {
  dot: string;
  t: string;
}

export interface Recommendation {
  t: string;
  d: string;
  tag?: string;
  value?: string;
}

export interface SectorRec {
  t: string;
  d: string;
  tag: string;
}
