/**
 * PFF — Expo / EAS configuration.
 * Born in Lagos. Built for the World.
 *
 * iOS: deploymentTarget 16.0+ (2026 biometric/age-verification readiness).
 * Android: compileSdk 35, targetSdk 35, SHA-256 signing via EAS credentials.
 */

const pkg = require('./package.json');

module.exports = {
  name: 'PFF PROTOCOL',
  slug: 'pff-protocol',
  version: pkg.version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'pff',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0d0d0f',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pff.mobile',
    deploymentTarget: '16.0',
    buildNumber: process.env.IOS_BUILD_NUMBER || '1',
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSFaceIDUsageDescription: 'PFF uses Face ID to verify your presence and sign Presence Proofs.',
      NSCameraUsageDescription: 'PFF uses the camera for liveness detection during Presence Verification.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0d0d0f',
    },
    package: 'com.pff.mobile',
    compileSdkVersion: 35,
    targetSdkVersion: 35,
    versionCode: parseInt(process.env.ANDROID_VERSION_CODE || '1', 10),
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  plugins: [],
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID || '48e550ab-4a24-4ca3-98ae-4165c19aeb77',
    },
  },
};
