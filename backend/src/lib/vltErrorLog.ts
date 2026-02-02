/**
 * PFF Backend — VLT Error Logging System
 * Hardware-level error logging to distinguish driver issues from fraud attempts
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Log all sequential handshake failures to VLT_ERROR_LOG
 * - Distinguish between hardware/driver errors and fraud attempts
 * - Provide Architect visibility into system health and security threats
 */

import { pool, query } from '../db/client';
import type { HandshakeError } from '../../../core/sequentialHandshake';

export interface VLTErrorLogEntry {
  id: string;
  session_id: string;
  citizen_id: string | null;
  error_code: string;
  error_message: string;
  phase: string;
  hardware_error: boolean;
  sensor_details: string | null;
  device_info: Record<string, unknown> | null;
  timestamp: Date;
  created_at: Date;
}

export interface LogErrorParams {
  sessionId: string;
  citizenId?: string;
  error: HandshakeError;
  deviceInfo?: {
    platform: string;
    osVersion: string;
    deviceModel: string;
    appVersion: string;
  };
}

/**
 * Log handshake error to VLT_ERROR_LOG
 * Returns error log ID for reference
 */
export async function logHandshakeError(params: LogErrorParams): Promise<string> {
  const {
    sessionId,
    citizenId,
    error,
    deviceInfo,
  } = params;

  const result = await query<{ id: string }>(
    `INSERT INTO vlt_error_log 
     (session_id, citizen_id, error_code, error_message, phase, hardware_error, sensor_details, device_info, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      sessionId,
      citizenId || null,
      error.code,
      error.message,
      error.phase,
      error.hardwareError || false,
      error.sensorDetails || null,
      deviceInfo ? JSON.stringify(deviceInfo) : null,
      new Date(error.timestamp),
    ]
  );

  return result.rows[0].id;
}

/**
 * Get error logs for a specific citizen
 * Useful for debugging repeated failures
 */
export async function getCitizenErrorLogs(
  citizenId: string,
  limit: number = 50
): Promise<VLTErrorLogEntry[]> {
  const result = await query<VLTErrorLogEntry>(
    `SELECT * FROM vlt_error_log
     WHERE citizen_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [citizenId, limit]
  );

  return result.rows;
}

/**
 * Get error logs by session ID
 * Useful for debugging a specific handshake attempt
 */
export async function getSessionErrorLogs(sessionId: string): Promise<VLTErrorLogEntry[]> {
  const result = await query<VLTErrorLogEntry>(
    `SELECT * FROM vlt_error_log
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );

  return result.rows;
}

/**
 * Get hardware error statistics
 * Helps identify systemic hardware/driver issues
 */
export async function getHardwareErrorStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalErrors: number;
  hardwareErrors: number;
  fraudAttempts: number;
  errorsByCode: Record<string, number>;
  errorsByPhase: Record<string, number>;
}> {
  const dateFilter = startDate && endDate
    ? `WHERE created_at BETWEEN $1 AND $2`
    : '';
  const params = startDate && endDate ? [startDate, endDate] : [];

  const totalResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM vlt_error_log ${dateFilter}`,
    params
  );

  const hardwareResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM vlt_error_log ${dateFilter ? dateFilter + ' AND' : 'WHERE'} hardware_error = true`,
    params
  );

  const fraudResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM vlt_error_log ${dateFilter ? dateFilter + ' AND' : 'WHERE'} hardware_error = false`,
    params
  );

  const byCodeResult = await query<{ error_code: string; count: string }>(
    `SELECT error_code, COUNT(*) as count FROM vlt_error_log ${dateFilter} GROUP BY error_code`,
    params
  );

  const byPhaseResult = await query<{ phase: string; count: string }>(
    `SELECT phase, COUNT(*) as count FROM vlt_error_log ${dateFilter} GROUP BY phase`,
    params
  );

  const errorsByCode: Record<string, number> = {};
  byCodeResult.rows.forEach(row => {
    errorsByCode[row.error_code] = parseInt(row.count, 10);
  });

  const errorsByPhase: Record<string, number> = {};
  byPhaseResult.rows.forEach(row => {
    errorsByPhase[row.phase] = parseInt(row.count, 10);
  });

  return {
    totalErrors: parseInt(totalResult.rows[0].count, 10),
    hardwareErrors: parseInt(hardwareResult.rows[0].count, 10),
    fraudAttempts: parseInt(fraudResult.rows[0].count, 10),
    errorsByCode,
    errorsByPhase,
  };
}

