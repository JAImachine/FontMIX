import React, { useState } from "react";
import { Sparkles, ArrowRight, Check, Loader2, AlertCircle } from "lucide-react";
import { FontMetadata } from "../types";

interface AIRecommenderProps {
  englishFonts: FontMetadata[];
  koreanFonts: HasKoreanFonts[];
  onApplyPairing: (englishFont: FontMetadata, koreanFont: FontMetadata, options?: any) => void;
}

type HasKoreanFonts = FontMetadata;

const CONCEPT_TAGS = [
  { label: "코스메틱 매거진", value: "우아하고 고급적인 하이엔드 뷰티 코스메틱 브랜딩" },
  { label: "미니멀 차 도서", value: "평온하고 고즈넉한 무드의 핸드드립 찻집 로고 및 도서" },
  { label: "테크 서비스 제안", value: "미래지향적이고 구조적 신뢰감이 두드러진 테크 서비스 제안서" },
  { label: "레트로 문학 에세이", value: "옛 인쇄기 질감과 두툼한 찰기가 도는 아날로그 문학 동호회" },
  { label: "비주얼 전시 포스터", value: "아방가르드하고 조형미가 가득 찬 현대 미술 전시회 설명 장치" }
];

export default function AIRecommender({
  englishFonts,
  koreanFonts,
  onApplyPairing,
}: AIRecommenderProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const handleQueryAI = async (conceptString: string) => {
    setIsLoading(true);
    setErrorInfo(null);
    setRecommendation(null);

    try {
      const response = await fetch("/api/ai-pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: conceptString })
      });

      if (!response.ok) {
        throw new Error("서버 추천 API 호출 중 네트워크 오류 발생");
      }

      const data = await response.json();
      
      if (data.recommendation) {
        setRecommendation({
          ...data.recommendation,
          useDefault: data.useDefault,
          warning: data.error
        });
      } else {
        throw new Error("올바른 추천 정보를 전달받지 못했습니다.");
      }
    } catch (err: any) {
      console.error("AI Recommender Error:", err);
      setErrorInfo(err.message || "추천 정보를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!recommendation) return;

    const recommendedEn = englishFonts.find(
      (f) =>
        f.id.toLowerCase() === recommendation.englishFontId.toLowerCase() ||
        f.name.toLowerCase() === recommendation.englishFontId.toLowerCase()
    ) || englishFonts[0];

    const recommendedKr = koreanFonts.find(
      (f) =>
        f.id.toLowerCase() === recommendation.koreanFontId.toLowerCase() ||
        f.name.toLowerCase() === recommendation.koreanFontId.toLowerCase()
    ) || koreanFonts[0];

    let scale = 1.0;
    if (recommendation.suggestedHeadingSizeAdjust) {
      const numeric = parseInt(recommendation.suggestedHeadingSizeAdjust.replace(/[^0-9]/g, ""));
      if (!isNaN(numeric)) {
        scale = numeric / 100;
      }
    }

    onApplyPairing(recommendedEn, recommendedKr, {
      englishScale: scale,
      rationale: recommendation.rationaleKorean,
      sampleEN: recommendation.sampleTextEN,
      sampleKO: recommendation.sampleTextKO
    });
  };

  return (
    <div className="bg-[#1A1A1A] text-[#F9F8F6] rounded-xs p-6 md:p-8 border border-[#1A1A1A] shadow-xs relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#F9F8F6]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF4D00] text-white rounded-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#FF4D00]">A.I. Engine / Mood Synthesis</h2>
            <p className="text-[11px] text-[#F9F8F6]/60 mt-0.5">브랜드 컨셉과 타이포 무드를 기입하면 인공지능이 최적의 비율 보정을 산출해 드립니다.</p>
          </div>
        </div>
        <span className="text-[9px] font-mono tracking-widest text-[#F9F8F6]/40 uppercase">Specimen Engine v1.0</span>
      </div>

      {/* Input container */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="예시: 우아함과 고풍미가 넘치는 클래식 차 브랜드..."
            disabled={isLoading}
            className="flex-1 bg-[#1A1A1A] border-b border-[#F9F8F6]/20 text-[#F9F8F6] py-3 px-1 text-xs focus:outline-none focus:border-[#FF4D00] transition placeholder-[#F9F8F6]/30 font-serif italic"
          />
          <button
            onClick={() => handleQueryAI(inputText || "현대적이고 우아한 감성 브랜드")}
            disabled={isLoading}
            className="bg-[#FF4D00] hover:bg-[#e04400] text-white font-bold text-xs px-6 py-2.5 rounded-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 tracking-widest uppercase"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Synthesis
          </button>
        </div>

        {/* Suggestion pills */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {CONCEPT_TAGS.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(tag.value);
                handleQueryAI(tag.value);
              }}
              disabled={isLoading}
              className="text-[10px] uppercase tracking-wider bg-transparent hover:bg-[#F9F8F6]/5 text-[#F9F8F6]/80 px-2.5 py-1 rounded-xs border border-[#F9F8F6]/10 transition cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Warning if default mock is triggered */}
      {recommendation?.useDefault && (
        <div className="bg-[#FF4D00]/10 border-l-2 border-[#FF4D00] text-[#FF4D00] p-4 rounded-xs flex items-start gap-3 mb-5 text-[11px] leading-relaxed">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold tracking-wider uppercase mb-0.5">Demoware Active / Gemini Off</p>
            Gemini API 서버 구성 미정태입니다. 사전에 엄선된 하이브리드 미세 매칭 비율 데이터베이스로 임시 렌더링을 시뮬레이션합니다.
          </div>
        </div>
      )}

      {errorInfo && (
        <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] p-3 rounded-xs flex items-center gap-2 mb-5 text-xs">
          <AlertCircle className="h-4 w-4 text-[#FF4D00]" />
          <span>{errorInfo}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-[#F9F8F6]/5 border border-[#F9F8F6]/10 p-8 flex flex-col items-center justify-center text-center gap-3.5 min-h-[170px]">
          <Loader2 className="h-6 w-6 text-[#FF4D00] animate-spin" />
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-[#FF4D00]">Analyzing Matrix Grid...</p>
            <p className="text-[11px] text-[#F9F8F6]/60 mt-1.5 font-serif italic max-w-md">
              "한글 자모의 정방형 여백 크기와 라틴 서체의 x-height 기하학 균형점을 산정하고 있습니다."
            </p>
          </div>
        </div>
      )}

      {/* Result presentation */}
      {recommendation && !isLoading && (
        <div className="bg-[#F9F8F6]/5 border border-[#F9F8F6]/15 rounded-xs p-5 md:p-6 flex flex-col gap-5 animate-fadeIn">
          {/* Main layout diagram */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#F9F8F6]/10 pb-4">
            <div className="flex items-center gap-6">
              <div className="text-center md:text-left">
                <span className="text-[9px] text-[#F9F8F6]/40 font-mono tracking-widest block uppercase">Selected Latin</span>
                <span className="text-sm font-bold text-white tracking-wide">{recommendation.englishFontId}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[#F9F8F6]/40 hidden md:block" />
              <div className="text-center md:text-left">
                <span className="text-[9px] text-[#F9F8F6]/40 font-mono tracking-widest block uppercase">Selected Hangul</span>
                <span className="text-sm font-bold text-white tracking-wide">{recommendation.koreanFontId}</span>
              </div>
            </div>
            <div className="border border-[#FF4D00] px-3 py-1 text-center">
              <span className="block text-[8px] uppercase tracking-widest text-[#FF4D00]">Optical Scale</span>
              <span className="text-xs font-mono font-bold text-white">{recommendation.suggestedHeadingSizeAdjust || "100%"}</span>
            </div>
          </div>

          {/* Rationale explanation */}
          <div>
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#FF4D00] mb-2 flex items-center gap-1">
              Typography Commentary
            </h4>
            <p className="text-xs text-[#F9F8F6]/85 leading-relaxed bg-[#1A1A1A] p-4 border border-[#F9F8F6]/10 rounded-xs font-serif italic">
              {recommendation.rationaleKorean}
            </p>
          </div>

          {/* Dynamic Mixed Preview */}
          <div className="bg-[#1A1A1A] p-4 border border-[#F9F8F6]/10 rounded-xs">
            <span className="text-[8px] uppercase tracking-widest text-[#F9F8F6]/40 block mb-1.5 font-mono">Synthesized Specimen Sentence</span>
            <p className="text-xs leading-relaxed text-[#F9F8F6]/90 font-serif">
              "{recommendation.sampleTextKO}" <span className="text-xs opacity-50 not-italic">({recommendation.sampleTextEN})</span>
            </p>
          </div>

          {/* Actions */}
          <button
            onClick={handleApply}
            className="w-full py-3.5 bg-[#F9F8F6] hover:bg-white text-[#1A1A1A] font-bold text-[11px] uppercase tracking-widest rounded-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
            Apply to workbench
          </button>
        </div>
      )}
    </div>
  );
}
