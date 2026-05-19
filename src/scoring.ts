import { appState } from './state';
import type {
  Answers,
  Scores,
  Maturity,
  Urgency,
  DimBadge,
  Finding,
  Recommendation,
  SectorRec,
} from './types';

const opsMap: Record<string, number> = {
  'Mostly paper-based': 5,
  'Basic spreadsheets & email': 28,
  'A mix of disconnected systems': 55,
  'Well-integrated digital systems': 88,
};
const dataMap: Record<string, number> = {
  'Gut feel and experience': 5,
  'Periodic manual reports from staff': 22,
  'Spreadsheets we update ourselves': 42,
  'A software system with some reporting': 68,
  'A live dashboard with real-time data': 95,
};
const digMap: Record<string, number> = {
  'We avoid it — too complex or costly': 5,
  'We use basic tools but struggle to adopt more': 28,
  "We're open but need guidance": 52,
  'We actively seek digital solutions': 76,
  "We're already quite digitally advanced": 94,
};
const infraMap: Record<string, number> = {
  'No reliable internet at our location': 5,
  'Slow or inconsistent connection': 25,
  'Reliable internet, basic devices': 55,
  'Good internet, multiple computers/tablets': 78,
  'Excellent — fibre, multiple modern devices': 96,
};
const cxMap: Record<string, number> = {
  'Long wait times or slow service': 15,
  'Difficulty booking or placing orders': 20,
  'Poor follow-up after purchase': 25,
  'Inconsistent service quality': 30,
  'No online or self-service channel': 35,
  'Customer experience is generally good': 82,
};

export function score(): Scores {
  const a = appState.answers;
  return {
    ops: opsMap[a.ops] || 30,
    data: dataMap[a.data] || 30,
    digital: digMap[a.digital] || 30,
    infra: infraMap[a.infra] || 30,
    cx: cxMap[a.cx] || 50,
  };
}

export function maturity(ops: number, digital: number): Maturity {
  const avg = (ops + digital) / 2;
  if(avg < 20) return {level:1, label:"Manual Operations"};
  if(avg < 40) return {level:2, label:"Basic Digital Tools"};
  if(avg < 60) return {level:3, label:"Partial Integration"};
  if(avg < 80) return {level:4, label:"Advanced Digital"};
  return {level:5, label:"Fully Integrated"};
}

export function urgency(scores: Scores): Urgency {
  const avg = Object.values(scores).reduce((a,b)=>a+b,0) / Object.values(scores).length;
  if(avg < 38) return {label:"High Priority", cls:"urg-high"};
  if(avg < 64) return {label:"Moderate Priority", cls:"urg-med"};
  return {label:"Well Positioned", cls:"urg-low"};
}

export function dimBadge(v: number): DimBadge {
  if(v >= 68) return {cls:"score-good-badge", bar:"bar-good"};
  if(v >= 42) return {cls:"score-warn-badge", bar:"bar-warn"};
  return {cls:"score-bad-badge", bar:"bar-bad"};
}

export function getSectorRec(sector: string): SectorRec {
  const map: Record<string, SectorRec> = {
    "Healthcare / Clinic":{t:"Patient & Service Delivery Optimisation",d:"There is clear opportunity to improve how appointments are managed, records are maintained, and patients are communicated with. A structured review of your service delivery workflow will identify the highest-impact areas for improvement — whether that involves scheduling, records, or patient communication channels.",tag:"Service Quality"},
    "Retail / FMCG":{t:"Stock, Sales & Customer Intelligence",d:"Retail operations benefit significantly from improved visibility across inventory, sales patterns, and customer behaviour. A detailed process review will identify where the greatest inefficiencies and revenue leakage occur and what intervention is most appropriate for your scale.",tag:"Revenue"},
    "Food & Beverage":{t:"Order Flow & Customer Experience",d:"Businesses in this sector often face pressure on speed, accuracy, and customer satisfaction simultaneously. A discovery session will map your current order and service flow to identify the specific friction points and opportunities most relevant to your operation.",tag:"Throughput"},
    "Education":{t:"Communication, Records & Stakeholder Engagement",d:"Educational institutions typically manage complex communication across students, parents, and staff while maintaining records and tracking fees. A structured review will clarify where manual processes are creating the most burden and where improvement would have the greatest impact.",tag:"Engagement"},
    "Logistics / Transport":{t:"Operations Visibility & Fleet Coordination",d:"Logistics businesses face constant pressure on cost, reliability, and real-time coordination. A process review will identify where visibility gaps are costing most — whether in fleet management, delivery confirmation, client communication, or route planning.",tag:"Efficiency"},
    "Finance / SACCO":{t:"Member Services & Operational Transparency",d:"Financial institutions and cooperatives benefit from improved member self-service, clearer reporting, and more reliable record-keeping. A discovery session will identify the areas where manual processes create the greatest compliance, trust, or efficiency risk.",tag:"Compliance"},
    "Hospitality":{t:"Guest Experience & Revenue Management",d:"Hospitality operations depend on seamless coordination across bookings, guest communication, and internal team management. A review of your current workflow will reveal where the most significant revenue and experience gaps sit and what would deliver the fastest improvement.",tag:"Revenue"},
    "Professional Services":{t:"Client Delivery & Practice Management",d:"Service firms often struggle with the gap between the quality of their expertise and the efficiency of how they manage client relationships, projects, and billing. A process review will surface the specific operational bottlenecks most affecting delivery quality and cash flow.",tag:"Delivery"},
  };
  return map[sector] || {t:"Operational Review & Improvement Planning",d:"Regardless of sector, the most valuable starting point is a structured review of how your business currently operates — identifying where time and resources are lost, where customers experience friction, and where the clearest opportunities for sustainable improvement exist.",tag:"Foundation"};
}

