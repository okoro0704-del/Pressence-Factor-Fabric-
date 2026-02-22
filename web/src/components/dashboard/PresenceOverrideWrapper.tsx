'use client';

import { useState, useEffect } from 'react';
import { PresenceOverrideModal } from './PresenceOverrideModal';
import type { GlobalIdentity } from '@/lib/phoneIdentity';

interface PresenceOverrideWrapperProps {
  children: React.ReactNode | ((args: { identity: GlobalIdentity; isPresenceOverride: boolean }) => React.ReactNode);
  deviceOwnerIdentity: GlobalIdentity; // The child's account (device owner)
}

/**
 * PRESENCE OVERRIDE WRAPPER
 * Manages temporary presence-based session override
 * Allows elderly parent to authenticate on child's phone
 * Session automatically reverts to device owner after transaction
 */
export function PresenceOverrideWrapper({
  children,
  deviceOwnerIdentity,
}: PresenceOverrideWrapperProps) {
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [activeIdentity, setActiveIdentity] = useState<GlobalIdentity>(deviceOwnerIdentity);
  const [isPresenceOverride, setIsPresenceOverride] = useState(false);

  // Listen for presence override trigger (can be triggered from anywhere)
  useEffect(() => {
    const handlePresenceOverrideTrigger = () => {
      setShowPresenceModal(true);
    };

    window.addEventListener('trigger-presence-override', handlePresenceOverrideTrigger);
    return () => {
      window.removeEventListener('trigger-presence-override', handlePresenceOverrideTrigger);
    };
  }, []);

  const handlePresenceVerified = (sovereignIdentity: GlobalIdentity) => {
    // Switch to sovereign's identity (parent)
    setActiveIdentity(sovereignIdentity);
    setIsPresenceOverride(true);
    setShowPresenceModal(false);

    // Show success banner
    showSovereignBanner(sovereignIdentity);
  };

  const handleRevertToDeviceOwner = () => {
    // Revert to device owner's identity (child)
    setActiveIdentity(deviceOwnerIdentity);
    setIsPresenceOverride(false);

    // Clear any temporary data
    sessionStorage.removeItem('presence_override_identity');
  };

  const showSovereignBanner = (identity: GlobalIdentity) => {
    // Create and show gold banner
    const banner = document.createElement('div');
    banner.className = 'fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#c9a227] to-[#e8c547] p-6 text-center shadow-2xl animate-pulse';
    banner.innerHTML = `
      <h2 class="text-3xl font-bold text-black uppercase tracking-wider">
        🟡 SOVEREIGN IDENTITY VERIFIED: ${identity.full_name}
      </h2>
      <p class="text-xl text-black/80 mt-2">ACCESS GRANTED</p>
    `;
    document.body.appendChild(banner);

    // Remove banner after 5 seconds
    setTimeout(() => {
      banner.remove();
    }, 5000);
  };

  return (
    <>
      {/* Presence Override Banner (if active) */}
      {isPresenceOverride && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-[#c9a227] to-[#e8c547] px-6 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🟡</span>
            <div>
              <p className="text-lg font-bold text-black">
                SOVEREIGN MODE: {activeIdentity.full_name}
              </p>
              <p className="text-sm text-black/70">
                Temporary access on {deviceOwnerIdentity.full_name}'s device
              </p>
            </div>
          </div>
          <button
            onClick={handleRevertToDeviceOwner}
            className="px-6 py-2 bg-black/20 hover:bg-black/30 text-black font-bold rounded-lg transition-colors"
          >
            END SESSION
          </button>
        </div>
      )}

      {/* Main Content with Active Identity */}
      <div className={isPresenceOverride ? 'mt-20' : ''}>
        {/* Clone children and inject activeIdentity */}
        {typeof children === 'function'
          ? children({ identity: activeIdentity, isPresenceOverride })
          : children}
      </div>

      {/* Presence Override Modal */}
      <PresenceOverrideModal
        isOpen={showPresenceModal}
        onClose={() => setShowPresenceModal(false)}
        onPresenceVerified={handlePresenceVerified}
        currentDeviceOwner={deviceOwnerIdentity.phone_number}
      />

      {/* Floating "Authenticate Dependent" Button */}
      {!isPresenceOverride && (
        <button
          onClick={() => setShowPresenceModal(true)}
          className="fixed bottom-6 right-6 z-30 px-6 py-4 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold text-lg rounded-full shadow-2xl shadow-[#e8c547]/30 transition-all duration-300 hover:scale-105"
        >
          🔐 Authenticate Dependent Presence
        </button>
      )}
    </>
  );
}

/**
 * Trigger presence override from anywhere in the app
 */
export function triggerPresenceOverride() {
  window.dispatchEvent(new Event('trigger-presence-override'));
}

