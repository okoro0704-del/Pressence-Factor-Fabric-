/**
 * Merchant instant notifications: Push + System Voice when a VIDA payment is received.
 * "Payment of [Amount] VIDA Received"
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function notifyMerchantPaymentReceived(amountVida: number): void {
  const message = `Payment of ${amountVida.toFixed(2)} VIDA Received`;
  if (typeof window === 'undefined') return;

  // Browser push notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('VIDA Payment Received', {
        body: message,
        icon: '/icons/icon-192.png',
        tag: `payment-${Date.now()}`,
      });
    } catch {
      // ignore
    }
  }

  // System voice alert
  if ('speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }
}