export function getFindings(a: Answers, scores: Scores): Finding[] {
  const f: Finding[] = [];
  if(scores.ops < 40) f.push({dot:"ind-red", t:"Operations are heavily manual, creating significant risk of errors, delays, and knowledge loss if key staff are unavailable."});
  else if(scores.ops < 65) f.push({dot:"ind-amber", t:"Some digital tools are in use but processes are not well integrated, creating information silos that slow decision-making."});
  else f.push({dot:"ind-green", t:"Operational systems are reasonably structured. Focus should now shift to deeper automation and system optimisation."});

  if(scores.data < 35) f.push({dot:"ind-red", t:"Business decisions are being made without reliable data, increasing the risk of costly misjudgements and missed early warning signs."});
  else if(scores.data < 65) f.push({dot:"ind-amber", t:"Some reporting exists but is manual or infrequent. Real-time visibility would significantly sharpen decision-making across the business."});
  else f.push({dot:"ind-green", t:"Good data visibility exists. Consider adding predictive analytics to move from reactive management to proactive strategy."});

  if(scores.cx < 50) f.push({dot:"ind-red", t:`Customer experience gap identified: "${a.cx}". This is likely affecting customer retention and limiting referral-driven growth.`});
  else f.push({dot:"ind-amber", t:"Customer experience is functional but digital channels could significantly expand reach and enable self-service, freeing staff time."});

  const bmap: Record<string, string> = {
    "Manual data entry & paperwork":"Significant staff capacity is being consumed by data entry tasks that could be fully automated, freeing the team for higher-value work.",
    "Delayed approvals & slow decisions":"Approval bottlenecks are slowing operational velocity. Digital workflow tools can reduce approval turnaround from days to minutes.",
    "Poor customer follow-up":"Missed follow-ups are resulting in lost sales and weakened relationships. A CRM system can systematically ensure no contact is left unattended.",
    "Inventory losses or stockouts":"Inventory management gaps are creating direct revenue leakage. Real-time stock tracking is an immediate priority.",
    "Billing & payment tracking":"Financial tracking gaps create cash flow risk and reconciliation overhead. Automated billing and payment monitoring is recommended.",
    "Staff coordination & scheduling":"Coordination inefficiencies reduce overall team productivity. Scheduling and task management tools can unlock significant capacity.",
  };
  if(a.bottleneck && bmap[a.bottleneck]) f.push({dot:"ind-amber", t:bmap[a.bottleneck]});
  return f;
}

export function getRecs(a: Answers, scores: Scores): Recommendation[] {
  const recs: Recommendation[] = [];
  recs.push(getSectorRec(a.sector));

  if(scores.ops < 55) recs.push({
    t:"Business Process Automation",
    d:"Identify and automate the most time-consuming manual workflows — approval chains, data entry, internal notifications, and report generation — using tools tailored to your operational context.",
    tag:"Efficiency",
    value:"Every hour of manual work automated is an hour redirected to customer-facing or revenue-generating activity. Organisations that automate core workflows typically reduce operational costs by 20–30% and can scale output without proportionally increasing headcount."
  });

  if(scores.data < 55) recs.push({
    t:"Real-Time Business Intelligence Dashboard",
    d:"A live management dashboard consolidating key metrics — revenue, customer activity, operational performance, and staff productivity — into a single view accessible from any device.",
    tag:"Intelligence",
    value:"Decisions made with accurate, timely data consistently outperform those made on intuition. Visibility into what drives revenue and what causes loss allows management to respond within hours rather than weeks — a measurable competitive advantage."
  });

  if(a.cx && a.cx !== "Customer experience is generally good") recs.push({
    t:"Customer Retention & Engagement Platform",
    d:"A CRM and engagement system that tracks every customer interaction, automates follow-ups and reminders, captures feedback, and enables targeted communication — ensuring no relationship is left unmanaged.",
    tag:"Retention",
    value:"Acquiring a new customer costs 5–7x more than retaining an existing one. A 5% improvement in customer retention can increase profitability by 25–95% depending on sector. Automated follow-ups directly reduce churn and increase the lifetime value of each customer."
  });

  if(scores.digital < 50) recs.push({
    t:"Phased Digital Transformation Roadmap",
    d:"A structured, prioritised plan for moving from the current operational state to an integrated digital environment — sequenced by impact and budget, with clear milestones and staff adoption support built in.",
    tag:"Foundation",
    value:"Organisations with a clear digital roadmap achieve adoption rates significantly higher than those implementing tools reactively. A phased approach protects budget by ensuring each investment delivers measurable value before the next is made."
  });

  if(scores.infra < 45) recs.push({
    t:"Infrastructure & Connectivity Readiness",
    d:"A practical review of current internet connectivity, available devices, network configuration, and backup systems — followed by a brief on what infrastructure improvements are needed before any digital solution can perform reliably.",
    tag:"Readiness",
    value:"Technology investments on poor infrastructure routinely fail, wasting budget and team goodwill. Getting the foundation right first protects every subsequent investment and ensures digital tools actually perform in the day-to-day operating environment."
  });

  if(a.revenue === "No online sales or booking channel") recs.push({
    t:"Digital Sales & Online Revenue Channel",
    d:"Build a direct online channel — whether e-commerce, online booking, digital ordering, or a payment portal — enabling customers to transact at any time without requiring staff involvement.",
    tag:"Growth",
    value:"Businesses that add a direct online channel typically see 15–40% revenue growth within the first year. An online channel operates 24/7, reaching customers who would never visit in person and capturing revenue currently lost to competitors with a digital presence."
  });

  return recs.slice(0, 4);
}
