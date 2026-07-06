import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export const CustomSelect = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex items-center justify-between text-left`}
      >
        <span className="truncate pr-2">{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === opt.value
                ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 font-bold"
                : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const VALID_AWS_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "ca-central-1", "ca-west-1", "sa-east-1",
  "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2", "eu-south-1", "eu-south-2", "eu-north-1",
  "ap-south-1", "ap-south-2", "ap-northeast-1", "ap-northeast-2", "ap-northeast-3", "ap-southeast-1", "ap-southeast-2", "ap-southeast-3", "ap-southeast-4", "ap-east-1",
  "me-south-1", "me-central-1", "af-south-1", "us-gov-west-1", "us-gov-east-1"
];

export const STANDARD_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "sa-east-1", label: "South America (São Paulo)" }
];

export const RegionSelect = ({ value, onChange, className, openUp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const selectRef = useRef(null);
  const isCustomInitiated = useRef(false);

  // Sync internal state with value prop
  useEffect(() => {
    if (isCustomInitiated.current) {
      isCustomInitiated.current = false;
      return;
    }
    const isStd = STANDARD_REGIONS.some((opt) => opt.value === value);
    if (value && !isStd) {
      // It's a custom region code
      setIsCustomMode(true);
      setSearch(value);
      setIsInvalid(!VALID_AWS_REGIONS.includes(value.toLowerCase()));
    } else {
      // It's a standard region or empty
      setIsCustomMode(false);
      setIsInvalid(false);
      const matched = STANDARD_REGIONS.find((opt) => opt.value === value);
      setSearch(matched ? matched.label : value || "");
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        if (isCustomMode) {
          commitValue();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [search, value, isCustomMode]);

  const commitValue = () => {
    const typedValue = search.trim();
    if (!typedValue) {
      onChange("");
      return;
    }
    // If they typed a standard region label or code, map to it
    const matched = STANDARD_REGIONS.find(
      (opt) =>
        opt.label.toLowerCase() === typedValue.toLowerCase() ||
        opt.value.toLowerCase() === typedValue.toLowerCase()
    );
    if (matched) {
      onChange(matched.value);
      setIsCustomMode(false);
    } else {
      onChange(typedValue);
    }
  };

  const handleInputChange = (e) => {
    if (!isCustomMode) return;
    const nextVal = e.target.value;
    setSearch(nextVal);

    const typed = nextVal.trim().toLowerCase();
    if (!typed) {
      setIsInvalid(false);
    } else {
      setIsInvalid(!VALID_AWS_REGIONS.includes(typed));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isCustomMode) {
      setIsOpen(false);
      commitValue();
      e.target.blur();
    }
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full" ref={selectRef}>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          readOnly={!isCustomMode}
          placeholder="Select or enter region..."
          className={`${className} ${isInvalid
            ? "border-rose-500 focus:border-rose-500 dark:border-rose-500 focus:ring-1 focus:ring-rose-500"
            : "focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            } ${!isCustomMode ? "cursor-pointer select-none" : ""} pr-10`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-slate-400 dark:text-zinc-500">
          <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isInvalid && (
        <span className="text-[10px] font-semibold text-rose-500 mt-1 block">
          ⚠ Invalid AWS Region Code
        </span>
      )}

      {isOpen && (
        <div className={`absolute z-[100] left-0 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 max-h-40 overflow-y-auto ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {STANDARD_REGIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${!isCustomMode && value === opt.value
                ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 font-bold"
                : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              isCustomInitiated.current = true;
              setIsCustomMode(true);
              setSearch("");
              onChange("");
              setIsOpen(false);
              setTimeout(() => {
                const inputEl = selectRef.current?.querySelector("input");
                if (inputEl) inputEl.focus();
              }, 50);
            }}
            className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-slate-100 dark:border-zinc-800/80 font-bold ${isCustomMode
              ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white"
              }`}
          >
            Custom Region...
          </button>
        </div>
      )}
    </div>
  );
};
