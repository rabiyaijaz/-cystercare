/**
 * CysterCare Clinical Criteria & Diagnostic Standards
 * Grounded in the 2023 International Evidence-based PCOS Guidelines (Monash/ASRM/ESHRE)
 * and Rotterdam Consensus 2003.
 */

export const CLINICAL_CONSTANTS = {
  // Menstrual Cycle Definitions
  CYCLE_NORMAL_MIN: 21,
  CYCLE_NORMAL_MAX: 35,
  PERIODS_PER_YEAR_MIN_NORMAL: 9,
  AMENORRHEA_DAYS: 90,
  CYCLE_VARIABILITY_THRESHOLD_DAYS: 9,

  // Modified Ferriman-Gallwey (mFG) Score Cutoffs
  MFG_CUTOFF_DEFAULT: 8,
  MFG_CUTOFF_SOUTH_ASIAN: 8,
  MFG_CUTOFF_EAST_ASIAN: 5,
  MFG_CUTOFF_SOUTHEAST_ASIAN: 6,

  // Default Standard Reference Ranges (Used strictly as fallback when lab range is absent)
  DEFAULT_LAB_RANGES: {
    totalTestosterone: { min: 0.5, max: 1.8, unit: 'nmol/L', altUnit: 'ng/dL', conversionToNmol: 0.0347 },
    freeTestosterone: { min: 3.5, max: 26.0, unit: 'pmol/L', altUnit: 'pg/mL', conversionToPmol: 3.47 },
    shbg: { min: 26.0, max: 110.0, unit: 'nmol/L' },
    fai: { min: 1.0, max: 4.5, unit: '%' }, // Free Androgen Index = (Total T nmol/L / SHBG nmol/L) * 100
    dheas: { min: 1.8, max: 7.7, unit: 'µmol/L', altUnit: 'µg/dL', conversionToUmol: 0.0271 },
    amh: { min: 7.0, max: 35.0, unit: 'pmol/L', altUnit: 'ng/mL', conversionToPmol: 7.14 },
    lh: { min: 2.0, max: 10.0, unit: 'IU/L' },
    fsh: { min: 2.5, max: 10.2, unit: 'IU/L' },
    tsh: { min: 0.45, max: 4.5, unit: 'mIU/L' },
    prolactin: { min: 4.8, max: 23.3, unit: 'ng/mL', altUnit: 'mIU/L', conversionToNgMl: 0.047 },
    ohp17: { min: 0.6, max: 6.0, unit: 'nmol/L', altUnit: 'ng/dL', conversionToNmol: 0.0303 },
    fastingGlucose: { min: 70, max: 99, unit: 'mg/dL' },
    hba1c: { min: 4.0, max: 5.6, unit: '%' },
    fastingInsulin: { min: 2.6, max: 24.9, unit: 'µIU/mL' }
  },

  // Ultrasound Diagnostic Thresholds (2023 Guidelines with transducer ≥8 MHz)
  ULTRASOUND: {
    MIN_FOLLICLE_COUNT_PER_OVARY: 20, // Antral Follicle Count (AFC)
    MIN_OVARIAN_VOLUME_ML: 10.0,      // Ovarian volume without active dominant follicle (>10mm)
    PERIPHERAL_PATTERN: 'string_of_pearls'
  },

  // Red Flag Clinical Escalation Triggers
  RED_FLAGS: {
    VIRILIZATION_ALERT_TESTOSTERONE_NMOL: 5.0, // >150-200 ng/dL indicates potential tumor
    VIRILIZATION_ALERT_DHEAS_UMOL: 18.0,      // >700-800 µg/dL indicates adrenal source
    RAPID_VIRILIZATION_MONTHS: 6
  }
};

/**
 * Calculates Free Androgen Index (FAI)
 * FAI = (Total Testosterone nmol/L / SHBG nmol/L) * 100
 */
export function calculateFAI(totalTestosteroneNmol, shbgNmol) {
  if (!totalTestosteroneNmol || !shbgNmol || shbgNmol <= 0) return null;
  return Number(((totalTestosteroneNmol / shbgNmol) * 100).toFixed(2));
}

/**
 * Normalizes lab values into standard units while respecting
 * patient-supplied lab reference ranges.
 */
