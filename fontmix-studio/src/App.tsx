import React, { useState, useEffect, useRef } from "react";
import * as opentype from "opentype.js";
import JSZip from "jszip";
import { ENGLISH_FONTS, KOREAN_FONTS } from "./data";
import { FontMetadata, StyleInstance, SavedCombination } from "./types";
import ScrubbableInput from "./components/ScrubbableInput";
import { 
  RefreshCw, 
  Download, 
  X, 
  Check, 
  FileCode,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bookmark,
  Heart,
  Eye,
  EyeOff
} from "lucide-react";

const DEFAULT_SPECIMEN_TEXT = `다람쥐, ‘헌 쳇바퀴’ 타고파 2026 영문(English) Type: setting 15?! 조판 예문 “123Xx맘01”입니다.`;
const LEGACY_SPECIMEN_TEXT = `다람쥐, ‘헌 쳇바퀴’ 타고파 2026 영문 (English) Type setting 02 조판 예문 “A맘01”`;

const createDefaultStyleInstances = (): StyleInstance[] => {
  const koreanFont = KOREAN_FONTS.find(f => f.id === "ibm-plex-sans-kr") || KOREAN_FONTS[0];
  const englishFont = ENGLISH_FONTS.find(f => f.id === "inter") || ENGLISH_FONTS[0];
  const baseStyle = {
    koreanFont,
    englishFont,
    fontSizeKo: 24,
    enScale: 1.08,
    letterSpacingKo: -0.045,
    letterSpacingEn: 0,
    baselineShiftEn: -10,
    numScale: 1.0,
    letterSpacingNum: 0,
    baselineShiftNum: 0,
    lineHeight: 1.45,
    textAlign: "center" as const,
    verticalAlign: "center" as const,
  };

  return [
    { ...baseStyle, id: "style-light", name: "light" },
    { ...baseStyle, id: "style-regular", name: "Regular" },
    { ...baseStyle, id: "style-medium", name: "medium" },
    { ...baseStyle, id: "style-bold", name: "Bold" },
  ];
};

