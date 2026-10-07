import type { Logging, PlatformAccessory, Service } from 'homebridge';

export class ChangeSensor {
  private resetTimer?: NodeJS.Timeout;

  constructor(
    private readonly accessory: PlatformAccessory,
    private readonly motionService: Service,
    private readonly log: Logging,
    private readonly resetAfterSeconds: number,
  ) {}

  trigger(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.motionService.updateCharacteristic('MotionDetected', true);
    this.log.info('Change detected for %s', this.accessory.displayName);

    this.resetTimer = setTimeout(() => {
      this.motionService.updateCharacteristic('MotionDetected', false);
      this.resetTimer = undefined;
      this.log.debug('Reset sensor %s', this.accessory.displayName);
    }, this.resetAfterSeconds * 1000);

    this.resetTimer.unref();
  }

  stop(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}
