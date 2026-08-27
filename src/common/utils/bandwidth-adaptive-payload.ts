/**
 * Select a mobile-appropriate response payload variant based on the
 * client's reported network condition. (#420)
 */
export type NetworkType = "wifi" | "4g" | "3g" | "2g" | "offline";
export type PayloadVariant = "full" | "reduced" | "minimal";

export function selectPayloadVariant(network: NetworkType): PayloadVariant {
  if (network === "wifi" || network === "4g") return "full";
  if (network === "3g") return "reduced";
  return "minimal";
}

export function shouldDeferSync(network: NetworkType): boolean {
  return network === "offline" || network === "2g";
}

export function estimatedPayloadSizeKb(variant: PayloadVariant, baseSizeKb: number): number {
  const factor = variant === "full" ? 1 : variant === "reduced" ? 0.5 : 0.2;
  return Math.round(baseSizeKb * factor);
}
