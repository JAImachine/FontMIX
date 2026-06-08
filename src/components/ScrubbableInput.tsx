import React, { useRef, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScrubbableInputProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  suffix?: string;
}

export default function ScrubbableInput({
  value,
  onChange,
  min,
  max,
  step,
  label,
  suffix = ""
}: ScrubbableInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const getPrecision = (stepVal: number) => {
    const stepStr = stepVal.toString();
    const dotIdx = stepStr.indexOf(".");
    return dotIdx === -1 ? 0 : stepStr.length - dotIdx - 1;
  };

  const precision = getPrecision(step);

  const clampAndRound = (val: number) => {
    const clamped = Math.max(min, Math.min(max, val));
    const inverse = 1 / step;
    const rounded = Math.round(clamped * inverse) / inverse;
    return parseFloat(rounded.toFixed(precision));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;

    // Prevent text highlights
    e.preventDefault();

    const startX = e.clientX;
    const startVal = value;
    let hasDragged = false;

    const range = max - min;
    // Dragging 240px will shift the full range of the control
    const baseSensitivity = range / 240;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;

      if (Math.abs(deltaX) > 3) {
        hasDragged = true;
      }

      if (hasDragged) {
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";

        // Precision modifiers
        let speed = baseSensitivity;
        if (moveEvent.shiftKey) {
          speed = baseSensitivity * 4; // Fast speed (Shift)
        } else if (moveEvent.altKey) {
          speed = baseSensitivity / 5; // Slow speed (Alt)
        }

        const rawNewVal = startVal + deltaX * speed;
        onChange(clampAndRound(rawNewVal));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (!hasDragged) {
        // Just a click without dragging -> transition to typing mode
        setIsEditing(true);
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 50);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Horizontal Wheel Scroll only (Vertical wheel scroll is ignored to let page scroll normally)
  const handleWheel = (e: React.WheelEvent) => {
    if (isEditing) return;

    // Only respond to horizontal scrolling
    if (Math.abs(e.deltaX) > 0) {
      e.preventDefault();

      let changeAmount = e.deltaX > 0 ? step : -step;

      // Adapt Shift (fast) and Alt (fine-tune precision)
      if (e.shiftKey) {
        changeAmount *= 5;
      } else if (e.altKey) {
        changeAmount /= 5;
      }

      onChange(clampAndRound(value + changeAmount));
    }
  };

  // Safe manual keyboard input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(clampAndRound(parsed));
    } else {
      setInputValue(value.toString());
    }
  };

  const applyStep = (direction: 1 | -1) => {
    const nextValue = clampAndRound(value + step * direction);
    onChange(nextValue);
    setInputValue(nextValue.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
      className="group relative flex flex-col gap-1 transition-all w-full select-none"
    >
      <div
        onMouseDown={handleMouseDown}
        style={{ cursor: isEditing ? "text" : "ew-resize" }}
        className={`relative flex items-center h-10 px-3 pr-8 bg-white border rounded transition-all select-none duration-150 ${
          isEditing
            ? "border-[#3D67E6]"
            : isHovered
            ? "border-[#3D67E6] bg-[#3D67E6]/[0.02] shadow-[0_0_10px_rgba(61,103,230,0.06)]"
            : "border-[#1a1a1a]/12"
        }`}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            step={step}
            min={min}
            max={max}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent text-xs font-semibold text-[#1A1A1A] outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <div className="w-full flex justify-between items-center text-xs font-bold font-mono text-[#1D1D1D]">
            <span className="transition-all duration-150 group-hover:text-[#3D67E6]">{value}</span>
            <span className="text-[10px] font-medium text-[#777] uppercase flex items-center gap-1">
              {suffix}
            </span>
          </div>
        )}
        <div
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded border border-[#1A1A1A]/10 bg-white shadow-xs transition-opacity ${
            isHovered || isEditing ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              applyStep(1);
            }}
            className="h-4 w-5 flex items-center justify-center text-[#1A1A1A]/45 hover:text-[#3D67E6] hover:bg-[#3D67E6]/5 border-b border-[#1A1A1A]/8 cursor-pointer"
            title={`${label} +${step}`}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              applyStep(-1);
            }}
            className="h-4 w-5 flex items-center justify-center text-[#1A1A1A]/45 hover:text-[#3D67E6] hover:bg-[#3D67E6]/5 cursor-pointer"
            title={`${label} -${step}`}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
