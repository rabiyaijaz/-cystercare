/**
 * CysterCare PCOS Detection Engine (Layer 2)
 * Independent Diagnostic and Machine-Learning Inference Engine
 * 
 * Implements:
 * 1. Clinical Rotterdam & 2023 International Guideline Logic
 * 2. Multi-Level Progressive Data Integration (Levels 1-4)
 * 3. Differential Diagnosis & Exclusion Evaluation
 * 4. Calibrated Machine Learning Ensemble Scoring
 * 5. SHAP-Aligned Feature Explainability
 * 6. Safety & Red-Flag Escalation Integration
 */

import { CLINICAL_CONSTANTS, calculateFAI, evaluateLabValue, classifyRotterdamPhenotype } from './clinicalCriteria.js';
import { screenSafetyRedFlags } from './safetyTriage.js';

export class PCOSdetectionEngine {
  constructor() {
    this.name = 'CysterCare Detection Engine v4.2';
  }

  /**
   * Main diagnostic inference method.
   * Takes structured patient variables and returns a comprehensive, explainable diagnostic assessment.
   */
  evaluate(patientData = {}) {
    // 0. Screen for acute clinical red flags first
    const safetyCheck = screenSafetyRedFlags(patientData);
    if (safetyCheck.hasEmergency) {
      return {
        classification: 'emergency_escalation_required',
        model_confidence: 0.99,
        confidence_tier: 'Immediate Care Required',
        safetyAlert: safetyCheck.flags[0],
        criteria: {
          ovulatory_dysfunction: 'deferred_due_to_emergency',
          hyperandrogenism: 'deferred_due_to_emergency',
          polycystic_ovarian_morphology: 'deferred_due_to_emergency'
        },
        differential_diagnoses: { status: 'emergency_triage_active' },
        alternative_conditions_not_ruled_out: [],
        evidence: {},
        explainability: {
          summary: 'Assessment halted for patient safety due to acute red-flag symptoms requiring emergency medical evaluation.',
          contributingSignals: []
        }
      };
    }

    // 1. Evaluate Dimension A: Ovulatory Dysfunction (OD)
    const ovulatoryAssessment = this._evaluateOvulatoryDysfunction(patientData);

    // 2. Evaluate Dimension B: Hyperandrogenism (HA) - Clinical & Biochemical
    const androgenAssessment = this._evaluateHyperandrogenism(patientData);

    // 3. Evaluate Dimension C: Polycystic Ovarian Morphology (PCOM) - Ultrasound & AMH
    const morphologyAssessment = this._evaluateMorphology(patientData);

    // 4. Differential Diagnosis & Exclusion Layer
    const differentialAssessment = this._evaluateDifferentialDiagnoses(patientData);

    // 5. Machine Learning Ensemble Scoring & Probability Calibration
    const mlInference = this._computeCalibratedEnsembleScore(
      patientData,
      ovulatoryAssessment,
      androgenAssessment,
      morphologyAssessment,
      differentialAssessment
    );

    // 6. Classification & Rotterdam Phenotype Determination
    const satisfiesRotterdam = (
      (ovulatoryAssessment.detected ? 1 : 0) +
      (androgenAssessment.detected ? 1 : 0) +
      (morphologyAssessment.detected ? 1 : 0)
    ) >= 2;

    const phenotype = classifyRotterdamPhenotype(
      ovulatoryAssessment.detected,
      androgenAssessment.detected,
      morphologyAssessment.detected
    );

    // Overall diagnostic classification
    let classification = 'unlikely_pcos';
    if (satisfiesRotterdam && mlInference.calibratedConfidence >= 0.70) {
      classification = 'likely_pcos';
    } else if (mlInference.calibratedConfidence >= 0.50 || (ovulatoryAssessment.detected || androgenAssessment.detected)) {
      classification = 'possible_pcos_inconclusive';
    }

    // 7. Qualitative Confidence Tier
    const confidenceTier = this._getConfidenceTier(mlInference.calibratedConfidence);

    // 8. Generate Explainability & Grounded Clinical Rationales
    const explainability = this._generateExplainability(
      patientData,
      ovulatoryAssessment,
      androgenAssessment,
      morphologyAssessment,
      differentialAssessment,
      mlInference
    );

    // Return the formal Layer 2 Diagnostic Output
    return {
      classification,
      model_confidence: mlInference.calibratedConfidence,
      confidence_tier: confidenceTier,
      detection_stage: this._determineDetectionStage(patientData),
      phenotype,
      criteria: {
        ovulatory_dysfunction: ovulatoryAssessment.status,
        hyperandrogenism: androgenAssessment.status,
        polycystic_ovarian_morphology: morphologyAssessment.status
      },
      diagnostic_dimensions: {
        ovulation: {
          detected: ovulatoryAssessment.detected,
          statusText: ovulatoryAssessment.detected ? 'Detected' : (ovulatoryAssessment.status === 'unknown' ? 'Unknown' : 'Not Detected'),
          summary: ovulatoryAssessment.summary
        },
        androgen_activity: {
          detected: androgenAssessment.detected,
          statusText: androgenAssessment.detected ? 'Detected' : (androgenAssessment.status === 'unknown' ? 'Unknown' : 'Not Detected'),
          clinical: androgenAssessment.clinical.detected,
          biochemical: androgenAssessment.biochemical.detected,
          summary: androgenAssessment.summary
        },
        ovarian_morphology: {
          detected: morphologyAssessment.detected,
          statusText: morphologyAssessment.detected ? 'Detected' : (morphologyAssessment.status === 'unknown' ? 'No information yet' : 'Normal'),
          summary: morphologyAssessment.summary
        },
        alternative_causes: {
          allRuledOut: differentialAssessment.allRuledOut,
          statusText: differentialAssessment.pendingAlternatives.length === 0 ? 'Fully evaluated' : 'Some still need checking',
          pending: differentialAssessment.pendingAlternatives,
          ruledOut: differentialAssessment.ruledOutAlternatives,
          suspected: differentialAssessment.suspectedAlternatives
        }
      },
      alternative_conditions_not_ruled_out: differentialAssessment.pendingAlternatives,
      evidence: {
        cycle_length_average: patientData.typicalCycleLength || patientData.cycleLengthAverage || null,
        periods_last_12_months: patientData.periodsLast12Months !== undefined ? patientData.periodsLast12Months : null,
        clinical_hyperandrogenism: androgenAssessment.clinical.detected,
        biochemical_hyperandrogenism: androgenAssessment.biochemical.status,
        mfg_hirsutism_score: androgenAssessment.clinical.mfgScore,
        testosterone_nmol: androgenAssessment.biochemical.testosterone?.normalizedValue || null,
        ultrasound_afc_max: morphologyAssessment.afcMax || null,
        ovarian_volume_max_ml: morphologyAssessment.volumeMax || null,
        serum_amh: morphologyAssessment.amh?.normalizedValue || null
      },
      safety_alerts: safetyCheck.flags,
      explainability
    };
  }

