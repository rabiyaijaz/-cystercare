/**
 * CysterCare Automated System Verification Suite
 */

import { PCOSdetectionEngine } from '../engine/detectionEngine.js';
import { ConversationalAgent } from '../engine/conversationalAgent.js';
import { ValidationBenchmark } from '../engine/validationBenchmark.js';
import { LabUltrasoundExtractor } from '../engine/labUltrasoundExtractor.js';
import { LongitudinalTracker } from '../engine/longitudinalTracker.js';

async function runTests() {
  console.log('--- STARTING CYSTERCARE SYSTEM VERIFICATION ---');

  // Test 1: Layer 2 Detection Engine Output Format
  console.log('\n[1/5] Testing Layer 2 PCOS Detection Engine...');
  const engine = new PCOSdetectionEngine();
  const testPatient = {
    typicalCycleLength: 49,
    periodsLast12Months: 6,
    facialHair: true,
    chinHair: 'significant',
    persistentAcne: true,
    mfgScore: 8,
    totalTestosterone: 2.8, // nmol/L
    shbg: 24.0,             // nmol/L -> FAI = 11.67 (Elevated)
    labRanges: {
      totalTestosterone: { min: 0.5, max: 1.8 }
    }
  };

  const result = engine.evaluate(testPatient);
  console.log('Classification:', result.classification);
  console.log('Model Confidence:', result.model_confidence);
  console.log('Confidence Tier:', result.confidence_tier);
  console.log('Criteria:', JSON.stringify(result.criteria));
  console.log('Alternative Conditions Not Ruled Out:', result.alternative_conditions_not_ruled_out);

  if (result.classification !== 'likely_pcos') throw new Error('Expected likely_pcos classification');
  if (result.model_confidence < 0.90) throw new Error('Expected model_confidence >= 0.90');
  if (!result.alternative_conditions_not_ruled_out.includes('thyroid_disorder')) throw new Error('Expected thyroid disorder in pending differentials');
  console.log('✓ Layer 2 Detection Engine passed');

  // Test 2: Layer 1 Conversational Agent Delegation & Human Language
  console.log('\n[2/5] Testing Layer 1 Conversational AI Agent...');
  const agent = new ConversationalAgent();
  const step1 = agent.processMessage('Let\'s check for PCOS');
  console.log('Bot Response Step 1:', step1.reply.substring(0, 80) + '...');
  console.log('Chips:', step1.chips);

  const step2 = agent.processMessage('36–60 days');
  console.log('Bot Response Step 2:', step2.reply.substring(0, 80) + '...');

  const termResp = agent.processMessage('What is SHBG?');
  console.log('Terminology Explanation:', termResp.reply.substring(0, 80) + '...');
  if (!termResp.reply.includes('Sex Hormone-Binding Globulin')) throw new Error('Failed terminology explanation');
  console.log('✓ Layer 1 Conversational Agent passed');

  // Test 3: Safety Triage Red Flag Escalation
  console.log('\n[3/5] Testing Acute Safety Triage Interception...');
  const emergencyResp = agent.processMessage('I have intense severe pelvic pain and fainting');
  console.log('Safety Alert Triggered:', emergencyResp.isEmergency);
  if (!emergencyResp.isEmergency) throw new Error('Emergency was not triggered for severe pelvic pain and fainting');
  console.log('✓ Safety Red Flag Interception passed');

  // Test 4: Longitudinal Intelligence
  console.log('\n[4/5] Testing Longitudinal Intelligence...');
  const tracker = new LongitudinalTracker();
  const cycleQuery = tracker.queryLongitudinal('Are my cycles getting better?');
  console.log('Cycle Query Headline:', cycleQuery.headline);
  console.log('Cycle Details:', cycleQuery.details);
  if (!cycleQuery.headline.includes('Yes, your cycles are significantly more regular')) {
    throw new Error('Longitudinal cycle query failed');
  }
  console.log('✓ Longitudinal Intelligence passed');

  // Test 5: Clinical Validation Benchmark (Target >=95%)
  console.log('\n[5/5] Testing Validation Benchmark Suite (N=1,000 cases)...');
  const benchmark = new ValidationBenchmark();
  const metrics = benchmark.evaluateValidation();
  console.log('Accuracy:', metrics.diagnosticMetrics.accuracy + '%');
  console.log('Sensitivity:', metrics.diagnosticMetrics.sensitivity + '%');
  console.log('Specificity:', metrics.diagnosticMetrics.specificity + '%');
  console.log('ROC-AUC:', metrics.diagnosticMetrics.rocAuc);
  console.log('F1 Score:', metrics.diagnosticMetrics.f1Score);
  console.log('South Asian Accuracy:', metrics.subgroups.southAsian.accuracy + '%');

  if (metrics.diagnosticMetrics.accuracy < 95.0) {
    throw new Error('Accuracy target < 95%');
  }
  console.log('✓ Validation Benchmark passed (>=95% target achieved)');

  console.log('\nALL 5 SYSTEM TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
