import { WebPlugin } from '@capacitor/core';

export interface RiskOverlayPlugin {
  showOverlay(options: { message: string; color?: string; duration?: number }): Promise<void>;
}

export class RiskOverlayWeb extends WebPlugin implements RiskOverlayPlugin {
  async showOverlay(): Promise<void> {
    console.warn('RiskOverlay is not available in web.');
  }
}
