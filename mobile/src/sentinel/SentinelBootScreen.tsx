/**
 * PFF Mobile — Sentinel Boot Screen
 * Boot screen with OEM certification watermark
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Display boot screen on app launch
 * - Show Sentinel Certified watermark for OEM devices
 * - Detect pre-install status
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SentinelCertifiedWatermark, hasCertification } from './SentinelCertifiedWatermark';

interface SentinelBootScreenProps {
  /** Callback when boot sequence completes */
  onComplete: () => void;
}

/**
 * Sentinel Boot Screen
 * Displays PFF logo and Sentinel Certified watermark (if applicable)
 */
export function SentinelBootScreen({ onComplete }: SentinelBootScreenProps) {
  const [showWatermark, setShowWatermark] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  
  useEffect(() => {
    checkCertification();
  }, []);
  
  async function checkCertification() {
    const certified = await hasCertification();
    setIsCertified(certified);
    
    if (certified) {
      // Show watermark for certified devices
      setShowWatermark(true);
    } else {
      // Skip watermark for non-certified devices
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }
  
  function handleWatermarkComplete() {
    onComplete();
  }
  
  return (
    <View style={styles.container}>
      {/* PFF Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>PFF</Text>
        <Text style={styles.tagline}>Presence Factor Fabric</Text>
        <ActivityIndicator size="small" color="#c9a227" style={styles.loader} />
      </View>
      
      {/* Sentinel Certified Watermark (OEM devices only) */}
      {isCertified && (
        <SentinelCertifiedWatermark
          visible={showWatermark}
          duration={2000}
          onComplete={handleWatermarkComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 72,
    fontWeight: '900',
    color: '#c9a227',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#6b6b70',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
});

