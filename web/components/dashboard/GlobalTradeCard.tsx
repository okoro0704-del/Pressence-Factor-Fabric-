'use client';

import { useState, useCallback, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import {
  getConnectedAddress,
  ensureRSK,
  getDLLRBalance,
  isMasterHandshakeComplete,
} from '@/lib/sovryn';
import { sendDLLR, isValidAddress } from '@/lib/sovryn/sendDLLR';
import { checkPresenceVerified } from '@/lib/withPresenceCheck';
import { PresenceOverrideModal } from './PresenceOverrideModal';
import type { GlobalIdentity } from '@/lib/phoneIdentity';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

// Exchange rates (DLLR pegged to $1.00)
const DLLR_USD_RATE = 1.0;
const USD_NGN_RATE = 1400;
const DLLR_NGN_RATE = DLLR_USD_RATE * USD_NGN_RATE;

export function GlobalTradeCard() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);
  
  // Send functionality
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  
  // Presence modal
  const [showPresenceModal, setShowPresenceModal] = useState(false);

  // Check presence verification status
  useEffect(() => {
    const checkPresence = async () => {
      const result = await checkPresenceVerified();
      setIsPresenceVerified(result.verified);
    };
    checkPresence();

    // Recheck every 30 seconds
    const interval = setInterval(checkPresence, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (address && balance !== null) {
      const interval = setInterval(() => {
        fetchBalance(address);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [address, balance]);

  const fetchBalance = async (addr: string) => {
    try {
      const { formatted, raw } = await getDLLRBalance(addr);
      setBalance(formatted);
      setBalanceRaw(raw);
    } catch (e) {
      console.error('[GlobalTradeCard] Balance fetch error:', e);
    }
  };

  const connectAndFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const addr = await getConnectedAddress();
      if (!addr) {
        setError('No wallet connected.');
        setLoading(false);
        return;
      }
      const ok = await ensureRSK();
      if (!ok) {
        setError('Could not switch to Rootstock (RSK). Add the network in your wallet.');
        setLoading(false);
        return;
      }
      setAddress(addr);
      if (!isMasterHandshakeComplete(addr)) {
        setBalance(null);
        setLoading(false);
        return;
      }
      await fetchBalance(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch DLLR balance.');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendClick = () => {
    if (!isPresenceVerified) {
      setShowPresenceModal(true);
    } else {
      setShowSendModal(true);
    }
  };

  const handlePresenceVerified = (identity: GlobalIdentity) => {
    setShowPresenceModal(false);
    setIsPresenceVerified(true);
    // Open send modal after verification
    setTimeout(() => setShowSendModal(true), 500);
  };

  const handleSendSubmit = async () => {
    if (!recipientAddress || !sendAmount) {
      setSendError('Please enter recipient address and amount');
      return;
    }

    if (!isValidAddress(recipientAddress)) {
      setSendError('Invalid recipient address format');
      return;
    }

    const amountNum = parseFloat(sendAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSendError('Invalid amount');
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    const result = await sendDLLR({
      toAddress: recipientAddress,
      amount: sendAmount,
    });

    setSending(false);

    if (result.success) {
      setSendSuccess(`Transaction successful! Hash: ${result.txHash?.slice(0, 10)}...`);
      setRecipientAddress('');
      setSendAmount('');
      // Refresh balance
      if (address) {
        await fetchBalance(address);
      }
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(null);
      }, 3000);
    } else {
      setSendError(result.error || 'Failed to send DLLR');
    }
  };

  const handshakeComplete = address !== null && isMasterHandshakeComplete(address);
  const balanceNum = balance ? parseFloat(balance.replace(/,/g, '')) : 0;
  const usdValue = balanceNum * DLLR_USD_RATE;
  const ngnValue = balanceNum * DLLR_NGN_RATE;

  return (
    <>
      <div
        className={`relative flex flex-col rounded-xl border px-6 py-5 ${jetbrains.className}`}
        style={{
          background: 'linear-gradient(135deg, #050505 0%, #0B0B0B 100%)',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          boxShadow: '0 0 40px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(212, 175, 55, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
              }}
            >
              <span className="text-2xl font-bold text-black">$</span>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#D4AF37' }}>
                Global Trade
              </h3>
              <p className="text-xs" style={{ color: '#6b6b70' }}>
                Sovereign Unit (DLLR)
              </p>
            </div>
          </div>

          {/* Bitcoin Secured Badge */}
          <div
            className="px-3 py-1.5 rounded-lg flex items-center gap-2"
            style={{
              background: 'rgba(255, 153, 0, 0.1)',
              border: '1px solid rgba(255, 153, 0, 0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002z" fill="#FF9900"/>
              <path d="M17.13 11.95c.24-1.59-.97-2.45-2.62-3.02l.54-2.15-1.31-.33-.52 2.09c-.35-.09-.7-.17-1.06-.25l.53-2.11-1.31-.33-.54 2.15c-.29-.07-.57-.13-.84-.2l-1.81-.45-.35 1.4s.97.22.95.24c.53.13.63.48.61.76l-1.23 4.93c-.05.13-.19.33-.49.25.01.02-.95-.24-.95-.24l-.65 1.51 1.71.43c.32.08.63.16.94.24l-.54 2.19 1.31.33.54-2.16c.36.1.71.19 1.05.28l-.54 2.15 1.31.33.54-2.18c2.24.42 3.92.25 4.63-1.77.57-1.63-.03-2.57-1.2-3.18.86-.2 1.5-.76 1.67-1.93zm-2.99 4.19c-.41 1.63-3.16.75-4.05.53l.72-2.89c.89.22 3.75.66 3.33 2.36zm.41-4.22c-.37 1.48-2.65.73-3.39.55l.65-2.62c.74.18 3.12.52 2.74 2.07z" fill="#000"/>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#FF9900' }}>
              Bitcoin Secured
            </span>
          </div>
        </div>

        {/* Balance Display */}
        {balance !== null && handshakeComplete ? (
          <div className="mb-4">
            <p className="text-3xl font-bold mb-2" style={{ color: '#D4AF37', textShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}>
              {balance} DLLR
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs" style={{ color: '#6b6b70' }}>USD Value</p>
                <p className="font-semibold" style={{ color: '#D4AF37' }}>
                  ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#6b6b70' }}>Naira Value</p>
                <p className="font-semibold" style={{ color: '#D4AF37' }}>
                  ₦{ngnValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {address && (
              <p className="mt-2 text-[10px] truncate" style={{ color: '#4a4a4e' }} title={address}>
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm" style={{ color: '#6b6b70' }}>
              {address ? 'Complete Master Handshake to view balance' : 'Connect wallet to view balance'}
            </p>
          </div>
        )}

        {/* Live Price Feed */}
        <div
          className="mb-4 p-3 rounded-lg"
          style={{
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6b6b70' }}>
            Live Price Feed
          </p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs" style={{ color: '#6b6b70' }}>DLLR/USD</p>
              <p className="text-lg font-bold" style={{ color: '#D4AF37' }}>$1.00</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#6b6b70' }}>DLLR/NGN</p>
              <p className="text-lg font-bold" style={{ color: '#D4AF37' }}>₦1,400</p>
            </div>
          </div>
          <p className="text-[9px] mt-2" style={{ color: '#4a4a4e' }}>
            Pegged to USD • Updated in real-time
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={connectAndFetch}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
            style={{
              background: loading ? '#6b6b70' : 'linear-gradient(135deg, #C9A227 0%, #D4AF37 100%)',
              color: '#050505',
              boxShadow: loading ? 'none' : '0 0 20px rgba(212, 175, 55, 0.3)',
            }}
          >
            {loading ? 'Connecting...' : balance !== null ? '🔄 Refresh' : '🔗 Connect Wallet'}
          </button>

          <button
            type="button"
            onClick={handleSendClick}
            disabled={!handshakeComplete || !isPresenceVerified}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
              !handshakeComplete || !isPresenceVerified ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              background: handshakeComplete && isPresenceVerified
                ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                : '#6b6b70',
              color: '#050505',
              boxShadow: handshakeComplete && isPresenceVerified ? '0 0 20px rgba(255, 215, 0, 0.4)' : 'none',
            }}
          >
            📤 Send to Exchange
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        )}

        {/* Security Notice */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
          <p className="text-[10px] text-center" style={{ color: '#6b6b70' }}>
            🔒 All transactions require 4-Layer Presence Verification
          </p>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-md mx-4 p-6 rounded-xl ${jetbrains.className}`}
            style={{
              background: 'linear-gradient(135deg, #0B0B0B 0%, #050505 100%)',
              border: '2px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowSendModal(false)}
              className="absolute top-4 right-4 text-2xl"
              style={{ color: '#6b6b70' }}
            >
              ×
            </button>

            {/* Header */}
            <h3 className="text-xl font-bold mb-2" style={{ color: '#D4AF37' }}>
              Send to Exchange
            </h3>
            <p className="text-xs mb-6" style={{ color: '#6b6b70' }}>
              Transfer DLLR to external wallet or exchange
            </p>

            {/* Recipient Address */}
            <div className="mb-4">
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#6b6b70' }}>
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-lg text-sm"
                style={{
                  background: '#050505',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  color: '#D4AF37',
                }}
              />
              <p className="text-[10px] mt-1" style={{ color: '#4a4a4e' }}>
                Enter Binance, Ledger, or any RSK-compatible address
              </p>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#6b6b70' }}>
                Amount (DLLR)
              </label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-lg text-sm"
                style={{
                  background: '#050505',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  color: '#D4AF37',
                }}
              />
              {balance && (
                <p className="text-[10px] mt-1" style={{ color: '#4a4a4e' }}>
                  Available: {balance} DLLR
                </p>
              )}
            </div>

            {/* Conversion Preview */}
            {sendAmount && parseFloat(sendAmount) > 0 && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  background: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6b6b70' }}>
                  You're Sending
                </p>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6b6b70' }}>USD:</span>
                  <span style={{ color: '#D4AF37' }}>
                    ${(parseFloat(sendAmount) * DLLR_USD_RATE).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span style={{ color: '#6b6b70' }}>NGN:</span>
                  <span style={{ color: '#D4AF37' }}>
                    ₦{(parseFloat(sendAmount) * DLLR_NGN_RATE).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {sendError && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <p className="text-xs text-red-400">{sendError}</p>
              </div>
            )}
            {sendSuccess && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <p className="text-xs text-green-400">{sendSuccess}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300"
                style={{
                  background: '#6b6b70',
                  color: '#050505',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendSubmit}
                disabled={sending || !recipientAddress || !sendAmount}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                style={{
                  background: sending ? '#6b6b70' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  color: '#050505',
                  boxShadow: sending ? 'none' : '0 0 20px rgba(255, 215, 0, 0.4)',
                }}
              >
                {sending ? 'Sending...' : '📤 Send'}
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
              <p className="text-[9px] text-center" style={{ color: '#6b6b70' }}>
                🔒 Transaction secured by Bitcoin network via Rootstock
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Presence Override Modal */}
      <PresenceOverrideModal
        isOpen={showPresenceModal}
        onClose={() => setShowPresenceModal(false)}
        onPresenceVerified={handlePresenceVerified}
      />
    </>
  );
}