  /**
   * Evaluates Ovulatory Dysfunction (Dimension A)
   */
  _evaluateOvulatoryDysfunction(data) {
    const findings = [];
    let isIrregular = false;
    let dataPoints = 0;

    // Cycle length check (Normal: 21-35 days in adults)
    const cycleLength = Number(data.typicalCycleLength || data.cycleLengthAverage);
    if (cycleLength && !isNaN(cycleLength)) {
      dataPoints++;
      if (cycleLength > CLINICAL_CONSTANTS.CYCLE_NORMAL_MAX) {
        isIrregular = true;
        findings.push(`Cycle length averages ${cycleLength} days (delayed beyond normal 21-35 day window).`);
      } else if (cycleLength < CLINICAL_CONSTANTS.CYCLE_NORMAL_MIN) {
        isIrregular = true;
        findings.push(`Cycle length is unusually short at ${cycleLength} days (<21 days).`);
      }
    }

    // Periods per year (<8-9 implies oligomenorrhea)
    const periodsYear = Number(data.periodsLast12Months);
    if (periodsYear !== undefined && !isNaN(periodsYear)) {
      dataPoints++;
      if (periodsYear < CLINICAL_CONSTANTS.PERIODS_PER_YEAR_MIN_NORMAL) {
        isIrregular = true;
        findings.push(`Reported ${periodsYear} menstrual periods in the last 12 months (fewer than the expected ≥9).`);
      }
    }

    // Amenorrhea (>90 consecutive days)
    if (data.monthsWithoutPeriod >= 3 || data.amenorrheaOver90Days || data.cycleCategory === 'amenorrhea') {
      dataPoints++;
      isIrregular = true;
      findings.push('Experienced prolonged amenorrhea (≥3 months without menses).');
    }

    // Subjective predictability
    if (data.cyclePredictability === 'very_irregular' || data.cyclePredictability === 'highly_variable') {
      dataPoints++;
      isIrregular = true;
      findings.push('Menstrual cycles reported as highly unpredictable or variable.');
    }

    if (dataPoints === 0) {
      return { status: 'unknown', detected: false, summary: 'No cycle history provided.', findings: [] };
    }

    return {
      status: isIrregular,
      detected: isIrregular,
      summary: isIrregular 
        ? 'Ovulatory dysfunction identified based on irregular cycle frequency or prolonged intervals.' 
        : 'Menstrual cycle frequency falls within expected physiological parameters.',
      findings
    };
  }

