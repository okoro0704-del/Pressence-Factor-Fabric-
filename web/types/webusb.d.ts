/**
 * Web USB API — minimal types for BiometricPillar (external fingerprint scanner).
 * https://developer.mozilla.org/en-US/docs/Web/API/USB
 */

interface USBConfiguration {
  configurationValue: number;
  interfaces: USBInterface[];
}

interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
  alternates?: USBAlternateInterface[];
}

interface USBAlternateInterface {
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: 'in' | 'out';
}

interface USBInTransferResult {
  status: 'ok' | 'stall' | 'babble';
  data?: DataView;
}

interface USBDevice {
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
  configuration: USBConfiguration | undefined;
  serialNumber?: string;
}

interface USB {
  requestDevice(options?: { filters: unknown[] }): Promise<USBDevice>;
}

interface Navigator {
  usb?: USB;
}
