/**
 * CysterCare Longitudinal Health Tracker & Intelligence Engine
 * Stores and analyzes chronological cycle, metabolic, dermatologic, and medication data.
 * Answers clinical questions grounded strictly in stored longitudinal telemetry.
 */

export class LongitudinalTracker {
  constructor() {
    // 6-month longitudinal history matching CysterCare patient profile (e.g. Sarah)
    this.records = {
      patientId: 'P-98412',
      name: 'Sarah',
      medications: [
        { name: 'Metformin', dose: '500 mg daily', startedMonth: 3, active: true },
        { name: 'Inositol (40:1 Myo/D-chiro)', dose: '2,000 mg daily', startedMonth: 1, active: true }
      ],
      // 6-Month Cycle Data (Month 1 is 6 months ago, Month 6 is current)
      cycles: [
        { month: 'Apr', monthIndex: 1, cycleLength: 62, periodDays: 6, flow: 'heavy', ovulatorySigns: 'absent' },
        { month: 'May', monthIndex: 2, cycleLength: 54, periodDays: 5, flow: 'heavy', ovulatorySigns: 'absent' },
        { month: 'Jun', monthIndex: 3, cycleLength: 48, periodDays: 5, flow: 'moderate', ovulatorySigns: 'possible' }, // Started Metformin
        { month: 'Jul', monthIndex: 4, cycleLength: 41, periodDays: 4, flow: 'moderate', ovulatorySigns: 'positive' },
        { month: 'Aug', monthIndex: 5, cycleLength: 35, periodDays: 4, flow: 'normal', ovulatorySigns: 'positive' },
        { month: 'Sep', monthIndex: 6, cycleLength: 32, periodDays: 4, flow: 'normal', ovulatorySigns: 'positive' }
      ],
      // Symptoms Over Time (Scale 0-10 or qualitative)
      symptoms: [
        { month: 'Apr', monthIndex: 1, acneSeverity: 8, chinHairRate: 'high', hairThinning: 7, energyLevel: 4, sleepHours: 6.2, mood: 'anxious' },
        { month: 'May', monthIndex: 2, acneSeverity: 7, chinHairRate: 'high', hairThinning: 7, energyLevel: 5, sleepHours: 6.5, mood: 'fatigued' },
        { month: 'Jun', monthIndex: 3, acneSeverity: 6, chinHairRate: 'moderate', hairThinning: 6, energyLevel: 6, sleepHours: 7.0, mood: 'calm' },
        { month: 'Jul', monthIndex: 4, acneSeverity: 5, chinHairRate: 'moderate', hairThinning: 5, energyLevel: 7, sleepHours: 7.2, mood: 'calm' },
        { month: 'Aug', monthIndex: 5, acneSeverity: 4, chinHairRate: 'mild', hairThinning: 4, energyLevel: 8, sleepHours: 7.5, mood: 'energetic' },
        { month: 'Sep', monthIndex: 6, acneSeverity: 3, chinHairRate: 'mild', hairThinning: 4, energyLevel: 8, sleepHours: 7.8, mood: 'happy' }
      ],
      // Weight & Metabolic Metrics
      weightHistory: [
        { month: 'Apr', weightKg: 78.4, bmi: 28.8 },
        { month: 'May', weightKg: 77.8, bmi: 28.6 },
        { month: 'Jun', weightKg: 76.9, bmi: 28.2 },
        { month: 'Jul', weightKg: 75.8, bmi: 27.8 },
        { month: 'Aug', weightKg: 75.4, bmi: 27.7 },
        { month: 'Sep', weightKg: 75.0, bmi: 27.5 }
      ],
      // Weekly Steps
      weeklySteps: [
        { day: 'S', steps: 1200 },
        { day: 'M', steps: 2100 },
        { day: 'T', steps: 2700 },
        { day: 'W', steps: 6100 },
        { day: 'T', steps: 6800 },
        { day: 'F', steps: 1400 },
        { day: 'S', steps: 2200 }
      ],
      // Lab Progress
      labs: [
        { date: 'Apr 2026', totalTestosterone: 2.8, fai: 5.6, fastingInsulin: 18.4, hba1c: 5.7 },
        { date: 'Sep 2026', totalTestosterone: 1.9, fai: 3.4, fastingInsulin: 10.2, hba1c: 5.4 }
      ]
    };
  }

  getPatientSummary() {
    return this.records;
  }