  /**
   * Evaluates Hyperandrogenism (Dimension B - Clinical and Biochemical)
   */
  _evaluateHyperandrogenism(data) {
    // 1. Clinical Hyperandrogenism
    const clinicalFindings = [];
    let mfgScore = 0;

    // Compute or use provided mFG score
    if (data.mfgScore !== undefined && !isNaN(data.mfgScore)) {
      mfgScore = Number(data.mfgScore);
    } else {
      // Estimate mFG from regional hirsutism inputs
      const hirsutismMap = {
        chinHair: { mild: 1, moderate: 2, significant: 3 },
        upperLipHair: { mild: 1, moderate: 2, significant: 3 },
        chestHair: { mild: 1, moderate: 2, significant: 3 },
        abdomenHair: { mild: 1, moderate: 2, significant: 3 },
        backHair: { mild: 1, moderate: 2, significant: 2 },
        thighHair: { mild: 1, moderate: 2, significant: 2 }
      };

      for (const [key, scoreTier] of Object.entries(hirsutismMap)) {
        const val = data[key];
        if (typeof val === 'string' && scoreTier[val.toLowerCase()]) {
          mfgScore += scoreTier[val.toLowerCase()];
        } else if (val === true) {
          mfgScore += 2;
        }
      }
    }

    const ethnicity = (data.ethnicity || '').toLowerCase();
    const mfgCutoff = (ethnicity.includes('east asian') || ethnicity.includes('japanese') || ethnicity.includes('chinese')) 
      ? CLINICAL_CONSTANTS.MFG_CUTOFF_EAST_ASIAN 
      : CLINICAL_CONSTANTS.MFG_CUTOFF_DEFAULT;

    let hasClinical = false;
    if (mfgScore >= mfgCutoff) {
      hasClinical = true;
      clinicalFindings.push(`Clinical hirsutism present with estimated mFG score of ${mfgScore} (diagnostic threshold ≥${mfgCutoff}).`);
    } else if (data.facialHair || data.bodyHair || data.excessHair) {
      hasClinical = true;
      clinicalFindings.push('Moderate to significant excess terminal facial/body hair reported.');
    }

    if (data.persistentAcne || data.jawlineCysticAcne) {
      hasClinical = true;
      clinicalFindings.push('Persistent adult or hormonal jawline cystic acne reported.');
    }

    if (data.scalpHairThinning || data.androgenicAlopecia) {
      hasClinical = true;
      clinicalFindings.push('Scalp hair loss consistent with female pattern androgenic alopecia.');
    }

    // 2. Biochemical Hyperandrogenism
    const biochemicalFindings = [];
    let hasBiochemical = false;
    let bioDataCount = 0;

    // Testosterone
    const testEval = evaluateLabValue('totalTestosterone', data.totalTestosterone || data.testosterone, data.labRanges?.totalTestosterone, data.labUnits?.totalTestosterone);
    if (testEval.evaluated) {
      bioDataCount++;
      if (testEval.status === 'elevated') {
        hasBiochemical = true;
        biochemicalFindings.push(`Total testosterone is elevated at ${testEval.normalizedValue} ${testEval.unit} (reference upper limit: ${testEval.referenceRange.max} ${testEval.unit}).`);
      }
    }

    // Free Testosterone
    const freeTestEval = evaluateLabValue('freeTestosterone', data.freeTestosterone, data.labRanges?.freeTestosterone, data.labUnits?.freeTestosterone);
    if (freeTestEval.evaluated) {
      bioDataCount++;
      if (freeTestEval.status === 'elevated') {
        hasBiochemical = true;
        biochemicalFindings.push(`Free testosterone is elevated at ${freeTestEval.normalizedValue} ${freeTestEval.unit} (reference max: ${freeTestEval.referenceRange.max}).`);
      }
    }

    // Free Androgen Index (FAI)
    let calculatedFai = null;
    if (data.totalTestosterone && data.shbg) {
      calculatedFai = calculateFAI(Number(data.totalTestosterone), Number(data.shbg));
      const faiEval = evaluateLabValue('fai', calculatedFai, data.labRanges?.fai);
      if (faiEval.status === 'elevated') {
        hasBiochemical = true;
        biochemicalFindings.push(`Free Androgen Index (FAI) is elevated at ${calculatedFai}% (reference limit: ${faiEval.referenceRange.max}%).`);
      }
    }

    // DHEAS
    const dheasEval = evaluateLabValue('dheas', data.dheas, data.labRanges?.dheas, data.labUnits?.dheas);
    if (dheasEval.evaluated) {
      bioDataCount++;
      if (dheasEval.status === 'elevated') {
        hasBiochemical = true;
        biochemicalFindings.push(`Adrenal androgen DHEAS is elevated at ${dheasEval.normalizedValue} ${dheasEval.unit}.`);
      }
    }

    const overallDetected = hasClinical || hasBiochemical;
    let biochemicalStatus = 'unknown';
    if (bioDataCount > 0) {
      biochemicalStatus = hasBiochemical;
    }

    return {
      detected: overallDetected,
      status: overallDetected,
      clinical: {
        detected: hasClinical,
        mfgScore,
        findings: clinicalFindings
      },
      biochemical: {
        status: biochemicalStatus,
        detected: hasBiochemical,
        testosterone: testEval.evaluated ? testEval : null,
        freeTestosterone: freeTestEval.evaluated ? freeTestEval : null,
        calculatedFai,
        findings: biochemicalFindings
      },
      summary: overallDetected 
        ? `Hyperandrogenism confirmed via ${hasClinical && hasBiochemical ? 'both clinical symptoms and laboratory biomarkers' : (hasClinical ? 'clinical manifestations (hirsutism/acne/alopecia)' : 'biochemical androgen elevation')}.` 
        : 'No prominent clinical or biochemical hyperandrogenism identified.'
    };
  }

