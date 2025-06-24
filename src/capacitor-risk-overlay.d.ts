declare module '@capacitor/core' {
  interface PluginRegistry {
    RiskOverlay: RiskOverlayPlugin;
  }
}

export interface RiskOverlayPlugin {
  showOverlay(options: { message: string }): Promise<void>;
  hideOverlay(): Promise<void>;
  startTracking(): Promise<void>;
  stopTracking(): Promise<void>;
}