  /**
   * Answers natural language questions based directly on actual stored records.
   */
  queryLongitudinal(query) {
    const q = query.toLowerCase();

    // 1. "Are my cycles getting better?" / "cycle improvement"
    if (q.includes('cycle') && (q.includes('better') || q.includes('improv') || q.includes('regular') || q.includes('change'))) {
      const firstCycle = this.records.cycles[0].cycleLength;
      const latestCycle = this.records.cycles[this.records.cycles.length - 1].cycleLength;
      const diff = firstCycle - latestCycle;

      return {
        query,
        topic: 'cycle_progression',
        headline: 'Yes, your cycles are significantly more regular.',
        details: `Your cycle length has decreased by ${diff} days over the last 6 months (from ${firstCycle} days in April down to ${latestCycle} days in September). A 32-day cycle now sits right inside the healthy physiological window of 21–35 days, indicating restored ovulatory regularity.`,
        dataPoints: this.records.cycles.map(c => ({ month: c.month, cycleLength: c.cycleLength })),
        trend: 'positive'
      };
    }

    // 2. "Has my acne improved?"
    if (q.includes('acne') || q.includes('skin') || q.includes('breakout')) {
      const firstAcne = this.records.symptoms[0].acneSeverity;
      const latestAcne = this.records.symptoms[this.records.symptoms.length - 1].acneSeverity;
      const reduction = Math.round(((firstAcne - latestAcne) / firstAcne) * 100);

      return {
        query,
        topic: 'acne_progression',
        headline: `Your acne severity has improved by approximately ${reduction}%.`,
        details: `In April, you logged jawline and hormonal acne at 8/10 severity. By September, this has dropped to 3/10 (mild). This closely tracks the decline in your Free Androgen Index and stabilized insulin levels.`,
        dataPoints: this.records.symptoms.map(s => ({ month: s.month, acne: s.acneSeverity })),
        trend: 'positive'
      };
    }

    // 3. "What's changed over the last six months?" / "overall summary"
    if (q.includes('six months') || q.includes('6 months') || q.includes('changed') || q.includes('overview') || q.includes('summary')) {
      return {
        query,
        topic: 'six_month_overview',
        headline: 'Here is your 6-month progress across all key PCOS/PMOS markers:',
        details: `• Cycle length: Shortened from 62 days to 32 days (-30 days, now regular)\n• Acne: Down from severe (8/10) to mild (3/10)\n• Weight: Gradual reduction of 3.4 kg (78.4 kg → 75.0 kg)\n• Energy: Rose from 4/10 to 8/10\n• Testosterone: Decreased from 2.8 nmol/L to 1.9 nmol/L`,
        dataPoints: {
          weight: '78.4kg → 75.0kg (-3.4kg)',
          cycle: '62d → 32d (-30d)',
          testosterone: '2.8 nmol/L → 1.9 nmol/L'
        },
        trend: 'positive'
      };
    }

    // 4. "Did my cycle change after starting metformin?"
    if (q.includes('metformin')) {
      const beforeMetformin = this.records.cycles.slice(0, 2).map(c => c.cycleLength);
      const afterMetformin = this.records.cycles.slice(2).map(c => c.cycleLength);
      const avgBefore = Math.round(beforeMetformin.reduce((a, b) => a + b, 0) / beforeMetformin.length);
      const avgAfter = Math.round(afterMetformin.reduce((a, b) => a + b, 0) / afterMetformin.length);

      return {
        query,
        topic: 'medication_impact_metformin',
        headline: 'Yes, your cycle shortened consistently after starting Metformin in Month 3 (June).',
        details: `Before Metformin (April–May), your cycles averaged ${avgBefore} days. After initiating Metformin in June alongside Inositol, your cycles steadily reduced across consecutive months (48d → 41d → 35d → 32d), averaging ${avgAfter} days and resuming ovulatory regularity.`,
        dataPoints: this.records.cycles,
        trend: 'positive'
      };
    }

    // Default response using stored data
    return {
      query,
      topic: 'general_telemetry',
      headline: 'Here is your current health telemetry:',
      details: `You currently have 6 months of continuous cycle and symptom logs. Your latest cycle was 32 days, weight is 75.0 kg, and average weekly steps reached 6,800 on peak days.`,
      dataPoints: this.records.cycles[this.records.cycles.length - 1],
      trend: 'stable'
    };
  }
}
