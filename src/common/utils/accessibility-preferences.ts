/**
 * Validate and apply player accessibility preferences. (#419)
 */
export interface AccessibilityPreferences {
  highContrast: boolean;
  textToSpeech: boolean;
  fontSizeScale: number;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  textToSpeech: false,
  fontSizeScale: 1,
  colorBlindMode: "none",
};

export function validateFontSizeScale(scale: number): boolean {
  return scale >= 0.75 && scale <= 2.0;
}

export function mergeAccessibilityPreferences(
  overrides: Partial<AccessibilityPreferences>,
): AccessibilityPreferences {
  const merged = { ...DEFAULT_ACCESSIBILITY_PREFERENCES, ...overrides };
  if (!validateFontSizeScale(merged.fontSizeScale)) {
    merged.fontSizeScale = DEFAULT_ACCESSIBILITY_PREFERENCES.fontSizeScale;
  }
  return merged;
}
