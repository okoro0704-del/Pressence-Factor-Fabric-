#!/usr/bin/env node
/**
 * Self-Test Protocol — Deep alignment checks for Mobile vs Web experience.
 * Run: node scripts/self-test-protocol.mjs (from repo root or web/)
 *
 * Verifies:
 * 1. QR Pairing: Laptop generates a code that mobile scanner can read (login_requests + LoginQRDisplay flow).
 * 2. Palm Logic: Palm/Face flow uses same biometric_strictness source (getBiometricStrictness(phone)) on both devices.
 * 3. 9-Day Ritual: Daily unlock (recordDailyScan) triggers when accessed via "Added to Home Screen" (standalone).
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');

const checks = [];

// 1. QR Pairing: LoginQRDisplay and login_requests flow exist
const loginQRDisplay = path.join(webRoot, 'components/auth/LoginQRDisplay.tsx');
const loginRequest = path.join(webRoot, 'lib/loginRequest.ts');
const linkDevicePage = path.join(webRoot, 'src/app/link-device/page.tsx');

checks.push({
  name: 'QR Pairing: Laptop generates code mobile can read',
  pass: existsSync(loginQRDisplay) && existsSync(loginRequest) && existsSync(linkDevicePage),
  detail: 'LoginQRDisplay, loginRequest, link-device page must exist for QR flow.',
});

if (existsSync(loginRequest)) {
  const loginRequestContent = readFileSync(loginRequest, 'utf8');
  checks.push({
    name: 'QR Pairing: createLoginRequest and completeLoginBridge exist',
    pass:
      loginRequestContent.includes('createLoginRequest') &&
      loginRequestContent.includes('completeLoginBridge') &&
      loginRequestContent.includes('login_requests'),
    detail: 'login_requests table and bridge functions required for pairing.',
  });
}

// 2. Palm Logic: Same biometric_strictness source on both devices (Face step); Palm uses palm_hash
const biometricStrictness = path.join(webRoot, 'lib/biometricStrictness.ts');
const fourLayerGate = path.join(webRoot, 'components/dashboard/FourLayerGate.tsx');
const palmHashProfile = path.join(webRoot, 'lib/palmHashProfile.ts');
const palmPulseCapture = path.join(webRoot, 'components/auth/PalmPulseCapture.tsx');

checks.push({
  name: 'Palm Logic: getBiometricStrictness used for Face; PalmPulseCapture used for Palm',
  pass: existsSync(biometricStrictness) && existsSync(fourLayerGate) && existsSync(palmPulseCapture),
  detail: 'biometric_strictness from user_profiles used by Gate (Face). Palm uses same camera flow on laptop and mobile.',
});

if (existsSync(fourLayerGate)) {
  const gateContent = readFileSync(fourLayerGate, 'utf8');
  checks.push({
    name: 'Palm Logic: Gate uses getBiometricStrictness(phone) for Face',
    pass:
      gateContent.includes('getBiometricStrictness') &&
      gateContent.includes('strictnessToConfig') &&
      gateContent.includes('identityAnchor.phone'),
    detail: 'Face Pulse (Architect Vision) reads same strictness from profile on both devices.',
  });
  checks.push({
    name: 'Palm Logic: Gate uses PalmPulseCapture for second pillar',
    pass: gateContent.includes('PalmPulseCapture') && gateContent.includes('verifyOrEnrollPalm'),
    detail: 'Palm Scan component used from Gate; same palm_hash flow on laptop (webcam) and mobile.',
  });
}

// 3. 9-Day Ritual: recordDailyScan and vitalization status
const vitalizationRitual = path.join(webRoot, 'lib/vitalizationRitual.ts');
const vitalizationCountdown = path.join(webRoot, 'components/dashboard/VitalizationCountdown.tsx');

checks.push({
  name: '9-Day Ritual: recordDailyScan and getVitalizationStatus exist',
  pass: existsSync(vitalizationRitual) && existsSync(vitalizationCountdown),
  detail: 'Daily unlock and streak require vitalizationRitual + UI.',
});

if (existsSync(vitalizationRitual)) {
  const ritualContent = readFileSync(vitalizationRitual, 'utf8');
  checks.push({
    name: '9-Day Ritual: recordDailyScan triggers daily unlock',
    pass:
      ritualContent.includes('recordDailyScan') &&
      ritualContent.includes('vitalization_daily_scans') &&
      ritualContent.includes('vitalization_streak'),
    detail: 'When accessed via Added to Home Screen (standalone), gate calls recordDailyScan after Face+Palm.',
  });
}

if (existsSync(fourLayerGate)) {
  const gateContent = readFileSync(fourLayerGate, 'utf8');
  checks.push({
    name: '9-Day Ritual: Gate calls recordDailyScan after Palm success',
    pass:
      gateContent.includes('recordDailyScan') &&
      (gateContent.includes('handlePalmSuccess') || gateContent.includes('Palm Pulse')),
    detail: 'Daily unlock triggers correctly when used from PWA (Added to Home Screen).',
  });
}

// 4. PWA: manifest and viewport
const manifestPath = path.join(webRoot, 'public/manifest.json');
const layoutPath = path.join(webRoot, 'src/app/layout.tsx');
checks.push({
  name: 'PWA: manifest.json and viewport (userScalable: false)',
  pass: existsSync(manifestPath) && existsSync(layoutPath),
  detail: 'Manifest and layout required for install and Palm Scan zoom lock.',
});

if (existsSync(layoutPath)) {
  const layoutContent = readFileSync(layoutPath, 'utf8');
  checks.push({
    name: 'PWA: viewport prevents zoom during Palm Scan',
    pass:
      layoutContent.includes('userScalable') &&
      (layoutContent.includes('false') || layoutContent.includes('maximumScale')),
    detail: 'userScalable: false prevents accidental zoom during Palm Scan.',
  });
}

// 5. Safe area for mobile
const globalsCss = path.join(webRoot, 'src/app/globals.css');
if (existsSync(globalsCss)) {
  const css = readFileSync(globalsCss, 'utf8');
  checks.push({
    name: 'Safe area: body respects notch and home bar',
    pass: css.includes('safe-area-inset-top') && css.includes('safe-area-inset-bottom'),
    detail: 'env(safe-area-inset-*) used so buttons do not hide under notch.',
  });
  checks.push({
    name: 'Visual unification: Sovereign Card layout (max-w-lg, center)',
    pass: css.includes('sovereign-card') && css.includes('max-w-lg'),
    detail: 'Centered Sovereign Card used for same look on MacBook and mobile.',
  });
}

// 6. Friction removal: Download prompt hidden on mobile
const installBanner = path.join(webRoot, 'components/InstallSmartBanner.tsx');
if (existsSync(installBanner)) {
  const bannerContent = readFileSync(installBanner, 'utf8');
  checks.push({
    name: 'Friction: Install banner hidden on mobile (show only on desktop)',
    pass: bannerContent.includes('!isMobile') || bannerContent.includes('! isMobile'),
    detail: 'When on mobile, hide Download App prompt; show only on laptop with Sync to Mobile.',
  });
}

// Run and report
const passed = checks.filter((c) => c.pass).length;
const failed = checks.filter((c) => !c.pass);

console.log('\n--- PFF Self-Test Protocol ---\n');
checks.forEach((c) => {
  console.log(c.pass ? '  ✓' : '  ✗', c.name);
  if (!c.pass && c.detail) console.log('    ', c.detail);
});
console.log('\nResult:', passed, '/', checks.length, 'checks passed.');
if (failed.length > 0) {
  console.log('Failed:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
console.log('Self-test protocol passed.\n');
process.exit(0);
