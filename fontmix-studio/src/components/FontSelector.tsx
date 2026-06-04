import React, { useState } from "react";
import { FontMetadata } from "../types";
import { Check, Search } from "lucide-react";

interface FontSelectorProps {
  title: string;
  fonts: FontMetadata[];
  selectedFont: FontMetadata;
  onSelect: (font: FontMetadata) => void;
  langTag: "EN" | "KO";
}

export default function FontSelector({
  title,
  fonts,
  selectedFont,
  onSelect,
  langTag,
}: FontSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "전체" },
    { id: "sans-serif", label: "고딕 (Sans)" },
    { id: "serif", label: "명조 (Serif)" },
    ...(langTag === "EN"
      ? [
          { id: "monospace", label: "모노 (Mono)" },
          { id: "display", label: "디스플레이" },
        ]
      : [
          { id: "display", label: "디스플레이" },
          { id: "handwriting", label: "손글씨" },
        ]),
  ];

  const filteredFonts = fonts.filter((font) => {
    const matchesCategory =
      activeCategory === "all" || font.category === activeCategory;
    const matchesSearch =
      font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.vibeTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xs border border-[#1A1A1A]/10 p-6 flex flex-col h-[520px] transition-all">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 border ${
                langTag === "KO"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              {langTag === "KO" ? "Hangul" : "Latin"}
            </span>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#1A1A1A]/80">{title}</h3>
          </div>
          <span className="text-[10px] font-mono opacity-50">
            {filteredFonts.length} specimens
          </span>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#1A1A1A]/40" />
          <input
            type="text"
            placeholder="서체명, 제작자, 키워드 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-b border-[#1A1A1A]/10 bg-transparent text-xs focus:outline-none focus:border-[#1A1A1A] transition placeholder-[#1A1A1A]/30"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-[10px] uppercase tracking-wider whitespace-nowrap px-3 py-1 font-medium transition cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#1A1A1A] text-[#F9F8F6]"
                  : "bg-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A] border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin divide-y divide-[#1A1A1A]/5">
        {filteredFonts.length === 0 ? (
          <div className="py-12 text-center text-[#1A1A1A]/40 text-xs font-serif italic">
            검색 결과와 호환되는 서체가 없습니다.
          </div>
        ) : (
          filteredFonts.map((font) => {
            const isSelected = selectedFont.id === font.id;
            return (
              <div
                key={font.id}
                onClick={() => onSelect(font)}
                className={`p-3 transition cursor-pointer flex flex-col gap-2 border-l-2 ${
                  isSelected
                    ? "bg-[#F9F8F6] border-[#FF4D00]"
                    : "border-transparent hover:bg-[#F9F8F6]/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] text-xs flex items-center gap-1.5 font-sans uppercase tracking-wider">
                      {font.name}
                      {isSelected && (
                        <Check className="h-3 w-3 text-[#FF4D00] stroke-[3]" />
                      )}
                    </h4>
                    <p className="text-[10px] font-mono text-[#1A1A1A]/50">by {font.developer}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
                    {font.vibeTags.slice(0, 1).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono text-[#1A1A1A]/60 uppercase border border-[#1A1A1A]/10 px-1 py-0.2"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Micro-preview native render */}
                <div
                  className="bg-white border border-[#1A1A1A]/5 p-2 h-[56px] flex items-center overflow-hidden transition-all text-xs"
                  style={{ fontFamily: `'${font.name}', sans-serif` }}
                >
                  <span className="text-[#1A1A1A] font-medium block truncate w-full">
                    {langTag === "KO"
                      ? "조화로운 글꼴의 배려 폰트믹스"
                      : "The quick brown fox jumps."}
                  </span>
                </div>

                <p className="text-[10px] text-[#1A1A1A]/75 leading-relaxed truncate">
                  {font.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
