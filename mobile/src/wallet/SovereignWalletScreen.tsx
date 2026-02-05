/**
 * PFF — Sovereign Wallet Screen
 * SEND / RECEIVE / SWAP open a simple flow: pick supported asset(s), then amount or receive info.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import type { AssetBalance, AssetSymbol, WalletActivityItem, LinkedBankAccount } from './types';

const SUPPORTED_ASSETS: AssetSymbol[] = ['VIDA', 'DLLR', 'USDT', 'vNGN'];

// Constants aligned with web (VIDA $1000, vNGN rate)
const VIDA_PRICE_USD = 1000;
const VIDA_LOCKED_FUTURE_WEALTH = 4;

const GOLD = '#D4AF37';
const GOLD_DIM = '#8b7355';
const GOLD_BG = 'rgba(212, 175, 55, 0.12)';
const BG = '#0d0d0f';
const SURFACE = '#16161a';
const BORDER = '#2a2a2e';
const MUTED = '#6b6b70';
const GREEN = '#00A368';

/** Placeholder balances — replace with real API later. */
function useWalletState() {
  const [balances, setBalances] = useState<AssetBalance[]>([
    { symbol: 'VIDA', balance: 5, usdValue: 5000, spendable: 1, locked: VIDA_LOCKED_FUTURE_WEALTH },
    { symbol: 'DLLR', balance: 0, usdValue: 0 },
    { symbol: 'USDT', balance: 0, usdValue: 0 },
    { symbol: 'vNGN', balance: 0, usdValue: 0 },
  ]);
  const [linkedBank, setLinkedBank] = useState<LinkedBankAccount | null>(null);
  const [activity] = useState<WalletActivityItem[]>([
    { id: '1', type: 'receive', symbol: 'VIDA', amount: 5, amountUsd: 5000, label: 'Vitalization mint', date: new Date().toISOString() },
  ]);
  return { balances, setBalances, linkedBank, setLinkedBank, activity };
}

type ActionMode = 'send' | 'receive' | 'swap' | null;

