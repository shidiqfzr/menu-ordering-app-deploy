import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT_DIR = process.cwd();
const REPORTS_DIR = path.join(ROOT_DIR, 'tests', 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('====================================================');
console.log('🚀 BUJANG CAFE - UNIFIED AUTOMATED TEST RUNNER');
console.log('====================================================\n');

const startTime = Date.now();
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// 1. Run Unit Tests
console.log('▶ [1/3] Running Unit Tests (Jest)...');
spawnSync(npmCmd, ['run', 'test:unit'], {
  stdio: 'inherit',
  cwd: ROOT_DIR,
  shell: true
});

// 2. Run API Integration Tests
console.log('\n▶ [2/3] Running API Integration Tests (Jest + Supertest + In-Memory MongoDB)...');
spawnSync(npmCmd, ['run', 'test:api'], {
  stdio: 'inherit',
  cwd: ROOT_DIR,
  shell: true
});

// 3. Run E2E Tests
console.log('\n▶ [3/3] Running End-to-End Tests (Playwright + Chrome)...');
spawnSync(npxCmd, ['playwright', 'test'], {
  stdio: 'inherit',
  cwd: ROOT_DIR,
  shell: true
});

const totalDurationMs = Date.now() - startTime;
const durationSec = (totalDurationMs / 1000).toFixed(1);

console.log('\n====================================================');
console.log('📊 COMPILING UNIFIED HTML TEST REPORT...');
console.log('====================================================');

// Parse Unit Results
let unitData = { numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, testResults: [] };
try {
  const raw = fs.readFileSync(path.join(REPORTS_DIR, 'unit-results.json'), 'utf-8');
  unitData = JSON.parse(raw);
} catch (e) {
  console.warn('Could not read unit-results.json:', e.message);
}

// Parse API Results
let apiData = { numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, testResults: [] };
try {
  const raw = fs.readFileSync(path.join(REPORTS_DIR, 'api-results.json'), 'utf-8');
  apiData = JSON.parse(raw);
} catch (e) {
  console.warn('Could not read api-results.json:', e.message);
}

// Parse Playwright E2E Results
let e2eTests = [];
let e2ePassed = 0;
let e2eFailed = 0;
try {
  const raw = fs.readFileSync(path.join(REPORTS_DIR, 'e2e-results.json'), 'utf-8');
  const parsed = JSON.parse(raw);
  
  const extractSuites = (suites) => {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          const result = test.results?.[0];
          const status = result?.status === 'passed' ? 'passed' : 'failed';
          if (status === 'passed') e2ePassed++;
          else e2eFailed++;
          
          e2eTests.push({
            title: spec.title,
            suite: suite.title || path.basename(suite.file || ''),
            status,
            duration: result?.duration || 0,
            error: result?.error?.message || null
          });
        }
      }
      if (suite.suites) extractSuites(suite.suites);
    }
  };
  extractSuites(parsed.suites);
} catch (e) {
  console.warn('Could not read e2e-results.json:', e.message);
}

// Collect normalized test cases
const allTests = [];

// Add Unit Tests
(unitData.testResults || []).forEach(suite => {
  const filename = path.basename(suite.name);
  (suite.assertionResults || []).forEach(test => {
    allTests.push({
      level: 'Unit Test',
      suite: filename,
      title: test.title,
      status: test.status === 'passed' ? 'PASSED' : 'FAILED',
      duration: test.duration || 1,
      failureMessages: test.failureMessages || []
    });
  });
});

// Add API Tests
(apiData.testResults || []).forEach(suite => {
  const filename = path.basename(suite.name);
  (suite.assertionResults || []).forEach(test => {
    allTests.push({
      level: 'API Test',
      suite: filename,
      title: test.title,
      status: test.status === 'passed' ? 'PASSED' : 'FAILED',
      duration: test.duration || 1,
      failureMessages: test.failureMessages || []
    });
  });
});

