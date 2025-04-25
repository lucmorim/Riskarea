import { registerPlugin } from '@capacitor/core';
import type { RiskOverlayPlugin } from './plugin';

const RiskOverlay = registerPlugin<RiskOverlayPlugin>('RiskOverlay');

export * from './plugin';
export { RiskOverlay };
