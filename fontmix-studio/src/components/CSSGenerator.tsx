import React, { useState } from "react";
import { FontMetadata } from "../types";
import { Check, Copy, Code, Sparkles } from "lucide-react";

interface CSSGeneratorProps {
  englishFont: FontMetadata;
  koreanFont: FontMetadata;
  englishScale: number;
  letterSpacing: string;
  lineHeight: string;
}

export default function CSSGenerator({
  englishFont,
  koreanFont,
  englishScale,
  letterSpacing,
  lineHeight,
}: CSSGeneratorProps) {
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<string>("unicode-range");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(id);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const googleFontsLinkCode = `<!-- 1. HTML <head> 부분에 구글 폰트 주입 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${englishFont.apiName}:wght@300;400;500;700;800&family=${koreanFont.apiName}:wght@300;400;500;700;900&display=swap" rel="stylesheet">`;

  const unicodeRangeStyleSheetCode = `/* 2. CSS unicode-range 기반 맞춤형 하이브리드 글꼴 정의 */
@font-face {
  font-family: 'HybridCustomFont';
  src: local('${englishFont.name}');
  font-weight: 300 800;
  font-style: normal;
  /* Basic Latin (영어 대소문자, 숫자, 기본 기호 전용) */
  unicode-range: U+0000-007F, U+0020-007E;
}

@font-face {
  font-family: 'HybridCustomFont';
  src: local('${koreanFont.name}');
  font-weight: 300 900;
  font-style: normal;
  /* Hangul Syllables & Jamo (한글 완성형 글자 및 자모 전체 영역) */
  unicode-range: U+AC00-D7A3, U+1100-11FF, U+3130-318F;
}

/* 3. 웹사이트 글꼴 적용 스타일 정의 */
.custom-hybrid-typography {
  font-family: 'HybridCustomFont', sans-serif;
  letter-spacing: ${letterSpacing};
  line-height: ${lineHeight};
  ${englishScale !== 1.0 ? `font-size-adjust: ${englishScale}; /* 영문 폰트 비율 보정 */` : ""}
}`;

  const simpleFallbackCode = `/* CSS 기본 폴백 체인 방식 (가장 간편한 결합법) */
.hybrid-easy-apply {
  font-family: '${englishFont.name}', '${koreanFont.name}', sans-serif;
  letter-spacing: ${letterSpacing};
  line-height: ${lineHeight};
  /* 한글이 미지원되는 영문 서체가 전방에 배치되어 영문은 영문서체로, 한글은 한글서체로 폴백합니다. */
}`;

  const tailwindConfigCode = `// tailwind.config.js (Tailwind v3 버전 적용 방법)
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        hybrid: ["'${englishFont.name}'", "'${koreanFont.name}'", "sans-serif"],
      },
    },
  },
}

/* ----------------- OR ----------------- */

/* @theme (Tailwind v4 버전 적용 방법) */
@theme {
  --font-hybrid: "${englishFont.name}", "${koreanFont.name}", sans-serif;
}`;

  return (
    <div className="bg-white border border-[#1A1A1A]/10 rounded-xs p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Code className="h-4 w-4 text-[#FF4D00]" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
          Export Specimen Code / CSS & HTML
        </h3>
      </div>

      <p className="text-[11px] text-[#1A1A1A]/60 leading-relaxed -mt-2">
        한글과 영문 서체를 완벽히 결합하여 실제 서비스 제작에 즉시 탑재시킬 수 있는 리얼타임 레이아웃 소스코드 모음집입니다.
      </p>

      {/* Code category tab select */}
      <div className="flex gap-4 border-b border-[#1A1A1A]/10 pb-1">
        <button
          onClick={() => setActiveCodeTab("unicode-range")}
          className={`pb-2 text-[10px] uppercase tracking-wider font-bold cursor-pointer transition ${
            activeCodeTab === "unicode-range"
              ? "text-[#1A1A1A] border-b-2 border-[#1A1A1A]"
              : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70"
          }`}
        >
          A. unicode-range (추천)
        </button>
        <button
          onClick={() => setActiveCodeTab("simple-chain")}
          className={`pb-2 text-[10px] uppercase tracking-wider font-bold cursor-pointer transition ${
            activeCodeTab === "simple-chain"
              ? "text-[#1A1A1A] border-b-2 border-[#1A1A1A]"
              : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70"
          }`}
        >
          B. Fallback Chain
        </button>
        <button
          onClick={() => setActiveCodeTab("tailwind")}
          className={`pb-2 text-[10px] uppercase tracking-wider font-bold cursor-pointer transition ${
            activeCodeTab === "tailwind"
              ? "text-[#1A1A1A] border-b-2 border-[#1A1A1A]"
              : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70"
          }`}
        >
          C. Tailwind Config
        </button>
      </div>

      {/* Code areas */}
      <div className="bg-[#1A1A1A] rounded-xs flex flex-col overflow-hidden border border-[#1A1A1A]">
        {/* Code tabs */}
        <div className="bg-[#1A1A1A]/80 px-4 py-2 flex items-center justify-between text-[9px] text-[#F9F8F6]/40 font-mono border-b border-[#F9F8F6]/10">
          <span>{englishFont.name} × {koreanFont.name} Specimen Set</span>
          <span>UTF-8 // Standard</span>
        </div>

        {/* Dynamic content rendering depending on tab */}
        {activeCodeTab === "unicode-range" && (
          <div className="p-4 space-y-4">
            {/* HTML head import */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#F9F8F6]/60 font-bold uppercase tracking-wider font-mono">
                  STEP 1. Web Font Import Code (HTML Head)
                </span>
                <button
                  onClick={() => handleCopy(googleFontsLinkCode, "gf")}
                  className="text-[#FF4D00] hover:text-[#ff6624] text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedState === "gf" ? <Check className="h-3 w-3 stroke-[3] text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedState === "gf" ? "copied" : "copy code"}
                </button>
              </div>
              <pre className="text-[10px] font-mono whitespace-pre-wrap bg-black/40 p-3 rounded-xs text-[#F9F8F6]/80 border border-[#F9F8F6]/5 overflow-x-auto">
                {googleFontsLinkCode}
              </pre>
            </div>

            {/* Unicode range stylesheet code */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#F9F8F6]/60 font-bold uppercase tracking-wider font-mono">
                  STEP 2. CSS unicode-range Integration
                </span>
                <button
                  onClick={() => handleCopy(unicodeRangeStyleSheetCode, "uc")}
                  className="text-[#FF4D00] hover:text-[#ff6624] text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedState === "uc" ? <Check className="h-3 w-3 stroke-[3] text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedState === "uc" ? "copied" : "copy code"}
                </button>
              </div>
              <pre className="text-[10px] font-mono whitespace-pre bg-black/40 p-3 rounded-xs text-[#F9F8F6]/80 border border-[#F9F8F6]/5 overflow-x-auto">
                {unicodeRangeStyleSheetCode}
              </pre>
            </div>
          </div>
        )}

        {activeCodeTab === "simple-chain" && (
          <div className="p-4 flex flex-col gap-3">
            {/* HTML head import */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#F9F8F6]/60 font-bold uppercase tracking-wider font-mono">
                  STEP 1. Web Font Import Code (HTML Head)
                </span>
                <button
                  onClick={() => handleCopy(googleFontsLinkCode, "gf2")}
                  className="text-[#FF4D00] hover:text-[#ff6624] text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedState === "gf2" ? <Check className="h-3 w-3 stroke-[3] text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedState === "gf2" ? "copied" : "copy code"}
                </button>
              </div>
              <pre className="text-[10px] font-mono whitespace-pre-wrap bg-black/40 p-3 rounded-xs text-[#F9F8F6]/80 border border-[#F9F8F6]/5 overflow-x-auto">
                {googleFontsLinkCode}
              </pre>
            </div>

            {/* CSS fallback code */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#F9F8F6]/60 font-bold uppercase tracking-wider font-mono">
                  STEP 2. Basic CSS Fallback Chain
                </span>
                <button
                  onClick={() => handleCopy(simpleFallbackCode, "sc")}
                  className="text-[#FF4D00] hover:text-[#ff6624] text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedState === "sc" ? <Check className="h-3 w-3 stroke-[3] text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedState === "sc" ? "copied" : "copy code"}
                </button>
              </div>
              <pre className="text-[10px] font-mono whitespace-pre bg-black/40 p-3 rounded-xs text-[#F9F8F6]/80 border border-[#F9F8F6]/5 overflow-x-auto">
                {simpleFallbackCode}
              </pre>
            </div>
          </div>
        )}

        {activeCodeTab === "tailwind" && (
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#F9F8F6]/60 font-bold uppercase tracking-wider font-mono">
                  Tailwind CSS Theme Settings
                </span>
                <button
                  onClick={() => handleCopy(tailwindConfigCode, "tw")}
                  className="text-[#FF4D00] hover:text-[#ff6624] text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedState === "tw" ? <Check className="h-3 w-3 stroke-[3] text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedState === "tw" ? "copied" : "copy code"}
                </button>
              </div>
              <pre className="text-[10px] font-mono whitespace-pre bg-black/40 p-3 rounded-xs text-[#F9F8F6]/80 border border-[#F9F8F6]/5 overflow-x-auto">
                {tailwindConfigCode}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Helpful developer advice box */}
      <div className="bg-[#F9F8F6]/80 border border-[#1A1A1A]/10 p-4 flex gap-3 text-xs leading-relaxed text-[#1A1A1A]/80">
        <Sparkles className="h-4 w-4 text-[#FF4D00] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5 tracking-wider uppercase text-[#1A1A1A]">PRO ADVICE: WHY UNICODE-RANGE?</p>
          CSS unicode-range를 선언하면 영문은 가볍고 날렵한 비율을 그대로 살리면서 한글만 우아한 한국어 폰트 볼륨으로 자연스럽게 결합해 줍니다. 타이포 디그리 조율에 매우 강력한 테크닉입니다.
        </div>
      </div>
    </div>
  );
}