export function SovereignWalletScreen(): React.JSX.Element {
  const { balances, linkedBank, setLinkedBank, activity } = useWalletState();
  const [vidaInfoVisible, setVidaInfoVisible] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [sendReceiveAsset, setSendReceiveAsset] = useState<AssetSymbol | null>(null);
  const [swapFrom, setSwapFrom] = useState<AssetSymbol | null>(null);
  const [swapTo, setSwapTo] = useState<AssetSymbol | null>(null);
  const [amount, setAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');

  const formatUsd = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatAmount = (n: number, decimals = 2) =>
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: 6 });

  const openAction = useCallback((mode: ActionMode) => {
    setActionMode(mode);
    setSendReceiveAsset(null);
    setSwapFrom(null);
    setSwapTo(null);
    setAmount('');
    setSendAddress('');
  }, []);

  const closeAction = useCallback(() => {
    setActionMode(null);
    setSendReceiveAsset(null);
    setSwapFrom(null);
    setSwapTo(null);
    setAmount('');
    setSendAddress('');
  }, []);

  const handleSend = useCallback(() => openAction('send'), [openAction]);
  const handleReceive = useCallback(() => openAction('receive'), [openAction]);
  const handleSwap = useCallback(() => openAction('swap'), [openAction]);

  const getBalanceForSymbol = useCallback(
    (symbol: AssetSymbol) => {
      const a = balances.find((b) => b.symbol === symbol);
      if (!a) return 0;
      if (symbol === 'VIDA' && a.spendable != null) return a.spendable;
      return a.balance;
    },
    [balances]
  );

  const handleLinkBank = useCallback(() => {
    // TODO: Open Link Nigerian Bank flow; for now just set a placeholder
    setLinkedBank({ bankName: 'First Bank', accountNumber: '****1234', accountName: 'Sovereign' });
  }, [setLinkedBank]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Sovereign Wallet</Text>

        {/* Primary actions: SEND, RECEIVE, SWAP */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSend} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>SEND</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleReceive} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>RECEIVE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSwap} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>SWAP</Text>
          </TouchableOpacity>
        </View>

        {/* Asset cards */}
        <Text style={styles.sectionLabel}>Assets</Text>
        {balances.map((asset) => (
          <AssetCard
            key={asset.symbol}
            asset={asset}
            formatUsd={formatUsd}
            formatAmount={formatAmount}
            onVidaInfoPress={asset.symbol === 'VIDA' ? () => setVidaInfoVisible(true) : undefined}
          />
        ))}

        {/* Linked Bank Account */}
        <Text style={styles.sectionLabel}>Linked Bank Account</Text>
        <View style={styles.linkBankCard}>
          {linkedBank ? (
            <View style={styles.linkedRow}>
              <Text style={styles.linkedBankName}>{linkedBank.bankName}</Text>
              <Text style={styles.linkedAccount}>{linkedBank.accountNumber}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.linkBankButton} onPress={handleLinkBank} activeOpacity={0.85}>
              <Text style={styles.linkBankButtonText}>+ Link Nigerian Bank Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionLabel}>Recent Activity</Text>
        <View style={styles.activityList}>
          {activity.length === 0 ? (
            <Text style={styles.activityEmpty}>No recent activity</Text>
          ) : (
            activity.map((item) => (
              <ActivityRow key={item.id} item={item} formatUsd={formatUsd} formatAmount={formatAmount} />
            ))
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* VIDA info modal: Locked 4 VIDA = Future Wealth */}
      <Modal visible={vidaInfoVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setVidaInfoVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>VIDA balance</Text>
            <Text style={styles.modalBody}>
              Your <Text style={styles.modalBold}>Spendable</Text> balance is the amount you can send or swap now.
            </Text>
            <Text style={styles.modalBody}>
              <Text style={styles.modalBold}>{VIDA_LOCKED_FUTURE_WEALTH} VIDA</Text> are locked as{' '}
              <Text style={styles.modalBold}>Future Wealth</Text> and unlock over the vesting period.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setVidaInfoVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Send / Receive / Swap flow: show supported wallets, then from/to and amount */}
      <Modal visible={actionMode !== null} transparent animationType="slide">
        <Pressable style={styles.actionModalOverlay} onPress={closeAction}>
          <Pressable style={styles.actionModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalTitle}>
                {actionMode === 'send' && !sendReceiveAsset && 'Choose asset to send'}
                {actionMode === 'send' && sendReceiveAsset && `Send ${sendReceiveAsset}`}
                {actionMode === 'receive' && !sendReceiveAsset && 'Choose asset to receive'}
                {actionMode === 'receive' && sendReceiveAsset && `Receive ${sendReceiveAsset}`}
                {actionMode === 'swap' && !swapFrom && 'Swap from'}
                {actionMode === 'swap' && swapFrom && !swapTo && 'Swap to'}
                {actionMode === 'swap' && swapFrom && swapTo && `Swap ${swapFrom} → ${swapTo}`}
              </Text>
              <TouchableOpacity onPress={closeAction} hitSlop={12}>
                <Text style={styles.actionModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {actionMode === 'send' && !sendReceiveAsset && (
              <AssetPicker
                assets={SUPPORTED_ASSETS}
                balances={balances}
                getBalanceForSymbol={getBalanceForSymbol}
                onSelect={setSendReceiveAsset}
              />
            )}
            {actionMode === 'send' && sendReceiveAsset && (
              <SendStep
                symbol={sendReceiveAsset}
                balance={getBalanceForSymbol(sendReceiveAsset)}
                amount={amount}
                setAmount={setAmount}
                address={sendAddress}
                setAddress={setSendAddress}
                onBack={() => setSendReceiveAsset(null)}
                onConfirm={() => {}}
              />
            )}

            {actionMode === 'receive' && !sendReceiveAsset && (
              <AssetPicker
                assets={SUPPORTED_ASSETS}
                balances={balances}
                getBalanceForSymbol={getBalanceForSymbol}
                onSelect={setSendReceiveAsset}
              />
            )}
            {actionMode === 'receive' && sendReceiveAsset && (
              <ReceiveStep symbol={sendReceiveAsset} onBack={() => setSendReceiveAsset(null)} />
            )}

            {actionMode === 'swap' && !swapFrom && (
              <AssetPicker
                assets={SUPPORTED_ASSETS}
                balances={balances}
                getBalanceForSymbol={getBalanceForSymbol}
                onSelect={setSwapFrom}
              />
            )}
            {actionMode === 'swap' && swapFrom && !swapTo && (
              <AssetPicker
                assets={SUPPORTED_ASSETS.filter((s) => s !== swapFrom)}
                balances={balances}
                getBalanceForSymbol={getBalanceForSymbol}
                onSelect={setSwapTo}
              />
            )}
            {actionMode === 'swap' && swapFrom && swapTo && (
              <SwapStep
                fromSymbol={swapFrom}
                toSymbol={swapTo}
                balance={getBalanceForSymbol(swapFrom)}
                amount={amount}
                setAmount={setAmount}
                onBack={() => setSwapTo(null)}
                onConfirm={() => {}}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function assetColor(symbol: AssetSymbol): string {
  return symbol === 'DLLR' ? GOLD : symbol === 'USDT' ? GREEN : symbol === 'vNGN' ? '#059669' : GOLD;
}

function AssetPicker({
  assets,
  balances,
  getBalanceForSymbol,
  onSelect,
}: {
  assets: AssetSymbol[];
  balances: AssetBalance[];
  getBalanceForSymbol: (s: AssetSymbol) => number;
  onSelect: (s: AssetSymbol) => void;
}): React.JSX.Element {
  return (
    <View style={styles.assetPickerList}>
      {assets.map((symbol) => {
        const bal = getBalanceForSymbol(symbol);
        const color = assetColor(symbol);
        return (
          <TouchableOpacity
            key={symbol}
            style={[styles.assetPickerItem, { borderColor: color + '50' }]}
            onPress={() => onSelect(symbol)}
            activeOpacity={0.8}
          >
            <Text style={[styles.assetPickerSymbol, { color }]}>{symbol}</Text>
            <Text style={styles.assetPickerBalance}>
              {bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} available
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SendStep({
  symbol,
  balance,
  amount,
  setAmount,
  address,
  setAddress,
  onBack,
  onConfirm,
}: {
  symbol: AssetSymbol;
  balance: number;
  amount: string;
  setAmount: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const num = parseFloat(amount) || 0;
  const valid = num > 0 && num <= balance && address.trim().length > 0;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.stepContent}>
      <Text style={styles.stepHint}>Balance: {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {symbol}</Text>
      <TextInput
        style={styles.amountInput}
        placeholder="Amount"
        placeholderTextColor={MUTED}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.addressInput}
        placeholder="Recipient address or phone"
        placeholderTextColor={MUTED}
        value={address}
        onChangeText={setAddress}
      />
      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.stepButtonSecondary} onPress={onBack}>
          <Text style={styles.stepButtonSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stepButtonPrimary, !valid && styles.stepButtonDisabled]}
          onPress={onConfirm}
          disabled={!valid}
        >
          <Text style={styles.stepButtonPrimaryText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function ReceiveStep({ symbol, onBack }: { symbol: AssetSymbol; onBack: () => void }): React.JSX.Element {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>Your {symbol} receive address</Text>
      <View style={styles.receiveAddressBox}>
        <Text style={styles.receiveAddressText} selectable>
          0x742d...8f2a
        </Text>
        <Text style={styles.receiveAddressNote}>Tap to copy · or show QR in app</Text>
      </View>
      <TouchableOpacity style={styles.stepButtonSecondary} onPress={onBack}>
        <Text style={styles.stepButtonSecondaryText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function SwapStep({
  fromSymbol,
  toSymbol,
  balance,
  amount,
  setAmount,
  onBack,
  onConfirm,
}: {
  fromSymbol: AssetSymbol;
  toSymbol: AssetSymbol;
  balance: number;
  amount: string;
  setAmount: (v: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const num = parseFloat(amount) || 0;
  const valid = num > 0 && num <= balance;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.stepContent}>
      <View style={styles.swapFromTo}>
        <Text style={[styles.swapLabel, { color: assetColor(fromSymbol) }]}>{fromSymbol}</Text>
        <Text style={styles.swapArrow}>→</Text>
        <Text style={[styles.swapLabel, { color: assetColor(toSymbol) }]}>{toSymbol}</Text>
      </View>
      <Text style={styles.stepHint}>Balance: {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {fromSymbol}</Text>
      <TextInput
        style={styles.amountInput}
        placeholder="Amount to swap"
        placeholderTextColor={MUTED}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.stepButtonSecondary} onPress={onBack}>
          <Text style={styles.stepButtonSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stepButtonPrimary, !valid && styles.stepButtonDisabled]}
          onPress={onConfirm}
          disabled={!valid}
        >
          <Text style={styles.stepButtonPrimaryText}>Swap</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function AssetCard({
  asset,
  formatUsd,
  formatAmount,
  onVidaInfoPress,
}: {
  asset: AssetBalance;
  formatUsd: (n: number) => string;
  formatAmount: (n: number, decimals?: number) => string;
  onVidaInfoPress?: () => void;
}): React.JSX.Element {
  const isVida = asset.symbol === 'VIDA';
  const displayAmount = isVida && asset.spendable != null ? asset.spendable : asset.balance;
  const displayUsd = isVida && asset.spendable != null ? asset.spendable * VIDA_PRICE_USD : asset.usdValue;
  const accent = asset.symbol === 'DLLR' ? GOLD : asset.symbol === 'USDT' ? GREEN : asset.symbol === 'vNGN' ? '#059669' : GOLD;

  return (
    <View style={[styles.assetCard, { borderColor: accent + '40' }]}>
      <View style={styles.assetCardHeader}>
        <Text style={[styles.assetSymbol, { color: accent }]}>{asset.symbol}</Text>
        {isVida && onVidaInfoPress && (
          <TouchableOpacity onPress={onVidaInfoPress} hitSlop={12} style={styles.infoTouch}>
            <Text style={styles.infoIcon}>i</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.assetAmount, { color: accent }]}>
        {formatAmount(displayAmount)} {asset.symbol}
      </Text>
      <Text style={styles.assetUsd}>{formatUsd(displayUsd)}</Text>
    </View>
  );
}

function ActivityRow({
  item,
  formatUsd,
  formatAmount,
}: {
  item: WalletActivityItem;
  formatUsd: (n: number) => string;
  formatAmount: (n: number, decimals?: number) => string;
}): React.JSX.Element {
  const typeLabel = item.type === 'send' ? 'Sent' : item.type === 'receive' ? 'Received' : 'Swap';
  const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityLeft}>
        <Text style={styles.activityType}>{typeLabel}</Text>
        <Text style={styles.activityLabel} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.activityDate}>{dateStr}</Text>
      </View>
      <View style={styles.activityRight}>
        <Text style={item.type === 'send' ? styles.activityAmountSent : styles.activityAmountRecv}>
          {item.type === 'send' ? '-' : '+'}{formatAmount(item.amount)} {item.symbol}
        </Text>
        {item.amountUsd != null && item.amountUsd > 0 && (
          <Text style={styles.activityUsd}>{formatUsd(item.amountUsd)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: GOLD_BG,
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1.2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  assetCard: {
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  assetCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  assetSymbol: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  infoTouch: { width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD_BG, alignItems: 'center', justifyContent: 'center' },
  infoIcon: { fontSize: 12, fontWeight: '700', color: GOLD },
  assetAmount: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  assetUsd: { fontSize: 12, color: MUTED },
  linkBankCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  linkedRow: { gap: 4 },
  linkedBankName: { fontSize: 14, fontWeight: '600', color: GOLD },
  linkedAccount: { fontSize: 12, color: MUTED },
  linkBankButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  linkBankButtonText: { fontSize: 14, fontWeight: '600', color: GOLD },
  activityList: { gap: 0 },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  activityLeft: { flex: 1 },
  activityType: { fontSize: 12, fontWeight: '700', color: GOLD_DIM, textTransform: 'uppercase', marginBottom: 2 },
  activityLabel: { fontSize: 14, color: '#e0e0e0', marginBottom: 2 },
  activityDate: { fontSize: 11, color: MUTED },
  activityRight: { alignItems: 'flex-end' },
  activityAmountSent: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
  activityAmountRecv: { fontSize: 14, fontWeight: '700', color: GREEN },
  activityUsd: { fontSize: 11, color: MUTED, marginTop: 2 },
  activityEmpty: { fontSize: 13, color: MUTED, paddingVertical: 20, textAlign: 'center' },
  bottomSpacer: { height: 40 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    maxWidth: 320,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: GOLD, marginBottom: 12 },
  modalBody: { fontSize: 14, color: '#e0e0e0', marginBottom: 10, lineHeight: 20 },
  modalBold: { fontWeight: '700', color: GOLD },
  modalButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: GOLD,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: { fontSize: 14, fontWeight: '700', color: BG },

  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  actionModalContent: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  actionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  actionModalClose: {
    fontSize: 22,
    color: MUTED,
    padding: 4,
  },
  assetPickerList: { gap: 10 },
  assetPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
  },
  assetPickerSymbol: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  assetPickerBalance: { fontSize: 12, color: MUTED },
  stepContent: { gap: 12 },
  stepHint: { fontSize: 12, color: MUTED, marginBottom: 4 },
  amountInput: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#e0e0e0',
  },
  addressInput: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#e0e0e0',
  },
  stepButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  stepButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  stepButtonSecondaryText: { fontSize: 14, fontWeight: '600', color: MUTED },
  stepButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
  },
  stepButtonPrimaryText: { fontSize: 14, fontWeight: '700', color: BG },
  stepButtonDisabled: { opacity: 0.5 },
  receiveAddressBox: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  receiveAddressText: { fontSize: 14, color: GOLD, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  receiveAddressNote: { fontSize: 11, color: MUTED, marginTop: 6 },
  swapFromTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  swapLabel: { fontSize: 18, fontWeight: '700' },
  swapArrow: { fontSize: 18, color: MUTED },
});
