export class HitStopManager {
  private freezeTimer = 0;
  private slowMoTimer = 0;
  private slowMoScale = 1;

  public triggerHitStop(durationSeconds: number): void {
    this.freezeTimer = Math.max(this.freezeTimer, durationSeconds);
  }

  public triggerSlowMo(durationSeconds: number, scale = 0.25): void {
    this.slowMoTimer = Math.max(this.slowMoTimer, durationSeconds);
    this.slowMoScale = scale;
  }

  public getEffectiveDelta(rawDt: number): number {
    if (this.freezeTimer > 0) {
      this.freezeTimer -= rawDt;
      return rawDt * 0.04; // Near-freeze micro-stop for meaty impact
    }
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDt;
      return rawDt * this.slowMoScale;
    }
    return rawDt;
  }
}
