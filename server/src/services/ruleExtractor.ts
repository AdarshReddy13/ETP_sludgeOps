import { RegulatoryRule, RuleCategory, RuleApplicability } from '../models/types.js';

export function extractRulesFromText(documentId: string, text: string): RegulatoryRule[] {
  const rules: RegulatoryRule[] = [];
  const lowerText = text.toLowerCase();

  // 1. Storage Duration Rule (e.g., 90 days, Rule 8 or Rule 20)
  if (lowerText.includes('ninety days') || lowerText.includes('90 days') || (lowerText.includes('storage') && lowerText.includes('days'))) {
    const daysMatch = text.match(/(?:not exceeding|period of|within)\s*([0-9]{2,3})\s*days/i);
    const limit = daysMatch ? parseInt(daysMatch[1], 10) : 90;
    
    rules.push({
      id: `rule-extracted-${Date.now()}-storage`,
      documentId,
      statutoryCitation: 'Rule 8(1) read with Rule 20, HOWM Rules 2016',
      sectionOrRule: 'Rule 8(1)',
      parameterName: 'Maximum On-Site Sludge Storage Duration',
      limitValue: limit,
      unit: 'days',
      comparisonOperator: '<=',
      ruleCategory: 'Storage_Duration',
      applicability: 'Mandatory_Statutory',
      legalRequirement: `Occupier shall not store hazardous chemical sludge on-site exceeding ${limit} days without prior SPCB extension.`,
      statutoryViolationAction: 'Emergency dispatch to TSDF required; statutory notification to SPCB under Section 15 EPA 1986.',
      isStatutoryViolation: true,
      penaltyImplication: 'Section 15 Environment (Protection) Act, 1986 — imprisonment up to 5 years or fine up to ₹1,00,000.',
      isApproved: false,
      isActive: false,
    });
  }

  // 2. Transport Manifest Form 10 (Rule 18 & 19)
  if (lowerText.includes('form 10') || lowerText.includes('manifest') || lowerText.includes('seven copies')) {
    rules.push({
      id: `rule-extracted-${Date.now()}-manifest`,
      documentId,
      statutoryCitation: 'Rule 18(2) & 19, HOWM Rules 2016',
      sectionOrRule: 'Rule 18(2)',
      parameterName: 'Form 10 Manifest Issuance for Highway Transport',
      limitValue: 1,
      unit: 'statutory manifest',
      comparisonOperator: '==',
      ruleCategory: 'Disposal_Manifest',
      applicability: 'Mandatory_Statutory',
      legalRequirement: 'The sender of hazardous sludge shall issue seven copies of statutory Form 10 manifest to the authorized transporter.',
      statutoryViolationAction: 'Halt vehicle transport immediately until Form 10 manifest is authenticated and provided.',
      isStatutoryViolation: true,
      penaltyImplication: 'Illegal hazardous waste transport under Rule 18.',
      isApproved: false,
      isActive: false,
    });
  }

  // 3. Annual Return Form 4 (Rule 20)
  if (lowerText.includes('form 4') || lowerText.includes('annual return') || lowerText.includes('30th day of june')) {
    rules.push({
      id: `rule-extracted-${Date.now()}-form4`,
      documentId,
      statutoryCitation: 'Rule 20(2), HOWM Rules 2016',
      sectionOrRule: 'Rule 20(2)',
      parameterName: 'Annual Return Form 4 Submission Deadline',
      limitValue: 30,
      unit: 'June deadline',
      comparisonOperator: '<=',
      ruleCategory: 'Annual_Return',
      applicability: 'Mandatory_Statutory',
      legalRequirement: 'Annual return in Form 4 shall be submitted to the SPCB on or before 30th June following the reporting financial year.',
      statutoryViolationAction: 'Compile Form 4 filing and submit through statutory state online consent management portal.',
      isStatutoryViolation: true,
      penaltyImplication: 'Statutory non-reporting violation under Rule 20.',
      isApproved: false,
      isActive: false,
    });
  }

  // 4. Heavy Metal Concentration Limits (Schedule II Class A)
  const heavyMetalPatterns = [
    { name: 'Lead (Pb)', symbol: 'pb', regex: /lead|pb/i, defaultLimit: 50, unit: 'mg/kg' },
    { name: 'Cadmium (Cd)', symbol: 'cd', regex: /cadmium|cd/i, defaultLimit: 5, unit: 'mg/kg' },
    { name: 'Total Chromium (Cr)', symbol: 'cr', regex: /chromium|total\s*cr|cr/i, defaultLimit: 50, unit: 'mg/kg' },
    { name: 'Nickel (Ni)', symbol: 'ni', regex: /nickel|ni/i, defaultLimit: 50, unit: 'mg/kg' },
    { name: 'Copper (Cu)', symbol: 'cu', regex: /copper|cu/i, defaultLimit: 5000, unit: 'mg/kg' },
    { name: 'Zinc (Zn)', symbol: 'zn', regex: /zinc|zn/i, defaultLimit: 20000, unit: 'mg/kg' },
  ];

  for (const metal of heavyMetalPatterns) {
    if (metal.regex.test(text)) {
      // Check if specific number is near the metal
      let foundLimit = metal.defaultLimit;
      const specificRegex = new RegExp(`(?:${metal.name}|${metal.symbol})[^0-9\n\r]{1,25}([0-9]+(?:\\.[0-9]+)?)`, 'i');
      const numMatch = text.match(specificRegex);
      if (numMatch && !isNaN(parseFloat(numMatch[1]))) {
        foundLimit = parseFloat(numMatch[1]);
      }

      rules.push({
        id: `rule-extracted-${Date.now()}-${metal.symbol}`,
        documentId,
        statutoryCitation: 'Schedule II, Class A, HOWM Rules 2016',
        sectionOrRule: 'Schedule II',
        parameterName: `${metal.name} Concentration`,
        limitValue: foundLimit,
        unit: metal.unit,
        comparisonOperator: '<=',
        ruleCategory: 'Heavy_Metals_Limit',
        applicability: 'Mandatory_Statutory',
        legalRequirement: `Concentration of ${metal.name} in sludge cake shall not exceed ${foundLimit} ${metal.unit} for non-hazardous classification.`,
        statutoryViolationAction: `Enforce Class A hazardous waste classification; divert to secured landfill or metal recovery.`,
        isStatutoryViolation: true,
        penaltyImplication: 'Hazardous Waste Rule 6 statutory misclassification breach.',
        isApproved: false,
        isActive: false,
      });
    }
  }

  // 5. Yard Storage Capacity Cap (e.g. 150 tonnes or specified TPA)
  const shedCapMatch = text.match(/(?:storage\s*capacity|retention\s*capacity|shed\s*capacity)[^\d]{1,20}(\d+)\s*(?:tonnes|tons|t)/i);
  if (shedCapMatch) {
    const shedCap = parseFloat(shedCapMatch[1]);
    rules.push({
      id: `rule-extracted-${Date.now()}-shed-cap`,
      documentId,
      statutoryCitation: 'Specific Condition, Facility Consent to Operate (CTO)',
      sectionOrRule: 'CTO Condition',
      parameterName: 'Impermeable Storage Shed Retention Capacity',
      limitValue: shedCap,
      unit: 'tonnes',
      comparisonOperator: '<=',
      ruleCategory: 'Storage_Duration',
      applicability: 'Conditional_Facility',
      legalRequirement: `Total on-site chemical sludge storage inventory shall not exceed authorized capacity of ${shedCap} tonnes inside dedicated covered shed.`,
      statutoryViolationAction: 'Halt further transfer to shed; dispatch excess volume to authorized TSDF immediately.',
      isStatutoryViolation: true,
      penaltyImplication: 'Section 33A Water (Prevention and Control of Pollution) Act, 1974.',
      isApproved: false,
      isActive: false,
    });
  }

  // 6. Co-Processing Moisture Limit (<30%)
  if (lowerText.includes('co-processing') || lowerText.includes('cement kiln') || (lowerText.includes('moisture') && lowerText.includes('30%'))) {
    rules.push({
      id: `rule-extracted-${Date.now()}-coproc-moisture`,
      documentId,
      statutoryCitation: 'Clause 3.2(b), CPCB Guidelines for Co-Processing in Cement Kilns',
      sectionOrRule: 'Clause 3.2(b)',
      parameterName: 'Cement Kiln Co-Processing Maximum Moisture',
      limitValue: 30.0,
      unit: '%',
      comparisonOperator: '<=',
      ruleCategory: 'Co_Processing_AFR',
      applicability: 'Conditional_Facility',
      legalRequirement: 'Dewatered chemical sludge destined for cement kiln co-processing shall have moisture content <= 30% by weight.',
      statutoryViolationAction: 'Moisture above 30% requires secondary thermal drying before dispatch to cement plant.',
      isStatutoryViolation: false,
      penaltyImplication: 'Shipment rejection at cement kiln gate.',
      isApproved: false,
      isActive: false,
    });
  }

  return rules;
}

