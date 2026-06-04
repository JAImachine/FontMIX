import React, { useState } from "react";
import { FontMetadata } from "../types";
import { Eye, FileText, Cpu, ShoppingBag, Sliders } from "lucide-react";

interface LayoutPreviewsProps {
  englishFont: FontMetadata;
  koreanFont: FontMetadata;
  englishScale: number;
  letterSpacing: string;
  lineHeight: string;
  customText: string;
  setCustomText: (text: string) => void;
}

export default function LayoutPreviews({
  englishFont,
  koreanFont,
  englishScale,
  letterSpacing,
  lineHeight,
  customText,
  setCustomText,
}: LayoutPreviewsProps) {
  const [activeTab, setActiveTab] = useState<string>("editorial");

  const combinedStyle = {
    fontFamily: `'${englishFont.name}', '${koreanFont.name}', sans-serif`,
    letterSpacing: letterSpacing,
    lineHeight: lineHeight,
  };

  const containerStyle = {
    ...combinedStyle,
    fontSizeAdjust: englishScale === 1 ? undefined : englishScale,
  };

  return (
    <div className="bg-white rounded-xs border border-[#1A1A1A]/10 p-6 flex flex-col gap-6">
      {/* Tab bar header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#FF4D00]" />
            Live Specimen Sandbox / 실시간 하이브리드 미리보기
          </h3>
          <p className="text-[11px] text-[#1A1A1A]/50 mt-1 font-serif italic">
            두 언어의 볼륨이 실제 시각 작업대에서 완벽한 비주얼 하모니를 이루는가 확인합니다.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-1 bg-[#F9F8F6] p-1 rounded-xs self-start lg:self-auto overflow-x-auto max-w-full border border-[#1A1A1A]/5">
          <button
            onClick={() => setActiveTab("editorial")}
            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "editorial"
                ? "bg-[#1A1A1A] text-[#F9F8F6]"
                : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Magazine Poster
          </button>
          <button
            onClick={() => setActiveTab("tech")}
            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "tech"
                ? "bg-[#1A1A1A] text-[#F9F8F6]"
                : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Tech Monitor
          </button>
          <button
            onClick={() => setActiveTab("commerce")}
            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "commerce"
                ? "bg-[#1A1A1A] text-[#F9F8F6]"
                : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Commerce Detail
          </button>
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "sandbox"
                ? "bg-[#1A1A1A] text-[#F9F8F6]"
                : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Free Typing
          </button>
        </div>
      </div>

      {/* Preview presentation area */}
      <div className="flex-1 min-h-[380px] bg-[#F9F8F6]/40 p-4 md:p-8 flex items-center justify-center border border-[#1A1A1A]/5">
        {/* Editorial Poster Layout */}
        {activeTab === "editorial" && (
          <div
            className="w-full max-w-2xl bg-white border border-[#1A1A1A]/10 p-6 md:p-10 relative overflow-hidden"
            style={containerStyle}
          >
            {/* Poster grid header */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4 mb-8 font-mono text-[10px] tracking-widest text-[#1A1A1A]/40 uppercase">
              <span>VOL. 42 / SPECIME RE-MIX</span>
              <span>EST. 2026 / MULTI LAB</span>
            </div>

            {/* Poster body */}
            <div className="space-y-6">
              {/* Font pairing indicator deleted */}
              <h1 className="text-3xl md:text-[44px] md:leading-[1.1] font-bold text-[#1A1A1A] tracking-tight">
                Design is not just what it looks like. 디자인은 영혼을 투영합니다.
              </h1>
              <p className="text-sm text-[#1A1A1A]/75 font-normal leading-relaxed font-serif">
                우리는 매시간 다양한 다국어 데이터 모델과 시각 타이포그래피를 향유합니다. 영문 서체와 한글 서체간의 매치 감각은 미세한 가로세로 폭 맞춤에서 시작됩니다. 
                <strong className="text-[#1A1A1A]"> Web Specimen Engine</strong>은 디자이너와 라이선스 담당 웹 프로그래머가 최선의 <em>Visual Balance</em>를 
                도출해 낼 수 있는 정형 수치 실증 연구실입니다. 라틴 문자의 정밀 세련미와 한글 돋움의 정갈한 따스함이 입을 맞춥니다.
              </p>
              
              <blockquote className="border-l border-[#1A1A1A]/40 pl-4 py-1.5 my-4 font-serif italic text-[#1A1A1A]/60">
                <p className="text-sm">
                  "Perfect alignment on baseline physical scales makes multilingual content 100% readable."
                </p>
                <cite className="text-[9px] font-mono uppercase tracking-wider block mt-1 not-italic opacity-40">— Type foundry technical log</cite>
              </blockquote>
            </div>

            <div className="mt-12 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[9px] font-mono tracking-widest text-[#1A1A1A]/40">
              <span>DESIGNER HYBRID SPEC SHEET</span>
              <span>ELASTIC SCALING BASELINE: {englishScale * 100}%</span>
            </div>
          </div>
        )}

        {/* Tech Dashboard Layout */}
        {activeTab === "tech" && (
          <div
            className="w-full max-w-2xl bg-[#1A1A1A] text-[#F9F8F6] rounded-xs p-6 border border-[#1A1A1A] flex flex-col gap-6"
            style={containerStyle}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F9F8F6]/10 pb-3 font-mono text-[9px] text-[#F9F8F6]/40 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF4D00]" />
                <span className="text-[#FF4D00] font-bold">SYSTEM ACTIVE // SPECIMEN DATASET</span>
              </div>
              <span>ENGINE: PORT 3000 // STANDALONE</span>
            </div>

            {/* Metric widgets block */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-[#1A1A1A] border border-[#F9F8F6]/10 p-4">
                <span className="text-[9px] text-[#F9F8F6]/40 uppercase font-mono tracking-wider block">Disk Latency / 대시보드 지연</span>
                <span className="text-xl font-bold font-mono text-white tracking-tight mt-1 block">0.42 ms <span className="text-[10px] text-[#FF4D00] uppercase font-sans">OPTIMAL</span></span>
              </div>
              <div className="bg-[#1A1A1A] border border-[#F9F8F6]/10 p-4">
                <span className="text-[9px] text-[#F9F8F6]/40 uppercase font-mono tracking-wider block">Network Bandwidth</span>
                <span className="text-xl font-bold font-mono text-white tracking-tight mt-1 block">842.1 Gb/s</span>
              </div>
              <div className="bg-[#1A1A1A] border border-[#F9F8F6]/10 p-4 col-span-2 md:col-span-1">
                <span className="text-[9px] text-[#F9F8F6]/40 uppercase font-mono tracking-wider block">Relative Memory</span>
                <span className="text-xl font-bold font-mono text-white tracking-tight mt-1 block">18.4% <span className="text-[10px] text-[#FF4D00] uppercase font-sans">MINIMAL</span></span>
              </div>
            </div>

            {/* Code / logs snippet block */}
            <div className="bg-black/40 border border-[#F9F8F6]/5 p-4 font-mono text-[11px] leading-relaxed text-[#F9F8F6]/60">
              <span className="text-[#FF4D00] block mb-2 font-bold text-[9px] uppercase tracking-widest">⚡ Terminal Logs & Properties</span>
              <p>
                {"$ "} <span className="text-[#F9F8F6]">npm run dev --host</span><br />
                {"[Foundry Engine] "} <span className="text-white">하이브리드 폰트 믹싱 모듈이 완벽히 마운트되었습니다. Ready.</span><br />
                {"[Vite-Process] "} <span className="text-[#FF4D00]">Latin: {englishFont.name} | Category: {englishFont.category}</span><br />
                {"[Vite-Process] "} <span className="text-slate-200">Hangul: {koreanFont.name} | Category: {koreanFont.category}</span><br />
                {"[Metrics] "} <span className="text-[#F9F8F6]/30">Letter-spacing: {letterSpacing || "default"} | Line-height: {lineHeight}</span>
              </p>
            </div>

            {/* Plain blended text block */}
            <p className="text-xs text-[#F9F8F6]/80 leading-relaxed font-serif">
              본 테크 패널 메트릭에서는 기술 지표에 정밀 특화된 <strong>{englishFont.name}</strong> 영어 서체와 본문 밀도가 우수한 <strong>{koreanFont.name}</strong> 한국어 폰트가 대조적 조형미를 이루며 공존합니다. 수치를 깔끔하게 관찰 가능한 최적 지점입니다.
            </p>
          </div>
        )}

        {/* E-Commerce Card Layout */}
        {activeTab === "commerce" && (
          <div
            className="w-full max-w-sm bg-white border border-[#1A1A1A]/10 p-5 flex flex-col gap-4 relative"
            style={containerStyle}
          >
            {/* Simulated Product Banner image area */}
            <div className="h-44 bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="relative z-10 space-y-1">
                <span className="text-[8px] uppercase font-bold tracking-[0.3em] text-[#FF4D00]">Typography Specimen Pack</span>
                <h4 className="text-xl font-bold text-[#F9F8F6] tracking-tight">THE HYBRID DESIGN PACK</h4>
                {/* Font pairing indicator deleted */}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="border border-[#FF4D00] text-[8px] text-[#FF4D00] uppercase font-bold tracking-widest px-2 py-0.5">
                  Artisanal Choose
                </span>
                <span className="font-mono text-[9px] text-[#1A1A1A]/40">SPECIMEN NO. FX-7281</span>
              </div>

              <h2 className="text-base font-bold text-[#1A1A1A] leading-snug">
                FontMix Premium 서체 세트: 가을날의 소박한 감성을 품다
              </h2>
              
              <p className="text-[11px] text-[#1A1A1A]/70 leading-relaxed font-serif">
                인쇄 서체를 연상케 하는 라틴 <strong>{englishFont.name}</strong>의 조형적 기교와 가독에 초점을 둔 <strong>{koreanFont.name}</strong>이 합쳐진, 소유가 아깝지 않은 장인의 스튜디오 에디션 폰트 팩입니다.
              </p>

              {/* Price & Rating */}
              <div className="flex items-baseline gap-2 mt-4 pt-4 border-t border-[#1A1A1A]/5 justify-between">
                <div>
                  <span className="text-xl font-bold text-[#1A1A1A] font-mono">$29.00 <span className="text-xs font-serif font-normal opacity-50">USD</span></span>
                  <span className="text-[9px] text-[#FF4D00] uppercase font-bold tracking-wider block mt-1">✓ Commercial License Lifetime</span>
                </div>
                <button className="bg-[#1A1A1A] hover:bg-[#333] text-[#F9F8F6] font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xs cursor-pointer transition">
                  Buy Specimen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sandbox Typewriter Layout */}
        {activeTab === "sandbox" && (
          <div className="w-full max-w-2xl bg-white border border-[#1A1A1A]/10 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between font-mono text-[9px] tracking-widest text-[#1A1A1A]/40 uppercase">
              <span>SANDBOX TYPEWRITER // 실시간 문장 믹싱 테스트</span>
              <span>자모 및 영자 결합도 확인</span>
            </div>
            
            {/* Dynamic visual preview area */}
            <div
              className="bg-[#F9F8F6]/30 border border-[#1A1A1A]/5 p-6 min-h-[140px] flex items-center justify-center transition-all text-center"
              style={containerStyle}
            >
              <p className="text-lg md:text-2xl font-bold text-[#1A1A1A] w-full break-words">
                {customText || "테스트하고 싶은 본인만의 다국어 매칭 문장을 입력해 주셔도 됩니다."}
              </p>
            </div>

            {/* Input target */}
            <div>
              <label className="text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]/50 block mb-1">
                텍스트 입력 필드
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="영문 알파벳과 한글이 마구 섞인 문장을 입력해서 글꼴의 두께와 높이 편차를 관찰해 보십시오. (예: Web Design의 정수는 React 컴포넌트를 이식하는 것입니다.)"
                className="w-full rounded-xs border border-[#1A1A1A]/10 p-3 text-xs focus:outline-none focus:border-[#FF4D00] bg-transparent font-serif italic"
                rows={3}
              />
            </div>

            {/* Quick preset texts */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/40 font-bold mr-1">추천 예문:</span>
              <button
                onClick={() => setCustomText("New World의 시작은 AI Build 인프라와 함께 합니다.")}
                className="text-[9px] uppercase tracking-wider bg-transparent border border-[#1A1A1A]/10 text-[#1A1A1A]/70 px-2.5 py-1 rounded-xs hover:border-[#1A1A1A]/30 cursor-pointer transition"
              >
                1. IT 테크스타일
              </button>
              <button
                onClick={() => setCustomText("The Paris luxury 브랜드 갤러리에 오신 것을 환영하며, 깊은 예술의 감격을 보냅니다.")}
                className="text-[9px] uppercase tracking-wider bg-transparent border border-[#1A1A1A]/10 text-[#1A1A1A]/70 px-2.5 py-1 rounded-xs hover:border-[#1A1A1A]/30 cursor-pointer transition"
              >
                2. 우아한 럭셔리 매그
              </button>
              <button
                onClick={() => setCustomText("Developer들을 위한 JetBrains Mono 가독성 가이드라인을 수립합니다. #100K 다운로드")}
                className="text-[9px] uppercase tracking-wider bg-transparent border border-[#1A1A1A]/10 text-[#1A1A1A]/70 px-2.5 py-1 rounded-xs hover:border-[#1A1A1A]/30 cursor-pointer transition"
              >
                3. 개발 로그 수치
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
