/**
 * PFF Mobile — Sentinel Certified Watermark
 * Boot screen watermark for OEM-partnered builds
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Display 'Sentinel Certified' watermark on boot screen
 * - Show certification level (Bronze, Silver, Gold, Platinum)
 * - Only visible on OEM-certified devices
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SentinelCertificationInfo {
  certificationId: string;
  certificationLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  watermarkText: string;
  manufacturer: string;
  deviceModel: string;
}

interface SentinelCertifiedWatermarkProps {
  /** Whether to show the watermark */
  visible: boolean;
  
  /** Duration to display watermark (ms) */
  duration?: number;
  
  /** Callback when watermark animation completes */
  onComplete?: () => void;
}

/**
 * Sentinel Certified Watermark Component
 * Displays certification badge on boot screen for OEM-certified devices
 */
export function SentinelCertifiedWatermark({
  visible,
  duration = 3000,
  onComplete,
}: SentinelCertifiedWatermarkProps) {
  const [certificationInfo, setCertificationInfo] = useState<SentinelCertificationInfo | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    loadCertificationInfo();
  }, []);
  
  useEffect(() => {
    if (visible && certificationInfo) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Hold for duration
        setTimeout(() => {
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            onComplete?.();
          });
        }, duration);
      });
    }
  }, [visible, certificationInfo, fadeAnim, duration, onComplete]);
  
  async function loadCertificationInfo() {
    try {
      const certInfoJson = await AsyncStorage.getItem('sentinel_certification_info');
      if (certInfoJson) {
        const certInfo = JSON.parse(certInfoJson) as SentinelCertificationInfo;
        setCertificationInfo(certInfo);
      }
    } catch (e) {
      console.error('Failed to load certification info:', e);
    }
  }
  
  if (!visible || !certificationInfo) {
    return null;
  }
  
  const levelColors = {
    BRONZE: '#CD7F32',
    SILVER: '#C0C0C0',
    GOLD: '#FFD700',
    PLATINUM: '#E5E4E2',
  };
  
  const levelEmojis = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
  };
  
  const color = levelColors[certificationInfo.certificationLevel];
  const emoji = levelEmojis[certificationInfo.certificationLevel];
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.badge}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.text, { color }]}>
          {certificationInfo.watermarkText}
        </Text>
        <Text style={styles.subtext}>
          {certificationInfo.manufacturer} {certificationInfo.deviceModel}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Store certification info in AsyncStorage
 * Called after successful Sentinel activation on OEM-certified device
 */
export async function storeCertificationInfo(
  certificationId: string,
  certificationLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
  watermarkText: string,
  manufacturer: string,
  deviceModel: string
): Promise<void> {
  const certInfo: SentinelCertificationInfo = {
    certificationId,
    certificationLevel,
    watermarkText,
    manufacturer,
    deviceModel,
  };
  
  await AsyncStorage.setItem('sentinel_certification_info', JSON.stringify(certInfo));
}

/**
 * Check if device has OEM certification
 */
export async function hasCertification(): Promise<boolean> {
  try {
    const certInfoJson = await AsyncStorage.getItem('sentinel_certification_info');
    return certInfoJson !== null;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
  },
  badge: {
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#6b6b70',
    textAlign: 'center',
  },
});

