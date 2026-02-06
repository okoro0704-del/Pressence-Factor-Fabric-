/**
 * Manifesto Unveiling Phase — Countdown and Architect gate.
 * Re-exports isArchitect/setArchitectAccess from publicRevealAccess for backward compatibility.
 */

import { isArchitect as isArchitectFromAccess, setArchitectAccess as setArchitectAccessFromAccess } from './publicRevealAccess';

const COUNTDOWN_TARGET = new Date('2026-04-07T00:00:00.000Z');

export function getCountdownTarget(): Date {
  return new Date(COUNTDOWN_TARGET);
}

export const isArchitect = isArchitectFromAccess;
export const setArchitectAccess = setArchitectAccessFromAccess;
