import type { Logging, PlatformAccessory } from 'homebridge';

export class ChangeSensor {
  private resetTimer?: NodeJS.Timeout;

  constructor(
    private readonly accessory: PlatformAccessory,
    private readonly updateMotion: (active: boolean) => void,
    private readonly log: Logging,
    private readonly resetAfterSeconds: number,
  ) {}

  trigger(): boolean {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    try {
      this.updateMotion(true);
      this.log.info('Change detected for %s', this.accessory.displayName);
    } catch (error) {
      this.log.error('Could not activate sensor %s: %s', this.accessory.displayName, String(error));
      return false;
    }

    this.resetTimer = setTimeout(() => {
      this.resetTimer = undefined;
      try {
        this.updateMotion(false);
        this.log.debug('Reset sensor %s', this.accessory.displayName);
      } catch (error) {
        this.log.error('Could not reset sensor %s: %s', this.accessory.displayName, String(error));
      }
    }, this.resetAfterSeconds * 1000);

    this.resetTimer.unref();
    return true;
  }

  stop(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}
