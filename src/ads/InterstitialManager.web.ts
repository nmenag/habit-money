export class InterstitialManager {
  public init() {
    // No-op on web
  }

  public load() {
    // No-op on web
  }

  public async show() {
    // No-op on web
  }

  public isLoaded() {
    return false;
  }
}

export const interstitialManager = new InterstitialManager();