export default function App() {
  // Safe default fonts
  const initialEnFont = ENGLISH_FONTS.find(f => f.id === "space-grotesk") || ENGLISH_FONTS[0];
  const initialKrFont = KOREAN_FONTS.find(f => f.id === "ibm-plex-sans-kr") || KOREAN_FONTS[0];

  // Fonts Lists (Dynamic with uploaded custom fonts)
  const [customKoreanFonts, setCustomKoreanFonts] = useState<FontMetadata[]>([]);
  const [customEnglishFonts, setCustomEnglishFonts] = useState<FontMetadata[]>([]);

  const allKoreanFonts = [...customKoreanFonts, ...KOREAN_FONTS];
  const allEnglishFonts = [...customEnglishFonts, ...ENGLISH_FONTS];

  // Workdesk States (List of coordinated Style weights supporting Variable layout pairing)
  const [styleInstances, setStyleInstances] = useState<StyleInstance[]>(() => {
    try {
      const stored = localStorage.getItem("font_harmony_workbench_style_instances");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          const hasDefaultWeights = ["style-light", "style-regular", "style-medium", "style-bold"]
            .every(id => parsed.some((style: StyleInstance) => style.id === id));
          if (hasDefaultWeights) {
            return parsed.map((style: StyleInstance) => {
              if (style.id === "style-light") return { ...style, name: "light" };
              if (style.id === "style-medium") return { ...style, name: "medium" };
              return style;
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse styleInstances from localStorage", e);
    }
    return createDefaultStyleInstances();
  });
  const [activeStyleId, setActiveStyleId] = useState<string>(() => {
    const stored = localStorage.getItem("font_harmony_workbench_active_style_id");
    return stored || "style-regular";
  });
  const [sidebarTab, setSidebarTab] = useState<"font" | "punc" | "balance" | "preset">("font");
  const [globalTextAlign, setGlobalTextAlign] = useState<"left" | "center" | "right" | "justify" >(() => {
    const stored = localStorage.getItem("font_harmony_workbench_text_align");
    return (stored === "left" || stored === "center" || stored === "right" || stored === "justify") ? stored : "center";
  });
  const [globalVerticalAlign, setGlobalVerticalAlign] = useState<"top" | "center" | "bottom">(() => {
    const stored = localStorage.getItem("font_harmony_workbench_vertical_align");
    return (stored === "top" || stored === "center" || stored === "bottom") ? stored : "center";
  });

  const updateGlobalTextAlign = (newAlign: "left" | "center" | "right" | "justify") => {
    setGlobalTextAlign(newAlign);
    setStyleInstances(prev => prev.map(s => ({ ...s, textAlign: newAlign })));
  };

  const updateGlobalVerticalAlign = (newVal: "top" | "center" | "bottom") => {
    setGlobalVerticalAlign(newVal);
    setStyleInstances(prev => prev.map(s => ({ ...s, verticalAlign: newVal })));
  };

  const activeStyle = styleInstances.find(s => s.id === activeStyleId) || styleInstances[0];

  const updateStyleInstance = (id: string, updatedFields: Partial<StyleInstance>) => {
    setStyleInstances(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const updateActiveStyle = (updatedFields: Partial<StyleInstance>) => {
    updateStyleInstance(activeStyleId, updatedFields);
  };

  const handleApplyActiveStyleToAllWeights = () => {
    const {
      enScale,
      fontSizeKo,
      letterSpacingKo,
      letterSpacingEn,
      baselineShiftEn,
      numScale,
      letterSpacingNum,
      baselineShiftNum,
      lineHeight,
    } = activeStyle;

    setStyleInstances(prev => prev.map(s => ({
      ...s,
      enScale,
      fontSizeKo,
      letterSpacingKo,
      letterSpacingEn,
      baselineShiftEn,
      numScale,
      letterSpacingNum,
      baselineShiftNum,
      lineHeight,
    })));

    setShowSyncSuccess(true);
    setTimeout(() => setShowSyncSuccess(false), 2000);
  };

  const handleAddNewStyleInstance = () => {
    const count = styleInstances.length + 1;
    const newId = `style-${Date.now()}`;
    
    // Determine default weight name based on count
    let newName = `Weight ${count}`;
    if (count === 1) newName = "light";
    else if (count === 2) newName = "Regular";
    else if (count === 3) newName = "medium";
    else if (count === 4) newName = "Bold";
    else if (count === 5) newName = "Black";
    
    const currentActive = styleInstances.find(s => s.id === activeStyleId) || styleInstances[0];
    
    const newInstance: StyleInstance = {
      id: newId,
      name: newName,
      koreanFont: currentActive.koreanFont,
      englishFont: currentActive.englishFont,
      fontSizeKo: currentActive.fontSizeKo,
      enScale: currentActive.enScale,
      letterSpacingKo: currentActive.letterSpacingKo,
      letterSpacingEn: currentActive.letterSpacingEn,
      baselineShiftEn: currentActive.baselineShiftEn,
      numScale: currentActive.numScale ?? 1.0,
      letterSpacingNum: currentActive.letterSpacingNum ?? 0,
      baselineShiftNum: currentActive.baselineShiftNum ?? 0,
      lineHeight: currentActive.lineHeight,
      textAlign: currentActive.textAlign,
      verticalAlign: currentActive.verticalAlign
    };
    
    setStyleInstances([...styleInstances, newInstance]);
    setActiveStyleId(newId);
  };

  // Derived compatibility aliases
  const koreanFont = activeStyle.koreanFont;
  const englishFont = activeStyle.englishFont;
  const fontSizeKo = activeStyle.fontSizeKo;
  const enScale = activeStyle.enScale;
  const letterSpacingKo = activeStyle.letterSpacingKo;
  const letterSpacingEn = activeStyle.letterSpacingEn;
  const baselineShiftEn = activeStyle.baselineShiftEn;
  const numScale = activeStyle.numScale ?? 1.0;
  const letterSpacingNum = activeStyle.letterSpacingNum ?? 0;
  const baselineShiftNum = activeStyle.baselineShiftNum ?? 0;
  const lineHeight = activeStyle.lineHeight;
  const textAlign = globalTextAlign;
  const verticalAlign = globalVerticalAlign;

  const fontSizeEn = Math.round(fontSizeKo * enScale);

  // 문장부호 커스텀 설정
  // 'all_en' -> 모든 아스키 문장부호/기호를 영문 서체로 오버라이드
  // 'all_ko' -> 모든 아스키 문장부호/기호를 한글 서체로 유지
  // 'individual' -> 기호별 개별 설정에 따라 결정
  const [punctuationRule, setPunctuationRule] = useState<"all_en" | "all_ko" | "individual">(() => {
    const stored = localStorage.getItem("font_harmony_workbench_punctuation_rule");
    return (stored === "all_en" || stored === "all_ko" || stored === "individual") ? stored : "individual";
  });
  
  // 개별 문장부호 그룹의 한글 서체 사용 여부 (ko = 한글 서체 사용, en = 영문 서체 사용)
  const [puncSettings, setPuncSettings] = useState<{ [key: string]: "ko" | "en" }>(() => {
    try {
      const stored = localStorage.getItem("font_harmony_workbench_punc_settings");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      period: "en",            // 마침표: 영문 서체 사용 (기본)
      comma: "en",             // 반점: 영문 서체 사용 (기본)
      ques_excl: "en",         // 물음표, 느낌표: 영문 서체 사용
      quotes: "en",            // 따옴표류: 영문 서체 사용
      brackets: "en",          // 괄호류: 영문 서체 사용
      math_dash: "en",         // 수식 및 대시/물결표: 영문 서체 사용
      colon_semicolon: "en",   // 콜론/세미콜론: 영문 서체 사용 (기본)
      etc: "en",               // 기타 기호: 영문 서체 사용
      number: "en",            // 숫자: 영문 서체 사용 (기본)
    };
  });

  // 각 문장부호 그룹의 상하좌우 조절 오프셋 (left/right: em 단위, shift: % 단위로 설정 후 css나 inline style에 반영)
  const [puncOffsets, setPuncOffsets] = useState<{ [key: string]: { left: number; right: number; shift: number } }>(() => {
    try {
      const stored = localStorage.getItem("font_harmony_workbench_punc_offsets");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      period: { left: 0, right: 0, shift: 0 },
      comma: { left: 0, right: 0, shift: 0 },
      ques_excl: { left: 0, right: 0, shift: 0 },
      quotes: { left: 0, right: 0, shift: 0 },
      brackets: { left: 0, right: 0, shift: 0 },
      math_dash: { left: 0, right: 0, shift: 0 },
      colon_semicolon: { left: 0, right: 0, shift: 0 },
      etc: { left: 0, right: 0, shift: 0 },
      number: { left: 0, right: 0, shift: 0 },
    };
  });

  // UI 팝업 중 활성화된 설정 팝업의 문장부호 그룹 ID
  const [activePuncPopup, setActivePuncPopup] = useState<string | null>(null);

  // 현재 클릭된 문장부호 항목의 Y 좌표 좌표 (플로팅 팝업 조절용)
  const [puncPopupY, setPuncPopupY] = useState<number>(200);

  // 밸런스 일괄 동기화 성공 피드백 상태
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);

  // 더블클릭 수정 모드 상태 - 활성화된 가중치 스타일 ID
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);

  // Guidelines feature states (per style weight)
  interface Guideline {
    id: string;
    type: "h" | "v"; // h = horizontal, v = vertical
    position: number; // percentage (0 to 100); h = text block, v = preview card
  }

  const [guidelines, setGuidelines] = useState<{ [styleId: string]: Guideline[] }>(() => {
    try {
      const stored = localStorage.getItem("font_harmony_workbench_guidelines");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse guidelines from localStorage", e);
    }
    return {
      "style-light": [],
      "style-regular": [],
      "style-medium": [],
      "style-bold": [],
    };
  });

  const [showGuidelinesGlobal, setShowGuidelinesGlobal] = useState<boolean>(() => {
    const stored = localStorage.getItem("font_harmony_workbench_show_guidelines_global");
    return stored !== "false";
  });
  const [hiddenGuidelineStyleIds, setHiddenGuidelineStyleIds] = useState<string[]>([]);
  const [selectedGuideline, setSelectedGuideline] = useState<{ styleId: string; id: string } | null>(null);
  const [draggingGuideline, setDraggingGuideline] = useState<{
    styleId: string;
    id: string;
    type: "h" | "v";
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedGuideline && (e.key === "Delete" || e.key === "Backspace")) {
        if (e.key === "Backspace") {
          const activeEl = document.activeElement;
          const isInput = activeEl && (
            activeEl.tagName === "INPUT" || 
            activeEl.tagName === "TEXTAREA" || 
            activeEl.getAttribute("contenteditable") === "true"
          );
          if (isInput) return;
          e.preventDefault();
        }
        
        const { styleId, id } = selectedGuideline;
        setGuidelines(prev => ({
          ...prev,
          [styleId]: (prev[styleId] || []).filter(g => g.id !== id)
        }));
        setSelectedGuideline(null);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingGuideline) return;

      const { styleId, id, type } = draggingGuideline;
      const guideElement = type === "h"
        ? document.getElementById(`preview-text-${styleId}`)
        : document.getElementById(`preview-card-${styleId}`);
      if (!guideElement) return;

      const rect = guideElement.getBoundingClientRect();
      let percent = 0;

      if (type === "h") {
        const relativeY = e.clientY - rect.top;
        percent = (relativeY / rect.height) * 100;
      } else {
        const relativeX = e.clientX - rect.left;
        percent = (relativeX / rect.width) * 100;
      }

      percent = Math.max(0, Math.min(100, percent));

      setGuidelines(prev => ({
        ...prev,
        [styleId]: (prev[styleId] || []).map(g => g.id === id ? { ...g, position: percent } : g)
      }));
    };

    const handleMouseUp = () => {
      if (draggingGuideline) {
        setDraggingGuideline(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selectedGuideline, draggingGuideline]);

  // 일괄 서체 업로드 대상 모델 정의 및 상태들
  interface BatchFontFile {
    id: string;
    file: File;
    name: string;
    targetLang: "KO" | "EN";
    targetStyleId: string; // style.id, "new_weight", or "none"
  }

  const [batchFonts, setBatchFonts] = useState<BatchFontFile[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isDragOverPage, setIsDragOverPage] = useState<boolean>(false);

  const getPunctuationGroup = (char: string): string | null => {
    if ([".", "．", "。"].includes(char)) return "period";
    if ([",", "，", "、"].includes(char)) return "comma";
    if (["?", "？", "!", "！"].includes(char)) return "ques_excl";
    if (
      ["'", "\"", "`", "‘", "’", "“", "”", "「", "」", "『", "』", "〃"].includes(char)
    ) return "quotes";
    if (["(", ")", "[", "]", "{", "}", "（", "）", "［", "］", "｛", "｝", "〈", "〉", "《", "》", "⟪", "⟫", "‹", "›", "«", "»", "【", "】"].includes(char)) return "brackets";
    if (["+", "-", "*", "/", "=", "<", ">", "＋", "－", "＊", "／", "＝", "＜", "＞", "±", "×", "÷", "~", "～", "—", "–", "―", "‑"].includes(char)) return "math_dash";
    if ([":", ";", "：", "；", "\\", "＼", "|", "｜"].includes(char)) return "colon_semicolon";
    if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "０", "１", "２", "３", "４", "５", "６", "７", "８", "９"].includes(char)) return "number";
    if (["@", "#", "$", "%", "^", "&", "＿", "_", "＠", "＃", "＄", "％", "＾", "＆"].includes(char)) return "etc";
    return null;
  };

  const isPunctuationChar = (char: string): boolean => {
    return getPunctuationGroup(char) !== null;
  };

  const isCharLatin = (char: string): boolean => {
    const code = char.charCodeAt(0);

    // Check punctuation group first so that full-width/smart punctuation is resolved by settings
    const group = getPunctuationGroup(char);
    if (group) {
      if (punctuationRule === "all_ko") return false;
      if (punctuationRule === "all_en") return true;
      if (punctuationRule === "individual") {
        return puncSettings[group] === "en";
      }
    }

    if (code > 255) return false;
    if (code === 32) return true; // Spacing always flows with Latin metrics
    return true;
  };

  // Focused state for real-time overlay transitions
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [cursorIndex, setCursorIndex] = useState<number>(0);

  const updateCursorIndex = () => {
    const textarea = specimenTextareaRef.current;
    if (textarea) {
      setCursorIndex(textarea.selectionStart);
    }
  };

  // Direct typing content area
  const [customText, setCustomText] = useState<string>(() => {
    const stored = localStorage.getItem("font_harmony_workbench_custom_text");
    return stored !== null && stored !== LEGACY_SPECIMEN_TEXT ? stored : DEFAULT_SPECIMEN_TEXT;
  });

  const setCustomTextWithSmartQuotes = (newText: string) => {
    let result = newText;
    // Replace double quotes
    result = result.replace(/(?:^|[\s([{])"/g, (match) => match.replace('"', '“'));
    result = result.replace(/"/g, '”');
    // Replace single quotes
    result = result.replace(/(?:^|[\s([{])'/g, (match) => match.replace("'", '‘'));
    result = result.replace(/'/g, '’');
    setCustomText(result);
  };

  // Local System Font Integration States
  const [uploadModalTab, setUploadModalTab] = useState<"file" | "device">("file");
  const [manualFontName, setManualFontName] = useState<string>("");
  const [scannedFonts, setScannedFonts] = useState<any[]>([]); 
  const [scannedFamilies, setScannedFamilies] = useState<string[]>([]); 
  const [scannedSearch, setScannedSearch] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [systemFontsLoaded, setSystemFontsLoaded] = useState<boolean>(false);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadTarget, setUploadTarget] = useState<"KO" | "EN">("KO");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFileName, setExportFileName] = useState<string>("");
  const [exportTTF, setExportTTF] = useState<boolean>(true);
  const [exportOTF, setExportOTF] = useState<boolean>(true);
  const [exportCSS, setExportCSS] = useState<boolean>(true);
  const [isPackaging, setIsPackaging] = useState<boolean>(false);
  const [packagingStep, setPackagingStep] = useState<number>(0);
  const [packComplete, setPackComplete] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fontBuffersRef = useRef<{ [fontId: string]: ArrayBuffer }>({});
  const specimenTextareaRef = useRef<HTMLTextAreaElement>(null);

  const createSystemFontMetadata = (familyName: string, language: "KO" | "EN"): FontMetadata => {
    const safeFamilyId = familyName
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    return {
      id: `local-system-${language.toLowerCase()}-${safeFamilyId || Date.now()}`,
      name: familyName,
      apiName: familyName,
      category: "sans-serif",
      developer: "기기 설치 글꼴",
      description: `'${familyName}' — 현재 기기에 설치된 글꼴입니다.`,
      languages: [language],
      vibeTags: ["System", "Local"],
    };
  };

  // Auto-resize the specimen textarea to fit its content precisely
  const adjustTextareaHeight = () => {
    const textarea = specimenTextareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [customText, fontSizeKo, lineHeight, letterSpacingKo, textAlign, verticalAlign]);

  // Synchronize Google Webfonts dynamically to document head
  useEffect(() => {
    const oldLink = document.getElementById("gfonts-dynamic-loader");
    if (oldLink) {
      oldLink.remove();
    }

    const loaders: string[] = [];
    if (englishFont && !englishFont.id.startsWith("local-")) {
      loaders.push(`${englishFont.apiName}:wght@300;400;500;700;800`);
    }
    if (koreanFont && !koreanFont.id.startsWith("local-")) {
      loaders.push(`${koreanFont.apiName}:wght@300;400;500;700;900`);
    }

    if (loaders.length > 0) {
      const link = document.createElement("link");
      link.id = "gfonts-dynamic-loader";
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${loaders.join("&family=")}&display=swap`;
      document.head.appendChild(link);
    }
  }, [englishFont, koreanFont]);

  // Set default export filename when fonts change
  useEffect(() => {
    const rawName = `${koreanFont.name}X${englishFont.name}`;
    const cleanName = rawName.replace(/\s+/g, "_");
    setExportFileName(cleanName);
  }, [englishFont, koreanFont]);

  // Synchronize custom cursorIndex back to the raw hidden textarea's physical selection
  useEffect(() => {
    const textarea = specimenTextareaRef.current;
    if (textarea && textarea.selectionStart !== cursorIndex) {
      textarea.selectionStart = cursorIndex;
      textarea.selectionEnd = cursorIndex;
    }
  }, [cursorIndex]);

  // Auto-save workbench layout & settings to localStorage to prevent loss on UI compilation or page reload
  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_style_instances", JSON.stringify(styleInstances));
  }, [styleInstances]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_punc_settings", JSON.stringify(puncSettings));
  }, [puncSettings]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_punc_offsets", JSON.stringify(puncOffsets));
  }, [puncOffsets]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_punctuation_rule", punctuationRule);
  }, [punctuationRule]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_guidelines", JSON.stringify(guidelines));
  }, [guidelines]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_custom_text", customText);
  }, [customText]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_global_text_align", globalTextAlign);
  }, [globalTextAlign]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_global_vertical_align", globalVerticalAlign);
  }, [globalVerticalAlign]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_active_style_id", activeStyleId);
  }, [activeStyleId]);

  useEffect(() => {
    localStorage.setItem("font_harmony_workbench_show_guidelines_global", String(showGuidelinesGlobal));
  }, [showGuidelinesGlobal]);

  // 즐겨찾기 (내 조합) 상태 및 로컬 스토리지 엔진 정의
  const [savedCombinations, setSavedCombinations] = useState<SavedCombination[]>(() => {
    try {
      const stored = localStorage.getItem("font_harmony_saved_combinations");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse saved combinations from localStorage", e);
      return [];
    }
  });

  const [newPresetName, setNewPresetName] = useState<string>("");

  const handleSaveCombination = (nameToSave: string) => {
    const trimmed = nameToSave.trim();
    const finalName = trimmed || `조합 ${savedCombinations.length + 1}`;
    
    const newCombination: SavedCombination = {
      id: `preset-${Date.now()}`,
      name: finalName,
      createdAt: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      punctuationRule,
      puncSettings,
      puncOffsets,
      styleInstances,
      activeStyleId
    };

    const updated = [newCombination, ...savedCombinations];
    setSavedCombinations(updated);
    localStorage.setItem("font_harmony_saved_combinations", JSON.stringify(updated));
    setNewPresetName(""); // Reset input field
  };

  const handleLoadCombination = (preset: SavedCombination) => {
    if (!preset) return;

    // Load punctuation rule
    if (preset.punctuationRule) {
      setPunctuationRule(preset.punctuationRule);
    }
    // Load punc settings
    if (preset.puncSettings) {
      const loadedPunc = { ...preset.puncSettings };
      if (loadedPunc.period_comma) {
        if (!loadedPunc.period) loadedPunc.period = loadedPunc.period_comma;
        if (!loadedPunc.comma) loadedPunc.comma = loadedPunc.period_comma;
      }
      setPuncSettings({
        period: "en",
        comma: "en",
        ques_excl: "en",
        quotes: "en",
        brackets: "en",
        math_dash: "en",
        colon_semicolon: "en",
        etc: "en",
        number: "en",
        ...loadedPunc
      });
    }
    // Load punc custom offsets
    if (preset.puncOffsets) {
      const loadedOffsets = { ...preset.puncOffsets };
      if (loadedOffsets.period_comma) {
        if (!loadedOffsets.period) loadedOffsets.period = { ...loadedOffsets.period_comma };
        if (!loadedOffsets.comma) loadedOffsets.comma = { ...loadedOffsets.period_comma };
      }
      setPuncOffsets({
        period: { left: 0, right: 0, shift: 0 },
        comma: { left: 0, right: 0, shift: 0 },
        ques_excl: { left: 0, right: 0, shift: 0 },
        quotes: { left: 0, right: 0, shift: 0 },
        brackets: { left: 0, right: 0, shift: 0 },
        math_dash: { left: 0, right: 0, shift: 0 },
        colon_semicolon: { left: 0, right: 0, shift: 0 },
        etc: { left: 0, right: 0, shift: 0 },
        number: { left: 0, right: 0, shift: 0 },
        ...loadedOffsets
      });
    } else {
      setPuncOffsets({
        period: { left: 0, right: 0, shift: 0 },
        comma: { left: 0, right: 0, shift: 0 },
        ques_excl: { left: 0, right: 0, shift: 0 },
        quotes: { left: 0, right: 0, shift: 0 },
        brackets: { left: 0, right: 0, shift: 0 },
        math_dash: { left: 0, right: 0, shift: 0 },
        colon_semicolon: { left: 0, right: 0, shift: 0 },
        etc: { left: 0, right: 0, shift: 0 },
        number: { left: 0, right: 0, shift: 0 },
      });
    }
    // Load style instances with fallback checks (prevent crashes)
    if (preset.styleInstances && preset.styleInstances.length > 0) {
      const sanitized = preset.styleInstances.map((style) => {
        // Resolve korean font
        const matchingKr = allKoreanFonts.find(f => f.id === style.koreanFont?.id) || style.koreanFont || allKoreanFonts[0];
        // Resolve english font
        const matchingEn = allEnglishFonts.find(f => f.id === style.englishFont?.id) || style.englishFont || allEnglishFonts[0];
        
        return {
          ...style,
          koreanFont: matchingKr,
          englishFont: matchingEn,
        };
      });
      setStyleInstances(sanitized);
      
      // Match active style ID or set to first loaded style
      const activeIdExists = sanitized.some(s => s.id === preset.activeStyleId);
      const targetActiveId = activeIdExists ? preset.activeStyleId : sanitized[0].id;
      setActiveStyleId(targetActiveId);

      const loadedActive = sanitized.find(s => s.id === targetActiveId) || sanitized[0];
      if (loadedActive) {
        setGlobalTextAlign(loadedActive.textAlign || "center");
        setGlobalVerticalAlign(loadedActive.verticalAlign || "center");
      }
    }
  };

  const handleDeleteCombination = (id: string) => {
    const updated = savedCombinations.filter(preset => preset.id !== id);
    setSavedCombinations(updated);
    localStorage.setItem("font_harmony_saved_combinations", JSON.stringify(updated));
  };

  // Reset workspace
  const handleResetWorkspace = () => {
    setStyleInstances(createDefaultStyleInstances());
    setActiveStyleId("style-regular");
    setGlobalTextAlign("center");
    setGlobalVerticalAlign("center");
    setPuncSettings({
      period: "en",
      comma: "en",
      ques_excl: "en",
      quotes: "en",
      brackets: "en",
      math_dash: "en",
      colon_semicolon: "en",
      etc: "en",
      number: "en",
    });
    setPuncOffsets({
      period: { left: 0, right: 0, shift: 0 },
      comma: { left: 0, right: 0, shift: 0 },
      ques_excl: { left: 0, right: 0, shift: 0 },
      quotes: { left: 0, right: 0, shift: 0 },
      brackets: { left: 0, right: 0, shift: 0 },
      math_dash: { left: 0, right: 0, shift: 0 },
      colon_semicolon: { left: 0, right: 0, shift: 0 },
      etc: { left: 0, right: 0, shift: 0 },
      number: { left: 0, right: 0, shift: 0 },
    });
    setCustomTextWithSmartQuotes(DEFAULT_SPECIMEN_TEXT);
    setGuidelines({
      "style-light": [],
      "style-regular": [],
      "style-medium": [],
      "style-bold": [],
    });
    setSelectedGuideline(null);
    setShowGuidelinesGlobal(true);
    setPunctuationRule("individual");

    // Clear workbench state cache from localStorage so it initializes cleanly
    const workbenchKeys = [
      "font_harmony_workbench_style_instances",
      "font_harmony_workbench_punc_settings",
      "font_harmony_workbench_punc_offsets",
      "font_harmony_workbench_punctuation_rule",
      "font_harmony_workbench_guidelines",
      "font_harmony_workbench_custom_text",
      "font_harmony_workbench_global_text_align",
      "font_harmony_workbench_global_vertical_align",
      "font_harmony_workbench_active_style_id",
      "font_harmony_workbench_show_guidelines_global"
    ];
    workbenchKeys.forEach(k => localStorage.removeItem(k));
  };

  // 일괄 서체 연동을 위한 배치 큐 파일 등록 가공 및 일괄 로더 처리 함수들
  const addFilesToBatchQueue = (files: File[]) => {
    const fontFiles = files.filter(file => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return ["ttf", "otf", "woff", "woff2"].includes(extension || "");
    });

    if (fontFiles.length === 0) {
      setUploadMessage({
        type: "error",
        text: "지원하지 않는 파일 포맷입니다. TTF, OTF, WOFF, WOFF2 파일을 연동해 주세요."
      });
      setIsBatchModalOpen(true);
      return;
    }

    const newBatchItems: BatchFontFile[] = fontFiles.map((file, index) => {
      const rawFontName = file.name.replace(/\.[^/.]+$/, "");
      const safeFontName = rawFontName
        .replace(/[-_]/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
      
      const finalFontName = `Local ${safeFontName}`;
      
      // 언어 자동 감지
      const nameLcase = file.name.toLowerCase();
      let guessedLang: "KO" | "EN" = "KO";
      if (
        nameLcase.includes("en") || 
        nameLcase.includes("latin") || 
        nameLcase.includes("eng") || 
        nameLcase.includes("roboto") || 
        nameLcase.includes("inter") || 
        nameLcase.includes("lato") || 
        nameLcase.includes("montserrat") || 
        nameLcase.includes("playfair") || 
        nameLcase.includes("space") ||
        (/^[a-z0-9\s-_.,()[\]]+$/i.test(rawFontName) && !nameLcase.includes("kr") && !nameLcase.includes("ko") && !nameLcase.includes("pretendard") && !nameLcase.includes("nanum"))
      ) {
        guessedLang = "EN";
      }

      // 가중치(세트 선택) 자동 감지
      let guessedStyleId = "new_weight"; // 기본값은 새 템플릿 세트로 등록
      
      const findMatchingStyleId = (keyword: string) => {
        const found = styleInstances.find(s => s.name.toLowerCase().includes(keyword));
        return found ? found.id : null;
      };

      if (nameLcase.includes("light") || nameLcase.includes("thin") || (nameLcase.includes("extra") && nameLcase.includes("light"))) {
        guessedStyleId = findMatchingStyleId("light") || "new_weight";
      } else if (nameLcase.includes("bold") || nameLcase.includes("black") || nameLcase.includes("heavy") || nameLcase.includes("thick")) {
        guessedStyleId = findMatchingStyleId("bold") || "new_weight";
      } else if (nameLcase.includes("regular") || nameLcase.includes("medium") || nameLcase.includes("normal") || nameLcase.includes("book")) {
        guessedStyleId = findMatchingStyleId("regular") || "new_weight";
      }

      return {
        id: `batch-item-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        file,
        name: finalFontName,
        targetLang: guessedLang,
        targetStyleId: guessedStyleId
      };
    });

    setBatchFonts(prev => [...prev, ...newBatchItems]);
    setIsBatchModalOpen(true);
    setUploadMessage(null);
  };

  const processBatchFonts = async () => {
    if (batchFonts.length === 0) return;
    setUploadMessage({ type: "info", text: "로컬 서체 바이너리 디코딩 및 전체 가중치 일괄 등록 코어 작동 중..." });
    
    let successCount = 0;
    let updatedStyleInstances = [...styleInstances];
    const newKoFonts: FontMetadata[] = [];
    const newEnFonts: FontMetadata[] = [];
    
    for (let i = 0; i < batchFonts.length; i++) {
      const item = batchFonts[i];
      const { file, name: fontName, targetLang, targetStyleId } = item;
      
      try {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(new Error("파일 읽기 실패"));
          reader.readAsArrayBuffer(file);
        });
        
        const fontFace = new FontFace(fontName, arrayBuffer);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);
        
        const safeId = `local-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
        fontBuffersRef.current[safeId] = arrayBuffer;
        
        const newMetadata: FontMetadata = {
          id: safeId,
          name: fontName,
          apiName: fontName,
          category: "sans-serif",
          developer: "로컬 설치 폰트 (일괄 연동)",
          description: `${file.name} — 사용자 일괄 드래그앤드롭으로 주입된 서체입니다.`,
          languages: [targetLang],
          vibeTags: ["Uploaded", "Batch"]
        };
        
        if (targetLang === "KO") {
          newKoFonts.push(newMetadata);
        } else {
          newEnFonts.push(newMetadata);
        }
        
        if (targetStyleId === "new_weight") {
          const nameGuess = fontName.replace("Local ", "");
          const newInstance: StyleInstance = {
            id: `style-custom-${Date.now()}-${i}`,
            name: nameGuess,
            koreanFont: targetLang === "KO" ? newMetadata : (KOREAN_FONTS.find(f => f.id === "ibm-plex-sans-kr") || KOREAN_FONTS[0]),
            englishFont: targetLang === "EN" ? newMetadata : (ENGLISH_FONTS.find(f => f.id === "inter") || ENGLISH_FONTS[0]),
            fontSizeKo: 24,
            enScale: 1.08,
            letterSpacingKo: -0.045,
            letterSpacingEn: 0,
            baselineShiftEn: -10,
            numScale: 1.0,
            letterSpacingNum: 0,
            baselineShiftNum: 0,
            lineHeight: 1.5,
            textAlign: "center",
            verticalAlign: "center",
          };
          updatedStyleInstances.push(newInstance);
        } else if (targetStyleId !== "none") {
          updatedStyleInstances = updatedStyleInstances.map(style => {
            if (style.id === targetStyleId) {
              return {
                ...style,
                koreanFont: targetLang === "KO" ? newMetadata : style.koreanFont,
                englishFont: targetLang === "EN" ? newMetadata : style.englishFont,
              };
            }
            return style;
          });
        }
        
        successCount++;
      } catch (e: any) {
        console.error(`Font load failed for ${file.name}:`, e);
      }
    }
    
    if (newKoFonts.length > 0) {
      setCustomKoreanFonts(prev => [...newKoFonts, ...prev]);
    }
    if (newEnFonts.length > 0) {
      setCustomEnglishFonts(prev => [...newEnFonts, ...prev]);
    }
    if (updatedStyleInstances.length > 0) {
      setStyleInstances(updatedStyleInstances);
      const lastItem = batchFonts[batchFonts.length - 1];
      if (lastItem.targetStyleId === "new_weight") {
        setActiveStyleId(updatedStyleInstances[updatedStyleInstances.length - 1].id);
      } else if (lastItem.targetStyleId !== "none") {
        setActiveStyleId(lastItem.targetStyleId);
      }
    }
    
    setUploadMessage({
      type: "success",
      text: `총 ${successCount}개의 서체를 성공적으로 로드하고 디자인 워크스페이스에 일괄 적용했습니다!`
    });
    
    setTimeout(() => {
      setIsBatchModalOpen(false);
      setUploadMessage(null);
      setBatchFonts([]);
    }, 1500);
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processFontFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processFontFile(file);
    }
  };

  const processFontFile = async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["ttf", "otf", "woff", "woff2"].includes(extension || "")) {
      setUploadMessage({
        type: "error",
        text: "지원하지 않는 파일 포맷입니다. TTF, OTF, WOFF, WOFF2 파일을 넣어주세요."
      });
      return;
    }

    setUploadMessage({ type: "info", text: "로컬 서체 바이너리 분석 및 로드 중..." });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          setUploadMessage({ type: "error", text: "파일을 디코딩하는 데 실패했습니다." });
          return;
        }

        const rawFontName = file.name.replace(/\.[^/.]+$/, "");
        const safeFontName = rawFontName.replace(/[^a-zA-Z0-9_-]/g, " ").trim();
        const finalFontName = `Local ${safeFontName}`;

        try {
          const fontFace = new FontFace(finalFontName, arrayBuffer);
          const loadedFace = await fontFace.load();
          document.fonts.add(loadedFace);

          const newMetadata: FontMetadata = {
            id: `local-${Date.now()}`,
            name: finalFontName,
            apiName: finalFontName,
            category: "sans-serif",
            developer: "로컬 설치 폰트",
            description: `${file.name} — 사용자가 연동한 로컬 커스텀 글꼴입니다.`,
            languages: uploadTarget === "KO" ? ["KO"] : ["EN"],
            vibeTags: ["Uploaded", "Custom"]
          };

          // Cache the binary buffer for compiler usage
          fontBuffersRef.current[newMetadata.id] = arrayBuffer;

          if (uploadTarget === "KO") {
            setCustomKoreanFonts(prev => [newMetadata, ...prev]);
            updateActiveStyle({ koreanFont: newMetadata });
          } else {
            setCustomEnglishFonts(prev => [newMetadata, ...prev]);
            updateActiveStyle({ englishFont: newMetadata });
          }

          setUploadMessage({
            type: "success",
            text: `[성공] ${finalFontName} 서체가 메모리에 성공적으로 적용되었습니다!`
          });

          setTimeout(() => {
            setIsUploadOpen(false);
            setUploadMessage(null);
          }, 1200);

        } catch (fontErr: any) {
          setUploadMessage({
            type: "error",
            text: `브라우저 폰트 주입 실패: ${fontErr.message || fontErr}`
          });
        }
      };
      reader.readAsArrayBuffer(file);

    } catch (err: any) {
      setUploadMessage({
        type: "error",
        text: `파일 읽기 오류: ${err.message || err}`
      });
    }
  };

  const handleScanSystemFonts = async () => {
    if (!('queryLocalFonts' in window)) {
      setUploadMessage({
        type: "error",
        text: "현재 브라우저는 로컬 설치 서체 검색 기능(Local Font Access API)을 지원하지 않습니다. Chrome/Edge 최신 버전을 활용하시거나 아래 '서체 이름 수동 기입'을 사용해 주세요!"
      });
      return;
    }

    setIsScanning(true);
    setUploadMessage({ type: "info", text: "컴퓨터에 설치된 모든 폰트 목록을 감지하는 중입니다..." });
    try {
      const fontsList = await (window as any).queryLocalFonts();
      if (!fontsList || fontsList.length === 0) {
        throw new Error("설치된 로컬 폰트를 찾을 수 없거나 사용자 전자의 권한 획득에 실패했습니다.");
      }
      
      const families = new Set<string>();
      fontsList.forEach((f: any) => {
        if (f.family && !f.family.startsWith('.')) {
          families.add(f.family);
        }
      });

      const sortedFamilies = Array.from(families).sort();
      setScannedFonts(fontsList);
      setScannedFamilies(sortedFamilies);
      setIsScanning(false);
      setUploadMessage({
        type: "success",
        text: `[감지 완료] 시스템에서 총 ${sortedFamilies.length}개의 고유 폰트 패밀리를 발견했습니다!`
      });
    } catch (err: any) {
      console.error("Local font access error:", err);
      setIsScanning(false);
      setUploadMessage({
        type: "error",
        text: `폰트 조회에 실패했습니다: ${err.message || err}`
      });
    }
  };

  const loadSystemFontsIntoSelectors = async () => {
    if (!("queryLocalFonts" in window)) {
      setUploadMessage({
        type: "error",
        text: "현재 실행 환경에서는 설치 글꼴 목록을 직접 읽을 수 없습니다. Chrome/Edge 또는 Electron 환경에서 사용할 수 있습니다."
      });
      setIsUploadOpen(true);
      setUploadModalTab("device");
      return;
    }

    setIsScanning(true);
    setUploadMessage({ type: "info", text: "설치된 글꼴 목록을 불러오는 중입니다..." });

    try {
      const fontsList = await (window as any).queryLocalFonts();
      const families = Array.from(new Set<string>(
        fontsList
          .map((font: any) => font.family)
          .filter((family: string | undefined): family is string => Boolean(family) && !family.startsWith("."))
      )).sort((a, b) => a.localeCompare(b));

      if (families.length === 0) {
        throw new Error("선택 가능한 설치 글꼴을 찾지 못했습니다.");
      }

      setScannedFonts(fontsList);
      setScannedFamilies(families);
      setCustomKoreanFonts(prev => {
        const existingIds = new Set(prev.map(font => font.id));
        const newFonts = families
          .map(family => createSystemFontMetadata(family, "KO"))
          .filter(font => !existingIds.has(font.id));
        return [...newFonts, ...prev];
      });
      setCustomEnglishFonts(prev => {
        const existingIds = new Set(prev.map(font => font.id));
        const newFonts = families
          .map(family => createSystemFontMetadata(family, "EN"))
          .filter(font => !existingIds.has(font.id));
        return [...newFonts, ...prev];
      });
      setSystemFontsLoaded(true);
      setUploadMessage({
        type: "success",
        text: `설치된 글꼴 ${families.length}개를 폰트 선택 목록에 추가했습니다.`
      });
      window.setTimeout(() => setUploadMessage(null), 1800);
    } catch (err: any) {
      console.error("Local font selector scan error:", err);
      setUploadMessage({
        type: "error",
        text: `설치 글꼴을 불러오지 못했습니다: ${err.message || err}`
      });
      setIsUploadOpen(true);
      setUploadModalTab("device");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRegisterSystemFont = async (familyName: string, isFromScan: boolean = false) => {
    if (!familyName.trim()) return;

    const fontNameClean = familyName.trim();
    const safeId = `local-sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    setUploadMessage({ type: "info", text: `'${fontNameClean}' 서체를 디자인 워크밴드에 등록 중...` });

    let fontFace: FontFace | null = null;
    let arrayBuffer: ArrayBuffer | null = null;

    try {
      if (isFromScan && scannedFonts.length > 0) {
        // Find matching FontData to see if we can read the raw binary file directly!
        const matchingFontData = scannedFonts.find(f => f.family === fontNameClean);
        if (matchingFontData) {
          setUploadMessage({ type: "info", text: `'${fontNameClean}' 폰트 파일 매핑 및 바이너리 데이터를 직접 로드하는 중...` });
          const blob = await matchingFontData.blob();
          arrayBuffer = await blob.arrayBuffer();

          // Register FontFace using browser's raw compiled buffer
          fontFace = new FontFace(fontNameClean, arrayBuffer);
          const loadedFace = await fontFace.load();
          document.fonts.add(loadedFace);

          // Cache binary buffer for packaging/merging!
          fontBuffersRef.current[safeId] = arrayBuffer;
        }
      }

      // Fallback: If we couldn't load binary buffer (or if typed name), load name-only using src: local()
      if (!fontFace) {
        fontFace = new FontFace(fontNameClean, `local("${fontNameClean}")`);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);
      }

      const newMetadata: FontMetadata = {
        id: safeId,
        name: fontNameClean,
        apiName: fontNameClean,
        category: "sans-serif",
        developer: isFromScan ? "로컬 설치 서체 (자동 연동)" : "로컬 설치 서체 (수동 기입)",
        description: isFromScan 
          ? `'${fontNameClean}' — 기기 자동 감지에 성공하여 Composite 패키징 병합 내보내기가 완벽히 지원됩니다.`
          : `'${fontNameClean}' — 사용자가 수동 연동한 로컬 폰트입니다 (화면 조판 미리보기 최적화).`,
        languages: uploadTarget === "KO" ? ["KO"] : ["EN"],
        vibeTags: [isFromScan ? "AutoLocal" : "ManualLocal", "System"]
      };

      if (uploadTarget === "KO") {
        setCustomKoreanFonts(prev => [newMetadata, ...prev]);
        updateActiveStyle({ koreanFont: newMetadata });
      } else {
        setCustomEnglishFonts(prev => [newMetadata, ...prev]);
        updateActiveStyle({ englishFont: newMetadata });
      }

      setUploadMessage({
        type: "success",
        text: `[연동 성공] '${fontNameClean}'가 ${uploadTarget === "KO" ? "한글" : "영문"} 폰트로 지정되었습니다!`
      });

      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadMessage(null);
        setManualFontName("");
      }, 1500);

    } catch (err: any) {
      console.error("Local register error:", err);
      // Perfect fallback to CSS local matching! Name-only registrations are 100% safe as a design option.
      const newMetadata: FontMetadata = {
        id: safeId,
        name: fontNameClean,
        apiName: fontNameClean,
        category: "sans-serif",
        developer: "로컬 설치 서체 (CSS 이름 매핑)",
        description: `'${fontNameClean}' — 사용자의 기기에 설치되어 있으면 브라우저 화면 상에 실시간 렌더링을 즉시 적용합니다.`,
        languages: uploadTarget === "KO" ? ["KO"] : ["EN"],
        vibeTags: ["LocalCSS", "System"]
      };

      if (uploadTarget === "KO") {
        setCustomKoreanFonts(prev => [newMetadata, ...prev]);
        updateActiveStyle({ koreanFont: newMetadata });
      } else {
        setCustomEnglishFonts(prev => [newMetadata, ...prev]);
        updateActiveStyle({ englishFont: newMetadata });
      }

      setUploadMessage({
        type: "success",
        text: `[등록 완료] '${fontNameClean}' CSS 매핑이 성공적으로 등록되었습니다!`
      });

      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadMessage(null);
        setManualFontName("");
      }, 1500);
    }
  };

  // Split text into Latin vs non-Latin chunks for custom layout control per style weight card
  const renderSpecimenTextForStyle = (style: StyleInstance, isCardFocused: boolean) => {
    if (!customText) {
      return (
        <span className="relative inline-block w-full text-[#1A1A1A]/30 italic font-sans text-sm select-none">
          {isCardFocused && (
            <span 
              key="caret-empty"
              className="absolute left-0 top-[0.1em] inline-block bg-[#3D67E6] w-[2.5px] animate-caret-blink select-none pointer-events-none"
              style={{
                height: `${style.fontSizeKo * 0.95}px`,
                boxShadow: "0 0 2px rgba(61, 103, 230, 0.4)",
              }}
            />
          )}
          여기에 한글과 영어 텍스트를 자유롭게 입력하여 조화를 확인해보세요...
        </span>
      );
    }

    const clampedIndex = Math.max(0, Math.min(customText.length, cursorIndex));
    const textBefore = customText.substring(0, clampedIndex);
    const textAfter = customText.substring(clampedIndex);

    const renderTextParts = (text: string, isBefore: boolean) => {
      if (!text) return [];

      interface TextCategoryPart {
        text: string;
        category: "ko" | "en" | "num";
      }

      const parts: TextCategoryPart[] = [];
      let currentWord = "";
      let currentCategory: "ko" | "en" | "num" = "ko";

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const isNum = getPunctuationGroup(char) === "number";
        const cat: "ko" | "en" | "num" = isNum ? "num" : (isCharLatin(char) ? "en" : "ko");
        
        if (i === 0) {
          currentWord = char;
          currentCategory = cat;
        } else if (cat === currentCategory) {
          currentWord += char;
        } else {
          parts.push({ text: currentWord, category: currentCategory });
          currentWord = char;
          currentCategory = cat;
        }
      }
      if (currentWord) {
        parts.push({ text: currentWord, category: currentCategory });
      }

      return parts.map((part, index) => {
        const key = `${isBefore ? "b" : "a"}-${index}-${part.text}`;
        if (part.category === "num") {
          const isLatin = isCharLatin(part.text[0]);
          const numFontName = isLatin ? style.englishFont.name : style.koreanFont.name;
          const numberStyle: React.CSSProperties = {
            fontFamily: `'${numFontName}', sans-serif`,
            fontSize: `${Math.round(style.fontSizeKo * (style.numScale ?? 1.0))}px`,
            letterSpacing: `${style.letterSpacingNum ?? 0}em`,
            position: "relative",
            top: `${-((style.baselineShiftNum ?? 0) / 100) * style.fontSizeKo}px`,
          };
          return (
            <span key={key} style={numberStyle} className="inline transition-all">
              {part.text}
            </span>
          );
        } else if (part.category === "en") {
          const englishStyle: React.CSSProperties = {
            fontFamily: `'${style.englishFont.name}', sans-serif`,
            fontSize: `${Math.round(style.fontSizeKo * style.enScale)}px`,
            letterSpacing: `${style.letterSpacingEn}em`,
            position: "relative",
            top: `${-(style.baselineShiftEn / 100) * style.fontSizeKo}px`,
          };
          return (
            <span key={key} style={englishStyle} className="inline transition-all">
              {part.text}
            </span>
          );
        } else {
          const koreanStyle: React.CSSProperties = {
            fontFamily: `'${style.koreanFont.name}', sans-serif`,
            fontSize: `${style.fontSizeKo}px`,
            letterSpacing: `${style.letterSpacingKo}em`,
          };
          return (
            <span key={key} style={koreanStyle} className="inline transition-all">
              {part.text}
            </span>
          );
        }
      });
    };

    const spansBefore = renderTextParts(textBefore, true);
    const spansAfter = renderTextParts(textAfter, false);

    const caretElement = isCardFocused ? (
      <span 
        key="caret"
        className="inline-block bg-[#3D67E6] w-[2.5px] animate-caret-blink select-none pointer-events-none align-middle"
        style={{
          height: `${style.fontSizeKo * 0.95}px`,
          marginLeft: "-1px",
          marginRight: "-1.5px",
          verticalAlign: "middle",
          position: "relative",
          top: "-0.05em",
          boxShadow: "0 0 2px rgba(61, 103, 230, 0.4)",
        }}
      />
    ) : null;

    return (
      <>
        {spansBefore}
        {caretElement}
        {spansAfter}
      </>
    );
  };

  // Modern character-by-character editing sync engine with 100% cursor alignment
  const renderEditableChars = (style: StyleInstance, isCardFocused: boolean) => {
    if (!customText) {
      return (
        <span 
          onClick={() => {
            setCursorIndex(0);
            specimenTextareaRef.current?.focus();
          }}
          className="relative inline-block w-full text-[#1A1A1A]/30 italic font-sans text-sm select-none cursor-text"
        >
          {isCardFocused && (
            <span 
              key="caret-empty"
              className="absolute left-0 top-[0.1em] inline-block bg-[#3D67E6] w-[2.5px] animate-caret-blink select-none pointer-events-none"
              style={{
                height: `${style.fontSizeKo * 0.95}px`,
                boxShadow: "0 0 2px rgba(61, 103, 230, 0.4)",
              }}
            />
          )}
          여기에 한글과 영어 텍스트를 자유롭게 입력하여 조화를 확인해보세요...
        </span>
      );
    }

    const elements: React.ReactNode[] = [];
    
    for (let idx = 0; idx < customText.length; idx++) {
      // If cursor is at this index, render caret before the character
      if (isCardFocused && cursorIndex === idx) {
        elements.push(
          <span 
            key={`caret-${idx}`}
            className="inline-block bg-[#3D67E6] w-[2.5px] animate-caret-blink select-none pointer-events-none align-middle"
            style={{
              height: `${style.fontSizeKo * 0.95}px`,
              marginLeft: "-1px",
              marginRight: "-1px",
              verticalAlign: "middle",
              position: "relative",
              top: "-0.05em",
              boxShadow: "0 0 2px rgba(61, 103, 230, 0.4)",
            }}
          />
        );
      }

      const char = customText[idx];
      const isLatin = isCharLatin(char);
      const puncGroup = getPunctuationGroup(char);
      const offset = puncGroup ? puncOffsets[puncGroup] : null;

      const handleCharClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCursorIndex(idx);
        specimenTextareaRef.current?.focus();
      };

      if (puncGroup === "number") {
        const numFontName = isLatin ? style.englishFont.name : style.koreanFont.name;
        const totalShiftPercent = (style.baselineShiftNum ?? 0) + (offset ? offset.shift : 0);
        const numberStyle: React.CSSProperties = {
          fontFamily: `'${numFontName}', sans-serif`,
          fontSize: `${Math.round(style.fontSizeKo * (style.numScale ?? 1.0))}px`,
          letterSpacing: `${style.letterSpacingNum ?? 0}em`,
          position: "relative",
          top: `${-(totalShiftPercent / 100) * style.fontSizeKo}px`,
          marginLeft: offset && offset.left !== 0 ? `${offset.left}em` : undefined,
          marginRight: offset && offset.right !== 0 ? `${offset.right}em` : undefined,
        };
        elements.push(
          <span 
            key={`char-${idx}`} 
            style={numberStyle} 
            onClick={handleCharClick}
            className="inline cursor-text hover:bg-black/5"
          >
            {char}
          </span>
        );
      } else if (isLatin) {
        const totalShiftPercent = style.baselineShiftEn + (offset ? offset.shift : 0);
        const englishStyle: React.CSSProperties = {
          fontFamily: `'${style.englishFont.name}', sans-serif`,
          fontSize: `${Math.round(style.fontSizeKo * style.enScale)}px`,
          letterSpacing: `${style.letterSpacingEn}em`,
          position: "relative",
          top: `${-(totalShiftPercent / 100) * style.fontSizeKo}px`,
          marginLeft: offset && offset.left !== 0 ? `${offset.left}em` : undefined,
          marginRight: offset && offset.right !== 0 ? `${offset.right}em` : undefined,
        };
        elements.push(
          <span 
            key={`char-${idx}`} 
            style={englishStyle} 
            onClick={handleCharClick}
            className="inline cursor-text hover:bg-black/5"
          >
            {char}
          </span>
        );
      } else {
        const koreanStyle: React.CSSProperties = {
          fontFamily: `'${style.koreanFont.name}', sans-serif`,
          fontSize: `${style.fontSizeKo}px`,
          letterSpacing: `${style.letterSpacingKo}em`,
          position: offset && offset.shift !== 0 ? "relative" : undefined,
          top: offset && offset.shift !== 0 ? `${-(offset.shift / 100) * style.fontSizeKo}px` : undefined,
          marginLeft: offset && offset.left !== 0 ? `${offset.left}em` : undefined,
          marginRight: offset && offset.right !== 0 ? `${offset.right}em` : undefined,
        };
        elements.push(
          <span 
            key={`char-${idx}`} 
            style={koreanStyle} 
            onClick={handleCharClick}
            className="inline cursor-text hover:bg-black/5"
          >
            {char}
          </span>
        );
      }
    }

    // Render ending caret if cursor is at the very end
    if (isCardFocused && cursorIndex === customText.length) {
      elements.push(
        <span 
          key="caret-end"
          className="inline-block bg-[#3D67E6] w-[2.5px] animate-caret-blink select-none pointer-events-none align-middle"
          style={{
            height: `${style.fontSizeKo * 0.95}px`,
            marginLeft: "-1px",
            marginRight: "-1px",
            verticalAlign: "middle",
            position: "relative",
            top: "-0.05em",
            boxShadow: "0 0 2px rgba(61, 103, 230, 0.4)",
          }}
        />
      );
    }

    // Render an end-of-text click target to make clicking after text set cursor to end
    elements.push(
      <span 
        key="end-target" 
        onClick={(e) => {
          e.stopPropagation();
          setCursorIndex(customText.length);
          specimenTextareaRef.current?.focus();
        }}
        className="inline-block w-4 h-[1em] cursor-text"
      />
    );

    return elements;
  };

  const fetchFontBuffer = async (font: FontMetadata): Promise<ArrayBuffer> => {
    if (font.id.startsWith("local-")) {
      const buffer = fontBuffersRef.current[font.id];
      if (buffer) return buffer;

      if (font.id.startsWith("local-system-") && scannedFonts.length > 0) {
        const matchingFontData = scannedFonts.find(f => f.family === font.name);
        if (matchingFontData) {
          const blob = await matchingFontData.blob();
          const systemBuffer = await blob.arrayBuffer();
          fontBuffersRef.current[font.id] = systemBuffer;
          return systemBuffer;
        }
      }

      throw new Error(`로컬 캐시에서 '${font.name}' 폰트 데이터를 찾을 수 없습니다.`);
    }

    try {
      const res = await fetch(`/api/fetch-font-ttf?family=${encodeURIComponent(font.name)}`);
      if (!res.ok) {
        throw new Error(`HTTP 에러: ${res.status}`);
      }
      return await res.arrayBuffer();
    } catch (e: any) {
      console.error(`서체 캐시 proxy 요청 중 에러:`, e);
      throw new Error(`웹 폰트 '${font.name}' 파일을 내려받을 수 없습니다. (상세: ${e.message || e})`);
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const zipUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = zipUrl;
    downloadLink.download = fileName;
    downloadLink.rel = "noopener";
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
    document.body.removeChild(downloadLink);

    window.setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
  };

  const handleTriggerExport = async () => {
    setIsPackaging(true);
    setPackagingStep(1);
    setPackComplete(false);
    setExportError(null);

    try {
      // Delay slightly for smooth transition
      await new Promise(r => setTimeout(r, 200));
      
      const rawFamilyName = (exportFileName || "CustomFontFamily").trim().replace(/\s+/g, "_");
      const cleanFileName = `${rawFamilyName}_Composite`;

      const zip = new JSZip();

      if (exportTTF || exportOTF) {
        // Compile each weight inside styleInstances list!
        for (let sIdx = 0; sIdx < styleInstances.length; sIdx++) {
          const style = styleInstances[sIdx];
        
        // Fetch Korean and English font buffers
        const krBuffer = await fetchFontBuffer(style.koreanFont);
        const enBuffer = await fetchFontBuffer(style.englishFont);

        // Parse using opentype.js
        const krFontParsed = opentype.parse(krBuffer);
        const enFontParsed = opentype.parse(enBuffer);

        const krUnitsPerEm = krFontParsed.unitsPerEm || 1000;
        const enUnitsPerEm = enFontParsed.unitsPerEm || 1000;

        const emAdjustmentScale = krUnitsPerEm / enUnitsPerEm;
        const totalScaleFactor = style.enScale * emAdjustmentScale;

        // baseline shift conversion (relative percentage of Em)
        const fontUnitsYShift = (style.baselineShiftEn / 100) * krUnitsPerEm;

        // letter spacing tracking conversion
        const fontUnitsSpacing = style.letterSpacingEn * krUnitsPerEm;

        // Build index of characters to compile and merge (ASCII + non-ASCII punctuation)
        const charsToProcess: string[] = [];
        for (let code = 32; code <= 126; code++) {
          charsToProcess.push(String.fromCharCode(code));
        }
        const nonAsciiPuncs = [
          "．", "。", "，", "、", "？", "！",
          "‘", "’", "“", "”", "〃",
          "（", "）", "［", "］", "｛", "｝", "〈", "〉", "《", "》",
          "＋", "－", "＊", "／", "＝", "＜", "＞", "±", "×", "÷",
          "：", "；", "＠", "＃", "＄", "％", "＾", "＆", "＿", "～", "＼", "｜"
        ];
        nonAsciiPuncs.forEach((c) => {
          if (!charsToProcess.includes(c)) {
            charsToProcess.push(c);
          }
        });

        // Execute merge processes
        for (const char of charsToProcess) {
          const puncGroup = getPunctuationGroup(char);
          const isNum = puncGroup === "number";

          if (puncGroup) {
            const useKorean = punctuationRule === "all_ko" || (punctuationRule === "individual" && puncSettings[puncGroup] === "ko");
            if (useKorean && !isNum) {
              continue; // Keep original Korean glyph in place, do not overwrite!
            }
            if (useKorean && isNum) {
              // Special in-place adjustment for Korean-styled numbers
              const krGlyph = krFontParsed.charToGlyph(char);
              if (!krGlyph) continue;

              const currentScale = style.numScale ?? 1.0;
              const currentShift = style.baselineShiftNum ?? 0;
              const currentSpacing = style.letterSpacingNum ?? 0;

              const originalPath = krGlyph.path;
              if (originalPath && originalPath.commands && (currentScale !== 1.0 || currentShift !== 0)) {
                const adjustedCommands = originalPath.commands.map((cmd: any) => {
                  const newCmd = { ...cmd };
                  if (newCmd.x !== undefined) newCmd.x = newCmd.x * currentScale;
                  if (newCmd.y !== undefined) newCmd.y = newCmd.y * currentScale + (currentShift / 100) * krUnitsPerEm;
                  if (newCmd.x1 !== undefined) newCmd.x1 = newCmd.x1 * currentScale;
                  if (newCmd.y1 !== undefined) newCmd.y1 = newCmd.y1 * currentScale + (currentShift / 100) * krUnitsPerEm;
                  if (newCmd.x2 !== undefined) newCmd.x2 = newCmd.x2 * currentScale;
                  if (newCmd.y2 !== undefined) newCmd.y2 = newCmd.y2 * currentScale + (currentShift / 100) * krUnitsPerEm;
                  return newCmd;
                });

                const newPath = new opentype.Path();
                newPath.commands = adjustedCommands;
                newPath.fill = originalPath.fill;
                newPath.stroke = originalPath.stroke;
                newPath.strokeWidth = originalPath.strokeWidth;
                krGlyph.path = newPath;
              }
              if (currentSpacing !== 0 || currentScale !== 1.0) {
                krGlyph.advanceWidth = Math.round(krGlyph.advanceWidth * currentScale + currentSpacing * krUnitsPerEm);
              }
              continue;
            }
          }

          const enGlyph = enFontParsed.charToGlyph(char);
          if (!enGlyph || enGlyph.index === 0) continue;

          const krGlyph = krFontParsed.charToGlyph(char);
          if (!krGlyph) continue;

          const currentScale = isNum ? (style.numScale ?? 1.0) : style.enScale;
          const currentShift = isNum ? (style.baselineShiftNum ?? 0) : style.baselineShiftEn;
          const currentSpacing = isNum ? (style.letterSpacingNum ?? 0) : style.letterSpacingEn;

          const currentScaleFactor = currentScale * emAdjustmentScale;
          const currentYShift = (currentShift / 100) * krUnitsPerEm;
          const currentSpacingUnits = currentSpacing * krUnitsPerEm;

          // Clone and adjust glyph paths
          const originalPath = enGlyph.path;
          if (originalPath && originalPath.commands) {
            const adjustedCommands = originalPath.commands.map((cmd: any) => {
              const newCmd = { ...cmd };
              if (newCmd.x !== undefined) newCmd.x = newCmd.x * currentScaleFactor;
              if (newCmd.y !== undefined) newCmd.y = newCmd.y * currentScaleFactor + currentYShift;
              if (newCmd.x1 !== undefined) newCmd.x1 = newCmd.x1 * currentScaleFactor;
              if (newCmd.y1 !== undefined) newCmd.y1 = newCmd.y1 * currentScaleFactor + currentYShift;
              if (newCmd.x2 !== undefined) newCmd.x2 = newCmd.x2 * currentScaleFactor;
              if (newCmd.y2 !== undefined) newCmd.y2 = newCmd.y2 * currentScaleFactor + currentYShift;
              return newCmd;
            });

            const newPath = new opentype.Path();
            newPath.commands = adjustedCommands;
            newPath.fill = originalPath.fill;
            newPath.stroke = originalPath.stroke;
            newPath.strokeWidth = originalPath.strokeWidth;

            krGlyph.path = newPath;
          }

          const newAdvanceWidth = Math.round(enGlyph.advanceWidth * currentScaleFactor + currentSpacingUnits);
          krGlyph.advanceWidth = newAdvanceWidth;
        }

        // Apply Korean letter spacing/tracking to remaining Korean glyphs
        const fontUnitsSpacingKo = Math.round(style.letterSpacingKo * krUnitsPerEm);
        if (fontUnitsSpacingKo !== 0) {
          const overriddenGlyphIndices = new Set<number>();
          for (const char of charsToProcess) {
            const puncGroup = getPunctuationGroup(char);
            if (puncGroup) {
              const useKorean = punctuationRule === "all_ko" || (punctuationRule === "individual" && puncSettings[puncGroup] === "ko");
              if (useKorean && puncGroup !== "number") {
                continue;
              }
            }
            const krGlyph = krFontParsed.charToGlyph(char);
            if (krGlyph) {
              overriddenGlyphIndices.add(krGlyph.index);
            }
          }

          // Advanced CJK & Hangul range checker to guarantee 100% precise Korean tracking application
          const isKoreanRange = (u: number) => {
            return (
              (u >= 0xAC00 && u <= 0xD7AF) || // Hangul Syllables
              (u >= 0x1100 && u <= 0x11FF) || // Hangul Jamo
              (u >= 0x3130 && u <= 0x318F) || // Hangul Compatibility Jamo
              (u >= 0x3200 && u <= 0x32FF) || // Enclosed CJK Letters and Months
              (u >= 0x4E00 && u <= 0x9FFF) || // CJK Unified Ideographs (Hanja)
              (u >= 0xF900 && u <= 0xFAFF)    // CJK Compatibility Ideographs
            );
          };

          for (let i = 0; i < krFontParsed.glyphs.length; i++) {
            const glyph = krFontParsed.glyphs.get(i);
            if (!glyph || glyph.index === 0 || glyph.advanceWidth <= 0) continue;
            
            const uni = glyph.unicode;
            const unis = glyph.unicodes || [];
            
            // Apply spacing to Korean CJK code ranges OR any non-ASCII glyph that was not explicitly overridden by Latin metrics
            const isLatinAscii = uni !== undefined && uni >= 32 && uni <= 126;
            const isKo = isKoreanRange(uni) || unis.some(u => isKoreanRange(u)) || (!isLatinAscii && !overriddenGlyphIndices.has(glyph.index));
            
            if (isKo) {
              glyph.advanceWidth = Math.round(glyph.advanceWidth + fontUnitsSpacingKo);
            }
          }
        }

        // Rename the font family in name tables
        const styleName = style.name.trim() || `Weight_${sIdx + 1}`;
        
        // Match Weight mapping to standard OpenType values
        if (krFontParsed.tables.os2) {
          const sNameLower = styleName.toLowerCase();
          let weightVal = 400;
          if (sNameLower.includes("thin")) weightVal = 100;
          else if (sNameLower.includes("extralight") || sNameLower.includes("extra light")) weightVal = 200;
          else if (sNameLower.includes("light")) weightVal = 300;
          else if (sNameLower.includes("medium")) weightVal = 500;
          else if (sNameLower.includes("semibold") || sNameLower.includes("semi bold") || sNameLower.includes("demi")) weightVal = 600;
          else if (sNameLower.includes("bold") && !sNameLower.includes("extra") && !sNameLower.includes("ultra")) weightVal = 700;
          else if (sNameLower.includes("extrabold") || sNameLower.includes("extra bold") || sNameLower.includes("heavy")) weightVal = 800;
          else if (sNameLower.includes("black") || sNameLower.includes("ultra")) weightVal = 900;
          krFontParsed.tables.os2.usWeightClass = weightVal;
        }

        // Generate dynamic timestamp-based version to force-bypass macOS/Windows and Adobe/Figma local font caches instantly
        const cacheBypassSuffix = Date.now().toString().slice(-4);
        const dynamicVersionStr = `Version 1.${cacheBypassSuffix}`;

        const platforms = ["unicode", "macintosh", "windows"];
        platforms.forEach(platform => {
          krFontParsed.names[platform] = {
            fontFamily: { en: cleanFileName },
            fontSubfamily: { en: styleName },
            fullName: { en: `${cleanFileName} ${styleName}` },
            postScriptName: { en: `${cleanFileName}-${styleName}` },
            uniqueID: { en: `${dynamicVersionStr};opentype;${cleanFileName}-${styleName}` },
            version: { en: dynamicVersionStr }
          };
        });

        delete (krFontParsed.names as any).fontFamily;
        delete (krFontParsed.names as any).fontSubfamily;
        delete (krFontParsed.names as any).fullName;
        delete (krFontParsed.names as any).postScriptName;
        delete (krFontParsed.names as any).uniqueID;
        delete (krFontParsed.names as any).version;

        const mergedFontBuffer = krFontParsed.toArrayBuffer();

        // Write compiled binaries directly to zip container instead of downloading individual files
        if (exportTTF) {
          zip.file(`${cleanFileName}-${styleName}.ttf`, mergedFontBuffer);
        }

          if (exportOTF) {
            zip.file(`${cleanFileName}-${styleName}.otf`, mergedFontBuffer);
          }
        }
      }

      setPackagingStep(4);
      await new Promise(r => setTimeout(r, 200));

      // Generate CSS code and manifest to represent variables and weights
      let cssContent = `/* 
  FontMix Hybrid Typography Compiled CSS
  Generated: ${new Date().toLocaleString()}
*/

`;

      styleInstances.forEach((style, sIdx) => {
        const styleName = style.name.trim() || `Weight_${sIdx + 1}`;
        let cssWeight = "400";
        const sNameLower = styleName.toLowerCase();
        if (sNameLower.includes("thin")) cssWeight = "100";
        else if (sNameLower.includes("extralight") || sNameLower.includes("extra light")) cssWeight = "200";
        else if (sNameLower.includes("light")) cssWeight = "300";
        else if (sNameLower.includes("medium")) cssWeight = "500";
        else if (sNameLower.includes("semibold") || sNameLower.includes("semi bold") || sNameLower.includes("demi")) cssWeight = "600";
        else if (sNameLower.includes("bold") && !sNameLower.includes("extra") && !sNameLower.includes("ultra")) cssWeight = "700";
        else if (sNameLower.includes("extrabold") || sNameLower.includes("extra bold") || sNameLower.includes("heavy")) cssWeight = "800";
        else if (sNameLower.includes("black") || sNameLower.includes("ultra")) cssWeight = "900";

        if (exportTTF) {
          cssContent += `@font-face {
  font-family: '${cleanFileName}';
  src: url('./${cleanFileName}-${styleName}.ttf') format('truetype');
  font-weight: ${cssWeight};
  font-style: normal;
  font-display: swap;
}\n`;
        }
        if (exportOTF) {
          cssContent += `@font-face {
  font-family: '${cleanFileName}';
  src: url('./${cleanFileName}-${styleName}.otf') format('opentype');
  font-weight: ${cssWeight};
  font-style: normal;
  font-display: swap;
}\n`;
        }
      });

      cssContent += `
/* Unified Custom Dual-Engine Typographer Class */
.hybrid-text-engine {
  line-height: ${lineHeight};
}

.hybrid-text-engine .lat-glyph {
  font-family: '${englishFont.name}', sans-serif;
  font-size: ${fontSizeEn}px;
  letter-spacing: ${letterSpacingEn}em;
  position: relative;
  top: ${-(baselineShiftEn / 100) * fontSizeKo}px;
  display: inline;
}

.hybrid-text-engine .num-glyph {
  font-family: '${englishFont.id.startsWith("local-") || !isCharLatin("0") ? koreanFont.name : englishFont.name}', sans-serif;
  font-size: ${Math.round(fontSizeKo * numScale)}px;
  letter-spacing: ${letterSpacingNum}em;
  position: relative;
  top: ${-(baselineShiftNum / 100) * fontSizeKo}px;
  display: inline;
}

.hybrid-text-engine .kr-glyph {
  font-family: '${koreanFont.name}', sans-serif;
  font-size: ${fontSizeKo}px;
  letter-spacing: ${letterSpacingKo}em;
  display: inline;
}
`;

      // Generate custom CSS rules for each punctuation group dynamically based on puncOffsets state
      let cssPuncRules = "";
      Object.keys(puncOffsets).forEach((groupId) => {
        const offset = puncOffsets[groupId];
        if (offset.left !== 0 || offset.right !== 0 || offset.shift !== 0) {
          cssPuncRules += `
.hybrid-text-engine .punc-${groupId} {
  ${offset.left !== 0 ? `margin-left: ${offset.left}em;` : ""}
  ${offset.right !== 0 ? `margin-right: ${offset.right}em;` : ""}
  ${offset.shift !== 0 ? `position: relative; top: ${-(offset.shift / 100)}em;` : ""}
}`;
        }
      });
      cssContent += cssPuncRules;

      zip.file(`${cleanFileName}-style.css`, cssContent);

      // Include Specimen HTML if requested
      if (exportCSS) {
        const specimenHtml = generateSpecimenHtml();
        zip.file(`${cleanFileName}-specimen.html`, specimenHtml);
      }

      // Add detailed documentation README.txt explaining installation and integration rules
      const readmeContent = `FontMix Composite Font Package
==============================

Congratulations! You have successfully exported your composite typography package:

- Combined Family Title: ${cleanFileName}
- Korean Source Font: ${koreanFont.name}
- English Source Font: ${englishFont.name}
- Total Integrated Weights: ${styleInstances.length} (${styleInstances.map(s => s.name).join(", ")})

What's inside this package:
---------------------------
1. Font Files:
   - TTF (.ttf) / OTF (.otf) composite fonts containing unified kerning, relative scale, and baseline aligned glyph offsets.
2. Web Integration:
   - ${cleanFileName}-specimen.html: An interactive local HTML testbed page.
   - ${cleanFileName}-style.css: Pre-configured CSS with @font-face mappings of your custom weights and layout variables.

How to install on Windows/macOS:
--------------------------------
1. Extract the ZIP package.
2. Select the .ttf (or .otf) files.
3. Right-click and choose "Install" (Windows) or double-click to open in Font Book (macOS) and click "Install".
4. The font family will show up in Figma, Adobe CC, Vector editors, MS Office, and system-wide programs under the single family name: "${cleanFileName}".

Thank you for designing with FontMix Studio!
`;
      zip.file("README.txt", readmeContent);

      // Package everything into one single ZIP file to prevent sequential popups
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `${cleanFileName}_Pack.zip`);

      setPackComplete(true);
      setIsPackaging(false);
    } catch (err: any) {
      console.error("폰트 컴파일 오류:", err);
      setExportError(err.message || "폰트를 병합하거나 패키징하는 도중 오류가 발생했습니다.");
      setIsPackaging(false);
    }
  };

  // Generate dynamic, bilingual self-contained spec sheet template string
  const generateSpecimenHtml = (): string => {
    const specName = exportFileName || `${koreanFont.name}X${englishFont.name}`;
    const enGoogleUrl = englishFont.id.startsWith("local-") 
      ? `/* Local font: ${englishFont.name} */`
      : `https://fonts.googleapis.com/css2?family=${englishFont.apiName}:wght@400;700&display=swap`;
    const krGoogleUrl = koreanFont.id.startsWith("local-")
      ? `/* Local font: ${koreanFont.name} */`
      : `https://fonts.googleapis.com/css2?family=${koreanFont.apiName}:wght@400;700&display=swap`;

    // Generate characters with discrete punctuation styling for high-fidelity rendering
    let specimenBodyHtml = "";
    for (let i = 0; i < customText.length; i++) {
      const char = customText[i];
      const puncGroup = getPunctuationGroup(char);
      const isLatin = isCharLatin(char);
      const escaped = char.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      const puncClass = puncGroup ? ` punc-${puncGroup}` : "";
      let fontClass = "kr-glyph";
      if (puncGroup === "number") {
        fontClass = "num-glyph";
      } else if (isLatin) {
        fontClass = "lat-glyph";
      }
      
      specimenBodyHtml += `<span class="${fontClass}${puncClass}">${escaped}</span>`;
    }

    // Generate custom CSS rules for each punctuation group dynamically based on puncOffsets state
    let puncCssRules = "";
    Object.keys(puncOffsets).forEach((groupId) => {
      const offset = puncOffsets[groupId];
      if (offset.left !== 0 || offset.right !== 0 || offset.shift !== 0) {
        puncCssRules += `
    .punc-${groupId} {
      ${offset.left !== 0 ? `margin-left: ${offset.left}em;` : ""}
      ${offset.right !== 0 ? `margin-right: ${offset.right}em;` : ""}
      ${offset.shift !== 0 ? `position: relative; top: ${-(offset.shift / 100)}em;` : ""}
    }`;
      }
    });

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${specName} - Hybrid Typography Specimen</title>
  ${!englishFont.id.startsWith("local-") ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${enGoogleUrl}" rel="stylesheet">` : ""}
  ${!koreanFont.id.startsWith("local-") ? `<link href="${krGoogleUrl}" rel="stylesheet">` : ""}

  <style>
    :root {
      --font-size-ko: ${fontSizeKo}px;
      --font-size-en: ${fontSizeEn}px;
      --font-size-num: ${Math.round(fontSizeKo * numScale)}px;
      --letter-spacing-ko: ${letterSpacingKo}em;
      --letter-spacing-en: ${letterSpacingEn}em;
      --letter-spacing-num: ${letterSpacingNum}em;
      --line-height: ${lineHeight};
      --baseline-shift-en: ${-(baselineShiftEn / 100) * fontSizeKo}px;
      --baseline-shift-num: ${-(baselineShiftNum / 100) * fontSizeKo}px;
      --bg-color: #F9F8F6;
      --text-color: #1A1A1A;
      --accent-color: #3D67E6;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", sans-serif;
      margin: 0;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }

    .wrapper {
      max-width: 900px;
      width: 100%;
      background: #FFFFFF;
      border: 1px solid rgba(26, 26, 26, 0.1);
      padding: 40px;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    }

    header {
      border-bottom: 1px solid rgba(26, 26, 26, 0.1);
      margin-bottom: 30px;
      padding-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meta-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--accent-color);
      font-weight: bold;
    }

    h1 {
      margin: 5px 0 0 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .specimen-canvas {
      background-color: #FCFAF6;
      border: 1px solid rgba(26, 26, 26, 0.05);
      padding: 60px 40px;
      margin: 40px 0;
      text-align: center;
      line-height: var(--line-height);
      word-break: break-all;
    }

    .lat-glyph {
      font-family: '${englishFont.name}', sans-serif;
      font-size: var(--font-size-en);
      letter-spacing: var(--letter-spacing-en);
      position: relative;
      top: var(--baseline-shift-en);
      display: inline;
    }

    .num-glyph {
      font-family: '${englishFont.id.startsWith("local-") || !isCharLatin("0") ? koreanFont.name : englishFont.name}', sans-serif;
      font-size: var(--font-size-num);
      letter-spacing: var(--letter-spacing-num);
      position: relative;
      top: var(--baseline-shift-num);
      display: inline;
    }

    .kr-glyph {
      font-family: '${koreanFont.name}', sans-serif;
      font-size: var(--font-size-ko);
      letter-spacing: var(--letter-spacing-ko);
      display: inline;
    }

    ${puncCssRules}

    .infobox {
      background: #FCFAF6;
      border-left: 3px solid var(--accent-color);
      padding: 20px;
      font-size: 13px;
      line-height: 1.6;
      margin-top: 30px;
    }

    .code-block {
      background: #1A1A1A;
      color: #F9F8F6;
      padding: 20px;
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 12px;
      border-radius: 3px;
      overflow-x: auto;
      margin-top: 20px;
    }

    .footer {
      margin-top: 60px;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(26, 26, 26, 0.4);
      text-align: center;
    }

    .btn-pack {
      display: inline-block;
      margin-top: 15px;
      background: var(--text-color);
      color: var(--bg-color);
      padding: 10px 18px;
      text-decoration: none;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.1em;
      border-radius: 2px;
    }

    .btn-pack:hover {
      background: var(--accent-color);
      color: white;
    }
  </style>
</head>
<body>

  <div class="wrapper">
    <header>
      <div>
        <div class="meta-title">Selected Hybrid Pairing</div>
        <h1>${koreanFont.name} × ${englishFont.name}</h1>
      </div>
    </header>

    <div class="specimen-canvas">
      ${specimenBodyHtml}
    </div>

    <div class="infobox">
      <strong>인스톨러 가이드 및 폰트 라이선스 규격 (Typeface Setup Info)</strong><br>
      • 한글 서체: ${koreanFont.name} (클래스: ${koreanFont.category}) — 라이선스: ${koreanFont.developer}<br>
      • 영문 서체: ${englishFont.name} (클래스: ${englishFont.category}) — 라이선스: ${englishFont.developer}<br>
      • 한글 및 영문 개별 사이즈와 자간 메트릭스가 통합 설계되어 혼합 렌더링 시 완벽한 심미적 조화를 제공합니다.<br>
      • 전체 행간: ${lineHeight}<br>
      ${exportTTF ? "• [검증됨] <strong>TTF (TrueType Format)</strong> 연동 빌더 활성화됨.<br>" : ""}
      ${exportOTF ? "• [검증됨] <strong>OTF (OpenType Format)</strong> 고해상도 그래픽 빌더 활성화됨.<br>" : ""}
    </div>

    <h3 style="margin-top: 40px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Production CSS Integration</h3>
    <textarea class="code-block" style="width: 100%; height: 260px; border: none; resize: none;" readonly>/* 1. Add web-fonts imports (if not local files) */
${!englishFont.id.startsWith("local-") ? `@import url('${enGoogleUrl}');` : "/* Local english font used. Please embed files. */"}
${!koreanFont.id.startsWith("local-") ? `@import url('${krGoogleUrl}');` : "/* Local korean font used. Please embed files. */"}

/* 2. Custom Dual-Engine Typographer Code */
.hybrid-text-engine {
  line-height: ${lineHeight};
}

.hybrid-text-engine .lat-glyph {
  font-family: '${englishFont.name}', sans-serif;
  font-size: ${fontSizeEn}px;
  letter-spacing: ${letterSpacingEn}em;
  position: relative;
  top: ${-(baselineShiftEn / 100) * fontSizeKo}px;
  display: inline;
}

.hybrid-text-engine .num-glyph {
  font-family: '${englishFont.id.startsWith("local-") || !isCharLatin("0") ? koreanFont.name : englishFont.name}', sans-serif;
  font-size: ${Math.round(fontSizeKo * numScale)}px;
  letter-spacing: ${letterSpacingNum}em;
  position: relative;
  top: ${-(baselineShiftNum / 100) * fontSizeKo}px;
  display: inline;
}

.hybrid-text-engine .kr-glyph {
  font-family: '${koreanFont.name}', sans-serif;
  font-size: ${fontSizeKo}px;
  letter-spacing: ${letterSpacingKo}em;
  display: inline;
}</textarea>

    ${(!englishFont.id.startsWith("local-") || !koreanFont.id.startsWith("local-")) ? `
    <div style="margin-top: 25px; border-top: 1px solid rgba(26,26,26,0.1); padding-top: 20px;">
      <strong>원본 폰트 파일 공식 다운로드:</strong><br>
      ${!englishFont.id.startsWith("local-") ? `<a href="https://fonts.google.com/specimen/${englishFont.apiName.replace("+", "_")}" target="_blank" class="btn-pack" style="margin-right: 10px;">Get ${englishFont.name}</a>` : ""}
      ${!koreanFont.id.startsWith("local-") ? `<a href="https://fonts.google.com/specimen/${koreanFont.apiName.replace("+", "_")}" target="_blank" class="btn-pack">Get ${koreanFont.name}</a>` : ""}
    </div>` : ""}

    <div class="footer">
      Generated via FontMix Studio Specimen Compiler
    </div>
  </div>

</body>
</html>`;
  };

  const generateAndDownloadSpecimen = () => {
    const specName = exportFileName || `${koreanFont.name}X${englishFont.name}`;
    const hContent = generateSpecimenHtml();
    const blob = new Blob([hContent], { type: "text/html;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${specName}_specimen.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);
  };

  const openUploadModal = (target: "KO" | "EN") => {
    setUploadTarget(target);
    setIsUploadOpen(true);
    setUploadMessage(null);
  };

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes("Files")) {
          setIsDragOverPage(true);
        }
      }}
      className="h-screen bg-[#F9F8F6] text-[#1A1A1A] flex flex-col font-sans overflow-hidden select-none relative"
    >
      
      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Central Display & Live Specimen Playground */}
        <section className="flex-1 bg-white p-8 flex flex-col overflow-hidden">
          
          {/* Unified Top Control Bar: Specimen Input on Left/Middle, Align Controls on Right */}
          <div className="flex items-center gap-4 mb-4 shrink-0 bg-white border border-[#1A1A1A]/10 pl-5 pr-4 py-2 rounded-2xl shadow-xs">
            {/* Input field (stretches to take space, pure input directly in the outer bar) */}
            <input
              id="specimen-top-live-input"
              type="text"
              value={customText}
              onChange={(e) => {
                setCustomTextWithSmartQuotes(e.target.value);
                setCursorIndex(e.target.selectionStart);
              }}
              placeholder="미리볼 한글과 라틴 혼합 텍스트를 입력해 보세요..."
              className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-sans text-left text-[#1A1A1A] py-1.5 placeholder-[#1A1A1A]/30"
            />

            {/* Align Controls on the Right */}
            <div className="flex items-center gap-3 shrink-0 select-none">
              {/* Text Horizontal Align (Overall global control) */}
              <div className="flex items-center gap-0.5 bg-[#1A1A1A]/5 p-0.5 rounded-lg" title="전체 단락 정렬 (Overall Horizontal Align)">
                <button
                  id="btn-align-left"
                  onClick={() => updateGlobalTextAlign("left")}
                  className={`p-1.5 rounded-md text-center flex items-center justify-center cursor-pointer transition-all ${
                    globalTextAlign === "left"
                      ? "bg-white text-[#3D67E6] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/80"
                  }`}
                  title="전체 왼쪽 정렬"
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  id="btn-align-center"
                  onClick={() => updateGlobalTextAlign("center")}
                  className={`p-1.5 rounded-md text-center flex items-center justify-center cursor-pointer transition-all ${
                    globalTextAlign === "center"
                      ? "bg-white text-[#3D67E6] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/80"
                  }`}
                  title="전체 가운데 정렬"
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>
                <button
                  id="btn-align-right"
                  onClick={() => updateGlobalTextAlign("right")}
                  className={`p-1.5 rounded-md text-center flex items-center justify-center cursor-pointer transition-all ${
                    globalTextAlign === "right"
                      ? "bg-white text-[#3D67E6] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/80"
                  }`}
                  title="전체 오른쪽 정렬"
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
                <button
                  id="btn-align-justify"
                  onClick={() => updateGlobalTextAlign("justify")}
                  className={`p-1.5 rounded-md text-center flex items-center justify-center cursor-pointer transition-all ${
                    globalTextAlign === "justify"
                      ? "bg-white text-[#3D67E6] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/80"
                  }`}
                  title="전체 양끝 정렬"
                >
                  <AlignJustify className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* THE GIANT DYNAMIC SPECIMEN PREVIEW (Stack of live previews, scrollable if they exceed the viewport) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {styleInstances.map((style) => {
              const idxInfo = styleInstances.findIndex((s) => s.id === style.id);
              const isActive = activeStyleId === style.id;
              const areGuidelinesVisible = showGuidelinesGlobal && !hiddenGuidelineStyleIds.includes(style.id);
              
              // Helper to update active style properties
              const updateThisStyle = (updates: Partial<StyleInstance>) => {
                setStyleInstances((prev) =>
                  prev.map((s) => (s.id === style.id ? { ...s, ...updates } : s))
                );
              };

              return (
                <div
                  key={style.id}
                  id={`preview-card-${style.id}`}
                  onClick={() => {
                    setActiveStyleId(style.id);
                    // Focus hidden textarea to ensure immediate typing synchronization
                    specimenTextareaRef.current?.focus();
                  }}
                  className={`border rounded-lg bg-[#F5F5F5] p-6 relative transition-all duration-200 cursor-text flex flex-col min-h-[160px] select-none ${
                    isActive
                      ? "border-[#3D67E6] ring-2 ring-[#3D67E6]/10 shadow-md"
                      : "border-[#1A1A1A]/10 opacity-70 hover:opacity-100 shadow-xs"
                  }`}
                >
                  {/* Guideline creation edge handles */}
                  {showGuidelinesGlobal && (
                    <>
                      {/* Top border handle */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2 bg-transparent hover:bg-[#3D67E6]/12 cursor-ns-resize z-20 group/handle flex items-center justify-center transition-colors"
                        title="클릭하고 아래로 드래그하여 수평 가이드라인 생성"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const el = document.getElementById(`preview-text-${style.id}`);
                          if (!el) return;
                          const rect = el.getBoundingClientRect();
                          const relativeY = e.clientY - rect.top;
                          const percent = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
                          const newId = `guide-h-${Date.now()}`;
                          setGuidelines(prev => ({
                            ...prev,
                            [style.id]: [...(prev[style.id] || []), { id: newId, type: "h", position: percent }]
                          }));
                          setSelectedGuideline({ styleId: style.id, id: newId });
                          setDraggingGuideline({ styleId: style.id, id: newId, type: "h" });
                        }}
                      >
                        <div className="w-12 h-1 bg-[#3D67E6]/25 rounded-full transition-colors opacity-0 group-hover/handle:opacity-100"></div>
                      </div>

                      {/* Left border handle */}
                      <div
                        className="absolute top-0 left-0 bottom-0 w-2 bg-transparent hover:bg-[#3D67E6]/12 cursor-ew-resize z-20 group/handle flex items-center justify-center transition-colors"
                        title="클릭하고 우측으로 드래그하여 수직 가이드라인 생성"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const el = document.getElementById(`preview-card-${style.id}`);
                          if (!el) return;
                          const rect = el.getBoundingClientRect();
                          const relativeX = e.clientX - rect.left;
                          const percent = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
                          const newId = `guide-v-${Date.now()}`;
                          setGuidelines(prev => ({
                            ...prev,
                            [style.id]: [...(prev[style.id] || []), { id: newId, type: "v", position: percent }]
                          }));
                          setSelectedGuideline({ styleId: style.id, id: newId });
                          setDraggingGuideline({ styleId: style.id, id: newId, type: "v" });
                        }}
                      >
                        <div className="h-12 w-1 bg-[#3D67E6]/25  rounded-full transition-colors opacity-0 group-hover/handle:opacity-100"></div>
                      </div>

                      {/* Right border handle */}
                      <div
                        className="absolute top-0 right-0 bottom-0 w-2 bg-transparent hover:bg-[#3D67E6]/12 cursor-ew-resize z-20 group/handle flex items-center justify-center transition-colors"
                        title="클릭하고 좌측으로 드래그하여 수직 가이드라인 생성"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const el = document.getElementById(`preview-card-${style.id}`);
                          if (!el) return;
                          const rect = el.getBoundingClientRect();
                          const relativeX = e.clientX - rect.left;
                          const percent = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
                          const newId = `guide-v-${Date.now()}`;
                          setGuidelines(prev => ({
                            ...prev,
                            [style.id]: [...(prev[style.id] || []), { id: newId, type: "v", position: percent }]
                          }));
                          setSelectedGuideline({ styleId: style.id, id: newId });
                          setDraggingGuideline({ styleId: style.id, id: newId, type: "v" });
                        }}
                      >
                        <div className="h-12 w-1 bg-[#3D67E6]/25 rounded-full transition-colors opacity-0 group-hover/handle:opacity-100"></div>
                      </div>
                    </>
                  )}

                  {/* Vertical guidelines rendering overlay */}
                  {areGuidelinesVisible && (guidelines[style.id] || []).map((guide) => {
                    const isSelected = selectedGuideline?.styleId === style.id && selectedGuideline?.id === guide.id;
                    if (guide.type !== "v") return null;
                    return (
                      <div
                        key={guide.id}
                        style={{ left: `${guide.position}%` }}
                        className="absolute top-0 bottom-0 w-3 -translate-x-1/2 cursor-ew-resize z-30 select-none flex justify-center"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedGuideline({ styleId: style.id, id: guide.id });
                          setDraggingGuideline({ styleId: style.id, id: guide.id, type: "v" });
                        }}
                      >
                        <div className={`h-full w-[1px] transition-colors ${isSelected ? "bg-[#3D67E6]/70" : "bg-[#3D67E6]/30"}`}></div>
                      </div>
                    );
                  })}

                  {/* Card Header Layer */}
                  <div className="flex items-center justify-between pb-1.5 mb-2.5 select-none relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 focus-within:ring-1 focus-within:ring-[#3D67E6] rounded px-1 -mx-1 py-0.5">
                        <input
                          type="text"
                          value={style.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            updateThisStyle({ name: e.target.value });
                          }}
                          className="text-[11px] font-bold font-sans text-[#1A1A1A] bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-24"
                          title="가중치 스타일 이름 수정 (Click to rename weight name)"
                        />
                      </div>
                    </div>

                    {/* Eye toggle onoff icon (appears ONLY when guidelines are created on this card) */}
                    {(guidelines[style.id] || []).length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHiddenGuidelineStyleIds(prev =>
                            prev.includes(style.id)
                              ? prev.filter(id => id !== style.id)
                              : [...prev, style.id]
                          );
                        }}
                        className={`p-1 rounded-md transition-all flex items-center justify-center cursor-pointer border ${
                          areGuidelinesVisible
                            ? "bg-[#3D67E6]/8 text-[#3D67E6] border-[#3D67E6]/25 shadow-xs"
                            : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/80 border-transparent bg-transparent"
                        }`}
                        title={areGuidelinesVisible ? "가이드라인 숨기기 (Hide Guidelines)" : "가이드라인 보이기 (Show Guidelines)"}
                      >
                        {areGuidelinesVisible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-[#1A1A1A]/40" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Character visual display container */}
                  <div
                    className={`flex-1 flex flex-col min-h-[100px] overflow-visible ${
                      globalVerticalAlign === "top"
                        ? "justify-start"
                        : globalVerticalAlign === "bottom"
                        ? "justify-end"
                        : "justify-center"
                    }`}
                  >
                    <div
                      id={`preview-text-${style.id}`}
                      style={{
                        lineHeight: style.lineHeight,
                        textAlign: globalTextAlign,
                        fontSize: `${style.fontSizeKo}px`,
                        letterSpacing: `${style.letterSpacingKo}em`,
                        fontFamily: `'${style.englishFont.name}', '${style.koreanFont.name}', sans-serif`,
                      }}
                      className="relative w-full break-words whitespace-pre-wrap leading-inherit select-text"
                    >
                      {areGuidelinesVisible && (guidelines[style.id] || []).map((guide) => {
                        const isSelected = selectedGuideline?.styleId === style.id && selectedGuideline?.id === guide.id;
                        if (guide.type !== "h") return null;
                        return (
                          <div
                            key={guide.id}
                            style={{ top: `${guide.position}%` }}
                            className="absolute left-0 right-0 h-3 -translate-y-1/2 cursor-ns-resize z-30 select-none flex items-center"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setSelectedGuideline({ styleId: style.id, id: guide.id });
                              setDraggingGuideline({ styleId: style.id, id: guide.id, type: "h" });
                            }}
                          >
                            <div className={`w-full h-[1px] transition-colors ${isSelected ? "bg-[#3D67E6]/70" : "bg-[#3D67E6]/30"}`}></div>
                          </div>
                        );
                      })}
                      {renderEditableChars(style, isActive)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invisible background captured textarea to parse physical IME / typing keystrokes safely */}
          <textarea
            ref={specimenTextareaRef}
            value={customText}
            onChange={(e) => {
              setCustomTextWithSmartQuotes(e.target.value);
              setCursorIndex(e.target.selectionStart);
            }}
            onSelect={updateCursorIndex}
            onKeyUp={updateCursorIndex}
            onKeyDown={updateCursorIndex}
            onMouseUp={updateCursorIndex}
            onClick={updateCursorIndex}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="sr-only select-none pointer-events-none opacity-0 absolute w-0 h-0"
          />

        </section>
        <aside className="w-[340px] border-l border-[#1a1a1a]/10 flex flex-col justify-between overflow-y-auto shrink-0 bg-[#FAFAFA] text-[#1D1D1D] font-sans pb-6">
          
          <div className="flex flex-col divide-y divide-[#1A1A1A]/8">
            
            {/* 01. FONT SELECTION & WEIGHTS SECTION */}
            <div className="flex flex-col">
              {/* CHROMISH TAB BAR HEADER FOR WEIGHTS (No FNT pill, no bottom border) */}
              <div className="bg-[#EAE8E4] px-3 flex items-end gap-1 select-none h-[35px] shrink-0">
                {/* Scrollable / Flex Tabs list */}
                <div className="flex-1 flex items-end gap-1 h-full overflow-x-auto whitespace-nowrap scrollbar-none">
                  {styleInstances.map((style) => {
                    const isEditing = editingStyleId === style.id;
                    return (
                      <div
                        key={style.id}
                        className="group relative flex items-end h-[28px]"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingStyleId(style.id);
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={style.name}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              updateStyleInstance(style.id, { name: e.target.value });
                            }}
                            onBlur={() => setEditingStyleId(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setEditingStyleId(null);
                              }
                            }}
                            className="bg-white text-[#3D67E6] text-[10px] font-black border-none outline-none focus:ring-0 p-0 m-0 w-20 text-center h-[28px] rounded-t-md z-20 px-2 font-sans"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setActiveStyleId(style.id);
                              specimenTextareaRef.current?.focus();
                            }}
                            className={`pl-3 ${styleInstances.length > 1 ? "pr-6" : "pr-3"} text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer h-[28px] select-none ${
                              activeStyleId === style.id
                                ? "bg-white text-[#3D67E6] rounded-t-md rounded-b-none shadow-[0_-1px_2px_rgba(0,0,0,0.03)] font-extrabold relative z-10"
                                : "text-[#1A1A1A]/55 hover:text-[#1A1A1A]/80 bg-transparent rounded-t-md rounded-b-none h-[25px]"
                            }`}
                            title="더블클릭하여 가중치 이름 수정"
                          >
                            {style.name}
                          </button>
                        )}
                        
                        {/* Delete weight button: visible on hover */}
                        {styleInstances.length > 1 && !isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const index = styleInstances.findIndex((s) => s.id === style.id);
                              const remaining = styleInstances.filter((s) => s.id !== style.id);
                              setStyleInstances(remaining);
                              if (activeStyleId === style.id) {
                                const fallbackIdx = index > 0 ? index - 1 : 0;
                                setActiveStyleId(remaining[fallbackIdx]?.id || remaining[0].id);
                              }
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full text-rose-500 hover:text-rose-600 hover:bg-white cursor-pointer flex items-center justify-center"
                            title="가중치 삭제"
                            style={{ transform: "translateY(-50%)" }}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Plus button inside the tabs row just like Chrome's "new tab" button! */}
                  <button
                    onClick={handleAddNewStyleInstance}
                    className="p-1 mb-1 text-[#3D67E6] hover:bg-black/5 rounded cursor-pointer transition-colors flex items-center justify-center w-[22px] h-[22px]"
                    title="새로운 가중치 추가 (Add Weight)"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 space-y-4 bg-white border-b border-[#1A1A1A]/10">
                <div className="text-[10px] font-bold text-[#888888] tracking-wider font-sans select-none">
                  Setting - <span className="text-[#3D67E6]">{activeStyle.name}</span>
                </div>

                {/* Korean Font Selection (for currently active weight) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-tight text-[#555555]">
                    <span>KOREAN BASE FONT ({activeStyle.name})</span>
                    <span className="text-[9px] text-[#3D67E6] font-extrabold font-mono">KO</span>
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      value={koreanFont.id}
                      onChange={(e) => {
                        if (e.target.value === "__load_system_fonts__") {
                          loadSystemFontsIntoSelectors();
                          return;
                        }
                        const found = allKoreanFonts.find(f => f.id === e.target.value);
                        if (found) {
                          updateActiveStyle({ koreanFont: found });
                        }
                      }}
                      className="flex-1 bg-white text-[#1a1a1a] border border-[#1a1a1a]/15 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3D67E6] font-medium font-sans cursor-pointer shadow-3xs"
                    >
                      {!allKoreanFonts.some(font => font.id === koreanFont.id) && (
                        <option value={koreanFont.id}>
                          {koreanFont.name}
                        </option>
                      )}
                      <option value="__load_system_fonts__" disabled={isScanning}>
                        {isScanning ? "설치 글꼴 불러오는 중..." : systemFontsLoaded ? "설치 글꼴 새로고침" : "설치 글꼴 불러오기"}
                      </option>
                      {allKoreanFonts.map(font => (
                        <option key={font.id} value={font.id}>
                          {font.id.startsWith("local-system-") ? `[Installed] ${font.name}` : font.id.startsWith("local-") ? `[Local] ${font.name}` : font.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => openUploadModal("KO")}
                      title="Upload local Hangul font (.ttf, .otf)"
                      className="bg-white hover:bg-[#F3F3F0] border border-[#1a1a1a]/15 px-2.5 rounded transition-all cursor-pointer text-[#3D67E6] flex items-center justify-center shadow-3xs"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {koreanFont.id.startsWith("local-") && (
                    <div className="text-[9px] text-[#3D67E6] font-semibold italic pl-1">
                      *{koreanFont.developer} Active
                    </div>
                  )}
                </div>

                {/* English Font Selection (for currently active weight) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-tight text-[#555555]">
                    <span>LATIN & NUMBERS FONT ({activeStyle.name})</span>
                    <span className="text-[9px] text-[#3D67E6] font-extrabold font-mono font-sans">EN / NUM</span>
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      value={englishFont.id}
                      onChange={(e) => {
                        if (e.target.value === "__load_system_fonts__") {
                          loadSystemFontsIntoSelectors();
                          return;
                        }
                        const found = allEnglishFonts.find(f => f.id === e.target.value);
                        if (found) {
                          updateActiveStyle({ englishFont: found });
                        }
                      }}
                      className="flex-1 bg-white text-[#1a1a1a] border border-[#1a1a1a]/15 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3D67E6] font-medium font-sans cursor-pointer shadow-3xs"
                    >
                      {!allEnglishFonts.some(font => font.id === englishFont.id) && (
                        <option value={englishFont.id}>
                          {englishFont.name}
                        </option>
                      )}
                      <option value="__load_system_fonts__" disabled={isScanning}>
                        {isScanning ? "설치 글꼴 불러오는 중..." : systemFontsLoaded ? "설치 글꼴 새로고침" : "설치 글꼴 불러오기"}
                      </option>
                      {allEnglishFonts.map(font => (
                        <option key={font.id} value={font.id}>
                          {font.id.startsWith("local-system-") ? `[Installed] ${font.name}` : font.id.startsWith("local-") ? `[Local] ${font.name}` : font.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => openUploadModal("EN")}
                      title="Upload local Latin font (.ttf, .otf)"
                      className="bg-white hover:bg-[#F3F3F0] border border-[#1a1a1a]/15 px-2.5 rounded transition-all cursor-pointer text-[#3D67E6] flex items-center justify-center shadow-3xs"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {englishFont.id.startsWith("local-") && (
                    <div className="text-[9px] text-[#3D67E6] font-semibold italic pl-1">
                      *{englishFont.developer} Active
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 02. PUNCTUATION CONTROL SECTION */}
            <div className="flex flex-col">
              {/* Punctuation control body content */}
              <div className="p-4 bg-white border-b border-[#1A1A1A]/10 space-y-3">
                <div className="text-[10px] font-bold text-[#888888] tracking-wider font-sans select-none">
                  Punctuation
                </div>
                <div className="grid grid-cols-1 gap-y-2 text-[10px] animate-fade-in pr-1 max-h-[300px] overflow-y-auto custom-sidebar-scrollbar pr-0.5">
                  {[
                    { id: "period", label: "Period", icon: ".", chars: "마침표" },
                    { id: "comma", label: "Comma", icon: ",", chars: "반점" },
                    { id: "ques_excl", label: "Question & Excl", icon: "?!", chars: "물음표, 느낌표" },
                    { id: "quotes", label: "Quotation Marks", icon: "‘“", chars: "작은/큰따옴표, 괄호따옴표" },
                    { id: "brackets", label: "Parentheses & Brackets", icon: "()", chars: "괄호 전체 (홑/대/겹괄호 등)" },
                    { id: "math_dash", label: "Math & Dash, Tilde", icon: "+~", chars: "수식, 엠/엔대쉬, 물결표" },
                    { id: "colon_semicolon", label: "Colon, Semicolon", icon: ":;", chars: "콜론, 세미콜론, 백슬래시, 바" },
                    { id: "number", label: "Numbers & Digits", icon: "12", chars: "숫자 전체 (0-9 및 전각 숫자)" },
                    { id: "etc", label: "Other Symbols", icon: "@#", chars: "기타 특수 심볼" },
                  ].map((group) => {
                    const currentFont = puncSettings[group.id] || "en";
                    const offset = puncOffsets[group.id] || { left: 0, right: 0, shift: 0 };
                    const isPopupActive = activePuncPopup === group.id;

                    return (
                      <div key={group.id} className="relative flex items-center justify-between py-1.5 border-b border-[#1A1A1A]/5 gap-2">
                        {/* Rich clickable button target for punctuation control popup */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const parentElement = document.querySelector("main");
                            if (parentElement) {
                              const parentRect = parentElement.getBoundingClientRect();
                              const relativeTop = rect.top - parentRect.top;
                              setPuncPopupY(relativeTop);
                            }
                            setActivePuncPopup(isPopupActive ? null : group.id);
                          }}
                          className={`flex items-center gap-1.5 cursor-pointer text-left select-none outline-none py-1.5 px-2 -ml-2 rounded-lg transition-all border ${
                            isPopupActive
                              ? "bg-[#3D67E6]/8 border-[#3D67E6]/20 text-[#3D67E6]"
                              : offset.left !== 0 || offset.right !== 0 || offset.shift !== 0
                              ? "bg-[#3D67E6]/3 border-[#3D67E6]/10 text-[#3D67E6]/90 font-medium hover:bg-[#3D67E6]/8"
                              : "bg-transparent border-transparent text-[#1A1A1A]/85 hover:bg-gray-100"
                          }`}
                          title={`${group.label} 미세 조절 패널 열기`}
                        >
                          <span className={`font-mono text-xs font-black w-5 text-center ${isPopupActive ? "text-[#3D67E6]" : "text-[#3D67E6]/80"}`}>
                            {group.icon}
                          </span>
                          <span className="text-[10.5px] font-bold leading-none flex items-center gap-1">
                            {group.label}
                          </span>
                        </button>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Figma-like visual adjust status pill or setting indicator */}
                          {(offset.left !== 0 || offset.right !== 0 || offset.shift !== 0) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const parentElement = document.querySelector("main");
                                if (parentElement) {
                                  const parentRect = parentElement.getBoundingClientRect();
                                  const relativeTop = rect.top - parentRect.top;
                                  setPuncPopupY(relativeTop);
                                }
                                setActivePuncPopup(isPopupActive ? null : group.id);
                              }}
                              className="text-[7.5px] bg-[#3D67E6]/10 text-[#3D67E6] px-1 py-0.5 rounded-sm font-mono font-bold leading-normal hover:bg-[#3D67E6]/15 transition-all cursor-pointer"
                              title="조정 상태 (클릭 시 조절 패널 열기)"
                            >
                              T:{offset.shift !== 0 ? (offset.shift > 0 ? `+${offset.shift}` : offset.shift) : "0"}%
                            </button>
                          )}

                          {/* Font Select Group Toggle (KR / EN) */}
                          <div className="flex rounded overflow-hidden border border-[#1a1a1a]/12 text-[8.5px] font-bold font-sans h-[22px] bg-white">
                            <button
                              type="button"
                              onClick={() => setPuncSettings(prev => ({ ...prev, [group.id]: "ko" }))}
                              className={`px-2 py-0.5 transition-all outline-none cursor-pointer ${currentFont === "ko" ? "bg-[#3D67E6] text-white" : "bg-transparent text-[#1A1A1A]/40 hover:bg-gray-100"}`}
                            >
                              KR
                            </button>
                            <button
                              type="button"
                              onClick={() => setPuncSettings(prev => ({ ...prev, [group.id]: "en" }))}
                              className={`px-2 py-0.5 transition-all outline-none cursor-pointer ${currentFont === "en" ? "bg-[#3D67E6] text-white" : "bg-transparent text-[#1A1A1A]/40 hover:bg-gray-100"}`}
                            >
                              EN
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 03. BALANCE SETTINGS SECTION (Stack Title/Pill Removed) */}
            <div className="flex flex-col">
              {/* Balance Parameters sliders row */}
              <div className="p-4 bg-white border-b border-[#1A1A1A]/10 space-y-4">
                <div className="flex justify-between items-center border-b border-[#1A1A1A]/5 pb-2 select-none">
                  <div className="text-[10px] font-bold text-[#888888] tracking-wider font-sans">
                    Setting - <span className="text-[#3D67E6]">{activeStyle.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyActiveStyleToAllWeights}
                    className="text-[9px] font-black text-[#3D67E6] bg-[#3D67E6]/8 hover:bg-[#3D67E6]/12 border border-[#3D67E6]/12 hover:border-[#3D67E6]/32 px-2 py-1 rounded transition-all cursor-pointer font-sans"
                    title="현재 가중치의 밸런스 설정(크기, 자간, 높이 등)을 다른 가중치에 똑같이 적용합니다."
                  >
                    {showSyncSuccess ? "Applied" : "Apply all"}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-[32px_repeat(3,minmax(0,1fr))] gap-2 items-end">
                    <span className="text-[9px] font-black text-[#3D67E6] uppercase tracking-wider select-none font-sans pb-3">KR</span>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">사이즈</span>
                      <ScrubbableInput value={fontSizeKo} onChange={(val) => updateActiveStyle({ fontSizeKo: val })} min={12} max={120} step={1} label="Korean Base Size" suffix="px" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">자간</span>
                      <ScrubbableInput value={letterSpacingKo} onChange={(val) => updateActiveStyle({ letterSpacingKo: val })} min={-0.12} max={0.20} step={0.001} label="Korean Letter Spacing" suffix="em" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">행간</span>
                      <ScrubbableInput value={lineHeight} onChange={(val) => updateActiveStyle({ lineHeight: val })} min={1.0} max={2.5} step={0.01} label="Line Height" suffix="em" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[32px_repeat(3,minmax(0,1fr))] gap-2 items-end">
                    <span className="text-[9px] font-black text-[#3D67E6] uppercase tracking-wider select-none font-sans pb-3">EN</span>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">사이즈</span>
                      <ScrubbableInput value={enScale} onChange={(val) => updateActiveStyle({ enScale: val })} min={0.50} max={1.80} step={0.01} label="English Relative Scale" suffix="x" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">자간</span>
                      <ScrubbableInput value={letterSpacingEn} onChange={(val) => updateActiveStyle({ letterSpacingEn: val })} min={-0.12} max={0.20} step={0.001} label="English Letter Spacing" suffix="em" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">베이스라인</span>
                      <ScrubbableInput value={baselineShiftEn} onChange={(val) => updateActiveStyle({ baselineShiftEn: val })} min={-20} max={20} step={0.1} label="English Baseline" suffix="%" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[32px_repeat(3,minmax(0,1fr))] gap-2 items-end">
                    <span className="text-[9px] font-black text-[#3D67E6] uppercase tracking-wider select-none font-sans pb-3">NUM</span>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">사이즈</span>
                      <ScrubbableInput value={numScale} onChange={(val) => updateActiveStyle({ numScale: val })} min={0.50} max={1.80} step={0.01} label="Number Relative Scale" suffix="x" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">자간</span>
                      <ScrubbableInput value={letterSpacingNum} onChange={(val) => updateActiveStyle({ letterSpacingNum: val })} min={-0.12} max={0.20} step={0.001} label="Number Letter Spacing" suffix="em" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[8.5px] font-bold text-[#888888] uppercase block pl-0.5 select-none font-sans">베이스라인</span>
                      <ScrubbableInput value={baselineShiftNum} onChange={(val) => updateActiveStyle({ baselineShiftNum: val })} min={-20} max={20} step={0.1} label="Number Baseline" suffix="%" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Action Zone: Reset & Export Controls inside sidebar bottom */}
          <div className="px-4 space-y-2 mt-auto pt-6 shrink-0 select-none">
            <button
              onClick={() => setIsExportOpen(true)}
              className="w-full bg-[#3D67E6] hover:bg-[#2C52C6] text-white text-[11px] font-bold uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#1a1a1a]/10 shadow-xs active:scale-[0.98] rounded font-sans"
            >
              <Download className="h-4 w-4" />
              EXPORT
            </button>
          </div>

        </aside>

        {/* Floating Punctuation Metric Adjuster (to the left of the sidebar, hovering over live specimen) */}
        {activePuncPopup && (() => {
          const group = [
            { id: "period", label: "Period (마침표)", icon: ".", chars: "마침표" },
            { id: "comma", label: "Comma (반점)", icon: ",", chars: "반점" },
            { id: "ques_excl", label: "Question & Excl", icon: "?!", chars: "물음표, 느낌표" },
            { id: "quotes", label: "Quotation Marks", icon: "‘“", chars: "작은/큰따옴표, 괄호따옴표" },
            { id: "brackets", label: "Parentheses & Brackets", icon: "()", chars: "괄호 전체 (홑/대/겹괄호 등)" },
            { id: "math_dash", label: "Math & Dash, Tilde", icon: "+~", chars: "수식, 엠/엔대쉬, 물결표" },
            { id: "colon_semicolon", label: "Colon, Semicolon", icon: ":;", chars: "콜론, 세미콜론, 백슬래시, 바" },
            { id: "number", label: "Numbers & Digits", icon: "12", chars: "숫자 전체 (0-9 및 전각 숫자)" },
            { id: "etc", label: "Other Symbols", icon: "@#", chars: "기타 특수 심볼" }
          ].find(g => g.id === activePuncPopup);
          
          if (!group) return null;
          
          const offset = puncOffsets[group.id] || { left: 0, right: 0, shift: 0 };
          
          return (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-[345px] z-50 w-[240px] bg-white border border-[#1A1A1A]/12 rounded-xl p-4 text-[#1A1A1A] select-none font-sans text-xs space-y-4 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] animate-fade-in border-l-4 border-l-[#3D67E6]"
              style={{
                top: `${Math.min(Math.max(16, puncPopupY - 50), window.innerHeight - 280)}px`
              }}
            >
              {/* Popup Header with Close Cross */}
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/8 pb-2">
                <span className="font-extrabold text-[#1A1A1A]/90 text-[11px] flex items-center gap-1.5 font-sans">
                  <span className="text-[#3D67E6] font-mono text-xs font-black">{group.icon}</span>
                  {group.label} 조절
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPuncOffsets(prev => ({
                        ...prev,
                        [group.id]: { left: 0, right: 0, shift: 0 }
                      }));
                    }}
                    className="text-[9px] text-[#3D67E6] font-bold hover:underline bg-transparent cursor-pointer"
                  >
                    초기화
                  </button>
                  <button 
                    onClick={() => setActivePuncPopup(null)}
                    className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]/80 p-0.5 rounded cursor-pointer transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>

              {/* LEFT SPACE (MARGIN-LEFT) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-[#1A1A1A]/60 font-mono">
                  <span>좌측 여백 (Left Space)</span>
                  <span className="font-extrabold text-[#3D67E6]">{offset.left > 0 ? `+${offset.left.toFixed(2)}` : offset.left.toFixed(2)}em</span>
                </div>
                <input
                  type="range"
                  min="-0.25"
                  max="0.25"
                  step="0.01"
                  value={offset.left}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPuncOffsets(prev => ({
                      ...prev,
                      [group.id]: { ...prev[group.id], left: val }
                    }));
                  }}
                  className="w-full accent-[#3D67E6] h-1.5 cursor-pointer bg-gray-100 rounded-lg appearance-none"
                />
              </div>

              {/* RIGHT SPACE (MARGIN-RIGHT) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-[#1A1A1A]/60 font-mono">
                  <span>우측 여백 (Right Space)</span>
                  <span className="font-extrabold text-[#3D67E6]">{offset.right > 0 ? `+${offset.right.toFixed(2)}` : offset.right.toFixed(2)}em</span>
                </div>
                <input
                  type="range"
                  min="-0.25"
                  max="0.25"
                  step="0.01"
                  value={offset.right}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPuncOffsets(prev => ({
                      ...prev,
                      [group.id]: { ...prev[group.id], right: val }
                    }));
                  }}
                  className="w-full accent-[#3D67E6] h-1.5 cursor-pointer bg-gray-100 rounded-lg appearance-none"
                />
              </div>

              {/* BASELINE HEIGHT SHIFT (TOP RELATIVE PERCENT) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-[#1A1A1A]/60 font-mono">
                  <span>상하 위치 (Baseline % Shift)</span>
                  <span className="font-extrabold text-[#3D67E6]">{offset.shift > 0 ? `+${offset.shift}` : offset.shift}%</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={offset.shift}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setPuncOffsets(prev => ({
                      ...prev,
                      [group.id]: { ...prev[group.id], shift: val }
                    }));
                  }}
                  className="w-full accent-[#3D67E6] h-1.5 cursor-pointer bg-gray-100 rounded-lg appearance-none"
                />
              </div>
            </div>
          );
        })()}

      </main>

      {/* 🚀 드래그 앤 드롭 글로벌 오버레이 */}
      {isDragOverPage && (
        <div 
          onDragLeave={() => setIsDragOverPage(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverPage(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              addFilesToBatchQueue(Array.from(e.dataTransfer.files));
            }
          }}
          className="fixed inset-0 bg-[#3D67E6]/15 backdrop-blur-md z-[100] flex flex-col items-center justify-center pointer-events-auto transition-all duration-300"
        >
          <div className="bg-white border-2 border-dashed border-[#3D67E6] rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl animate-pulse select-none pointer-events-none">
            <div className="w-16 h-16 bg-[#3D67E6]/10 rounded-full flex items-center justify-center text-[#3D67E6]">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            <div className="text-center space-y-1.5 font-sans">
              <h3 className="text-sm font-extrabold text-[#1A1A1A] tracking-tight uppercase">여기에 드롭하여 한 번에 등록</h3>
              <p className="text-xs text-gray-500 font-bold">
                여러 개의 폰트 파일(.ttf, .otf, .woff, .woff2)을 드래그앤드랍하여 동시 연동할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 일괄 서체 연동 설정 팝업 (Batch Font List Settings) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#1a1a1a]/15 max-w-2xl w-full rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans text-[#1A1A1A]">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-[#1a1a1a]/10 bg-[#FCFAF6]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#3D67E6]" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1a1a1a]">
                  드래그앤드롭 일괄 서체 연동 관리자
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setBatchFonts([]);
                  setUploadMessage(null);
                }}
                className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] p-2 cursor-pointer transition-colors"
                title="닫기"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1 max-h-[500px] overflow-y-auto custom-sidebar-scrollbar">
              
              {/* Info Tips & Bulk controls */}
              <div className="bg-[#3D67E6]/5 border border-[#3D67E6]/15 rounded-xl p-3.5 space-y-2.5">
                <div className="text-[10px] uppercase font-black text-[#3D67E6] tracking-wider select-none">
                  ⚡ 퀵 벌크 일괄 제어판
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFonts(prev => prev.map(f => ({ ...f, targetLang: "KO" })));
                    }}
                    className="bg-white border border-[#1A1A1A]/10 hover:border-[#3D67E6] hover:text-[#3D67E6] text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                  >
                    모든 파일 한글(KO) 지정
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFonts(prev => prev.map(f => ({ ...f, targetLang: "EN" })));
                    }}
                    className="bg-white border border-[#1A1A1A]/10 hover:border-[#3D67E6] hover:text-[#3D67E6] text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                  >
                    모든 파일 라틴/영문(EN) 지정
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFonts(prev => prev.map(f => ({ ...f, targetStyleId: "new_weight" })));
                    }}
                    className="bg-white border border-[#1A1A1A]/10 hover:border-[#3D67E6] hover:text-[#3D67E6] text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                  >
                    모두 새 가중치 탭 개설
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFonts(prev => prev.map(f => ({ ...f, targetStyleId: "none" })));
                    }}
                    className="bg-white border border-[#1A1A1A]/10 hover:border-[#3D67E6] hover:text-[#3D67E6] text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                  >
                    모두 보관함 등록만 (미지정)
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {uploadMessage && (
                <div className={`p-3 rounded-lg text-xs font-bold ${
                  uploadMessage.type === "success" 
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15" 
                    : uploadMessage.type === "error"
                    ? "bg-rose-500/10 text-rose-600 border border-rose-500/15"
                    : "bg-[#3D67E6]/10 text-[#3D67E6] border border-[#3D67E6]/15"
                }`}>
                  {uploadMessage.text}
                </div>
              )}

              {/* Files Queue List */}
              <div className="space-y-3">
                <span className="text-[10px] font-black tracking-wider uppercase text-gray-400 block select-none">
                  등록 및 맵핑할 폰트 파일 목록 ({batchFonts.length}개)
                </span>
                
                {batchFonts.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#1a1a1a]/10 rounded-xl bg-gray-50/50">
                    <p className="text-xs text-gray-400 font-bold">
                      업로드된 폰트 파일이 없습니다. 파일을 더 길게 끌어다 놓아주세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-0.5 custom-sidebar-scrollbar select-none">
                    {batchFonts.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-gray-50 border border-[#1A1A1A]/8 px-4 py-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs hover:border-[#3D67E6]/30 transition-all"
                      >
                        {/* File Name & Display Sub-text */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                            <span>{item.file.name.split(".").pop()?.toUpperCase()}</span>
                            <span>•</span>
                            <span>{(item.file.size / 1024).toFixed(0)} KB</span>
                          </div>
                          
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              setBatchFonts(prev => prev.map(f => f.id === item.id ? { ...f, name: e.target.value } : f));
                            }}
                            className="w-full bg-white text-xs font-bold px-2.5 py-1 border border-[#1A1A1A]/10 rounded focus:outline-none focus:border-[#3D67E6] focus:ring-0"
                            placeholder="폰트 이름 기입"
                          />
                        </div>

                        {/* Config Column: Language + Position style weight assignments */}
                        <div className="flex items-center gap-3.5 shrink-0">
                          
                          {/* Lang Select */}
                          <div className="flex items-center gap-1 border border-[#1A1A1A]/10 bg-white p-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setBatchFonts(prev => prev.map(f => f.id === item.id ? { ...f, targetLang: "KO" } : f));
                              }}
                              className={`text-[9px] font-black px-2 py-1 rounded-md transition-all cursor-pointer ${
                                item.targetLang === "KO"
                                  ? "bg-[#3D67E6] text-white shadow-3xs font-extrabold"
                                  : "text-gray-400 hover:text-gray-700 bg-transparent"
                              }`}
                            >
                              한글 (KO)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBatchFonts(prev => prev.map(f => f.id === item.id ? { ...f, targetLang: "EN" } : f));
                              }}
                              className={`text-[9px] font-black px-2 py-1 rounded-md transition-all cursor-pointer ${
                                item.targetLang === "EN"
                                  ? "bg-[#3D67E6] text-white shadow-3xs font-extrabold"
                                  : "text-gray-400 hover:text-gray-700 bg-transparent"
                              }`}
                            >
                              Latin (EN)
                            </button>
                          </div>

                          {/* Weight Target Select Dropdown */}
                          <select
                            value={item.targetStyleId}
                            onChange={(e) => {
                              setBatchFonts(prev => prev.map(f => f.id === item.id ? { ...f, targetStyleId: e.target.value } : f));
                            }}
                            className="bg-white text-[10px] font-bold border border-[#1A1A1A]/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#3D67E6] cursor-pointer shadow-3xs"
                          >
                            <option value="new_weight">새 가중치(세트)로 추가</option>
                            <option value="none">라이브러리에만 추가 (미지정)</option>
                            {styleInstances.map((style) => (
                              <option key={style.id} value={style.id}>
                                가중치: {style.name}에 할당
                              </option>
                            ))}
                          </select>

                          {/* Remove singular item from batch queue */}
                          <button
                            type="button"
                            onClick={() => {
                              setBatchFonts(prev => prev.filter(f => f.id !== item.id));
                            }}
                            className="text-gray-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-all cursor-pointer animate-delay-200"
                            title="목록에서 제거"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Browse to add more manually into queue */}
              <div className="flex justify-center border border-dashed border-[#3D67E6]/25 rounded-xl p-4 bg-[#3D67E6]/2.5 text-center">
                <input
                  type="file"
                  id="modal-batch-file-picker"
                  multiple
                  accept=".ttf, .otf, .woff, .woff2"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      addFilesToBatchQueue(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                />
                <label 
                  htmlFor="modal-batch-file-picker"
                  className="cursor-pointer text-[11px] font-bold text-[#3D67E6] hover:underline flex items-center gap-1.5 select-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  파일 탐색기에서 폰트 파일 추가로 가져오기 (다중 선택 가능)
                </label>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FCFAF6] border-t border-[#1a1a1a]/10 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold text-gray-400 select-none">
                완료되면 선택한 지정 가중치(세트)에 각 폰트가 대입됩니다.
              </span>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBatchModalOpen(false);
                    setBatchFonts([]);
                    setUploadMessage(null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg border border-[#1A1A1A]/10 hover:bg-[#F3F3F0] cursor-pointer transition-all"
                >
                  닫기
                </button>
                <button
                  type="button"
                  disabled={batchFonts.length === 0}
                  onClick={processBatchFonts}
                  className="px-5 py-1.5 text-xs font-extrabold rounded-lg bg-[#3D67E6] hover:bg-[#2C4FB4] text-white disabled:opacity-40 select-none cursor-pointer duration-150 transition-all shadow-sm flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  한번에 일괄 등록 완료 및 적용
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DRAG AND DROP LOCAL FONT UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#1a1a1a]/15 max-w-lg w-full rounded-md shadow-xl flex flex-col overflow-hidden font-sans text-[#1A1A1A]">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a]/10 bg-[#FCFAF6]">
              <div className="flex items-center gap-2">
                <Upload className="h-4.5 w-4.5 text-[#3D67E6]" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1a1a1a]">
                  로컬 폰트 주입 및 연동 ({uploadTarget === "KO" ? "한글용" : "영문용"})
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadMessage(null);
                }}
                className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] p-2 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-[#1a1a1a]/10 bg-[#F9F8F6]">
              <button
                onClick={() => setUploadModalTab("file")}
                className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 text-center cursor-pointer h-10 ${
                  uploadModalTab === "file" 
                    ? "border-[#3D67E6] text-[#3D67E6] bg-white font-extrabold" 
                    : "border-transparent text-[#1A1A1A]/50 hover:bg-black/5 hover:text-[#1A1A1A]"
                }`}
              >
                파일로 업로드 (.ttf, .otf 등)
              </button>
              <button
                onClick={() => setUploadModalTab("device")}
                className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 text-center cursor-pointer h-10 ${
                  uploadModalTab === "device" 
                    ? "border-[#3D67E6] text-[#3D67E6] bg-white font-extrabold" 
                    : "border-transparent text-[#1A1A1A]/50 hover:bg-black/5 hover:text-[#1A1A1A]"
                }`}
              >
                내 컴퓨터 폰트 바로 선택/등록
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto">
              
              {/* Target Selector */}
              <div className="flex justify-center gap-6 text-xs font-bold pb-2 border-b border-[#1a1a1a]/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modalTarget"
                    checked={uploadTarget === "KO"}
                    onChange={() => setUploadTarget("KO")}
                    className="accent-[#3D67E6] h-4 w-4"
                  />
                  <span>한글 서체용으로 할당</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modalTarget"
                    checked={uploadTarget === "EN"}
                    onChange={() => setUploadTarget("EN")}
                    className="accent-[#3D67E6] h-4 w-4"
                  />
                  <span>영문/숫자용으로 할당</span>
                </label>
              </div>

              {/* TAB 1: FILE UPLOAD CONTENT */}
              {uploadModalTab === "file" && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded p-8 text-center transition-all cursor-pointer ${
                    dragActive 
                      ? "border-[#3D67E6] bg-[#3D67E6]/5" 
                      : "border-[#1a1a1a]/20 hover:border-[#3D67E6] bg-[#FCFAF6]"
                  }`}
                >
                  <input
                    type="file"
                    id="font-file-picker"
                    accept=".ttf, .otf, .woff, .woff2"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label htmlFor="font-file-picker" className="cursor-pointer space-y-3 block">
                    <div className="flex justify-center">
                      <Upload className="h-10 w-10 text-[#3D67E6]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1A1A1A] block">
                        이곳에 폰트 파일 드래그 & 드롭
                      </span>
                      <span className="text-[10px] text-[#888888] block mt-1">
                        또는 내 컴퓨터에서 파일 찾기 클릭
                      </span>
                      <span className="text-[10px] text-[#3D67E6] block tracking-wide mt-2 font-mono font-bold font-extrabold">
                        [ .TTF / .OTF / .WOFF / .WOFF2 ]
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* TAB 2: DEVICE FONTS CONTENT */}
              {uploadModalTab === "device" && (
                <div className="space-y-4">
                  {/* Option A: Scan system fonts */}
                  <div className="p-4 border border-[#1a1a1a]/10 rounded bg-[#F9F8F6] space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-[#1A1A1A]">컴퓨터 설치 폰트 세션 스캔 (Chromium 계열 브라우저 전용)</span>
                      <span className="text-[9px] bg-[#3D67E6]/10 text-[#3D67E6] px-1.5 py-0.5 rounded font-bold">AUTO</span>
                    </div>
                    <p className="text-[10px] text-[#1a1a1a]/60 leading-relaxed">
                      컴퓨터에 깔려 있는 서체 파일들의 인덱스를 동기화하여 클릭 한 번으로 가져옵니다. 최초 실시간 로드가 가능합니다.
                    </p>
                    
                    {scannedFamilies.length === 0 ? (
                      <button
                        onClick={handleScanSystemFonts}
                        disabled={isScanning}
                        className="w-full bg-white border border-[#3D67E6] text-[#3D67E6] hover:bg-[#3D67E6]/5 transition-all text-xs font-bold py-2 rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isScanning ? "스캔 분석 및 동기화 중..." : "설치된 폰트 불러오기 및 스캔"}
                      </button>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="가져온 폰트 검색 (예: Pretendard, Gmarket, Apple...)"
                          value={scannedSearch}
                          onChange={(e) => setScannedSearch(e.target.value)}
                          className="w-full bg-white text-[#1a1a1a] border border-[#1a1a1a]/15 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3D67E6] font-medium font-sans animate-fadeIn"
                        />
                        <div className="border border-[#1a1a1a]/10 rounded bg-white max-h-[140px] overflow-y-auto p-1.5 text-left grid grid-cols-1 gap-1">
                          {scannedFamilies
                            .filter(fam => fam.toLowerCase().includes(scannedSearch.toLowerCase()))
                            .slice(0, 50) 
                            .map((family) => (
                              <button
                                key={family}
                                onClick={() => handleRegisterSystemFont(family, true)}
                                className="w-full text-left font-sans text-[11px] px-2 py-1.5 hover:bg-[#3D67E6]/5 hover:text-[#3D67E6] rounded flex justify-between items-center border border-transparent font-medium group transition-all cursor-pointer"
                              >
                                <span>{family}</span>
                                <span className="opacity-0 group-hover:opacity-100 text-[9px] text-[#3D67E6] font-extrabold transition-all">선택 &rarr;</span>
                              </button>
                            ))}
                          {scannedFamilies.filter(fam => fam.toLowerCase().includes(scannedSearch.toLowerCase())).length === 0 && (
                            <div className="text-[10px] text-gray-400 italic py-3 text-center font-sans">검색 결과가 없습니다.</div>
                          )}
                        </div>
                        <div className="text-[8.5px] text-[#777772] text-right font-sans">
                          *상위 50개 항목만 노출 중입니다.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option B: Manual Type Fallback (Supported on all browsers!) */}
                  <div className="p-4 border border-[#1a1a1a]/10 rounded bg-white space-y-2.5">
                    <div className="flex justify-between items-center font-sans">
                      <span className="text-[11px] font-bold text-[#1A1A1A]">컴퓨터 서체명 수동 등록 (사파리, 파이어폭스, 일반 환경)</span>
                      <span className="text-[9px] bg-[#1a1a1a]/8 text-[#1a1a1a]/70 px-1.5 py-0.5 rounded font-bold">MANUAL</span>
                    </div>
                    <p className="text-[10px] text-[#1a1a1a]/60 leading-relaxed font-sans">
                      컴퓨터에 이미 서체가 깔려 있다면, 정확한 서체 이름(예: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">Pretendard</code>, <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">Apple SD Gothic Neo</code>, <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">D2Coding</code>)을 아래에 기재하면 미리보기에 완벽 동기화해 드립니다.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="정확한 폰트 패밀리 이름 기입"
                        value={manualFontName}
                        onChange={(e) => setManualFontName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRegisterSystemFont(manualFontName, false);
                          }
                        }}
                        className="flex-1 bg-[#FCFAF6] text-[#1a1a1a] border border-[#1a1a1a]/15 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3D67E6] font-medium font-sans"
                      />
                      <button
                        onClick={() => handleRegisterSystemFont(manualFontName, false)}
                        className="bg-[#1D1D1D] hover:bg-[#3D67E6] text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer font-sans"
                      >
                        이름으로 추가
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Zone */}
              {uploadMessage && (
                <div className={`p-3 rounded text-xs font-semibold border transition-all font-sans ${
                  uploadMessage.type === "success" 
                    ? "bg-[#E6F3EA] text-[#2A7545] border-[#B7DFD2]"
                    : uploadMessage.type === "error"
                    ? "bg-[#FBEBEB] text-[#BF2121] border-[#EAAFA7]"
                    : "bg-[#EBF3FB] text-[#2A65B1] border-[#B7D2DF]"
                }`}>
                  {uploadMessage.text}
                </div>
              )}

              <div className="text-[9.5px] leading-relaxed text-[#777772] font-sans">
                *참고: 자동 스캔으로 등록된 '기기 설치 서체'는 브라우저 보안 샌드박스로부터 실제 바이너리를 읽어와 **Composite 서체 다운로드** 패징 병합 처리에까지 완전하게 수용됩니다. 수동 이름 매핑 서체는 조판 디자인 미리보기 전용입니다.
              </div>

            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-[#1a1a1a]/10 bg-[#FCFAF6] flex justify-end gap-3 font-semibold text-xs text-stone-600">
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadMessage(null);
                }}
                className="hover:text-[#1a1a1a] px-4 py-2 cursor-pointer transition-colors font-sans"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EXPORT POPUP MODAL */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#1a1a1a]/15 max-w-lg w-full rounded shadow-xl flex flex-col overflow-hidden font-sans">
            
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-[#1a1a1a]/10 bg-[#FCFAF6]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#3D67E6]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1A1A]">
                  Specimen Export Setup
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsExportOpen(false);
                  setPackComplete(false);
                }}
                className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] p-1 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 text-[#1A1A1A]">
              
              {/* Filename Tweak */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/50 block">
                  내보내기 파일명 (Save Title)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value.replace(/\s+/g, "_"))}
                    placeholder="결과물_파일명_설정"
                    className="flex-1 bg-[#FCFAF6] border border-[#1a1a1a]/15 rounded px-3.5 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-[#3D67E6]"
                  />
                  <span className="bg-[#1A1A1A]/5 px-3.5 py-2 text-[11px] font-mono rounded flex items-center justify-center text-[#1A1A1A]/70 select-none">
                    .otf / .ttf
                  </span>
                </div>
                <p className="text-[10px] text-[#1D1D1D]/55 font-medium">
                  지정된 한글(KO) 폰트와 영문(EN) 폰트가 조합 비율 및 미세 조정값에 맞춰 하나의 서체 파일로 완전 합성/패킹됩니다.
                </p>
              </div>

              {/* Format Checkboxes */}
              <div className="space-y-3 pt-2 border-t border-[#1a1a1a]/10">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/50 block">
                  포맷 탑재 여부 검증 (Format Selection)
                </label>
                
                <div className="space-y-2.5">
                  
                  {/* TTF Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={exportTTF}
                      onChange={(e) => setExportTTF(e.target.checked)}
                      className="mt-0.5 rounded accent-[#3D67E6] h-4 w-4"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-[#1A1A1A] block">
                        합성 TrueType 서체 파일 내보내기 (.ttf)
                      </span>
                      <span className="text-[10px] text-[#1A1A1A]/50 block font-medium">
                        Windows 및 일반 컴퓨터 인스톨, 전반적인 그래픽 및 디지털 디바이스 연동용
                      </span>
                    </div>
                  </label>

                  {/* OTF Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={exportOTF}
                      onChange={(e) => setExportOTF(e.target.checked)}
                      className="mt-0.5 rounded accent-[#3D67E6] h-4 w-4"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-[#1A1A1A] block">
                        합성 OpenType 서체 파일 내보내기 (.otf)
                      </span>
                      <span className="text-[10px] text-[#1A1A1A]/50 block font-medium">
                        macOS 서체 책 및 어도비 계열(Figma, Photoshop 등) 인쇄/퍼블리싱용
                      </span>
                    </div>
                  </label>

                  {/* HTML/CSS Spec Sheet */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={exportCSS}
                      onChange={(e) => setExportCSS(e.target.checked)}
                      className="mt-0.5 rounded accent-[#3D67E6] h-4 w-4"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-[#1A1A1A] block">
                        가이드 HTML 템플릿 & 통합 CSS unicode-range 코드
                      </span>
                      <span className="text-[10px] text-[#1A1A1A]/50 block font-medium">
                        브라우저가 다국어 글꼴을 인지하여 한영 조형 비율과 베이스라인 보정치를 자동 분배하는 웹 소스코드 포함
                      </span>
                    </div>
                  </label>

                </div>
              </div>

              {/* Live Parameters Preview */}
              <div className="bg-[#FCFAF6] border border-[#1a1a1a]/10 p-4 rounded text-[10px] font-mono text-[#1A1A1A]/70 space-y-1">
                <div className="flex justify-between">
                  <span>- KO Size / Space:</span>
                  <span className="font-bold">{fontSizeKo}px / {letterSpacingKo}em</span>
                </div>
                <div className="flex justify-between">
                  <span>- EN Size / Space:</span>
                  <span className="font-bold">{fontSizeEn}px / {letterSpacingEn}em</span>
                </div>
                <div className="flex justify-between">
                  <span>- EN Baseline Shift:</span>
                  <span className="font-bold text-[#3D67E6]">{baselineShiftEn}%</span>
                </div>
                <div className="flex justify-between">
                  <span>- Global Line Height:</span>
                  <span className="font-bold">{lineHeight}</span>
                </div>
              </div>

            </div>

            {/* Error Feedback Banner */}
            {exportError && (
              <div className="px-8 pb-4">
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-[11px] flex flex-col gap-1 animate-fadeIn">
                  <span className="font-bold text-red-700 block">서체 파일 컴파일에 실패했습니다:</span>
                  <span className="font-mono text-[10px] leading-relaxed opacity-95">{exportError}</span>
                </div>
              </div>
            )}

            {/* Packaging / Loading Indicator */}
            {isPackaging && (
              <div className="px-8 pb-4">
                <div className="bg-[#FCFAF6] border border-[#1a1a1a]/10 p-3 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 border-2 border-[#3D67E6] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] font-bold text-[#1A1A1A]">
                      {packagingStep === 1 && "한글 및 영문 폰트 원본 데이터 획득 중..."}
                      {packagingStep === 2 && "Unicode 맵핑 기반의 glyph 개별 형상 데이터 정렬 중..."}
                      {packagingStep === 3 && "한영 동적 스케일 x 베이스라인 shift 벡터 오프셋 연동 중..."}
                      {packagingStep === 4 && "최종 TrueType/OpenType 폰트 바이너리 로컬 조립 중..."}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#3D67E6] font-bold">
                    {packagingStep * 25}%
                  </span>
                </div>
                <div className="w-full bg-[#1A1A1A]/10 h-[2px] mt-2 overflow-hidden">
                  <div 
                    className="bg-[#3D67E6] h-full transition-all duration-500 ease-out"
                    style={{ width: `${packagingStep * 25}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Feedback Banner */}
            {packComplete && (
              <div className="px-8 pb-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded text-[11px] flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="font-semibold">
                      성공적으로 조율된 하이브리드 서체(TTF/OTF) 컴파일이 완료되어 다운로드되었습니다!
                    </span>
                  </div>
                  <span className="font-mono text-[9px] opacity-75">SUCCESS</span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="px-8 py-5 border-t border-[#1a1a1a]/10 bg-[#FCFAF6] flex gap-3.5 justify-end">
              <button
                onClick={() => {
                  setIsExportOpen(false);
                  setPackComplete(false);
                  setExportError(null);
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 px-5 py-2.5 hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={handleTriggerExport}
                disabled={isPackaging}
                className="bg-[#1A1A1A] text-[#F9F8F6] text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 hover:bg-[#3D67E6] transition-colors flex items-center gap-1.5 cursor-pointer rounded disabled:opacity-50 shadow-xs font-semibold"
              >
                <FileCode className="h-3.5 w-3.5" />
                서체 합성 및 패키지 내려받기
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