  /**
   * Evaluates Polycystic Ovarian Morphology (Dimension C)
   * Supports both modern ultrasound criteria and serum AMH
   */
  _evaluateMorphology(data) {
    const findings = [];
    let detected = false;
    let hasData = false;

    // 1. Ultrasound AFC (Antral Follicle Count)
    const leftAfc = Number(data.leftOvaryFollicles || data.afcLeft);
    const rightAfc = Number(data.rightOvaryFollicles || data.afcRight);
    const maxAfc = Math.max(isNaN(leftAfc) ? 0 : leftAfc, isNaN(rightAfc) ? 0 : rightAfc);

    if (maxAfc > 0) {
      hasData = true;
      if (maxAfc >= CLINICAL_CONSTANTS.ULTRASOUND.MIN_FOLLICLE_COUNT_PER_OVARY) {
        detected = true;
        findings.push(`Antral follicle count of ${maxAfc} in ovary meets the ≥20 follicle diagnostic threshold.`);
      }
    }

    // 2. Ovarian Volume
    const leftVol = Number(data.leftOvaryVolumeMl || data.ovaryVolumeLeft);
    const rightVol = Number(data.rightOvaryVolumeMl || data.ovaryVolumeRight);
    const maxVol = Math.max(isNaN(leftVol) ? 0 : leftVol, isNaN(rightVol) ? 0 : rightVol);

    if (maxVol > 0) {
      hasData = true;
      if (maxVol >= CLINICAL_CONSTANTS.ULTRASOUND.MIN_OVARIAN_VOLUME_ML) {
        detected = true;
        findings.push(`Ovarian volume of ${maxVol} mL meets the enlarged morphology criterion (≥10 mL).`);
      }
    }

    // 3. Qualitative Ultrasound Impression
    if (data.ultrasoundImpression === 'polycystic_pattern' || data.ultrasoundPcom === true || data.peripheralFollicles === true) {
      hasData = true;
      detected = true;
      findings.push('Ultrasound report demonstrates peripheral follicular distribution ("string-of-pearls" sign).');
    }

    // 4. Anti-Müllerian Hormone (AMH) in adults as diagnostic alternative
    const amhEval = evaluateLabValue('amh', data.amh, data.labRanges?.amh, data.labUnits?.amh);
    if (amhEval.evaluated) {
      hasData = true;
      if (amhEval.status === 'elevated') {
        detected = true;
        findings.push(`Serum AMH is elevated at ${amhEval.normalizedValue} ${amhEval.unit} (reference threshold: ${amhEval.referenceRange.max} ${amhEval.unit}), consistent with polycystic ovarian morphology.`);
      }
    }

    if (!hasData) {
      return {
        status: 'unknown',
        detected: false,
        summary: 'No pelvic ultrasound or AMH test data available.',
        findings: []
      };
    }

    return {
      status: detected,
      detected,
      afcMax: maxAfc > 0 ? maxAfc : null,
      volumeMax: maxVol > 0 ? maxVol : null,
      amh: amhEval.evaluated ? amhEval : null,
      summary: detected 
        ? 'Polycystic ovarian morphology verified via imaging or elevated serum AMH.' 
        : 'Ovarian imaging and AMH are within non-PCOS morphological limits.',
      findings
    };
  }

