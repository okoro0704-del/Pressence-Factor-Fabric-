/**
 * Web Bluetooth API — minimal types for Sentinel BLE bridge.
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
 */

interface BluetoothRemoteGATTCharacteristic {
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface Bluetooth {
  requestDevice(options: { filters: { name?: string }[]; optionalServices?: string[] }): Promise<BluetoothDevice>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