// Add E2E Tests
e2eTests.forEach(test => {
  allTests.push({
    level: 'E2E Test',
    suite: test.suite,
    title: test.title,
    status: test.status === 'passed' ? 'PASSED' : 'FAILED',
    duration: test.duration || 1,
    failureMessages: test.error ? [test.error] : []
  });
});

const totalCount = allTests.length;
const passedCount = allTests.filter(t => t.status === 'PASSED').length;
const failedCount = allTests.filter(t => t.status === 'FAILED').length;
const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : 0;

const unitTotal = (unitData.testResults || []).reduce((acc, s) => acc + (s.assertionResults?.length || 0), 0);
const unitPass = (unitData.testResults || []).reduce((acc, s) => acc + (s.assertionResults?.filter(a => a.status === 'passed').length || 0), 0);
const apiTotal = (apiData.testResults || []).reduce((acc, s) => acc + (s.assertionResults?.length || 0), 0);
const apiPass = (apiData.testResults || []).reduce((acc, s) => acc + (s.assertionResults?.filter(a => a.status === 'passed').length || 0), 0);
const e2eTotal = e2eTests.length;

// Generate Modern Interactive HTML Report
const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bujang Cafe - Unified Automated Test Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f17;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --accent: #ff5722;
      --accent-subtle: rgba(255, 87, 34, 0.12);
      --success: #10b981;
      --success-subtle: rgba(16, 185, 129, 0.12);
      --danger: #ef4444;
      --danger-subtle: rgba(239, 68, 68, 0.12);
      --blue: #3b82f6;
      --blue-subtle: rgba(59, 130, 246, 0.12);
      --purple: #8b5cf6;
      --purple-subtle: rgba(139, 92, 246, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text-main);
      padding: 32px 24px;
      line-height: 1.5;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-title { display: flex; align-items: center; gap: 14px; }
    .brand-logo {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #ff5722, #f97316);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; color: #fff;
    }
    h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { font-size: 13px; color: var(--text-muted); }
    .badge-status {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 999px;
      font-size: 13px; font-weight: 700;
      background: ${failedCount === 0 ? 'var(--success-subtle)' : 'var(--danger-subtle)'};
      color: ${failedCount === 0 ? 'var(--success)' : 'var(--danger)'};
      border: 1px solid ${failedCount === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
    }
    .badge-status::before {
      content: ''; width: 8px; height: 8px; border-radius: 50%;
      background: ${failedCount === 0 ? 'var(--success)' : 'var(--danger)'};
      box-shadow: 0 0 10px ${failedCount === 0 ? 'var(--success)' : 'var(--danger)'};
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .stat-card.unit { border-top: 3px solid var(--blue); }
    .stat-card.api { border-top: 3px solid var(--purple); }
    .stat-card.e2e { border-top: 3px solid var(--accent); }
    .stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
    .stat-val { font-size: 32px; font-weight: 800; margin: 8px 0 4px; }
    .stat-sub { font-size: 12px; color: var(--text-muted); }
    
    /* Comparison Banner */
    .compare-card {
      background: linear-gradient(135deg, rgba(31, 41, 55, 0.7), rgba(17, 24, 39, 0.9));
      border: 1px solid #374151;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .compare-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: #fbbf24; }
    .compare-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .compare-col {
      background: rgba(15, 23, 42, 0.6);
      padding: 16px; border-radius: 12px; border: 1px solid #1e293b;
    }
    .compare-col h4 { font-size: 14px; margin-bottom: 8px; color: var(--text-main); }
    .compare-col p { font-size: 12.5px; color: var(--text-muted); }
    .compare-col ul { margin-left: 18px; margin-top: 6px; font-size: 12px; color: #cbd5e1; }

    /* Filters & Search */
    .controls-bar {
      display: flex; justify-content: space-between; align-items: center;
      gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .tab-btn {
      padding: 8px 16px; border-radius: 10px;
      border: 1px solid var(--card-border);
      background: var(--card-bg); color: var(--text-muted);
      cursor: pointer; font-size: 13px; font-weight: 600;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: var(--text-main); border-color: #374151; }
    .tab-btn.active {
      background: var(--accent); color: #fff; border-color: var(--accent);
    }
    .search-box {
      position: relative; min-width: 260px;
    }
    .search-input {
      width: 100%; padding: 8px 16px 8px 36px;
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 10px; color: var(--text-main); font-size: 13px;
      outline: none;
    }
    .search-input:focus { border-color: var(--accent); }
    .search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); font-size: 14px; pointer-events: none;
    }

    /* Test Table */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      background: #141d2e; padding: 12px 16px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      color: var(--text-muted); letter-spacing: 0.5px;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 14px 16px; border-bottom: 1px solid var(--card-border);
      font-size: 13px; vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }
    .badge-level {
      display: inline-block; padding: 4px 10px; border-radius: 6px;
      font-size: 11px; font-weight: 700;
    }
    .badge-level.unit { background: var(--blue-subtle); color: var(--blue); }
    .badge-level.api { background: var(--purple-subtle); color: var(--purple); }
    .badge-level.e2e { background: var(--accent-subtle); color: var(--accent); }
    .badge-pill-pass {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 999px;
      background: var(--success-subtle); color: var(--success);
      font-size: 11.5px; font-weight: 700;
    }
    .badge-pill-fail {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 999px;
      background: var(--danger-subtle); color: var(--danger);
      font-size: 11.5px; font-weight: 700;
    }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8; }
    .duration { color: var(--text-muted); font-size: 12px; }
    footer {
      margin-top: 36px; text-align: center;
      font-size: 12px; color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand-title">
        <div class="brand-logo">B</div>
        <div>
          <h1>Bujang Cafe POS - Automated Test Report</h1>
          <p class="subtitle">Laporan Hasil Pengujian Otomatis Sistem POS & Restoran • Dihasilkan pada ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>
      <div>
        <span class="badge-status">${failedCount === 0 ? 'ALL TESTS PASSED (100%)' : `${failedCount} TESTS FAILED`}</span>
      </div>
    </header>

    <!-- Top KPI Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Test Cases</div>
        <div class="stat-val">${totalCount}</div>
        <div class="stat-sub">Skenario terverifikasi otomatis</div>
      </div>
      <div class="stat-card unit">
        <div class="stat-label">Unit Tests (Jest)</div>
        <div class="stat-val" style="color: var(--blue);">${unitPass}/${unitTotal}</div>
        <div class="stat-sub">Diskon, Keranjang, Invoice, Auth Logic</div>
      </div>
      <div class="stat-card api">
        <div class="stat-label">API Tests (Supertest)</div>
        <div class="stat-val" style="color: var(--purple);">${apiPass}/${apiTotal}</div>
        <div class="stat-sub">Auth, Order Flow, RBAC, In-Memory DB</div>
      </div>
      <div class="stat-card e2e">
        <div class="stat-label">E2E Tests (Playwright)</div>
        <div class="stat-val" style="color: var(--accent);">${e2ePassed}/${e2eTotal}</div>
        <div class="stat-sub">UI Customer & Admin POS Flow</div>
      </div>
    </div>

    <!-- Comparison Section (Manual Black-Box vs Automated) -->
    <div class="compare-card">
      <div class="compare-title">
        <span>⚖️ Matriks Perbandingan: Pengujian Manual (Black-Box) vs Pengujian Otomatis (Automated)</span>
      </div>
      <div class="compare-grid">
        <div class="compare-col">
          <h4>📋 Pengujian Manual (Black-Box)</h4>
          <p>Telah didokumentasikan lengkap dalam repositori:</p>
          <ul>
            <li><strong>BLACK_BOX_TESTING_CUSTOMER.md</strong>: 54 Test Cases</li>
            <li><strong>BLACK_BOX_TESTING_ADMIN.md</strong>: 84 Test Cases</li>
            <li><strong>Metode</strong>: Equivalence Partitioning & Boundary Value Analysis</li>
            <li><strong>Karakteristik</strong>: Menguji persepsi visual, transisi toast, tactile feel, dan verifikasi fisik struk thermal.</li>
          </ul>
        </div>
        <div class="compare-col">
          <h4>⚡ Pengujian Otomatis (Automated Suite)</h4>
          <p>Dijalankan serentak dengan 1 perintah <code style="color:#f97316;">npm run test:all</code>:</p>
          <ul>
            <li><strong>Total Eksekusi</strong>: ${totalCount} Skenario Uji Otomatis</li>
            <li><strong>Tingkatan</strong>: Unit (Formula kalkulasi), API (Integrasi database), E2E (Simulasi browser)</li>
            <li><strong>Waktu Eksekusi</strong>: ${durationSec} detik secara konsisten</li>
            <li><strong>Database</strong>: MongoDB In-Memory Server terisolasi (Aman dari modifikasi data riil)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="tabs">
        <button class="tab-btn active" onclick="filterLevel('all', this)">Semua (${totalCount})</button>
        <button class="tab-btn" onclick="filterLevel('Unit Test', this)">Unit Tests (${unitTotal})</button>
        <button class="tab-btn" onclick="filterLevel('API Test', this)">API Tests (${apiTotal})</button>
        <button class="tab-btn" onclick="filterLevel('E2E Test', this)">E2E Tests (${e2eTotal})</button>
      </div>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" class="search-input" placeholder="Cari skenario pengujian..." oninput="handleSearch()">
      </div>
    </div>

    <!-- Test Results Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 120px;">Tingkatan</th>
            <th style="width: 220px;">Modul / File</th>
            <th>Deskripsi Skenario Pengujian</th>
            <th style="width: 110px;">Durasi</th>
            <th style="width: 100px;">Status</th>
          </tr>
        </thead>
        <tbody id="testTableBody">
          ${allTests.map(t => {
            const levelClass = t.level === 'Unit Test' ? 'unit' : t.level === 'API Test' ? 'api' : 'e2e';
            return `
            <tr data-level="${t.level}" data-title="${t.title.toLowerCase()}" data-suite="${t.suite.toLowerCase()}">
              <td><span class="badge-level ${levelClass}">${t.level}</span></td>
              <td class="mono">${t.suite}</td>
              <td><strong>${t.title}</strong></td>
              <td class="duration">${t.duration} ms</td>
              <td>
                <span class="${t.status === 'PASSED' ? 'badge-pill-pass' : 'badge-pill-fail'}">
                  ${t.status === 'PASSED' ? '✔ PASS' : '✖ FAIL'}
                </span>
              </td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <footer>
      <p>Bujang Cafe POS & Restaurant Management System • Automated Test Suite & Manual Black-Box Deliverable</p>
    </footer>
  </div>

  <script>
    let activeLevel = 'all';

    function filterLevel(level, btn) {
      activeLevel = level;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    }

    function handleSearch() {
      applyFilters();
    }

    function applyFilters() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const rows = document.querySelectorAll('#testTableBody tr');

      rows.forEach(row => {
        const level = row.getAttribute('data-level');
        const title = row.getAttribute('data-title');
        const suite = row.getAttribute('data-suite');

        const matchesLevel = (activeLevel === 'all' || level === activeLevel);
        const matchesQuery = (!q || title.includes(q) || suite.includes(q));

        row.style.display = (matchesLevel && matchesQuery) ? '' : 'none';
      });
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(REPORTS_DIR, 'index.html'), htmlContent, 'utf-8');
console.log(`\n✅ Unified HTML Report generated successfully!`);
console.log(`📄 Location: ${path.join(REPORTS_DIR, 'index.html')}`);
console.log(`Total Duration: ${durationSec}s\n`);

process.exit(failedCount > 0 ? 1 : 0);
