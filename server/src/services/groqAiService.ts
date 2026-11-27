/**
 * ETP SludgeOps — Groq AI Service
 * Provides intelligent analysis of lab reports, dewatering solutions, and compliance findings.
 * Uses the Groq Cloud API (OpenAI-compatible endpoint) with llama-3.3-70b-versatile.
 *
 * Zero-assumption policy: AI is explicitly instructed never to invent missing values.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getGroqKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured. Add it to server/.env');
  }
  return key;
}

function getGroqModel(): string {
  return process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
}

async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getGroqKey()}`,
    },
    body: JSON.stringify({
      model: getGroqModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Lab Report — Chemical & Physical Properties Analysis
// ─────────────────────────────────────────────────────────────────────────────
export interface LabReportInput {
  batchId?: string;
  pH?: number | null;
  moisturePct?: number | null;
  codMgKg?: number | null;
  oilAndGreaseMgKg?: number | null;
  phenolMgKg?: number | null;
  sulphideMgKg?: number | null;
  heavyMetals?: {
    chromium?: number | null;
    nickel?: number | null;
    lead?: number | null;
    cadmium?: number | null;
    copper?: number | null;
    zinc?: number | null;
  };
  consistency?: string | null;
  cstSeconds?: number | null;
  settleabilityMlG?: number | null;
  specificGravity?: number | null;
  tclpResults?: Record<string, number | null>;
}

export async function analyzeLabReport(input: LabReportInput): Promise<string> {
  const system = `You are a senior industrial wastewater treatment engineer and chemist 
specialising in ETP (Effluent Treatment Plant) sludge characterisation under Indian 
environmental regulations (HWM Rules 2016, CPCB / KSPCB standards).

RULES:
- Interpret only the data provided. Never invent or assume missing values.
- For each property provided, explain its significance to sludge treatability.
- State whether TCLP thresholds under Schedule II of HWM Rules 2016 are breached (Pb ≤ 5 mg/L, Cd ≤ 1 mg/L, Cr ≤ 5 mg/L, Ni ≤ 2 mg/L).
- Identify key handling risks: corrosivity, toxicity, flammability, reactivity.
- Conclude with a 2-sentence classification summary (Hazardous / Non-Hazardous / Pending).
- Use plain industrial English. No markdown headings. Use numbered lists where helpful.
- Limit response to 500 words.`;

  const user = `Analyse the following ETP sludge lab report:

${formatLabInputForPrompt(input)}

Provide: (1) interpretation of each measured property, (2) comparison against CPCB/HWM thresholds, 
(3) key handling risks, (4) preliminary hazardous-waste classification.`;

  return callGroq(system, user);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dewatering Recommendation
// ─────────────────────────────────────────────────────────────────────────────
export interface DewateringInput extends LabReportInput {
  currentDewateringMethod?: string | null;
  currentPolymerType?: string | null;
  currentPolymerDoseKgPerTonne?: number | null;
  cakeMoisturePct?: number | null;
  filtrateTssMgL?: number | null;
  volumeReductionPct?: number | null;
  handlingIssues?: string[];
}

export async function recommendDewateringSolution(input: DewateringInput): Promise<string> {
  const system = `You are a senior sludge dewatering process engineer with 20 years of experience 
in filter press, belt press, centrifuge, and drying bed operations for industrial ETP sludge.

RULES:
- Base recommendations only on the data provided. Never invent or assume missing values.
- If a parameter is missing, explicitly note it and explain what test is needed.
- Provide a stepwise, practical prescription: polymer conditioning → dewatering method → target moisture.
- Recommend polymer type (cationic/anionic) and approximate dose range (kg/tonne dry solids).
- If oil & grease > 500 mg/kg, recommend pre-treatment (DAF or solvent extraction) before dewatering.
- If pH < 6 or > 9, recommend pH correction step first.
- If CST > 200 s, recommend advanced conditioning (thermal, ultrasonic, or enzymatic).
- State expected cake moisture and volume reduction achievable.
- Use concise numbered steps. Industrial English only. No jargon without explanation.
- Limit response to 450 words.`;

  const user = `ETP sludge parameters for dewatering recommendation:

${formatLabInputForPrompt(input)}
${input.currentDewateringMethod ? `Current dewatering method: ${input.currentDewateringMethod}` : ''}
${input.currentPolymerType ? `Current polymer: ${input.currentPolymerType} at ${input.currentPolymerDoseKgPerTonne ?? '?'} kg/tonne DS` : ''}
${input.cakeMoisturePct != null ? `Current cake moisture: ${input.cakeMoisturePct}%` : ''}
${input.filtrateTssMgL != null ? `Filtrate TSS: ${input.filtrateTssMgL} mg/L` : ''}
${input.handlingIssues?.length ? `Reported handling issues: ${input.handlingIssues.join(', ')}` : ''}

Provide the simplest step-by-step dewatering solution, polymer recommendation, and target outcomes.`;

  return callGroq(system, user);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Compliance Summary
// ─────────────────────────────────────────────────────────────────────────────
export interface ComplianceFindingInput {
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    regulation?: string;
    recommendedAction?: string;
  }>;
  facilityName?: string;
  evaluationDate?: string;
}

export async function interpretComplianceFindings(input: ComplianceFindingInput): Promise<string> {
  const system = `You are an environmental compliance counsel specialising in Indian hazardous waste 
regulations: HWM Rules 2016, CPCB guidelines, and State PCB (KSPCB) consent conditions.

RULES:
- Distinguish statutory violations (non-compliance with legal provisions) from operational warnings.
- For each finding, cite the specific rule or schedule breached if mentioned.
- Recommend corrective actions in plain language.
- State the legal consequence of non-compliance (show cause, closure, penalty under EP Act 1986).
- Never invent legal thresholds not present in the findings.
- Prioritise critical findings first. Use numbered list format.
- Limit response to 400 words.`;

  const user = `Facility: ${input.facilityName || 'ETP Sludge Management Facility'}
Evaluation date: ${input.evaluationDate || new Date().toISOString().split('T')[0]}

Compliance findings:
${input.findings
  .map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.type}: ${f.description}${f.regulation ? ` (${f.regulation})` : ''}${f.recommendedAction ? ` → Action: ${f.recommendedAction}` : ''}`)
  .join('\n')}

Provide a plain-language compliance summary with prioritised corrective actions.`;

  return callGroq(system, user);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
function formatLabInputForPrompt(input: LabReportInput): string {
  const lines: string[] = [];
  if (input.batchId) lines.push(`Batch ID: ${input.batchId}`);
  if (input.pH != null) lines.push(`pH: ${input.pH}`);
  if (input.moisturePct != null) lines.push(`Moisture: ${input.moisturePct}%`);
  if (input.codMgKg != null) lines.push(`COD: ${input.codMgKg} mg/kg`);
  if (input.oilAndGreaseMgKg != null) lines.push(`Oil & Grease: ${input.oilAndGreaseMgKg} mg/kg`);
  if (input.phenolMgKg != null) lines.push(`Phenol: ${input.phenolMgKg} mg/kg`);
  if (input.sulphideMgKg != null) lines.push(`Sulphide: ${input.sulphideMgKg} mg/kg`);
  if (input.heavyMetals) {
    const hm = input.heavyMetals;
    if (hm.chromium != null) lines.push(`Chromium (Cr): ${hm.chromium} mg/kg`);
    if (hm.nickel != null) lines.push(`Nickel (Ni): ${hm.nickel} mg/kg`);
    if (hm.lead != null) lines.push(`Lead (Pb): ${hm.lead} mg/kg`);
    if (hm.cadmium != null) lines.push(`Cadmium (Cd): ${hm.cadmium} mg/kg`);
    if (hm.copper != null) lines.push(`Copper (Cu): ${hm.copper} mg/kg`);
    if (hm.zinc != null) lines.push(`Zinc (Zn): ${hm.zinc} mg/kg`);
  }
  if (input.consistency) lines.push(`Consistency: ${input.consistency}`);
  if (input.cstSeconds != null) lines.push(`CST: ${input.cstSeconds} s`);
  if (input.settleabilityMlG != null) lines.push(`Settleability: ${input.settleabilityMlG} mL/g`);
  if (input.specificGravity != null) lines.push(`Specific Gravity: ${input.specificGravity}`);
  if (input.tclpResults && Object.keys(input.tclpResults).length > 0) {
    lines.push('TCLP Leachability results:');
    for (const [metal, val] of Object.entries(input.tclpResults)) {
      if (val != null) lines.push(`  ${metal}: ${val} mg/L`);
    }
  }
  return lines.length > 0 ? lines.join('\n') : 'No parameters provided.';
}
