import { SludgeBatch } from '../types';

export interface SimplestSolutionResult {
  batchId: string;
  facility: string;
  source: string;
  diagnosis: {
    phStatus: 'Acidic (Requires Lime)' | 'Neutral / Optimal' | 'Alkaline';
    moistureStatus: 'Extremely Wet / Dilute' | 'Moderate Moisture' | 'Dewatered Cake';
    oilStatus: 'High Oil & Grease (Cloth Blinding Risk)' | 'Moderate Oil' | 'Low / Clean';
    filterability: 'High Resistance (Colloidal)' | 'Moderate' | 'Good Free-Draining';
    odourRisk: 'High Sulphide / Septic' | 'Normal Earthy';
    keyBottleneck: string;
  };
  step1ChemicalConditioning: {
    title: string;
    limeDoseKgPerTonne: number; // Hydrated Lime Ca(OH)2
    limeRationale: string;
    coagulantType: string;
    coagulantDosePpm: number;
    coagulantRationale: string;
    polymerType: string;
    polymerDoseKgPerTonne: number;
    polymerSolutionPct: number;
    polymerRationale: string;
  };
  step2MechanicalOperation: {
    title: string;
    recommendedMethod: 'Recessed Chamber Plate Filter Press' | 'Belt Filter Press' | 'Centrifuge Decanter';
    operatingPressureBar: number;
    clothSpecification: string;
    preCoatRequired: boolean;
    preCoatMaterial: string;
    cycleDurationMinutes: number;
    coreBlowdownDurationMinutes: number;
  };
  step3OdourAndHandling: {
    title: string;
    odourScavengerDosePpm: number;
    odourScavengerType: string;
    storageDispatchProtocol: string;
  };
  targetOutcomes: {
    initialMoisturePct: number;
    targetCakeMoisturePct: number;
    targetVolumeReductionPct: number;
    targetFiltrateTssMgL: number;
    finalCakeConsistency: 'Solid, non-sticky spadeable cake' | 'Friable granular solids';
    statutoryCompatibility: string;
  };
}

