import type { PlatformConfig } from 'homebridge';

export interface SensorConfig {
  id: string;
  name: string;
}

export interface ChangeDetectionConfig extends PlatformConfig {
  bindAddress?: string;
  port?: number;
  resetAfterSeconds?: number;
  sensors?: SensorConfig[];
  token?: string;
}