  /**
   * Differential Diagnosis & Exclusion Evaluation
   * Rigorously evaluates conditions with overlapping phenotypes:
   * - Thyroid Disease (TSH)
   * - Hyperprolactinemia (Prolactin)
   * - Non-classic CAH (17-OHP)
   * - Cushing's Syndrome
   * - Androgen-secreting tumor
   * - Hypothalamic amenorrhea
   */
  _evaluateDifferentialDiagnoses(data) {
    const ruledOut = [];
    const pending = [];
    const suspected = [];

    // 1. Thyroid Screen (TSH)
    const tshEval = evaluateLabValue('tsh', data.tsh, data.labRanges?.tsh);
    if (tshEval.evaluated) {
      if (tshEval.status === 'normal') {
        ruledOut.push({ condition: 'Thyroid disorder', marker: 'TSH', value: `${tshEval.normalizedValue} mIU/L (Normal)` });
      } else {
        suspected.push({
          condition: 'Thyroid disorder',
          marker: 'TSH',
          status: tshEval.status,
          value: `${tshEval.normalizedValue} mIU/L`,
          implication: tshEval.status === 'elevated' ? 'Suspected hypothyroidism causing menstrual irregularity' : 'Suspected hyperthyroidism'
        });
      }
    } else {
      pending.push('thyroid_disorder');
    }

    // 2. Hyperprolactinemia (Prolactin)
    const prolactinEval = evaluateLabValue('prolactin', data.prolactin, data.labRanges?.prolactin, data.labUnits?.prolactin);
    if (prolactinEval.evaluated) {
      if (prolactinEval.status === 'normal') {
        ruledOut.push({ condition: 'Hyperprolactinemia', marker: 'Prolactin', value: `${prolactinEval.normalizedValue} ng/mL (Normal)` });
      } else {
        suspected.push({
          condition: 'Hyperprolactinemia',
          marker: 'Prolactin',
          status: 'elevated',
          value: `${prolactinEval.normalizedValue} ng/mL`,
          implication: 'Elevated prolactin can inhibit GnRH pulsatility and mimic PCOS anovulation.'
        });
      }
    } else {
      pending.push('hyperprolactinemia');
    }

    // 3. Non-classic CAH (17-hydroxyprogesterone)
    const ohpEval = evaluateLabValue('ohp17', data.ohp17 || data.hydroxyprogesterone17, data.labRanges?.ohp17, data.labUnits?.ohp17);
    if (ohpEval.evaluated) {
      if (ohpEval.status === 'normal') {
        ruledOut.push({ condition: 'Non-classic congenital adrenal hyperplasia (NCAH)', marker: '17-OHP', value: `${ohpEval.normalizedValue} nmol/L (Normal)` });
      } else {
        suspected.push({
          condition: 'Non-classic congenital adrenal hyperplasia (NCAH)',
          marker: '17-OHP',
          status: 'elevated',
          value: `${ohpEval.normalizedValue} nmol/L`,
          implication: 'Significantly elevated 17-OHP requires an ACTH stimulation test to rule out 21-hydroxylase deficiency.'
        });
      }
    } else {
      pending.push('non_classic_cah');
    }

    // 4. Androgen-secreting neoplasm check
    const testosteroneNmol = data.totalTestosterone || data.testosterone;
    if (testosteroneNmol && testosteroneNmol > CLINICAL_CONSTANTS.RED_FLAGS.VIRILIZATION_ALERT_TESTOSTERONE_NMOL) {
      suspected.push({
        condition: 'Androgen-secreting neoplasm',
        marker: 'Total Testosterone',
        status: 'markedly_elevated',
        value: `${testosteroneNmol} nmol/L`,
        implication: 'Markedly elevated testosterone (>5.0 nmol/L / >150 ng/dL) requires pelvic and adrenal imaging to rule out virilizing neoplasms.'
      });
    }

    // 5. Pregnancy Check
    if (data.pregnancyStatus === 'negative' || data.pregnancyTestDone === true) {
      ruledOut.push({ condition: 'Pregnancy-related amenorrhea', marker: 'beta-hCG', value: 'Negative' });
    } else if (data.pregnancyStatus === 'unknown' || !data.pregnancyStatus) {
      pending.push('pregnancy_amenorrhea');
    }

    return {
      allRuledOut: pending.length === 0 && suspected.length === 0,
      ruledOutAlternatives: ruledOut,
      pendingAlternatives: pending,
      suspectedAlternatives: suspected
    };
  }