export function calculateSimplestDewateringSolution(batch: SludgeBatch): SimplestSolutionResult {
  const ph = batch.pH || 5.5;
  const moisture = batch.moisturePct !== null && batch.moisturePct !== undefined ? batch.moisturePct : 92.5;
  const oilAndGrease = batch.oilAndGreaseMgKg !== null && batch.oilAndGreaseMgKg !== undefined ? batch.oilAndGreaseMgKg : 850;
  const sulphide = batch.sulphideMgKg !== null && batch.sulphideMgKg !== undefined ? batch.sulphideMgKg : 35;
  const consistency = batch.physicalProperties?.consistency || (oilAndGrease > 1000 ? 'sticky' : 'pasty');
  const cst = batch.physicalProperties?.cstSeconds || 85;

  // 1. Diagnosis
  const isAcidic = ph < 6.5;
  const isHighOil = oilAndGrease > 800;
  const isHighSulphide = sulphide > 30;
  const isHighCst = cst > 60;

  let keyBottleneck = 'Standard colloidal chemical sludge';
  if (isAcidic && isHighOil) {
    keyBottleneck = 'Dual Bottleneck: Low pH (5.5) inhibits floc shear strength while high oil (1,000+ mg/kg) blinds filter cloth pores.';
  } else if (isAcidic) {
    keyBottleneck = 'Acidic pH (5.5 baseline) prevents charge neutralization, resulting in fine compressible pin flocs.';
  } else if (isHighOil) {
    keyBottleneck = 'Elevated Oil & Grease emulsifies floc boundaries, leading to cloth blinding and poor cake release.';
  } else if (isHighCst) {
    keyBottleneck = 'High Capillary Suction Time indicates high bound water retention in colloidal floc structure.';
  }

  // 2. Step 1: Chemical Pre-Conditioning
  let limeDose = 0;
  let limeRationale = 'pH is in optimal neutral range; lime conditioning not strictly required.';
  if (isAcidic) {
    limeDose = Math.round(35 + (6.5 - ph) * 20); // e.g. 5.5 -> ~55 kg/tonne dry solids
    limeRationale = `Dose Hydrated Lime (Ca(OH)₂) at ${limeDose} kg/tonne dry solids to raise sludge pH from ${ph.toFixed(1)} to 7.8–8.2. Calcium ions form an incompressible rigid crystalline skeleton, preventing gelatinous collapse under press pressure.`;
  }

  let coagulantType = 'Polyaluminium Chloride (PAC 18% Al₂O₃)';
  let coagulantDose = isHighOil ? 180 : 120;
  let coagulantRationale = `Add PAC at ${coagulantDose} mg/L to neutralize anionic colloidal charges and destabilize emulsified oil droplets.`;

  let polymerType = isHighOil
    ? 'High-Charge Cationic Polyacrylamide (15–20% charge, 6–8 MDa)'
    : 'Medium-Charge Cationic Polyacrylamide (10–15% charge, 8–10 MDa)';
  let polymerDose = isHighCst ? 3.8 : 3.0;
  let polymerRationale = `Prepare 0.15% PAM solution and dose at ${polymerDose.toFixed(1)} kg/t dry solids directly in-line prior to press feeding. Forms dense, shear-resistant macro-flocs with clear free-water release.`;

  // 3. Step 2: Mechanical Dewatering Setup
  let recommendedMethod: 'Recessed Chamber Plate Filter Press' | 'Belt Filter Press' | 'Centrifuge Decanter' = 'Recessed Chamber Plate Filter Press';
  let operatingPressure = 14; // bar
  let clothSpec = isHighOil
    ? 'Monofilament Polypropylene (air permeability 220–280 L/dm²/min) with calendared satin weave for easy oil release.'
    : 'Woven Polypropylene Monofilament (permeability 300–400 L/dm²/min).';
  let preCoatRequired = isHighOil;
  let preCoatMaterial = isHighOil
    ? 'Diatomaceous earth or fine fly ash/lime slurry (1.2–1.5 kg/m² cloth area) pre-coat before first fill.'
    : 'None required';
  let cycleDuration = isHighOil ? 110 : 90;
  let blowdownDuration = 15;

  // 4. Step 3: Odour & Handling Protocol
  let odourDose = isHighSulphide ? 35 : 10;
  let odourType = isHighSulphide ? 'Ferric Chloride (FeCl₃) or Sodium Hypochlorite (NaOCl)' : 'Mild aeration';
  let storageProtocol = isHighSulphide
    ? 'Dose 30–40 ppm FeCl₃ to precipitate dissolved sulphide as insoluble iron sulphide (FeS). Store in covered shed with active ventilation; dispatch within 30 days.'
    : 'Store inside designated impermeable RCC shed. Maintain stack height <= 2.5m for natural air drying.';

  // 5. Target Outcomes
  const targetCakeMoisture = isHighOil ? 66.0 : 62.5;
  const targetVolumeReduction = Math.round((1 - (100 - moisture) / (100 - targetCakeMoisture)) * 100);

  return {
    batchId: batch.batchId,
    facility: batch.facility || 'Unit 4 - Chemical Coagulation',
    source: batch.sludgeSource,
    diagnosis: {
      phStatus: isAcidic ? 'Acidic (Requires Lime)' : 'Neutral / Optimal',
      moistureStatus: moisture > 85 ? 'Extremely Wet / Dilute' : 'Moderate Moisture',
      oilStatus: isHighOil ? 'High Oil & Grease (Cloth Blinding Risk)' : 'Low / Clean',
      filterability: isHighCst ? 'High Resistance (Colloidal)' : 'Good Free-Draining',
      odourRisk: isHighSulphide ? 'High Sulphide / Septic' : 'Normal Earthy',
      keyBottleneck,
    },
    step1ChemicalConditioning: {
      title: 'Step 1: Chemical Conditioning & pH Optimization',
      limeDoseKgPerTonne: limeDose,
      limeRationale,
      coagulantType,
      coagulantDosePpm: coagulantDose,
      coagulantRationale,
      polymerType,
      polymerDoseKgPerTonne: polymerDose,
      polymerSolutionPct: 0.15,
      polymerRationale,
    },
    step2MechanicalOperation: {
      title: 'Step 2: Filter Press Mechanical Operating Parameters',
      recommendedMethod,
      operatingPressureBar: operatingPressure,
      clothSpecification: clothSpec,
      preCoatRequired,
      preCoatMaterial,
      cycleDurationMinutes: cycleDuration,
      coreBlowdownDurationMinutes: blowdownDuration,
    },
    step3OdourAndHandling: {
      title: 'Step 3: Odour Abatement & Cake Discharge Protocol',
      odourScavengerDosePpm: odourDose,
      odourScavengerType: odourType,
      storageDispatchProtocol: storageProtocol,
    },
    targetOutcomes: {
      initialMoisturePct: moisture,
      targetCakeMoisturePct: targetCakeMoisture,
      targetVolumeReductionPct: Math.max(70, Math.min(88, targetVolumeReduction)),
      targetFiltrateTssMgL: 65,
      finalCakeConsistency: 'Solid, non-sticky spadeable cake',
      statutoryCompatibility: 'Meets KSPCB CTO Shed Storage & TSDF Landfill Acceptance Criteria (<70% moisture). Ready for secondary solar/thermal drying for Cement Kiln Co-Processing (<30%).',
    },
  };
}
