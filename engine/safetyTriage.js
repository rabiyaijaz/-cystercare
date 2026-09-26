/**
 * CysterCare Clinical Safety & Red Flag Triage Engine
 * Detects acute emergencies, androgen-secreting neoplasms, and psychiatric distress.
 * PCOS analysis MUST NEVER explain away acute clinical danger.
 */

export function screenSafetyRedFlags(input = {}) {
  const flags = [];

  // 1. Severe Pelvic Pain / Acute Abdomen (Ovarian torsion, ruptured cyst, ectopic)
  if (input.severePelvicPain || input.acuteAbdominalPain || 
      (typeof input.painSeverity === 'string' && input.painSeverity.toLowerCase() === 'severe')) {
    flags.push({
      category: 'emergency_pain',
      level: 'URGENT_EMERGENCY',
      title: 'Severe Pelvic Pain Alert',
      summary: 'Sudden or severe pelvic pain requires urgent in-person medical evaluation to rule out conditions such as ovarian torsion, ruptured hemorrhagic ovarian cyst, or pelvic infection.',
      recommendation: 'Seek immediate emergency medical care or visit the nearest emergency department right away.'
    });
  }

  // 2. Pregnancy Emergency / Possible Ectopic Pregnancy
  if ((input.pregnancyStatus === 'positive' || input.pregnancyStatus === 'possible') && 
      (input.pelvicPain || input.spottingBleeding || input.shoulderPain || input.dizzinessFainting)) {
    flags.push({
      category: 'pregnancy_emergency',
      level: 'URGENT_EMERGENCY',
      title: 'Potential Pregnancy Complication Alert',
      summary: 'Abdominal pain, dizziness, or abnormal bleeding in the setting of possible pregnancy may be signs of an ectopic pregnancy, which is a life-threatening medical emergency.',
      recommendation: 'Go to the nearest emergency room immediately for urgent ultrasound and clinical assessment.'
    });
  }

  // 3. Very Heavy Bleeding / Hemorrhage
  if (input.veryHeavyBleeding || input.soakingPadsHourly || input.largeBloodClots || input.faintingWithBleeding) {
    flags.push({
      category: 'abnormal_uterine_bleeding',
      level: 'URGENT_EMERGENCY',
      title: 'Acute Heavy Bleeding Alert',
      summary: 'Soaking through one or more sanitary pads/tampons every hour for 2 or more consecutive hours, passing golf ball-sized clots, or feeling dizzy/faint requires immediate clinical intervention.',
      recommendation: 'Contact urgent healthcare services or visit the nearest emergency medical facility immediately.'
    });
  }

  // 4. Fainting / Syncope
  if (input.fainting || input.syncope || input.lossOfConsciousness) {
    flags.push({
      category: 'syncope',
      level: 'URGENT_EMERGENCY',
      title: 'Fainting / Syncope Alert',
      summary: 'Episodes of fainting or sudden loss of consciousness can stem from internal bleeding, severe anemia, or cardiovascular causes and cannot be attributed solely to PCOS.',
      recommendation: 'Seek immediate medical evaluation.'
    });
  }

  // 5. Rapid Virilization (< 6 months, severe voice deepening, clitoromegaly)
  // Highly suspicious for androgen-secreting ovarian or adrenal neoplasms
  if (input.rapidVirilization || 
      (input.virilizationOnsetMonths !== undefined && input.virilizationOnsetMonths < 6 && (input.voiceDeepening || input.clitoromegaly)) ||
      (input.testosteroneNmol && input.testosteroneNmol > 5.0) ||
      (input.dheasUmol && input.dheasUmol > 18.0)) {
    flags.push({
      category: 'rapid_virilization',
      level: 'URGENT_SPECIALIST_REFERRAL',
      title: 'Rapid Virilization Alert (Neoplasm Screen Required)',
      summary: 'Rapid onset of severe androgenic signs (deepening voice, clitoral enlargement, or markedly elevated androgens: Total T > 5.0 nmol/L [>150-200 ng/dL] or DHEAS > 18.0 µmol/L) can indicate an androgen-secreting ovarian or adrenal tumor rather than benign PCOS.',
      recommendation: 'Prioritize an urgent consultation with an endocrinologist or gynecologic oncologist for targeted imaging and hormone workup.'
    });
  }

  // 6. Crisis / Self-Harm / Severe Depression
  if (input.selfHarmIntent || input.suicidalIdeation || input.mentalHealthCrisis) {
    flags.push({
      category: 'mental_health_crisis',
      level: 'CRISIS_SUPPORT',
      title: 'Urgent Emotional & Mental Health Support',
      summary: 'Living with chronic hormonal distress can feel overwhelming, but immediate, compassionate support is available right now.',
      recommendation: 'Please connect immediately with a crisis lifeline (Call/Text 988 in the US/Canada, 111 in the UK, or your local emergency mental health helpline). You are not alone.'
    });
  }

  return {
    hasEmergency: flags.some(f => f.level === 'URGENT_EMERGENCY' || f.level === 'CRISIS_SUPPORT'),
    hasSpecialistWarning: flags.some(f => f.level === 'URGENT_SPECIALIST_REFERRAL'),
    flags
  };
}
