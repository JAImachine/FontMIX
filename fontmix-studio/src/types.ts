export interface FontMetadata {
  id: string; // url friendly id
  name: string; // Display Name (e.g. "Space Grotesk")
  apiName: string; // Google Fonts name with + (e.g. "Space+Grotesk")
  category: "sans-serif" | "serif" | "monospace" | "display" | "handwriting";
  developer: string;
  description: string;
  languages: ("EN" | "KO")[];
  vibeTags: string[];
}

export interface FontPairing {
  id: string;
  name: string;
  englishFont: FontMetadata;
  koreanFont: FontMetadata;
  description: string;
  englishScale: number; // e.g. 1.0; used to scale up/down EN font to match visual weight of KR
  englishWeightOffset: number; // e.g. 0; shift EN weight
  koreanWeightOffset: number; // e.g. 0
  letterSpacing: string; // custom spacing tweak
  descriptionEx?: string; // Long visual analysis
}

export interface PreviewLayout {
  id: string;
  name: string;
  description: string;
}

export interface StyleInstance {
  id: string;
  name: string; // e.g. "Light", "Regular", "Bold"
  koreanFont: FontMetadata;
  englishFont: FontMetadata;
  fontSizeKo: number;
  enScale: number;
  letterSpacingKo: number;
  letterSpacingEn: number;
  baselineShiftEn: number;
  numScale: number;
  letterSpacingNum: number;
  baselineShiftNum: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right" | "justify";
  verticalAlign: "top" | "center" | "bottom";
}

export interface SavedCombination {
  id: string;
  name: string;
  createdAt: string;
  punctuationRule: "all_en" | "all_ko" | "individual";
  puncSettings: { [key: string]: "ko" | "en" };
  puncOffsets?: { [key: string]: { left: number; right: number; shift: number } };
  styleInstances: StyleInstance[];
  activeStyleId: string;
}

