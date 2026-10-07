import {
  APIEvent,
  type API,
  type DynamicPlatformPlugin,
  type Logging,
  type PlatformAccessory,
} from 'homebridge';

import { ChangeSensor } from './sensor.js';
import {
  DEFAULT_BIND_ADDRESS,
  DEFAULT_PORT,
  DEFAULT_RESET_SECONDS,
  PLATFORM_NAME,
  PLUGIN_NAME,
} from './settings.js';
import type { ChangeDetectionConfig, SensorConfig } from './types.js';
import { WebhookServer } from './webhook-server.js';

export class ChangeDetectionPlatform implements DynamicPlatformPlugin {
  private readonly cachedAccessories = new Map<string, PlatformAccessory>();
  private readonly sensors = new Map<string, ChangeSensor>();
  private server?: WebhookServer;

  constructor(
    private readonly log: Logging,
    private readonly config: ChangeDetectionConfig,
    private readonly api: API,
  ) {
    if (!config) {
      return;
    }

    api.on(APIEvent.DID_FINISH_LAUNCHING, () => this.start());
    api.on(APIEvent.SHUTDOWN, () => this.stop());
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.cachedAccessories.set(accessory.UUID, accessory);
  }

  private start(): void {
    const token = this.config.token?.trim();
    const sensorConfigs = this.validSensors(this.config.sensors);
    if (!token || token.length < 16 || sensorConfigs.length === 0) {
      this.log.error('Plugin is not configured: add a token of at least 16 characters and one sensor.');
      return;
    }

    const resetAfterSeconds = this.integerInRange(
      this.config.resetAfterSeconds,
      1,
      3600,
      DEFAULT_RESET_SECONDS,
    );
    const activeUuids = new Set<string>();

    for (const sensorConfig of sensorConfigs) {
      const uuid = this.api.hap.uuid.generate(sensorConfig.id);
      activeUuids.add(uuid);
      const accessory = this.cachedAccessories.get(uuid)
        ?? new this.api.platformAccessory(sensorConfig.name, uuid);

      accessory.displayName = sensorConfig.name;
      accessory.context.sensorId = sensorConfig.id;
      accessory.getService(this.api.hap.Service.AccessoryInformation)
        ?.setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'ChangeDetection')
        .setCharacteristic(this.api.hap.Characteristic.Model, 'Webhook Motion Sensor')
        .setCharacteristic(this.api.hap.Characteristic.SerialNumber, sensorConfig.id);

      const motionService = accessory.getService(this.api.hap.Service.MotionSensor)
        ?? accessory.addService(this.api.hap.Service.MotionSensor, 'Change detected');
      motionService.setCharacteristic(this.api.hap.Characteristic.Name, sensorConfig.name);

      if (!this.cachedAccessories.has(uuid)) {
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.cachedAccessories.set(uuid, accessory);
      }

      this.sensors.set(
        sensorConfig.id,
        new ChangeSensor(accessory, motionService, this.log, resetAfterSeconds),
      );
    }

    const staleAccessories = [...this.cachedAccessories.values()]
      .filter(accessory => !activeUuids.has(accessory.UUID));
    if (staleAccessories.length > 0) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, staleAccessories);
    }

    const port = this.integerInRange(this.config.port, 1, 65535, DEFAULT_PORT);
    const bindAddress = this.config.bindAddress?.trim() || DEFAULT_BIND_ADDRESS;
    this.server = new WebhookServer({
      bindAddress,
      port,
      token,
      onTrigger: id => {
        const sensor = this.sensors.get(id);
        sensor?.trigger();
        return Boolean(sensor);
      },
    });

    void this.server.start()
      .then(() => this.log.info('Webhook server listening on %s:%d', bindAddress, port))
      .catch(error => this.log.error('Could not start webhook server: %s', String(error)));
  }

  private stop(): void {
    for (const sensor of this.sensors.values()) {
      sensor.stop();
    }
    void this.server?.stop()
      .catch(error => this.log.error('Could not stop webhook server: %s', String(error)));
  }

  private validSensors(value: SensorConfig[] | undefined): SensorConfig[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const result: SensorConfig[] = [];
    const ids = new Set<string>();
    for (const sensor of value) {
      const id = sensor?.id?.trim();
      const name = sensor?.name?.trim();
      if (!id || !name || !/^[A-Za-z0-9._~-]{1,128}$/.test(id) || ids.has(id)) {
        this.log.warn('Ignoring invalid or duplicate sensor configuration.');
        continue;
      }
      ids.add(id);
      result.push({ id, name });
    }
    return result;
  }

  private integerInRange(value: number | undefined, min: number, max: number, fallback: number): number {
    return Number.isInteger(value) && value !== undefined && value >= min && value <= max
      ? value
      : fallback;
  }
}
