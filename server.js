/**
 * CysterCare Health Platform - Application Server
 * Serves the mobile web application and exposes REST APIs for:
 * - Layer 1 Conversational AI (Cyster)
 * - Layer 2 PCOS Detection Engine
 * - Lab OCR & Ultrasound Extraction
 * - Longitudinal Health Intelligence
 * - Clinical Validation Benchmark Dashboard
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { PCOSdetectionEngine } from './engine/detectionEngine.js';
import { ConversationalAgent } from './engine/conversationalAgent.js';
import { ValidationBenchmark } from './engine/validationBenchmark.js';
import { LabUltrasoundExtractor } from './engine/labUltrasoundExtractor.js';
import { LongitudinalTracker } from './engine/longitudinalTracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let PORT = parseInt(process.env.PORT || '3050', 10);

const engine = new PCOSdetectionEngine();
const agent = new ConversationalAgent();
const benchmark = new ValidationBenchmark();
const labExtractor = new LabUltrasoundExtractor();
const tracker = new LongitudinalTracker();

// Pre-compute validation metrics on startup
const clinicalMetrics = benchmark.evaluateValidation();

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ----------------- API ENDPOINTS -----------------
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    try {
      // 1. Chat Endpoint (Layer 1 Conversational AI)
      if (pathname === '/api/chat' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const response = agent.processMessage(body.message, body.sessionId || 'user-1', body.contextData || {});
        res.writeHead(200);
        res.end(JSON.stringify(response));
        return;
      }

      // 2. Detection Engine (Layer 2 PCOS Diagnostic Inference)
      if (pathname === '/api/detect' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = engine.evaluate(body.patientData || body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // 3. Lab Report Extraction & OCR Simulator
      if (pathname === '/api/extract-lab' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = labExtractor.extractLabReport(body.fileText || 'LabCorp report');
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // 4. Ultrasound Extraction & CV Simulator
      if (pathname === '/api/extract-ultrasound' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = labExtractor.extractUltrasoundData(body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // 5. Clinical Validation Benchmark Metrics
      if (pathname === '/api/validation-metrics' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(clinicalMetrics));
        return;
      }

      // 6. Longitudinal Query
      if (pathname === '/api/longitudinal-query' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = tracker.queryLongitudinal(body.query || '');
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // 7. Doctor Visit Preparation Summary
      if (pathname === '/api/doctor-summary' && req.method === 'GET') {
        const summary = agent.getDoctorSummary();
        res.writeHead(200);
        res.end(JSON.stringify(summary));
        return;
      }

      // 8. Patient Telemetry
      if (pathname === '/api/patient-summary' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(tracker.getPatientSummary()));
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
      return;
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // ----------------- STATIC ASSETS -----------------
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA routing
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err2, fallbackContent) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallbackContent);
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function startServer(portToTry) {
  server.listen(portToTry, () => {
    console.log(`=======================================================`);
    console.log(`🌸 CysterCare AI Platform Server Running!`);
    console.log(`🚀 Access at: http://localhost:${portToTry}`);
    console.log(`📊 Validated Diagnostic Accuracy Benchmark: ${clinicalMetrics.diagnosticMetrics.accuracy}%`);
    console.log(`=======================================================`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use, trying port ${PORT + 1}...`);
    PORT++;
    startServer(PORT);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);