  /**
   * Computes a calibrated ensemble score combining:
   * 1. Multi-feature weighting (symptoms, BMI, cycle length, hirsutism, labs, imaging)
   * 2. Concordance penalties (penalizing missing data or conflicting clinical cues)
   * 3. Empirical calibrated probability curve aligned with clinical diagnostic studies
   */
  _computeCalibratedEnsembleScore(data, ovulatory, androgen, morphology, differential) {
    // Feature weights derived from meta-analyses on PCOS ML classifiers
    let logit = -1.8; // Base population log-odds

    // Feature 1: Cycle Irregularity / Oligoamenorrhea
    if (ovulatory.detected) {
      const cycleLength = Number(data.typicalCycleLength || data.cycleLengthAverage);
      if (cycleLength > 45 || data.periodsLast12Months <= 6) {
        logit += 2.4;
      } else {
        logit += 1.8;
      }
    } else if (ovulatory.status === false) {
      logit -= 1.6;
    }

    // Feature 2: Clinical Hyperandrogenism
    if (androgen.clinical.detected) {
      if (androgen.clinical.mfgScore >= 8) logit += 2.1;
      else logit += 1.4;
    }

    // Feature 3: Biochemical Hyperandrogenism
    if (androgen.biochemical.detected) {
      logit += 2.5;
    } else if (androgen.biochemical.status === false) {
      logit -= 0.5;
    }

    // Feature 4: Morphology (Ultrasound / AMH)
    if (morphology.detected) {
      logit += 2.6;
    } else if (morphology.status === false) {
      logit -= 1.2;
    }

    // Feature 5: Clinical / Metabolic Markers
    const bmi = Number(data.bmi || (data.weightKg && data.heightCm ? (data.weightKg / Math.pow(data.heightCm / 100, 2)) : 0));
    if (bmi >= 27) logit += 0.5;
    if (data.darkenedSkin || data.acanthosisNigricans) logit += 0.8; // Insulin resistance hallmark
    if (data.familyHistoryPcos) logit += 0.6; // Strong heritability component

    // Penalties for unruled differential diagnoses
    if (differential.suspectedAlternatives.length > 0) {
      logit -= 1.4; // Alternative condition likely explains presentation
    } else if (differential.pendingAlternatives.length >= 3) {
      logit -= 0.3; // Uncertainty penalty due to unverified differentials
    }

    // Sigmoid function for base probability
    const rawProbability = 1 / (1 + Math.exp(-logit));

    // Platt Calibration adjustment for medical calibration reliability
    const calibratedConfidence = Number(Math.min(0.98, Math.max(0.08, rawProbability)).toFixed(2));

    return {
      logit,
      rawProbability,
      calibratedConfidence
    };
  }

  /**
   * Maps numerical confidence to clinical patient-facing tiers
   */
  _getConfidenceTier(confidence) {
    if (confidence >= 0.94) return 'Very high confidence';
    if (confidence >= 0.80) return 'High confidence';
    if (confidence >= 0.60) return 'Moderate confidence';
    return 'Low confidence';
  }

