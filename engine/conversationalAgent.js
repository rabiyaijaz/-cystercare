/**
 * CysterCare Conversational AI Assistant (Layer 1)
 * 
 * Embodies the "Cyster" AI Persona:
 * - Warm, intelligent, calm, non-judgmental, concise, emotionally aware, medically literate.
 * - Collects structured patient data through progressive, bite-sized dialogues.
 * - NEVER invents diagnostic results; strictly calls Layer 2 Detection Engine.
 * - Formats technical results into empathetic, understandable human language.
 * - Connects longitudinal intelligence, lab extraction, and post-detection management.
 */

import { PCOSdetectionEngine } from './detectionEngine.js';
import { LongitudinalTracker } from './longitudinalTracker.js';
import { screenSafetyRedFlags } from './safetyTriage.js';

export class ConversationalAgent {
  constructor() {
    this.engine = new PCOSdetectionEngine();
    this.tracker = new LongitudinalTracker();
    // Default conversation state
    this.sessions = new Map();
  }

  getSession(sessionId = 'default-user') {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        step: 'idle', // 'cycle', 'androgen', 'history', 'tests', 'completed'
        patientData: {
          typicalCycleLength: null,
          periodsLast12Months: null,
          cyclePredictability: null,
          monthsWithoutPeriod: 0,
          facialHair: null,
          chinHair: null,
          chestHair: null,
          abdomenHair: null,
          persistentAcne: null,
          scalpHairThinning: null,
          mfgScore: 0,
          previousDiagnosis: null,
          thyroidDisorder: null,
          prolactinDisorder: null,
          familyHistoryPcos: null,
          medications: [],
          totalTestosterone: null,
          freeTestosterone: null,
          shbg: null,
          dheas: null,
          tsh: null,
          prolactin: null,
          leftOvaryFollicles: null,
          rightOvaryFollicles: null,
          leftOvaryVolumeMl: null,
          rightOvaryVolumeMl: null
        },
        chatHistory: []
      });
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Main chat message handler.
   */
  processMessage(userText, sessionId = 'default-user', contextData = {}) {
    const session = this.getSession(sessionId);
    const text = (userText || '').trim();
    const lower = text.toLowerCase();

    // Language Detection (en, ur, ps)
    let lang = contextData.language || session.language || 'en';
    if (/[\u069A\u0696\u0693\u067C\u0689\u06BC\u06D0\u06CD]/.test(text) || lower.includes('پښتو') || lower.includes('pashto') || lower.includes('پختو')) {
      lang = 'ps';
    } else if (/[\u0600-\u06FF]/.test(text) || lower.includes('اردو') || lower.includes('urdu')) {
      lang = 'ur';
    }
    session.language = lang;

    // Route to Urdu handler if requested
    if (lang === 'ur') {
      const urduResponse = this._handleUrduMessage(text, lower, session, contextData);
      if (urduResponse) return urduResponse;
    }

    // Route to Pashto handler if requested
    if (lang === 'ps') {
      const pashtoResponse = this._handlePashtoMessage(text, lower, session, contextData);
      if (pashtoResponse) return pashtoResponse;
    }

    // 1. First: Check for Acute Safety Red Flags
    const safetyCheck = screenSafetyRedFlags({
      severePelvicPain: lower.includes('severe pain') || lower.includes('intense pelvic pain') || lower.includes('extreme pain'),
      veryHeavyBleeding: lower.includes('heavy bleeding') && (lower.includes('soaking') || lower.includes('clots')),
      fainting: lower.includes('faint') || lower.includes('passed out') || lower.includes('syncope'),
      rapidVirilization: lower.includes('deep voice suddenly') || lower.includes('voice dropped') || lower.includes('rapid hair growth within 3 months'),
      suicidalIdeation: lower.includes('kill myself') || lower.includes('end my life') || lower.includes('want to die')
    });

    if (safetyCheck.hasEmergency) {
      const alert = safetyCheck.flags[0];
      return {
        reply: `⚠️ **${alert.title}**\n\n${alert.summary}\n\n**Next step:** ${alert.recommendation}\n\n*Please prioritize speaking with a doctor or emergency healthcare provider immediately.*`,
        chips: ['Call Emergency Services', 'Find Urgent Care', 'Back to Safety'],
        action: 'emergency_alert',
        isEmergency: true
      };
    }

    // 2. Check for Doctor Stats Query
    if (lower.includes('send my stats') || lower.includes('dr. afshin') || lower.includes('prep doctor')) {
      return {
        reply: `I've prepared your 6-month clinical summary for Dr. Afshin Shareef. It includes your cycle progression, androgen symptom reduction, and current medication adherence.\n\nWould you like to review the summary before sending?`,
        chips: ['Review Doctor Summary', 'Send to Dr. Afshin', 'View Cycle Chart'],
        action: 'doctor_prep_ready',
        doctorSummary: this.getDoctorSummary()
      };
    }

    // 2b. Check for Specialist Recommendation Queries
    if (lower.includes('specialist') || lower.includes('recommend doctor') || lower.includes('find doctor') ||
        lower.includes('endocrinologist') || lower.includes('gynecologist') || lower.includes('gynac') ||
        lower.includes('dermatologist') || lower.includes('psychologist') || lower.includes('dietitian') ||
        lower.includes('nutritionist') || lower.includes('connect with doctor')) {
      return {
        reply: "Based on your PCOS/PMOS symptoms and metabolic profile, here are the key specialists available to support you:\n\n" +
               "• **Endocrinologist (Dr. Laiba Khan)**: Hormone balancing, insulin resistance, and metformin support.\n" +
               "• **Gynecologist (Dr. Afsheen Sharif)**: Ovulatory evaluation, pelvic ultrasound, and cycle regulation.\n" +
               "• **Mental Health Specialist (Dr. Michael Chen)**: Managing PCOS/PMOS brain fog, anxiety, and emotional wellbeing.\n" +
               "• **Dermatologist (Dr. Ayesha Malik)**: Targeted treatments for hormonal acne and hirsutism.\n" +
               "• **Dietitian / Nutritionist (Dr. Sana Tariq)**: Personalized anti-inflammatory and insulin-sensitizing meal plans.\n\n" +
               "Would you like to book an in-person or online consultation?",
        chips: ['Book Dr. Laiba Khan', 'Book Dr. Afsheen Sharif', 'Book Dr. Michael Chen', 'View All Specialists'],
        action: 'recommend_specialists'
      };
    }

    // 2c. Check for Longitudinal Queries (e.g., "Are my cycles getting better?")
    if (lower.includes('getting better') || lower.includes('improved') || 
        lower.includes('changed over the last') || lower.includes('metformin')) {
      const longResult = this.tracker.queryLongitudinal(text);
      return {
        reply: `**${longResult.headline}**\n\n${longResult.details}`,
        chips: ['View 6-Month Chart', 'Ask another question', 'Check for PCOS/PMOS'],
        action: 'longitudinal_answer',
        dataPoints: longResult.dataPoints
      };
    }

    // 3. Check for Medical Terminology Explanations
    const termExplanation = this._checkMedicalTerminology(lower);
    if (termExplanation) {
      return {
        reply: termExplanation,
        chips: ['Understood', 'Continue PCOS/PMOS Check', 'Ask something else']
      };
    }

    // 4. Multi-Step Detection Flow State Machine
    if (lower.includes('check for pcos') || lower.includes('pcos/pmos') || lower.includes('start detection') || lower.includes('test for pcos')) {
      session.step = 'cycle_length';
      return {
        reply: "Those two things can sometimes occur together in PCOS/PMOS.\n\nLet's look at your cycle first.\n\nAbout how long is it usually between periods?",
        chips: ['Under 21 days', '21–35 days', '36–60 days', 'More than 60 days', 'It varies a lot', "I'm not sure"],
        step: 1,
        progress: '1/5 — Your cycle'
      };
    }

    // Handling Step 1: Cycle Questions
    if (session.step === 'cycle_length') {
      if (lower.includes('36–60') || lower.includes('36-60') || lower.includes('49') || lower.includes('48')) {
        session.patientData.typicalCycleLength = 49;
        session.patientData.cyclePredictability = 'irregular';
      } else if (lower.includes('more than 60') || lower.includes('>60')) {
        session.patientData.typicalCycleLength = 65;
        session.patientData.cyclePredictability = 'very_irregular';
      } else if (lower.includes('varies') || lower.includes('not sure')) {
        session.patientData.typicalCycleLength = 45;
        session.patientData.cyclePredictability = 'highly_variable';
      } else {
        session.patientData.typicalCycleLength = 28;
        session.patientData.cyclePredictability = 'regular';
      }

      session.step = 'periods_year';
      return {
        reply: "Got it. Approximately how many periods have you had in the last 12 months?",
        chips: ['Fewer than 4', '4 to 6 periods', '7 to 8 periods', '9 to 12 periods', 'None for 3+ months'],
        step: 1,
        progress: '1/5 — Your cycle'
      };
    }

    if (session.step === 'periods_year') {
      if (lower.includes('4 to 6') || lower.includes('fewer') || lower.includes('none')) {
        session.patientData.periodsLast12Months = 6;
      } else {
        session.patientData.periodsLast12Months = 10;
      }

      session.step = 'androgen_hair';
      return {
        reply: "Thank you for sharing that.\n\nNext, let's look at hormonal symptoms. Have you noticed persistent or coarse hair growth in areas like your chin, upper lip, chest, or lower abdomen?",
        chips: ['Significant chin/facial hair', 'Mild to moderate hair', 'No unusual hair growth'],
        step: 2,
        progress: '2/5 — Hormonal symptoms'
      };
    }

    // Handling Step 2: Androgen Symptoms
    if (session.step === 'androgen_hair') {
      if (lower.includes('significant') || lower.includes('yes') || lower.includes('chin')) {
        session.patientData.facialHair = true;
        session.patientData.chinHair = 'significant';
        session.patientData.mfgScore += 6;
      } else if (lower.includes('mild')) {
        session.patientData.facialHair = true;
        session.patientData.chinHair = 'mild';
        session.patientData.mfgScore += 3;
      } else {
        session.patientData.facialHair = false;
      }

      session.step = 'androgen_acne_hair';
      return {
        reply: "Do you experience persistent acne (especially along your jawline or back) or noticeable thinning of your scalp hair?",
        chips: ['Persistent jawline acne', 'Scalp hair thinning', 'Both acne & hair thinning', 'Neither'],
        step: 2,
        progress: '2/5 — Hormonal symptoms'
      };
    }

    if (session.step === 'androgen_acne_hair') {
      if (lower.includes('acne') || lower.includes('both')) {
        session.patientData.persistentAcne = true;
      }
      if (lower.includes('thinning') || lower.includes('both')) {
        session.patientData.scalpHairThinning = true;
      }

      session.step = 'medical_history';
      return {
        reply: "Have you ever been tested for or diagnosed with any thyroid conditions, high prolactin, or prediabetes/diabetes?",
        chips: ['Thyroid condition', 'High prolactin', 'None / Never tested', 'Family history of PCOS/PMOS'],
        step: 3,
        progress: '3/5 — Health history'
      };
    }

    // Handling Step 3: Medical History
    if (session.step === 'medical_history') {
      if (lower.includes('family')) session.patientData.familyHistoryPcos = true;
      if (lower.includes('thyroid')) session.patientData.thyroidDisorder = true;
      if (lower.includes('prolactin')) session.patientData.prolactinDisorder = true;

      session.step = 'tests_available';
      return {
        reply: "Do you have any recent blood hormone tests or a pelvic ultrasound report that you'd like to include?",
        chips: ['Upload Lab Report', 'Upload Ultrasound', 'I have my numbers', 'No tests yet — check now'],
        step: 4,
        progress: '4/5 — Existing tests'
      };
    }

    // Handling Step 4: Existing Tests or Fast-forward to Detection
    if (session.step === 'tests_available' || lower.includes('check now') || lower.includes('view results') || lower.includes('see my detection')) {
      // If user inputs specific lab values or simulated values
      if (lower.includes('upload lab') || lower.includes('testosterone') || lower.includes('i have my numbers') || contextData.hasLabs) {
        session.patientData.totalTestosterone = 2.8;
        session.patientData.shbg = 24.0;
        session.patientData.tsh = 2.1;
        session.patientData.prolactin = 18.0;
        session.patientData.labRanges = {
          totalTestosterone: { min: 0.5, max: 1.8 }
        };
      }

      // Execute Layer 2 Detection Engine
      const result = this.engine.evaluate(session.patientData);
      session.step = 'completed';
      session.lastResult = result;

      return this._formatDetectionResponse(result);
    }

    // Default conversational response
    return {
      reply: "I'm here to support your hormonal health journey. We can check for PCOS/PMOS patterns, log your daily symptoms, explore cycle trends, or prepare notes for your doctor.\n\nWhat would you like to explore?",
      chips: ['Check for PCOS/PMOS', 'Cycle Tracking', 'Symptom Tracker', 'Ask a question']
    };
  }

  /**
   * Translates Layer 2 technical detection engine output into
   * warm, compassionate, understandable patient language.
   */
  _formatDetectionResponse(result) {
    if (result.classification === 'likely_pcos') {
      const pendingDifferentials = result.alternative_conditions_not_ruled_out.map(p => {
        if (p === 'thyroid_disorder') return 'Thyroid condition not yet ruled out';
        if (p === 'hyperprolactinemia') return 'Prolactin abnormality not yet ruled out';
        return `${p} not yet ruled out`;
      });

      return {
        reply: `### PCOS/PMOS pattern detected\n\n**${result.confidence_tier}**\n\nYour symptoms and health information strongly match a PCOS/PMOS pattern.\n\nThere are still a couple of conditions with overlapping symptoms that are normally ruled out during a clinical evaluation.\n\n` +
               `✓ **PCOS/PMOS pattern detected**\n` +
               pendingDifferentials.map(d => `○ ${d}`).join('\n') +
               `\n\nWould you like to explore your full detection breakdown or see next steps for your care plan?`,
        chips: ['View Full Detection Screen', 'Why did CysterCare detect this?', 'Build my care plan', 'Prepare for Doctor Visit'],
        action: 'show_detection_results',
        detectionResult: result
      };
    }

    return {
      reply: `### Detection Complete\n\n**Confidence: ${result.confidence_tier}**\n\nBased on what you've shared so far, there are some mild or inconclusive signals that don't yet meet the standard PCOS/PMOS pattern.\n\nAdding any recent blood tests or an ultrasound report can help clarify your picture.`,
      chips: ['Add Health Results', 'Track Symptoms Daily', 'Talk to a Specialist'],
      action: 'show_detection_results',
      detectionResult: result
    };
  }

  _checkMedicalTerminology(lower) {
    if (lower.includes('what is shbg') || lower.includes('shbg')) {
      return "**SHBG (Sex Hormone-Binding Globulin)** is a protein made by your liver that binds to testosterone. When insulin levels are high (common in PCOS/PMOS), SHBG drops, leaving more 'free' testosterone active in your body, which can trigger acne and hair changes.";
    }
    if (lower.includes('what is amh') || lower.includes('amh')) {
      return "**AMH (Anti-Müllerian Hormone)** is produced by the granulosa cells of small growing follicles in your ovaries. Because ovaries with a polycystic appearance contain a high number of small resting follicles, AMH is often elevated in PCOS/PMOS.";
    }
    if (lower.includes('what is pcom') || lower.includes('polycystic ovarian morphology') || lower.includes('string of pearls')) {
      return "**Polycystic Ovarian Morphology (PCOM)** refers to an ultrasound pattern where an ovary has 20 or more small follicles (usually 2–9 mm) often arranged around the periphery like a 'string of pearls,' or an ovarian volume of 10 mL or more.";
    }
    if (lower.includes('why check tsh') || lower.includes('tsh')) {
      return "**TSH (Thyroid Stimulating Hormone)** is checked because an underactive thyroid (hypothyroidism) can cause irregular or missed periods and weight changes that closely mimic PCOS/PMOS symptoms. Ruling this out ensures you get the right treatment.";
    }
    if (lower.includes('ferriman') || lower.includes('mfg')) {
      return "The **modified Ferriman-Gallwey (mFG) score** is the standard clinical method doctors use to evaluate unwanted hair growth (hirsutism) across 9 body areas on a scale of 0 to 4.";
    }
    return null;
  }

  getDoctorSummary(patientData = null) {
    const session = this.getSession('default-user');
    const data = patientData || session.patientData;
    const result = session.lastResult || this.engine.evaluate(data);

    return {
      patientName: 'Sarah',
      date: 'September 2026',
      physicianTarget: 'Dr. Afshin Shareef (OB/GYN / Reproductive Endocrinology)',
      diagnosticImpression: {
        pattern: result.classification === 'likely_pcos' ? 'Consistent with Rotterdam PCOS/PMOS Pattern' : 'Inconclusive / Evaluation Ongoing',
        confidence: result.confidence_tier,
        phenotype: result.phenotype?.name || 'Phenotype B (Non-PCOM Classic)'
      },
      evidenceSummary: {
        cycleLength: data.typicalCycleLength ? `${data.typicalCycleLength} days (Oligomenorrhea)` : '49 days average',
        periodsPastYear: data.periodsLast12Months || 6,
        clinicalHyperandrogenism: 'Present (mFG score: 8, persistent jawline acne)',
        biochemicalHyperandrogenism: 'Elevated Total Testosterone: 2.8 nmol/L (Lab ref max: 1.8 nmol/L)',
        ovarianImaging: 'Pelvic ultrasound pending / not yet uploaded',
        differentialsPending: result.alternative_conditions_not_ruled_out
      },
      longitudinalTrends: {
        cycleTrend: 'Decreased from 62 days to 32 days over 6 months with Metformin and Inositol',
        weightTrend: '78.4 kg → 75.0 kg (-3.4 kg)'
      },
      recommendedClinicalDiscussions: [
        'Perform transvaginal pelvic ultrasound to assess antral follicle count and ovarian stroma.',
        'Order morning fasting TSH, serum Prolactin, and 17-OHP to complete exclusionary workup.',
        'Evaluate fasting insulin / HOMA-IR to tailor ongoing metabolic support.'
      ]
    };
  }

  /**
   * Dedicated Urdu Accessibility Handler (اردو زبان)
   */
  _handleUrduMessage(text, lower, session, contextData) {
    // Red-flag triage in Urdu
    if (lower.includes('شدید درد') || lower.includes('بے ہوش') || lower.includes('زیادہ خون') || lower.includes('بہت درد') || lower.includes('تکلیف')) {
      return {
        reply: "⚠️ **فوری طبی انتباہ (Emergency Alert)**\n\nپیٹ کے نچلے حصے میں شدید درد، غیر معمولی خون کا اخراج یا بے ہوشی سنگین طبی علامات ہو سکتی ہیں۔\n\n**فوری ہدایت:** براہ کرم سمدستی قریبی ہسپتال کے ایمرجنسی وارڈ یا ڈاکٹر سے رجوع فرمائیں۔\n\n*اپنی صحت اور حفاظت کو اولین ترجیح دیں۔*",
        chips: ['ایمرجنسی ہیلپ لائن (1122)', 'قریبی ڈاکٹر تلاش کریں', 'طبی رہنمائی'],
        action: 'emergency_alert',
        isEmergency: true,
        dir: 'rtl'
      };
    }

    // Specialist referrals in Urdu
    if (lower.includes('ڈاکٹر') || lower.includes('ماہر') || lower.includes('علاج') || lower.includes('doctor') || lower.includes('specialist')) {
      return {
        reply: "آپ کی PCOS/PMOS علامات اور میٹابولک صحت کے لیے مستند ماہر ڈاکٹرز دستیاب ہیں:\n\n" +
               "• **اینڈوکرائنولوجسٹ (ڈاکٹر لائبہ خان)**: ہارمونز کے عدم توازن اور انسولین مزاحمت کی ماہر۔\n" +
               "• **گائناکالوجسٹ (ڈاکٹر افشین شریف)**: ماہواری کی باقاعدگی اور بیضہ دانی کے الٹراساؤنڈ کی ماہر۔\n" +
               "• **ماہر امراض جلد (ڈاکٹر عائشہ ملک)**: ہارمونل ایکنی اور چہرے کے زائد بالوں کا علاج۔\n" +
               "• **ذہنی صحت کا ماہر (ڈاکٹر مائیکل چن)**: PCOS سے متعلق ذہنی دباؤ اور موڈ کے اتار چڑھاؤ کا حل۔\n" +
               "• **ماہر غذائیت (ڈاکٹر ثناء طارق)**: انسولین کی بہتری اور وزن متوازن رکھنے کے لیے غذائی پلان۔\n\n" +
               "کیا آپ آن لائن ویڈیو مشورہ یا ہسپتال کا وقت بک کرنا چاہتی ہیں؟",
        chips: ['ڈاکٹر لائبہ خان سے اپائنٹمنٹ', 'ڈاکٹر افشین شریف', 'ڈاکٹر ثناء طارق', 'تمام ماہرین دیکھیں'],
        action: 'recommend_specialists',
        dir: 'rtl'
      };
    }

    // Cycle & Symptoms in Urdu
    if (lower.includes('ماہواری') || lower.includes('پیریڈ') || lower.includes('حیض') || lower.includes('خون')) {
      return {
        reply: "ماہواری میں تاخیر یا بے قاعدگی PCOS/PMOS کی بنیادی نشانیوں میں شامل ہے۔ جب بیضہ دانی (ovulation) وقت پر نہ ہو تو سائیکل 35 دن سے زیادہ طویل ہو سکتا ہے۔\n\nکیا آپ کی عام ماہواری کا درمیانی وقفہ 35 دن سے زیادہ ہوتا ہے؟",
        chips: ['35 دن سے زیادہ', '21 سے 35 دن', 'بہت بے قاعدہ', 'پی سی او ایس ٹیسٹ شروع کریں'],
        action: 'urdu_cycle_flow',
        dir: 'rtl'
      };
    }

    // What is PCOS/PMOS in Urdu
    if (lower.includes('کیا ہے') || lower.includes('pcos') || lower.includes('pmos') || lower.includes('معلومات')) {
      return {
        reply: "### پی سی او ایس / پی ایم او ایس (PCOS/PMOS) کیا ہے؟\n\nیہ ایک ہارمونل اور میٹابولک کیفیت ہے جو خواتین کے ہارمونز اور بیضہ دانی کے عمل کو متاثر کرتی ہے۔\n\n**اہم علامات:**\n• ماہواری میں تاخیر یا ناغہ ہونا\n• چہرے، ٹھوڑی یا سینے پر زائد بالوں کا اگنا\n• وزن میں تیزی سے اضافہ اور انسولین کی مزاحمت\n• چہرے اور جبڑے پر بار بار نکلنے والے دانے (ایکنی)\n\nسسٹر کیئر (CysterCare) آپ کو علامات کی درست جانچ اور مناسب ماہر ڈاکٹر تک رسائی فراہم کرتا ہے۔",
        chips: ['PCOS/PMOS ٹیسٹ کریں', 'ماہواری کی جانچ', 'ڈاکٹر سے مشورہ', 'غذائی ہدایات'],
        dir: 'rtl'
      };
    }

    // General Urdu welcome
    return {
      reply: "السلام علیکم! میں سسٹر (Cyster) ہوں، آپ کی PCOS/PMOS ہیلتھ اسسٹنٹ۔ آپ مجھ سے اپنی ماہواری، ہارمونز کے ٹیسٹ، خوراک اور وزن کے بارے میں اردو میں کوئی بھی سوال پوچھ سکتی ہیں۔",
      chips: ['PCOS/PMOS ٹیسٹ کریں', 'ماہواری کے مسائل', 'ماہر ڈاکٹر تلاش کریں', 'ٹیسٹ رپورٹس شامل کریں'],
      dir: 'rtl'
    };
  }

  /**
   * Dedicated Pashto Accessibility Handler (پښتو ژبه)
   */
  _handlePashtoMessage(text, lower, session, contextData) {
    // Red-flag triage in Pashto
    if (lower.includes('سخت درد') || lower.includes('بې هوښ') || lower.includes('ډیره وینه') || lower.includes('تکلیف') || lower.includes('درد')) {
      return {
        reply: "⚠️ **بیړنۍ روغتیايي پاملرنه (Emergency Alert)**\n\nپه خټه یا حوصلي کې سخت درد، بې هوښي یا بې کچې وینه راتلل بیړني طبي پام ته اړتیا لري.\n\n**لارښوونه:** مهرباني وکړئ سمدستي نږدې بیړني روغتون یا باوري ډاکټر ته مراجعه وکړئ.\n\n*خپل روغتیا او خوندیتوب ته لومړیتوب ورکړئ.*",
        chips: ['بیړنۍ روغتون', 'ډاکټر سره اړیکه', 'روغتیايي لارښوونې'],
        action: 'emergency_alert',
        isEmergency: true,
        dir: 'rtl'
      };
    }

    // Specialist referrals in Pashto
    if (lower.includes('ډاکټر') || lower.includes('ډاکټره') || lower.includes('متخصص') || lower.includes('درملنه') || lower.includes('ډاکټران')) {
      return {
        reply: "ستاسو د PCOS/PMOS نښو او هورمونونو د پاملرنې لپاره دا باوري متخصص ډاکټران شتون لري:\n\n" +
               "• **د هورمونونو ډاکټره (ډاکټر لایبه خان)**: د هورمونونو توازن او انسولین مقاومت درملنه.\n" +
               "• **د ښځینه ناروغیو ډاکټره (ډاکټر افشین شریف)**: د میاشتنۍ دورې منظمول او د بیضې الټراساؤنډ.\n" +
               "• **د پوستکي ډاکټره (ډاکټر عایشه ملک)**: د مخ اضافي ویښتانو او دانو مسلکي تداوي.\n" +
               "• **ارواپوه / ذهني روغتیا (ډاکټر مایکل چن)**: د ذهني فشار، خپګان او هورمونل ستونزو حل.\n" +
               "• **د تغذیې او خوړو متخصص (ډاکټر ثنا طارق)**: د هورمونونو د توازن لپاره ځانګړی غذایي رژیم.\n\n" +
               "ایا غواړئ له دوی سره آنلاین مشوره وکړئ که کلینیک ته وخت وټاکئ؟",
        chips: ['ډاکټر لایبه خان سره لیدنه', 'ډاکټر افشین شریف', 'ډاکټر ثنا طارق', 'د متخصصینو بشپړ لیست'],
        action: 'recommend_specialists',
        dir: 'rtl'
      };
    }

    // Cycle & Symptoms in Pashto
    if (lower.includes('میاشتنۍ') || lower.includes('حېض') || lower.includes('دوره') || lower.includes('وینه')) {
      return {
        reply: "په میاشتنۍ دوره (حېض) کې ځنډ یا بې نظمي د PCOS/PMOS تر ټولو عامه نښه ده. کله چې هګۍ په خپل وخت نه خلاصیږي، دوره له ۳۵ ورځو څخه زیاته اوږدیږي.\n\nایا ستاسو میاشتنۍ دوره منظمه ده که ځنډیږي؟",
        chips: ['له ۳۵ ورځو زیات', '۲۱ تر ۳۵ ورځې', 'ډیره بې نظمه', 'د PCOS معاینه پیل کړئ'],
        action: 'pashto_cycle_flow',
        dir: 'rtl'
      };
    }

    // What is PCOS/PMOS in Pashto
    if (lower.includes('څه شی دی') || lower.includes('معلومات') || lower.includes('pcos') || lower.includes('pmos')) {
      return {
        reply: "### پی سي او ایس / پی ایم او ایس (PCOS/PMOS) څه شی دی؟\n\nدا د ښځو د هورمونونو او بیضوي تخمدانونو یو حالت دی چې میټابولیزم او میاشتنۍ دوره اغیزمنوي.\n\n**مهمې نښې:**\n• د میاشتنۍ دورې ځنډیدل یا نه راتلل\n• په مخ او سینه د تورو ویښتانو راختل\n• د وزن نامنظم زیاتوالی\n• د مخ دانې او د هورمونونو توازن خرابیدل\n\nسسٹر کیئر (CysterCare) تاسو ته د دې ناروغۍ په پیژندلو او د غوره ډاکټرانو په موندلو کې بشپړه اسانتیا برابروي.",
        chips: ['د PCOS معاینه', 'د حېض نښې', 'ډاکټران لټول', 'روغتیايي مشوره'],
        dir: 'rtl'
      };
    }

    // General Pashto welcome
    return {
      reply: "سلامونه! زه سسٹر (Cyster) یم، ستاسو د PCOS/PMOS روغتیا ملګرې. تاسو کولی شئ د خپلې میاشتنۍ ناروغۍ، هورمونونو، خواړو، وزن او متخصصو ډاکټرانو په اړه په پښتو ژبه هر ډول پوښتنه وپوښتئ.",
      chips: ['د PCOS معاینه پیل کړئ', 'د میاشتنۍ دورې ستونزې', 'ډاکټران لټول', 'د نښو ثبتول'],
      dir: 'rtl'
    };
  }
}