export function evaluateLabValue(testKey, value, customRange = null, unit = null) {
  if (value === undefined || value === null || isNaN(value)) {
    return { status: 'unknown', evaluated: false, message: 'Not provided' };
  }

  const defaultMeta = CLINICAL_CONSTANTS.DEFAULT_LAB_RANGES[testKey];
  let normalizedValue = Number(value);

  // Unit conversion if needed
  if (defaultMeta && defaultMeta.altUnit && unit && unit.toLowerCase() === defaultMeta.altUnit.toLowerCase()) {
    if (defaultMeta.conversionToNmol) normalizedValue *= defaultMeta.conversionToNmol;
    if (defaultMeta.conversionToPmol) normalizedValue *= defaultMeta.conversionToPmol;
    if (defaultMeta.conversionToUmol) normalizedValue *= defaultMeta.conversionToUmol;
    if (defaultMeta.conversionToNgMl) normalizedValue *= defaultMeta.conversionToNgMl;
  }

  // Use custom reference range from patient's lab report when available
  const minRange = (customRange && customRange.min !== undefined && customRange.min !== null) 
    ? Number(customRange.min) 
    : (defaultMeta ? defaultMeta.min : null);

  const maxRange = (customRange && customRange.max !== undefined && customRange.max !== null) 
    ? Number(customRange.max) 
    : (defaultMeta ? defaultMeta.max : null);

  let status = 'normal';
  if (maxRange !== null && normalizedValue > maxRange) {
    status = 'elevated';
  } else if (minRange !== null && normalizedValue < minRange) {
    status = 'low';
  }

  return {
    testKey,
    originalValue: value,
    normalizedValue: Number(normalizedValue.toFixed(2)),
    unit: unit || (defaultMeta ? defaultMeta.unit : ''),
    referenceRange: { min: minRange, max: maxRange },
    status,
    evaluated: true,
    isLabSpecific: Boolean(customRange && customRange.max !== undefined)
  };
}

/**
 * Determines Rotterdam PCOS Phenotype
 * - Phenotype A: Ovulatory Dysfunction + Hyperandrogenism + PCOM
 * - Phenotype B: Ovulatory Dysfunction + Hyperandrogenism
 * - Phenotype C: Hyperandrogenism + PCOM
 * - Phenotype D: Ovulatory Dysfunction + PCOM
 */
export function classifyRotterdamPhenotype(ovulatoryDysfunction, hyperandrogenism, pcom) {
  const od = Boolean(ovulatoryDysfunction);
  const ha = Boolean(hyperandrogenism);
  const pc = Boolean(pcom);

  if (od && ha && pc) {
    return {
      code: 'A',
      name: 'Phenotype A (Classic / Complete)',
      description: 'Presence of all three core dimensions: ovulatory dysfunction, hyperandrogenism, and polycystic ovarian morphology.',
      clinicalImplications: 'Associated with higher metabolic risk, marked insulin resistance, and highest fertility challenge.'
    };
  }
  if (od && ha && !pc) {
    return {
      code: 'B',
      name: 'Phenotype B (Non-PCOM Classic)',
      description: 'Ovulatory dysfunction and clinical/biochemical hyperandrogenism, without verified polycystic ovarian morphology.',
      clinicalImplications: 'Meets full NIH 1990 criteria. High androgen activity and metabolic risk even without typical ultrasound appearance.'
    };
  }
  if (!od && ha && pc) {
    return {
      code: 'C',
      name: 'Phenotype C (Ovulatory PCOS)',
      description: 'Clinical/biochemical hyperandrogenism and polycystic ovarian morphology, with regular ovulatory cycles.',
      clinicalImplications: 'Typically milder metabolic profile than Phenotypes A and B, but hyperandrogenic symptoms remain significant.'
    };
  }
  if (od && !ha && pc) {
    return {
      code: 'D',
      name: 'Phenotype D (Non-Androgenic PCOS)',
      description: 'Ovulatory dysfunction and polycystic ovarian morphology without demonstrable hyperandrogenism.',
      clinicalImplications: 'Milder clinical presentation; critical to rigorously exclude secondary causes (hypothalamic amenorrhea, hyperprolactinemia).'
    };
  }

  return {
    code: 'None',
    name: 'Incomplete Criteria',
    description: 'Does not satisfy the 2-out-of-3 Rotterdam consensus criteria.',
    clinicalImplications: 'Evaluate for other single-factor causes or monitor longitudinal cycle changes.'
  };
}