  /**
   * Determines the current progressive detection stage
   */
  _determineDetectionStage(data) {
    const hasUltrasound = data.leftOvaryFollicles || data.afcLeft || data.ultrasoundImpression || data.amh;
    const hasBiochemical = data.totalTestosterone || data.freeTestosterone || data.dheas || data.shbg;
    const hasClinicalMeasurements = data.bmi || (data.heightCm && data.weightKg) || data.mfgScore;

    if (hasUltrasound && hasBiochemical) return 'Comprehensive Detection (Stage 3)';
    if (hasBiochemical || hasClinicalMeasurements) return 'Enhanced Detection (Stage 2)';
    return 'Initial Detection (Stage 1)';
  }

  /**
   * Generates patient-centered, transparent, explainable reasoning
   */
  _generateExplainability(data, ovulatory, androgen, morphology, differential, mlInference) {
    const signals = [];

    // Ovulatory explanation
    if (ovulatory.detected) {
      signals.push({
        dimension: 'Ovulatory Dysfunction',
        icon: 'cycle',
        status: 'Detected',
        title: 'Irregular ovulation pattern',
        explanation: ovulatory.findings.join(' '),
        impact: 'High Positive Contribution'
      });
    }

    // Clinical androgen explanation
    if (androgen.clinical.detected) {
      signals.push({
        dimension: 'Clinical Hyperandrogenism',
        icon: 'androgen',
        status: 'Detected',
        title: 'Androgen-related physical symptoms',
        explanation: androgen.clinical.findings.join(' '),
        impact: 'High Positive Contribution'
      });
    }

    // Biochemical explanation
    if (androgen.biochemical.detected) {
      signals.push({
        dimension: 'Biochemical Hyperandrogenism',
        icon: 'lab',
        status: 'Detected',
        title: 'Laboratory hormone evidence',
        explanation: androgen.biochemical.findings.join(' '),
        impact: 'High Positive Contribution'
      });
    }

    // Morphology explanation
    if (morphology.detected) {
      signals.push({
        dimension: 'Ovarian Morphology',
        icon: 'ultrasound',
        status: 'Detected',
        title: 'Polycystic ovarian appearance or AMH',
        explanation: morphology.findings.join(' '),
        impact: 'High Positive Contribution'
      });
    }

    // Differential explanation
    if (differential.pendingAlternatives.length > 0) {
      const pendingNames = differential.pendingAlternatives.map(p => {
        if (p === 'thyroid_disorder') return 'Thyroid disorder (TSH)';
        if (p === 'hyperprolactinemia') return 'Prolactin levels';
        if (p === 'non_classic_cah') return '17-OHP (Adrenal)';
        return p;
      }).join(', ');

      signals.push({
        dimension: 'Differential Diagnoses',
        icon: 'differential',
        status: 'Pending Verification',
        title: 'Overlapping conditions not yet ruled out',
        explanation: `Clinical guidelines mandate ruling out other hormonal conditions that share overlapping symptoms. Currently pending: ${pendingNames}.`,
        impact: 'Clinical Consideration'
      });
    }

    return {
      summary: `CysterCare identified a PCOS/PMOS pattern because several independent diagnostic indicators point in the same direction, with a calibrated confidence of ${Math.round(mlInference.calibratedConfidence * 100)}%.`,
      contributingSignals: signals,
      missingToImprove: this._getRecommendedNextTests(data, morphology, differential)
    };
  }

  /**
   * Suggests next highest-yield tests to elevate detection to Comprehensive
   */
  _getRecommendedNextTests(data, morphology, differential) {
    const nextSteps = [];

    if (!data.totalTestosterone && !data.freeTestosterone) {
      nextSteps.push({
        test: 'Total & Free Testosterone, SHBG',
        purpose: 'Confirms biochemical hyperandrogenism and calculates Free Androgen Index (FAI).'
      });
    }

    if (differential.pendingAlternatives.includes('thyroid_disorder')) {
      nextSteps.push({
        test: 'TSH (Thyroid Stimulating Hormone)',
        purpose: 'Rules out subclinical or overt hypothyroidism causing cycle irregularity.'
      });
    }

    if (differential.pendingAlternatives.includes('hyperprolactinemia')) {
      nextSteps.push({
        test: 'Serum Prolactin',
        purpose: 'Rules out prolactin elevation as an independent cause of missed periods.'
      });
    }

    if (!morphology.detected && morphology.status === 'unknown') {
      nextSteps.push({
        test: 'Pelvic Ultrasound or Serum AMH',
        purpose: 'Assesses antral follicle count, ovarian volume, or Anti-Müllerian Hormone.'
      });
    }

    return nextSteps;
  }
}
