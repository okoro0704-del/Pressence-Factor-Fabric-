'use client';

import { useEffect, useState } from 'react';
import {
  getAuthorizedDevices,
  revokeDeviceAuthorization,
  updateDeviceNickname,
} from '@/lib/multiDeviceVitalization';

interface SentinelDevicesManagerProps {
  phoneNumber: string;
}

interface AuthorizedDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  device_nickname: string | null;
  is_primary: boolean;
  status: 'ACTIVE' | 'REVOKED' | 'SUSPENDED';
  authorized_at: string;
  last_used_at: string | null;
  platform: string | null;
  screen_resolution: string | null;
}

/**
 * SENTINEL DEVICES MANAGER
 * Device Management UI for Sovereign Dashboard
 * Shows all authorized devices with revoke functionality
 */
export function SentinelDevicesManager({ phoneNumber }: SentinelDevicesManagerProps) {
  const [devices, setDevices] = useState<AuthorizedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState('');

  useEffect(() => {
    loadDevices();
  }, [phoneNumber]);

  const loadDevices = async () => {
    setLoading(true);
    const data = await getAuthorizedDevices(phoneNumber);
    setDevices(data);
    setLoading(false);
  };

  const handleRevoke = async (deviceId: string, deviceName: string) => {
    if (confirm(`Are you sure you want to revoke access to "${deviceName}"?`)) {
      await revokeDeviceAuthorization(deviceId);
      await loadDevices();
    }
  };

  const handleStartEditNickname = (deviceId: string, currentNickname: string | null) => {
    setEditingNickname(deviceId);
    setNicknameValue(currentNickname || '');
  };

  const handleSaveNickname = async (deviceId: string) => {
    if (nicknameValue.trim()) {
      await updateDeviceNickname(deviceId, nicknameValue.trim());
      await loadDevices();
    }
    setEditingNickname(null);
    setNicknameValue('');
  };

  const handleCancelEditNickname = () => {
    setEditingNickname(null);
    setNicknameValue('');
  };

  const activeDevices = devices.filter((d) => d.status === 'ACTIVE');
  const revokedDevices = devices.filter((d) => d.status === 'REVOKED');

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'PHONE':
        return '📱';
      case 'LAPTOP':
        return '💻';
      case 'TABLET':
        return '📲';
      case 'DESKTOP':
        return '🖥️';
      default:
        return '🔐';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#D4AF37] text-lg font-mono">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#D4AF37] font-mono">SENTINEL DEVICES</h2>
        <div className="flex gap-4 text-sm font-mono">
          <div className="text-[#22c55e]">
            Active: <span className="font-bold">{activeDevices.length}</span>
          </div>
          <div className="text-[#ef4444]">
            Revoked: <span className="font-bold">{revokedDevices.length}</span>
          </div>
        </div>
      </div>

      {/* Active Devices */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#C9A227] font-mono">ACTIVE DEVICES</h3>
        {activeDevices.length === 0 ? (
          <div className="text-[#6b6b70] font-mono text-center py-8">No active devices</div>
        ) : (
          <div className="grid gap-4">
            {activeDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onRevoke={handleRevoke}
                editingNickname={editingNickname === device.device_id}
                nicknameValue={nicknameValue}
                onStartEditNickname={handleStartEditNickname}
                onSaveNickname={handleSaveNickname}
                onCancelEditNickname={handleCancelEditNickname}
                onNicknameChange={setNicknameValue}
                getDeviceIcon={getDeviceIcon}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Revoked Devices */}
      {revokedDevices.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#6b6b70] font-mono">REVOKED DEVICES</h3>
          <div className="grid gap-4 opacity-50">
            {revokedDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onRevoke={handleRevoke}
                editingNickname={false}
                nicknameValue=""
                onStartEditNickname={handleStartEditNickname}
                onSaveNickname={handleSaveNickname}
                onCancelEditNickname={handleCancelEditNickname}
                onNicknameChange={setNicknameValue}
                getDeviceIcon={getDeviceIcon}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DeviceCardProps {
  device: AuthorizedDevice;
  onRevoke: (deviceId: string, deviceName: string) => void;
  editingNickname: boolean;
  nicknameValue: string;
  onStartEditNickname: (deviceId: string, currentNickname: string | null) => void;
  onSaveNickname: (deviceId: string) => void;
  onCancelEditNickname: () => void;
  onNicknameChange: (value: string) => void;
  getDeviceIcon: (deviceType: string) => string;
  formatDate: (dateString: string) => string;
}

function DeviceCard({
  device,
  onRevoke,
  editingNickname,
  nicknameValue,
  onStartEditNickname,
  onSaveNickname,
  onCancelEditNickname,
  onNicknameChange,
  getDeviceIcon,
  formatDate,
}: DeviceCardProps) {
  const isRevoked = device.status === 'REVOKED';

  return (
    <div
      className={`
        relative p-6 rounded-lg border-2
        ${device.is_primary ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#C9A227]/30 bg-[#050505]/50'}
        ${isRevoked ? 'opacity-50' : ''}
        backdrop-blur-sm
      `}
    >
      {/* Primary Badge */}
      {device.is_primary && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-[#D4AF37] text-[#050505] text-xs font-bold font-mono rounded">
          PRIMARY SENTINEL
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Device Icon */}
        <div className="text-5xl">{getDeviceIcon(device.device_type)}</div>

        {/* Device Info */}
        <div className="flex-1 space-y-2">
          {/* Device Name / Nickname */}
          <div>
            {editingNickname ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nicknameValue}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  className="flex-1 px-3 py-1 bg-[#050505] border border-[#D4AF37] text-[#D4AF37] font-mono rounded"
                  placeholder="Enter device nickname"
                  autoFocus
                />
                <button
                  onClick={() => onSaveNickname(device.device_id)}
                  className="px-3 py-1 bg-[#22c55e] text-[#050505] font-bold font-mono rounded hover:bg-[#22c55e]/80"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEditNickname}
                  className="px-3 py-1 bg-[#6b6b70] text-white font-bold font-mono rounded hover:bg-[#6b6b70]/80"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#D4AF37] font-mono">
                  {device.device_nickname || device.device_name}
                </h3>
                {!isRevoked && (
                  <button
                    onClick={() => onStartEditNickname(device.device_id, device.device_nickname)}
                    className="text-[#C9A227] hover:text-[#D4AF37] text-sm"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
            {device.device_nickname && (
              <p className="text-sm text-[#6b6b70] font-mono">{device.device_name}</p>
            )}
          </div>

          {/* Device Details */}
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <span className="text-[#6b6b70]">Type:</span>{' '}
              <span className="text-[#D4AF37]">{device.device_type}</span>
            </div>
            <div>
              <span className="text-[#6b6b70]">Status:</span>{' '}
              <span
                className={
                  device.status === 'ACTIVE'
                    ? 'text-[#22c55e]'
                    : device.status === 'REVOKED'
                    ? 'text-[#ef4444]'
                    : 'text-[#FFD700]'
                }
              >
                {device.status}
              </span>
            </div>
            <div>
              <span className="text-[#6b6b70]">Authorized:</span>{' '}
              <span className="text-[#D4AF37]">{formatDate(device.authorized_at)}</span>
            </div>
            <div>
              <span className="text-[#6b6b70]">Last Used:</span>{' '}
              <span className="text-[#D4AF37]">
                {device.last_used_at ? formatDate(device.last_used_at) : 'Never'}
              </span>
            </div>
            {device.platform && (
              <div>
                <span className="text-[#6b6b70]">Platform:</span>{' '}
                <span className="text-[#D4AF37]">{device.platform}</span>
              </div>
            )}
            {device.screen_resolution && (
              <div>
                <span className="text-[#6b6b70]">Resolution:</span>{' '}
                <span className="text-[#D4AF37]">{device.screen_resolution}</span>
              </div>
            )}
          </div>

          {/* Revoke Button */}
          {!isRevoked && !device.is_primary && (
            <button
              onClick={() => onRevoke(device.device_id, device.device_nickname || device.device_name)}
              className="mt-4 px-4 py-2 bg-[#ef4444] text-white font-bold font-mono rounded hover:bg-[#ef4444]/80 transition-colors"
            >
              REVOKE ACCESS
            </button>
          )}

          {device.is_primary && (
            <p className="mt-4 text-sm text-[#6b6b70] font-mono italic">
              Primary device cannot be revoked. Use Guardian Recovery if lost.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

