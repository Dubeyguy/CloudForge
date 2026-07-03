import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  NodeResizer,
  Handle,
  Position,
  ConnectionMode,
  reconnectEdge, // <-- Added for Edge Reconnection
  useStore,
  applyNodeChanges,
} from "@xyflow/react";
import {
  Play,
  Download,
  Code,
  Layers,
  Terminal,
  Trash2,
  Settings2,
  X,
  CheckCircle2,
  Check,
  Database,
  Scissors,
  ClipboardPaste,
  Copy,
  Menu,
  HardDrive,
  CloudLightning,
  ChevronRight,
  ChevronDown,
  Activity,
  FolderOpen,
  Plus,
  AlertTriangle,
  FolderPlus,
  ArrowLeft,
  Clock,
  Settings,
  Moon,
  Sun,
  Sparkles,
  Save,
  Search,
  Square,
  Circle as CircleIcon,
  Type,
  Undo,
  Redo,
  User,
  Users,
  Key,
  Shield,
  Coins,
  Maximize2,
  Edit,
  File,
  Folder,
  Upload,
  Server,
  History,
} from "lucide-react";

import "@xyflow/react/dist/style.css";

// ==========================================
// CUSTOM COMPONENTS
// ==========================================
const CustomSelect = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = React.useRef(null);

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

const VALID_AWS_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "ca-central-1", "ca-west-1", "sa-east-1",
  "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2", "eu-south-1", "eu-south-2", "eu-north-1",
  "ap-south-1", "ap-south-2", "ap-northeast-1", "ap-northeast-2", "ap-northeast-3", "ap-southeast-1", "ap-southeast-2", "ap-southeast-3", "ap-southeast-4", "ap-east-1",
  "me-south-1", "me-central-1", "af-south-1", "us-gov-west-1", "us-gov-east-1"
];

const STANDARD_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
];

const ALL_INSTANCE_TYPES = [
  // T2 Family (Burstable, Legacy)
  { value: "t2.nano", label: "t2.nano", family: "General Purpose", cpu: 1, ram: "0.5 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0058, Windows: 0.0081, RHEL: 0.0658, UbuntuPro: 0.0076, SUSE: 0.0158 } },
  { value: "t2.micro", label: "t2.micro", family: "General Purpose", cpu: 1, ram: "1 GiB", currentGen: true, freeTier: true, legacy: true, pricing: { Linux: 0.0116, Windows: 0.0162, RHEL: 0.0716, UbuntuPro: 0.0142, SUSE: 0.0216 } },
  { value: "t2.small", label: "t2.small", family: "General Purpose", cpu: 1, ram: "2 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0230, Windows: 0.0324, RHEL: 0.0830, UbuntuPro: 0.0266, SUSE: 0.0330 } },
  { value: "t2.medium", label: "t2.medium", family: "General Purpose", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0464, Windows: 0.0648, RHEL: 0.1064, UbuntuPro: 0.0531, SUSE: 0.0564 } },
  { value: "t2.large", label: "t2.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0928, Windows: 0.1296, RHEL: 0.1528, UbuntuPro: 0.1062, SUSE: 0.1028 } },
  { value: "t2.xlarge", label: "t2.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.1856, Windows: 0.2592, RHEL: 0.2456, UbuntuPro: 0.2124, SUSE: 0.1956 } },
  { value: "t2.2xlarge", label: "t2.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.3712, Windows: 0.5184, RHEL: 0.4312, UbuntuPro: 0.4248, SUSE: 0.3812 } },

  // T3 Family (Burstable, Current Gen)
  { value: "t3.nano", label: "t3.nano", family: "General Purpose", cpu: 1, ram: "0.5 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0052, Windows: 0.0079, RHEL: 0.0652, UbuntuPro: 0.0070, SUSE: 0.0152 } },
  { value: "t3.micro", label: "t3.micro", family: "General Purpose", cpu: 1, ram: "1 GiB", currentGen: true, freeTier: true, legacy: false, pricing: { Linux: 0.0104, Windows: 0.0156, RHEL: 0.0704, UbuntuPro: 0.0130, SUSE: 0.0204 } },
  { value: "t3.small", label: "t3.small", family: "General Purpose", cpu: 2, ram: "2 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0208, Windows: 0.0312, RHEL: 0.0808, UbuntuPro: 0.0244, SUSE: 0.0308 } },
  { value: "t3.medium", label: "t3.medium", family: "General Purpose", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0416, Windows: 0.0624, RHEL: 0.1016, UbuntuPro: 0.0488, SUSE: 0.0516 } },
  { value: "t3.large", label: "t3.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0832, Windows: 0.1248, RHEL: 0.1432, UbuntuPro: 0.0976, SUSE: 0.0932 } },
  { value: "t3.xlarge", label: "t3.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1664, Windows: 0.2496, RHEL: 0.2264, UbuntuPro: 0.1952, SUSE: 0.1764 } },
  { value: "t3.2xlarge", label: "t3.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3328, Windows: 0.4992, RHEL: 0.3928, UbuntuPro: 0.3904, SUSE: 0.3428 } },

  // T4g Family (Burstable, AWS Graviton2)
  { value: "t4g.nano", label: "t4g.nano", family: "General Purpose", cpu: 2, ram: "0.5 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0042, Windows: null, RHEL: 0.0642, UbuntuPro: 0.0056, SUSE: 0.0142 } },
  { value: "t4g.micro", label: "t4g.micro", family: "General Purpose", cpu: 2, ram: "1 GiB", currentGen: true, freeTier: true, legacy: false, pricing: { Linux: 0.0084, Windows: null, RHEL: 0.0684, UbuntuPro: 0.0104, SUSE: 0.0184 } },
  { value: "t4g.small", label: "t4g.small", family: "General Purpose", cpu: 2, ram: "2 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0168, Windows: null, RHEL: 0.0768, UbuntuPro: 0.0196, SUSE: 0.0268 } },
  { value: "t4g.medium", label: "t4g.medium", family: "General Purpose", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0336, Windows: null, RHEL: 0.0936, UbuntuPro: 0.0392, SUSE: 0.0436 } },
  { value: "t4g.large", label: "t4g.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0672, Windows: null, RHEL: 0.1272, UbuntuPro: 0.0784, SUSE: 0.0772 } },
  { value: "t4g.xlarge", label: "t4g.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1344, Windows: null, RHEL: 0.1944, UbuntuPro: 0.1568, SUSE: 0.1444 } },
  { value: "t4g.2xlarge", label: "t4g.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2688, Windows: null, RHEL: 0.3288, UbuntuPro: 0.3136, SUSE: 0.2788 } },

  // M5 Family (General Purpose)
  { value: "m5.large", label: "m5.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0960, Windows: 0.1880, RHEL: 0.1560, UbuntuPro: 0.1160, SUSE: 0.2160 } },
  { value: "m5.xlarge", label: "m5.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1920, Windows: 0.3760, RHEL: 0.2520, UbuntuPro: 0.2320, SUSE: 0.3120 } },
  { value: "m5.2xlarge", label: "m5.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3840, Windows: 0.7520, RHEL: 0.4440, UbuntuPro: 0.4640, SUSE: 0.5040 } },
  { value: "m5.4xlarge", label: "m5.4xlarge", family: "General Purpose", cpu: 16, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.7680, Windows: 1.5040, RHEL: 0.8280, UbuntuPro: 0.9280, SUSE: 0.8880 } },

  // M6g Family (General Purpose, AWS Graviton3)
  { value: "m6g.large", label: "m6g.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0770, Windows: null, RHEL: 0.1370, UbuntuPro: 0.0930, SUSE: 0.1970 } },
  { value: "m6g.xlarge", label: "m6g.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1540, Windows: null, RHEL: 0.2140, UbuntuPro: 0.1860, SUSE: 0.2740 } },
  { value: "m6g.2xlarge", label: "m6g.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3080, Windows: null, RHEL: 0.3680, UbuntuPro: 0.3720, SUSE: 0.4280 } },
  { value: "m6g.4xlarge", label: "m6g.4xlarge", family: "General Purpose", cpu: 16, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.6160, Windows: null, RHEL: 0.6760, UbuntuPro: 0.7440, SUSE: 0.7360 } },

  // C5 Family (Compute Optimized)
  { value: "c5.large", label: "c5.large", family: "Compute Optimized", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0850, Windows: 0.1770, RHEL: 0.1450, UbuntuPro: 0.1050, SUSE: 0.2050 } },
  { value: "c5.xlarge", label: "c5.xlarge", family: "Compute Optimized", cpu: 4, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1700, Windows: 0.3540, RHEL: 0.2300, UbuntuPro: 0.2100, SUSE: 0.2900 } },
  { value: "c5.2xlarge", label: "c5.2xlarge", family: "Compute Optimized", cpu: 8, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3400, Windows: 0.7080, RHEL: 0.4000, UbuntuPro: 0.4200, SUSE: 0.4600 } },
  { value: "c5.4xlarge", label: "c5.4xlarge", family: "Compute Optimized", cpu: 16, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.6800, Windows: 1.4160, RHEL: 0.7400, UbuntuPro: 0.8400, SUSE: 0.8000 } },

  // C6g Family (Compute Optimized, AWS Graviton3)
  { value: "c6g.large", label: "c6g.large", family: "Compute Optimized", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0680, Windows: null, RHEL: 0.1280, UbuntuPro: 0.0840, SUSE: 0.1880 } },
  { value: "c6g.xlarge", label: "c6g.xlarge", family: "Compute Optimized", cpu: 4, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1360, Windows: null, RHEL: 0.1960, UbuntuPro: 0.1680, SUSE: 0.2560 } },
  { value: "c6g.2xlarge", label: "c6g.2xlarge", family: "Compute Optimized", cpu: 8, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2720, Windows: null, RHEL: 0.3320, UbuntuPro: 0.3360, SUSE: 0.3920 } },
  { value: "c6g.4xlarge", label: "c6g.4xlarge", family: "Compute Optimized", cpu: 16, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.5440, Windows: null, RHEL: 0.6040, UbuntuPro: 0.6720, SUSE: 0.6640 } },

  // R5 Family (Memory Optimized)
  { value: "r5.large", label: "r5.large", family: "Memory Optimized", cpu: 2, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1260, Windows: 0.2180, RHEL: 0.1860, UbuntuPro: 0.1460, SUSE: 0.2460 } },
  { value: "r5.xlarge", label: "r5.xlarge", family: "Memory Optimized", cpu: 4, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2520, Windows: 0.4360, RHEL: 0.3120, UbuntuPro: 0.2920, SUSE: 0.3720 } },
  { value: "r5.2xlarge", label: "r5.2xlarge", family: "Memory Optimized", cpu: 8, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.5040, Windows: 0.8720, RHEL: 0.5640, UbuntuPro: 0.5840, SUSE: 0.6240 } },
  { value: "r5.4xlarge", label: "r5.4xlarge", family: "Memory Optimized", cpu: 16, ram: "128 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 1.0080, Windows: 1.7440, RHEL: 1.0680, UbuntuPro: 1.1680, SUSE: 1.1280 } },

  // R6g Family (Memory Optimized, AWS Graviton3)
  { value: "r6g.large", label: "r6g.large", family: "Memory Optimized", cpu: 2, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1010, Windows: null, RHEL: 0.1610, UbuntuPro: 0.1170, SUSE: 0.2210 } },
  { value: "r6g.xlarge", label: "r6g.xlarge", family: "Memory Optimized", cpu: 4, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2020, Windows: null, RHEL: 0.2620, UbuntuPro: 0.2340, SUSE: 0.3220 } },
  { value: "r6g.2xlarge", label: "r6g.2xlarge", family: "Memory Optimized", cpu: 8, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.4040, Windows: null, RHEL: 0.4640, UbuntuPro: 0.4680, SUSE: 0.5240 } },
  { value: "r6g.4xlarge", label: "r6g.4xlarge", family: "Memory Optimized", cpu: 16, ram: "128 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.8080, Windows: null, RHEL: 0.8680, UbuntuPro: 0.9360, SUSE: 0.9280 } }
];

const REGIONAL_MULTIPLIERS = {
  "us-east-1": 1.00,
  "us-east-2": 1.05,
  "us-west-1": 1.20,
  "us-west-2": 1.10,
  "eu-west-1": 1.12,
  "eu-central-1": 1.18,
  "ap-south-1": 1.15
};

const OS_IMAGES = [
  { 
    id: "amazon-linux-2023", 
    name: "Amazon Linux 2023 (AL2023)", 
    platform: "Linux", 
    defaultAmis: { 
      "us-east-1": "ami-04b70fa74e45c3917", 
      "us-east-2": "ami-05d389e10743b881a", 
      "us-west-1": "ami-038b90a07d27e85c7", 
      "us-west-2": "ami-03d5c48b0a1d9cad5", 
      "ap-south-1": "ami-022d03f649d12a49d" 
    } 
  },
  { 
    id: "ubuntu-24", 
    name: "Ubuntu Server 24.04 LTS", 
    platform: "Linux", 
    defaultAmis: { 
      "us-east-1": "ami-04a81a99f5ec58529", 
      "us-east-2": "ami-0904037de8501fd90", 
      "us-west-1": "ami-053a45df0a698bc08", 
      "us-west-2": "ami-0606dd43116f5ed57", 
      "ap-south-1": "ami-0f5ee92e2d63afc18" 
    } 
  },
  { 
    id: "windows-2022", 
    name: "Windows Server 2022 Base", 
    platform: "Windows", 
    defaultAmis: { 
      "us-east-1": "ami-03c62377d6118544d", 
      "us-east-2": "ami-0d65b161df27f8a70", 
      "us-west-1": "ami-0b92db2d713c7bc37", 
      "us-west-2": "ami-07971b3e150965e64", 
      "ap-south-1": "ami-07d0f779774640108" 
    } 
  },
  { 
    id: "rhel-9", 
    name: "Red Hat Enterprise Linux 9", 
    platform: "RHEL", 
    defaultAmis: { 
      "us-east-1": "ami-0583d8c7a9c35d7a9", 
      "us-east-2": "ami-0f2c00a6e76cfb1ef", 
      "us-west-1": "ami-054965c6cd7c6e4c9", 
      "us-west-2": "ami-03c004c27a20c3a2f", 
      "ap-south-1": "ami-0e1d062fe401e4046" 
    } 
  },
  { 
    id: "suse-15", 
    name: "SUSE Linux Enterprise Server 15", 
    platform: "SUSE", 
    defaultAmis: { 
      "us-east-1": "ami-0db2fb6d43522f7b8", 
      "us-east-2": "ami-04e4c360b37dc1d7c", 
      "us-west-1": "ami-01d89955faad0061e", 
      "us-west-2": "ami-09cf8f1b63574c8bc", 
      "ap-south-1": "ami-03b879ec352a979dd" 
    } 
  }
];

const calculateEC2Cost = (instanceType, volumeSize, region, platform) => {
  const currentInstanceType = instanceType || "t2.micro";
  const currentVolumeSize = volumeSize || 8;
  const currentRegion = region || "us-east-1";
  const currentPlatform = platform || "Linux";

  const matchedType = ALL_INSTANCE_TYPES.find(t => t.value === currentInstanceType);
  const hourlyPrice = matchedType && matchedType.pricing
    ? (matchedType.pricing[currentPlatform] !== null ? matchedType.pricing[currentPlatform] : matchedType.pricing["Linux"])
    : 0.0116;

  const baseCost = (hourlyPrice || 0) * 730;
  const multiplier = REGIONAL_MULTIPLIERS[currentRegion.toLowerCase()] !== undefined
    ? REGIONAL_MULTIPLIERS[currentRegion.toLowerCase()]
    : 1.15;

  const instanceCost = baseCost * multiplier;
  const storageCost = currentVolumeSize * 0.08;
  return parseFloat((instanceCost + storageCost).toFixed(2));
};


const RegionSelect = ({ value, onChange, className }) => {
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
          className={`${className} ${
            isInvalid
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
        <div className="absolute z-[100] top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto">
          {STANDARD_REGIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                !isCustomMode && value === opt.value
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
            className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-slate-100 dark:border-zinc-800/80 font-bold ${
              isCustomMode
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

// ==========================================
// 1. CUSTOM NODES
// ==========================================
const ModeContext = React.createContext("dev");

const AuditBadge = ({ data }) => {
  const activeMode = React.useContext(ModeContext);
  if (activeMode !== "audit") return null;

  const findings = data?.auditFindings || [];
  if (findings.length === 0) {
    return (
      <span className="absolute -top-2 -right-2 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full shadow-md z-20 border border-white dark:border-zinc-900 bg-emerald-500 text-white">
        ✓ Secure
      </span>
    );
  }

  const severityCounts = { critical: 0, high: 0, medium: 0, info: 0 };
  findings.forEach((f) => {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
  });

  let badgeColor = "bg-emerald-500 text-white";
  let label = "✓ Secure";

  if (severityCounts.critical > 0) {
    badgeColor = "bg-rose-600 text-white animate-pulse";
    label = `❌ Critical (${severityCounts.critical})`;
  } else if (severityCounts.high > 0) {
    badgeColor = "bg-red-500 text-white";
    label = `⚠️ High (${severityCounts.high})`;
  } else if (severityCounts.medium > 0) {
    badgeColor = "bg-amber-500 text-white";
    label = `⚠️ Warning (${severityCounts.medium})`;
  } else if (severityCounts.info > 0) {
    badgeColor = "bg-sky-500 text-white";
    label = `ℹ️ Info (${severityCounts.info})`;
  }

  return (
    <span className={`absolute -top-2 -right-2 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full shadow-md z-20 border border-white dark:border-zinc-900 ${badgeColor}`}>
      {label}
    </span>
  );
};

const ZoomedOutOverlay = ({ type, name, colorClass = "bg-amber-500", borderClass = "border-amber-500", isCard = false, circle = false }) => {
  const zoom = useStore((s) => s.transform[2]);
  const isZoomedOut = zoom < 0.65;

  if (!isZoomedOut) return null;

  if (isCard) {
    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 border border-dashed ${borderClass} z-50 pointer-events-none select-none text-center rounded-xl p-2.5 animate-fade-in`}
      >
        <span className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-white ${colorClass} mb-1.5 shrink-0 shadow-sm`}>
          {type}
        </span>
        <span className="text-slate-900 dark:text-zinc-100 font-extrabold text-[15px] leading-tight truncate w-full px-1.5 shrink-0">
          {name}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 border-4 border-dashed ${borderClass} z-50 pointer-events-none select-none text-center p-5 transition-all duration-300 ${
        circle ? "rounded-full" : "rounded-3xl"
      }`}
    >
      <span className={`text-[18px] font-black uppercase tracking-widest px-4 py-1.5 rounded text-white ${colorClass} mb-3 shadow-lg shrink-0`}>
        {type}
      </span>
      <span className="text-slate-900 dark:text-zinc-100 font-black text-[26px] tracking-wide leading-tight line-clamp-3 max-w-full px-3 shrink-0">
        {name}
      </span>
    </div>
  );
};

const S3Node = ({ id, data, selected }) => {
  const activeMode = React.useContext(ModeContext);
  const isBudgetMode = activeMode === "budgets";
  const isAuditMode = activeMode === "audit";
  const cost = data?.cost || 0;
  const findings = data?.auditFindings || [];

  const [isListOpen, setIsListOpen] = useState(false);
  const children = useStore((s) => s.nodes.filter((n) => n.parentId === id && n.type === "s3ObjectNode"));
  const { setNodes, setEdges } = useReactFlow();

  const handleDeleteChild = (childId) => {
    setNodes((nds) => {
      const remainingChildren = nds.filter((n) => n.parentId === id && n.id !== childId);
      const newChildrenCount = remainingChildren.length;
      
      const newHeight = Math.max(200, 100 + Math.ceil(newChildrenCount / 2) * 80);
      const newWidth = newChildrenCount > 1 ? 500 : 300;

      return nds
        .filter((n) => n.id !== childId)
        .map((n) => {
          if (n.id === id) {
            return {
              ...n,
              style: {
                ...n.style,
                height: newHeight,
                width: newWidth,
              }
            };
          }
          if (n.parentId === id) {
            const childIndex = remainingChildren.findIndex(child => child.id === n.id);
            const row = Math.floor(childIndex / 2);
            const col = childIndex % 2;
            return {
              ...n,
              position: { x: 20 + col * 240, y: 60 + row * 80 }
            };
          }
          return n;
        });
    });
    setEdges((eds) => eds.filter((e) => e.source !== childId && e.target !== childId));
  };

  let borderClass = "border-dashed border-amber-300 dark:border-amber-500/50 hover:border-amber-400 dark:hover:border-amber-500/80";
  if (isBudgetMode) {
    borderClass = "border-dashed border-amber-400 dark:border-amber-500/50";
  }

  return (
    <>
      <NodeResizer
        color="#f59e0b"
        isVisible={selected}
        minWidth={250}
        minHeight={150}
      />
      <div
        className={`w-full h-full relative border-4 bg-transparent transition-colors cursor-grab active:cursor-grabbing group rounded-3xl ${borderClass}`}
      >
        <ZoomedOutOverlay type="S3 Bucket" name={data?.label} colorClass="bg-amber-500" borderClass="border-amber-500" />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none select-none z-10 min-w-0">
          <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-md text-amber-600 dark:text-amber-500 shrink-0">
              <Database size={14} />
            </div>
            <span className="text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-widest truncate">
              {data?.label || "S3 Bucket"}
            </span>
            {children.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsListOpen(!isListOpen);
                }}
                className={`p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all ${
                  isListOpen ? "bg-amber-100 dark:bg-amber-500/30" : ""
                }`}
                title="Toggle Snap List"
              >
                <Layers size={11} />
              </button>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
            {data?.isPublic ? "Public" : "Private"}
          </span>
        </div>

        {isListOpen && children.length > 0 && (
          <div className="absolute top-12 left-4 right-4 bottom-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 overflow-y-auto custom-scrollbar pointer-events-auto cursor-default flex flex-col gap-1.5 z-20 shadow-lg animate-fade-in nodrag">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-1.5 mb-1 shrink-0">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500">
                Snapped Objects ({children.length})
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsListOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between gap-2 text-[10px] bg-slate-50 dark:bg-zinc-900/40 p-2 rounded-xl border border-slate-100 dark:border-zinc-900/60 hover:border-amber-400/50 dark:hover:border-amber-500/30 transition-colors">
                <div className="flex flex-col min-w-0 flex-1 pr-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-200 truncate">
                    {child.data?.label || "S3 Object"}
                  </span>
                  <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono truncate" title={child.data?.sourcePath || ""}>
                    Path: {child.data?.sourcePath || "No path selected"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChild(child.id);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const S3ObjectNode = ({ data, id }) => {
  const parentId = useStore((s) => s.nodes.find((n) => n.id === id)?.parentId);
  const zoom = useStore((s) => s.transform[2]);
  const isZoomedOut = zoom < 0.65;

  if (isZoomedOut && parentId) return null;

  const isFolder = data?.sourceType === "folder";
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg dark:shadow-xl w-[220px] transition-all cursor-grab active:cursor-grabbing group relative hover:border-amber-400 dark:hover:border-amber-500/50">
      <ZoomedOutOverlay type="S3 Object" name={data?.label} colorClass="bg-amber-500" borderClass="border-amber-500" isCard={true} />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20 shadow-inner shrink-0">
          {isFolder ? <Folder size={16} /> : <File size={16} />}
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="text-slate-800 dark:text-zinc-100 font-bold text-sm leading-tight tracking-wide truncate">
            {data?.label || "S3 Object"}
          </h4>
          <p className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-semibold truncate">
            {isFolder ? "Folder Source" : "File Source"}
          </p>
        </div>
      </div>
    </div>
  );
};

const IAMNode = ({ data, id }) => {
  const parentId = useStore((s) => s.nodes.find((n) => n.id === id)?.parentId);
  const zoom = useStore((s) => s.transform[2]);
  const isZoomedOut = zoom < 0.65;

  if (isZoomedOut && parentId) return null;

  const activeMode = React.useContext(ModeContext);
  const isBudgetMode = activeMode === "budgets";
  const isAuditMode = activeMode === "audit";
  const findings = data?.auditFindings || [];

  const getIcon = () => {
    switch (data?.iamType) {
      case "User":
        return <User size={16} />;
      case "Group":
        return <Users size={16} />;
      case "Role":
        return <Shield size={16} />;
      case "Policy":
        return <Key size={16} />;
      default:
        return <User size={16} />;
    }
  };

  let borderClass = "border-slate-200 dark:border-zinc-800";
  let glowClass = "hover:border-violet-400 dark:hover:border-violet-500/50";

  if (isBudgetMode) {
    borderClass = "border-slate-300 dark:border-zinc-700/50";
  } else if (isAuditMode) {
    if (findings.length === 0) {
      glowClass = "shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-400 dark:border-emerald-500/30 hover:border-emerald-500";
      borderClass = "border-emerald-400 dark:border-emerald-500/30";
    } else {
      const hasCritical = findings.some((f) => f.severity === "critical" || f.severity === "high");
      if (hasCritical) {
        glowClass = "shadow-[0_0_20px_rgba(239,68,68,0.3)] border-rose-500 hover:border-rose-600";
        borderClass = "border-rose-500";
      } else {
        glowClass = "shadow-[0_0_15px_rgba(245,158,11,0.25)] border-amber-500 hover:border-amber-600";
        borderClass = "border-amber-500";
      }
    }
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl p-3 shadow-lg dark:shadow-xl w-[220px] transition-all cursor-grab active:cursor-grabbing group relative ${borderClass} ${glowClass}`}>
      <ZoomedOutOverlay type={`IAM ${data?.iamType || "Resource"}`} name={data?.label} colorClass="bg-violet-500" borderClass="border-violet-500" isCard={true} />
      <AuditBadge data={data} />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>

      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-500 border border-violet-100 dark:border-violet-500/20 shadow-inner shrink-0">
            {getIcon()}
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-slate-800 dark:text-zinc-100 font-bold text-sm leading-tight tracking-wide truncate">
              {data?.label || `IAM ${data?.iamType || "Resource"}`}
            </h4>
            <p className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-semibold truncate">
              AWS IAM {data?.iamType}
            </p>
          </div>
        </div>
        {isBudgetMode && (
          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shadow-sm bg-slate-500/10 text-slate-500 border border-slate-500/20">
            $0.00/mo
          </span>
        )}
      </div>
    </div>
  );
};

const ShapeNode = ({ data, selected }) => {
  const isText = data?.shapeType === "Text";
  const isCircle = data?.shapeType === "Circle";

  if (isText) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-lg dark:shadow-xl flex items-center justify-center min-w-[120px] min-h-[80px] transition-all hover:border-blue-400 dark:hover:border-blue-500/50 cursor-grab active:cursor-grabbing rounded-xl group relative">
        <ZoomedOutOverlay type="Note" name={data?.label} colorClass="bg-blue-500" borderClass="border-blue-500" isCard={true} />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <span className="text-slate-800 dark:text-zinc-200 font-bold text-sm text-center">
          {data?.label || "Text Note"}
        </span>
      </div>
    );
  }

  return (
    <>
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={200}
        minHeight={200}
        keepAspectRatio={isCircle}
      />
      <div
        className={`w-full h-full relative border-4 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-500/5 dark:bg-zinc-500/5 transition-colors hover:border-blue-400 dark:hover:border-blue-500/80 cursor-grab active:cursor-grabbing group ${isCircle ? "rounded-full" : "rounded-3xl"}`}
      >
        <ZoomedOutOverlay type={data?.shapeType || "Group"} name={data?.label} colorClass="bg-blue-500" borderClass="border-blue-500" circle={isCircle} />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>

        <div
          className={`absolute inset-4 nodrag cursor-default ${isCircle ? "rounded-full" : "rounded-2xl"}`}
        ></div>
        <span
          className={`absolute top-6 ${isCircle ? "left-1/2 -translate-x-1/2 text-center" : "left-6 text-left"} text-slate-400 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest pointer-events-none select-none z-10 max-w-[80%]`}
        >
          {data?.label || "Group"}
        </span>
      </div>
    </>
  );
};

const IAMGroupNode = ({ id, data, selected }) => {
  const [isListOpen, setIsListOpen] = useState(false);
  const children = useStore((s) => s.nodes.filter((n) => n.parentId === id && n.type === "iamNode"));
  const { setNodes, setEdges } = useReactFlow();

  const handleDeleteChild = (childId) => {
    setNodes((nds) => {
      const remainingChildren = nds.filter((n) => n.parentId === id && n.id !== childId);
      const newChildrenCount = remainingChildren.length;
      
      const newHeight = Math.max(200, 100 + Math.ceil(newChildrenCount / 2) * 80);
      const newWidth = newChildrenCount > 1 ? 500 : 300;

      return nds
        .filter((n) => n.id !== childId)
        .map((n) => {
          if (n.id === id) {
            return {
              ...n,
              style: {
                ...n.style,
                height: newHeight,
                width: newWidth,
              }
            };
          }
          if (n.parentId === id) {
            const childIndex = remainingChildren.findIndex(child => child.id === n.id);
            const row = Math.floor(childIndex / 2);
            const col = childIndex % 2;
            return {
              ...n,
              position: { x: 20 + col * 240, y: 60 + row * 80 }
            };
          }
          return n;
        });
    });
    setEdges((eds) => eds.filter((e) => e.source !== childId && e.target !== childId));
  };

  return (
    <>
      <NodeResizer
        color="#8b5cf6"
        isVisible={selected}
        minWidth={250}
        minHeight={150}
      />
      <div
        className={`w-full h-full relative border-4 border-dashed border-violet-300 dark:border-violet-500/50 bg-transparent transition-colors hover:border-violet-400 dark:hover:border-violet-500/80 cursor-grab active:cursor-grabbing group rounded-3xl`}
      >
        <ZoomedOutOverlay type="IAM Group" name={data?.label} colorClass="bg-violet-500" borderClass="border-violet-500" />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none select-none z-10 min-w-0">
          <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
            <div className="p-1.5 bg-violet-100 dark:bg-violet-500/20 rounded-md text-violet-600 dark:text-violet-500 shrink-0">
              <Users size={14} />
            </div>
            <span className="text-violet-700 dark:text-violet-300 font-bold text-xs uppercase tracking-widest truncate">
              {data?.label || "IAM Group"}
            </span>
            {children.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsListOpen(!isListOpen);
                }}
                className={`p-1 rounded text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all ${
                  isListOpen ? "bg-violet-100 dark:bg-violet-500/30" : ""
                }`}
                title="Toggle Group Members List"
              >
                <Layers size={11} />
              </button>
            )}
          </div>
        </div>

        {isListOpen && children.length > 0 && (
          <div className="absolute top-12 left-4 right-4 bottom-4 bg-white/95 dark:bg-zinc-955/95 backdrop-blur p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 overflow-y-auto custom-scrollbar pointer-events-auto cursor-default flex flex-col gap-1.5 z-20 shadow-lg animate-fade-in nodrag">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-1.5 mb-1 shrink-0">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500">
                Group Members ({children.length})
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsListOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between gap-2 text-[10px] bg-slate-50 dark:bg-zinc-900/40 p-2 rounded-xl border border-slate-100 dark:border-zinc-900/60 hover:border-violet-400/50 dark:hover:border-violet-500/30 transition-colors">
                <div className="flex flex-col min-w-0 flex-1 pr-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-200 truncate">
                    {child.data?.label || "IAM User"}
                  </span>
                  <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                    Type: {child.data?.iamType || "User"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChild(child.id);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const EC2Node = ({ data }) => {
  const activeMode = React.useContext(ModeContext);
  const isBudgetMode = activeMode === "budgets";
  const isAuditMode = activeMode === "audit";
  const cost = data?.cost || 8.50;
  const findings = data?.auditFindings || [];

  let glowClass = "hover:border-sky-400 dark:hover:border-sky-500/50";
  let borderClass = "border-slate-200 dark:border-zinc-800";
  let badgeClass = "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-zinc-700/50";

  if (isBudgetMode) {
    if (cost === 0) {
      glowClass = "shadow-[0_0_15px_rgba(148,163,184,0.15)] border-slate-300 dark:border-zinc-700";
      borderClass = "border-slate-300 dark:border-zinc-700";
      badgeClass = "bg-slate-500/10 text-slate-500 border border-slate-500/20";
    } else if (cost < 15) {
      glowClass = "shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-400 dark:border-emerald-500/50";
      borderClass = "border-emerald-400 dark:border-emerald-500/50";
      badgeClass = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20";
    } else {
      glowClass = "shadow-[0_0_15px_rgba(234,179,8,0.3)] border-yellow-400 dark:border-yellow-500/50";
      borderClass = "border-yellow-400 dark:border-yellow-500/50";
      badgeClass = "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-100 dark:border-yellow-500/20";
    }
  } else if (isAuditMode) {
    if (findings.length === 0) {
      glowClass = "shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-400 dark:border-emerald-500/30 hover:border-emerald-500";
      borderClass = "border-emerald-400 dark:border-emerald-500/30";
    } else {
      const hasCritical = findings.some((f) => f.severity === "critical" || f.severity === "high");
      if (hasCritical) {
        glowClass = "shadow-[0_0_20px_rgba(239,68,68,0.3)] border-rose-500 hover:border-rose-600";
        borderClass = "border-rose-500";
      } else {
        glowClass = "shadow-[0_0_15px_rgba(245,158,11,0.25)] border-amber-500 hover:border-amber-600";
        borderClass = "border-amber-500";
      }
    }
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl p-3 shadow-lg dark:shadow-xl w-[220px] transition-all cursor-grab active:cursor-grabbing group relative ${borderClass} ${glowClass}`}>
      <ZoomedOutOverlay type="EC2 Instance" name={data?.label} colorClass="bg-sky-500" borderClass="border-sky-500" isCard={true} />
      <AuditBadge data={data} />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>

      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-lg text-sky-600 dark:text-sky-500 border border-sky-100 dark:border-sky-500/20 shadow-inner shrink-0">
            <Server size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-slate-800 dark:text-zinc-100 font-bold text-sm leading-tight tracking-wide truncate">
              {data?.label || "EC2 Instance"}
            </h4>
            <p className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-semibold truncate">
              Amazon EC2
            </p>
          </div>
        </div>
        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shadow-sm transition-colors ${isBudgetMode ? badgeClass : "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20"}`}>
          {isBudgetMode ? `$${cost.toFixed(2)}/mo` : (data?.instanceType || "t2.micro")}
        </span>
      </div>
    </div>
  );
};

const nodeTypes = { s3Node: S3Node, s3ObjectNode: S3ObjectNode, shapeNode: ShapeNode, iamNode: IAMNode, iamGroupNode: IAMGroupNode, ec2Node: EC2Node };

const defaultInitialNodes = [
  {
    id: "s3_bucket_primary",
    type: "s3Node",
    data: {
      label: "production-assets-bucket",
      region: "us-east-1",
      isPublic: false,
      versioning: true,
      storageGB: 10,
      cost: 0.23,
    },
    position: { x: 250, y: 150 },
    zIndex: -1,
    style: { width: 300, height: 200 },
  },
];

// ==========================================
// 2. BOOT SEQUENCE: Welcome Screen
// ==========================================
const WelcomeScreen = ({ projects, onCreateProject, onLoadProject }) => {
  const [bootLog, setBootLog] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState("default");
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    const sequence = [
      "Initializing CloudForge Engine v0.8...",
      "Mounting visual workspace...",
      "Connecting to local storage driver...",
      "System ready.",
    ];
    let step = 0;
    const interval = setInterval(() => {
      setBootLog((prev) => [...prev, sequence[step]]);
      step++;
      if (step === sequence.length) {
        clearInterval(interval);
        setTimeout(() => setIsReady(true), 300);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) onCreateProject(newProjectName.trim());
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-zinc-950 items-center justify-center font-sans relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 welcome-pattern opacity-80"></div>

      <div className="z-10 w-full max-w-3xl p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white dark:text-black font-bold shadow-[0_4px_20px_rgba(245,158,11,0.4)]">
            <CloudLightning size={32} />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
              CloudForge
            </h1>
            <p className="text-slate-500 dark:text-zinc-500 text-lg font-mono mt-2">
              Visual Infrastructure as Code
            </p>
          </div>
        </div>

        {viewMode === "default" && (
          <>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl mb-8 min-h-[180px] flex flex-col justify-end transition-colors">
              <div className="font-mono text-base text-slate-500 dark:text-zinc-500 space-y-3 mb-4">
                {bootLog.map((log, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ChevronRight size={16} className="text-amber-500" />
                    <span
                      className={
                        i === bootLog.length - 1
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-slate-600 dark:text-zinc-400"
                      }
                    >
                      {log}
                    </span>
                  </div>
                ))}
                {!isReady && (
                  <div className="flex items-center gap-3 animate-pulse">
                    <span className="w-3 h-6 bg-amber-500 inline-block rounded-sm"></span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`transition-all duration-500 ease-out flex gap-6 ${isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <button
                onClick={() => setViewMode("new")}
                className="flex-1 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-950 p-6 rounded-2xl font-bold text-xl flex items-center justify-between group transition-all cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <Plus size={28} /> <span>Initialize Canvas</span>
                </div>
                <Activity
                  size={24}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
              <button
                onClick={() => setViewMode("open")}
                className="flex-1 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 p-6 rounded-2xl font-bold text-xl flex items-center justify-between transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <FolderOpen size={28} className="text-amber-500" />{" "}
                  <span>Open Project</span>
                </div>
              </button>
            </div>
          </>
        )}

        {viewMode === "new" && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl animate-fade-in transition-colors">
            <button
              onClick={() => setViewMode("default")}
              className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 mb-6 transition-colors font-medium"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Create New Infrastructure
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6">
              Enter a project name to initialize your local deployment tracking.
            </p>
            <form onSubmit={handleCreate} className="flex gap-4">
              <input
                autoFocus
                type="text"
                placeholder="e.g., prod-database-cluster"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium transition-colors"
              />
              <button
                type="submit"
                disabled={!newProjectName.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-bold px-8 py-4 rounded-xl transition-all shadow-md"
              >
                Start Building
              </button>
            </form>
          </div>
        )}

        {viewMode === "open" && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl animate-fade-in flex flex-col max-h-[400px] transition-colors">
            <button
              onClick={() => setViewMode("default")}
              className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 mb-6 transition-colors w-fit font-medium"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Your Cloud Projects
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-zinc-500 font-medium">
                  No saved projects found in local storage.
                </div>
              ) : (
                projects
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onLoadProject(proj.id)}
                      className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950/50 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg">
                          <Layers size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-white transition-colors">
                            {proj.name}
                          </h3>
                          <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-1">
                            {proj.nodes?.length || 0} Components • Last edited{" "}
                            {new Date(proj.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className="text-slate-300 dark:text-zinc-600 group-hover:text-amber-500 transition-colors"
                      />
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN APP: The Floating Editor
// ==========================================
function CloudForgeEditor({
  activeProject,
  projects,
  onLoadProject,
  onSave,
  onNewProjectFlow,
  userSettings,
  updateSettings,
  onOpenProjectsDashboard,
}) {
  const { screenToFlowPosition, fitView, getIntersectingNodes, getNode } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const connectionStartParams = useRef(null);
  const [floatingConnectionSearch, setFloatingConnectionSearch] = useState(null);
  const [connectionSearchQuery, setConnectionSearchQuery] = useState("");
  const [connectionSearchActiveIndex, setConnectionSearchActiveIndex] = useState(0);
  const connectionSearchRef = useRef(null);
  const prevConnectionIndex = useRef(0);
  const prevGlobalIndex = useRef(-1);
  const connectionMade = useRef(false);

  const [nodes, setNodes, standardOnNodesChange] = useNodesState(
    activeProject?.nodes || [],
  );

  const onNodesChange = useCallback(
    (changes) => {
      const removeChanges = changes.filter((c) => c.type === "remove");
      if (removeChanges.length > 0) {
        const removedIds = removeChanges.map((c) => c.id);
        setNodes((nds) => {
          const parentIdsToUpdate = new Set();
          nds.forEach((n) => {
            if (removedIds.includes(n.id) && n.parentId) {
              parentIdsToUpdate.add(n.parentId);
            }
          });

          let nextNodes = applyNodeChanges(changes, nds);

          parentIdsToUpdate.forEach((parentId) => {
            const parentGroupNode = nextNodes.find((n) => n.id === parentId);
            if (parentGroupNode) {
              const remainingChildren = nextNodes.filter((n) => n.parentId === parentId);
              const newChildrenCount = remainingChildren.length;
              
              const newHeight = Math.max(200, 100 + Math.ceil(newChildrenCount / 2) * 80);
              const newWidth = newChildrenCount > 1 ? 500 : 300;

              nextNodes = nextNodes.map((n) => {
                if (n.id === parentId) {
                  return {
                    ...n,
                    style: {
                      ...n.style,
                      height: newHeight,
                      width: newWidth,
                    },
                  };
                }
                if (n.parentId === parentId) {
                  const childIndex = remainingChildren.findIndex((child) => child.id === n.id);
                  const row = Math.floor(childIndex / 2);
                  const col = childIndex % 2;
                  return {
                    ...n,
                    position: { x: 20 + col * 240, y: 60 + row * 80 },
                  };
                }
                return n;
              });
            }
          });

          return nextNodes;
        });
      } else {
        standardOnNodesChange(changes);
      }
    },
    [standardOnNodesChange, setNodes]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    activeProject?.edges || [],
  );

  const evaluatedNodes = useMemo(() => {
    return nodes.map((node) => {
      const findings = [];

      // S3 rules
      if (node.type === "s3Node") {
        if (node.data?.isPublic) {
          findings.push({
            ruleId: "S3_PUBLIC_EXPOSURE",
            severity: "critical",
            message: `S3 Bucket ${node.data?.label} is publicly accessible to the internet.`,
            fixable: true,
          });
        }
        if (!node.data?.versioning) {
          findings.push({
            ruleId: "S3_VERSIONING_DISABLED",
            severity: "medium",
            message: `Versioning is disabled on S3 Bucket ${node.data?.label}.`,
            fixable: true,
          });
        }
      }

      // EC2 rules
      if (node.type === "ec2Node") {
        const hasRoleEdge = edges.some(
          (edge) =>
            (edge.source === node.id && nodes.find((n) => n.id === edge.target)?.type === "iamNode" && nodes.find((n) => n.id === edge.target)?.data?.iamType === "Role") ||
            (edge.target === node.id && nodes.find((n) => n.id === edge.source)?.type === "iamNode" && nodes.find((n) => n.id === edge.source)?.data?.iamType === "Role")
        );
        if (!hasRoleEdge) {
          findings.push({
            ruleId: "EC2_NO_IAM_ROLE",
            severity: "high",
            message: `EC2 Instance ${node.data?.label} has no associated IAM Role.`,
            fixable: false,
          });
        }
      }

      // IAM rules
      if (node.type === "iamNode") {
        const type = node.data?.iamType;
        if (type === "User" && !node.parentId) {
          findings.push({
            ruleId: "IAM_USER_NO_GROUP",
            severity: "medium",
            message: `IAM User ${node.data?.label} is not nested inside any IAM Group.`,
            fixable: false,
          });
        }
        if (type === "Policy" || type === "Role") {
          // Check wildcard action
          if (node.data?.policyActions === "*" || node.data?.policyActions === "s3:*") {
            findings.push({
              ruleId: "IAM_WILDCARD_ACTION",
              severity: "critical",
              message: `IAM Policy ${node.data?.label} grants administrative actions (*).`,
              fixable: true,
            });
          }
          // Check wildcard resource
          if (node.data?.policyResource === "*") {
            findings.push({
              ruleId: "IAM_WILDCARD_RESOURCE",
              severity: "high",
              message: `IAM Policy ${node.data?.label} grants access to wildcard resource (*).`,
              fixable: true,
            });
          }
        }
      }

      return {
        ...node,
        data: {
          ...node.data,
          auditFindings: findings,
        },
      };
    });
  }, [nodes, edges]);

  const allFindings = useMemo(() => {
    return evaluatedNodes.flatMap((n) =>
      (n.data?.auditFindings || []).map((f) => ({
        ...f,
        nodeId: n.id,
        nodeLabel: n.data?.label || n.id,
        nodeType: n.type,
      }))
    );
  }, [evaluatedNodes]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [activeMode, setActiveMode] = useState("dev");
  const [userCollapsedLegend, setUserCollapsedLegend] = useState(false);
  const [isAuditLegendCollapsed, setIsAuditLegendCollapsed] = useState(true);

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState("code"); // "code" or "terminal"
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [hasDeployment, setHasDeployment] = useState(false);
  const [terminalMode, setTerminalMode] = useState("deploy"); // "deploy" or "destroy"
  const [isDeploymentsModalOpen, setIsDeploymentsModalOpen] = useState(false);
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [latestDeploymentId, setLatestDeploymentId] = useState(null);
  const eventSourceRef = useRef(null);
  const terminalEndRef = useRef(null);

  const checkDeploymentStatus = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/deploy/status");
      if (response.ok) {
        const data = await response.json();
        setHasDeployment(data.deployed);
        setLatestDeploymentId(data.latestDeploymentId);
      }
    } catch (err) {
      console.warn("Failed to fetch deployment status:", err);
    }
  }, []);

  const fetchDeploymentsList = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/deployments");
      if (response.ok) {
        const data = await response.json();
        setDeployments(data);
      }
    } catch (err) {
      console.warn("Failed to fetch deployments list:", err);
    }
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  useEffect(() => {
    checkDeploymentStatus();
    fetchDeploymentsList();
  }, [checkDeploymentStatus, fetchDeploymentsList]);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [instanceActiveTab, setInstanceActiveTab] = useState("All");
  const [instanceSearchQuery, setInstanceSearchQuery] = useState("");
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [livePricing, setLivePricing] = useState({});

  const fetchPricingForRegion = useCallback(async (regionCode) => {
    const rCode = (regionCode || "us-east-1").toLowerCase();
    if (livePricing[rCode]) return;

    try {
      const res = await fetch(`http://127.0.0.1:3001/api/pricing/ec2?region=${rCode}`);
      if (!res.ok) throw new Error("Server pricing fetch failed");
      const data = await res.json();
      setLivePricing((prev) => ({ ...prev, [rCode]: data }));
    } catch (err) {
      console.warn(`Failed to fetch live pricing for region ${rCode}, falling back to static database`, err);
    }
  }, [livePricing]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Filesystem directory browser states
  const [isFsModalOpen, setIsFsModalOpen] = useState(false);
  const [fsCurrentPath, setFsCurrentPath] = useState("");
  const [fsParentPath, setFsParentPath] = useState("");
  const [fsFolders, setFsFolders] = useState([]);
  const [fsFiles, setFsFiles] = useState([]);
  const [fsSelectedItem, setFsSelectedItem] = useState(null);
  const [fsOnSelect, setFsOnSelect] = useState(() => () => {});

  const openFsBrowser = async (initialPath, onSelectCallback) => {
    setFsSelectedItem(null);
    setFsOnSelect(() => onSelectCallback);
    setIsFsModalOpen(true);
    await fetchFsDirectory(initialPath || "");
  };

  const fetchFsDirectory = async (dirPath) => {
    try {
      const res = await fetch(`http://localhost:3001/api/fs/browse?path=${encodeURIComponent(dirPath)}`);
      if (!res.ok) throw new Error("Failed to read directory");
      const data = await res.json();
      setFsCurrentPath(data.currentPath);
      setFsParentPath(data.parentPath);
      setFsFolders(data.folders);
      setFsFiles(data.files);
    } catch (err) {
      addLog(`❌ File browser error: ${err.message}`, "error");
    }
  };

  const [expandedCategories, setExpandedCategories] = useState({
    aws: true,
    iam: true,
    compute: true,
    shapes: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);

  const [generatedCode, setGeneratedCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const [logs, setLogs] = useState([
    {
      id: Date.now(),
      text: `📂 Loaded Project: ${activeProject?.name}`,
      type: "success",
    },
  ]);
  const addLog = useCallback((text, type = "info") => {
    setLogs((prev) => [...prev, { id: Date.now(), text, type }]);
  }, []);

  const takeSnapshot = useCallback(() => {
    setPast((p) => [...p, { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, p.length - 1));
    setFuture((f) => [{ nodes, edges }, ...f]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    addLog(`⏪ Action undone.`, "info");
  }, [past, nodes, edges, setNodes, setEdges, addLog]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    addLog(`⏩ Action redone.`, "info");
  }, [future, nodes, edges, setNodes, setEdges, addLog]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (!userSettings.autoSave) return;
    const timer = setTimeout(() => {
      onSave(activeProject.id, nodes, edges);
    }, 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges, activeProject.id, onSave, userSettings.autoSave]);

  // Auto-recalculate S3 Bucket size and cost based on nested S3 Objects
  useEffect(() => {
    let changed = false;
    const updated = nodes.map((node) => {
      if (node.type === "s3Node") {
        const children = nodes.filter((c) => c.type === "s3ObjectNode" && c.parentId === node.id);
        const childrenWithPaths = children.filter((c) => c.data?.sourcePath);
        
        if (childrenWithPaths.length > 0) {
          const totalSizeGB = childrenWithPaths.reduce((sum, child) => sum + (child.data?.sizeGB || 0), 0);
          const storageGB = parseFloat(totalSizeGB.toFixed(3));
          const cost = parseFloat((storageGB * 0.023).toFixed(2));
          if (node.data?.storageGB !== storageGB || node.data?.cost !== cost || !node.data?.isAutoSized) {
            changed = true;
            return {
              ...node,
              data: {
                ...node.data,
                storageGB,
                cost,
                isAutoSized: true,
              },
            };
          }
        } else if (node.data?.isAutoSized) {
          // If no nested S3 Objects have paths, switch back to manual sizing mode
          changed = true;
          return {
            ...node,
            data: {
              ...node.data,
              storageGB: 10,
              cost: 0.23,
              isAutoSized: false,
            },
          };
        }
      }
      return node;
    });

    if (changed) {
      setNodes(updated);
    }
  }, [nodes, setNodes]);

  useEffect(() => {
    if (activeMode === "budgets") {
      setUserCollapsedLegend(false);
      const timer = setTimeout(() => {
        setUserCollapsedLegend(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeMode]);

  useEffect(() => {
    const selectedNodeObj = nodes.find(n => n.id === selectedNodeId);
    if (selectedNodeObj && selectedNodeObj.type === "ec2Node") {
      const region = selectedNodeObj.data?.region || "us-east-1";
      fetchPricingForRegion(region);
    }
  }, [selectedNodeId, nodes, fetchPricingForRegion]);

  useEffect(() => {
    fetchPricingForRegion(userSettings.defaultRegion);
  }, [userSettings.defaultRegion, fetchPricingForRegion]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "ec2Node") {
          const region = (node.data?.region || "us-east-1").toLowerCase();
          const db = livePricing[region];
          if (db) {
            const platform = node.data?.platform || "Linux";
            const instType = node.data?.instanceType || "t2.micro";
            const volSize = node.data?.volumeSize || 8;
            
            const newCost = calculateEC2Cost(instType, volSize, region, platform, db, true);
            if (newCost !== node.data?.cost) {
              return {
                ...node,
                data: { ...node.data, cost: newCost },
              };
            }
          }
        }
        return node;
      })
    );
  }, [livePricing]);

  // CONNECT HANDLER
  const onConnect = useCallback(
    (params) => {
      takeSnapshot();
      setEdges((eds) => addEdge(params, eds));
      connectionMade.current = true;
    },
    [setEdges, takeSnapshot],
  );

  // RECONNECT HANDLER: Allows user to drag existing edges to new handles
  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      takeSnapshot();
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      addLog(`🔌 Edge re-routed successfully.`, "info");
      connectionMade.current = true;
    },
    [setEdges, takeSnapshot, addLog],
  );

  const onConnectStart = useCallback((event, params) => {
    connectionStartParams.current = params;
    connectionMade.current = false;
  }, []);

  const onConnectEnd = useCallback(
    (event) => {
      const isOverHandle = event.target.closest('.react-flow__handle');
      const isOverNode = event.target.closest('.react-flow__node');

      // Use setTimeout so that synchronous onConnect / onReconnect have time to set connectionMade.current to true
      setTimeout(() => {
        if (!isOverHandle && !isOverNode && connectionStartParams.current && !connectionMade.current) {
          const { nodeId, handleId, handleType } = connectionStartParams.current;

          // Calculate client coordinates relative to the ReactFlow wrapper
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          const clientX = event.clientX;
          const clientY = event.clientY;

          const position = screenToFlowPosition({
            x: clientX - reactFlowBounds.left,
            y: clientY - reactFlowBounds.top,
          });

          setFloatingConnectionSearch({
            clientX,
            clientY,
            flowX: position.x,
            flowY: position.y,
            fromNodeId: nodeId,
            fromHandleId: handleId,
            fromHandleType: handleType,
          });
          setConnectionSearchQuery("");
          setConnectionSearchActiveIndex(0);
        }
        connectionMade.current = false;
      }, 50);
    },
    [screenToFlowPosition]
  );

  const handleCreateAndConnect = useCallback((nodeType, labelType) => {
    if (!floatingConnectionSearch) return;

    const { flowX, flowY, fromNodeId, fromHandleId, fromHandleType } = floatingConnectionSearch;
    setFloatingConnectionSearch(null);
    takeSnapshot();

    // Center offset adjustments based on node size
    let centeredPosition = { x: flowX, y: flowY };
    if (nodeType === "s3ObjectNode" || nodeType === "ec2Node" || (nodeType === "iamNode" && labelType !== "Group")) {
      centeredPosition.x -= 110;
      centeredPosition.y -= 35;
    } else if (nodeType === "iamGroupNode" || nodeType === "s3Node" || labelType === "Group") {
      centeredPosition.x -= 150;
      centeredPosition.y -= 100;
    } else if (nodeType === "shapeNode") {
      const isContainer = labelType === "Rectangle" || labelType === "Circle";
      if (isContainer) {
        centeredPosition.x -= 175;
        centeredPosition.y -= 175;
      } else {
        centeredPosition.x -= 60;
        centeredPosition.y -= 20;
      }
    }

    let newNodeId = "";
    let newNode = null;

    if (nodeType === "s3Node") {
      newNodeId = `s3_${Date.now()}`;
      newNode = {
        id: newNodeId,
        type: "s3Node",
        data: {
          label: `new-bucket-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
          isPublic: false,
          versioning: false,
          storageGB: 10,
          cost: 0.23,
        },
        position: centeredPosition,
        zIndex: -1,
        style: { width: 300, height: 200 },
      };
      addLog(`➕ Added S3 Bucket and Connected.`, "success");
    } else if (nodeType === "s3ObjectNode") {
      newNodeId = `s3_obj_${Date.now()}`;
      newNode = {
        id: newNodeId,
        type: "s3ObjectNode",
        data: {
          label: `new-object-${Math.floor(Math.random() * 1000)}`,
          sourceType: "file",
          sourcePath: "",
          region: userSettings.defaultRegion,
        },
        position: centeredPosition,
        zIndex: 0,
      };
      addLog(`➕ Added S3 Object and Connected.`, "success");
    } else if (nodeType === "ec2Node") {
      newNodeId = `ec2_${Date.now()}`;
      newNode = {
        id: newNodeId,
        type: "ec2Node",
        data: {
          label: `new-instance-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
          instanceType: "t2.micro",
          osImage: "amazon-linux-2023",
          platform: "Linux",
          ami: OS_IMAGES.find(img => img.id === "amazon-linux-2023")?.defaultAmis[userSettings.defaultRegion.toLowerCase()] || "ami-04b70fa74e45c3917",
          volumeSize: 8,
          cost: calculateEC2Cost("t2.micro", 8, userSettings.defaultRegion, "Linux"),
        },
        position: centeredPosition,
        zIndex: 0,
      };
      addLog(`➕ Added EC2 Instance and Connected.`, "success");
    } else if (nodeType === "iamNode" || nodeType === "iamGroupNode") {
      const type = labelType;
      newNodeId = `iam_${type.toLowerCase()}_${Date.now()}`;

      const nodeData = {
        label: `new-${type.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
        iamType: type,
        region: userSettings.defaultRegion,
      };

      if (type === "Role") {
        nodeData.roleService = "ec2.amazonaws.com";
      } else if (type === "Policy") {
        nodeData.policyActions = "s3:*";
        nodeData.policyResource = "*";
      }

      newNode = {
        id: newNodeId,
        type: type === "Group" ? "iamGroupNode" : "iamNode",
        data: nodeData,
        position: centeredPosition,
        zIndex: type === "Group" ? -1 : 0,
        ...(type === "Group" && { style: { width: 300, height: 200 } }),
      };
      addLog(`➕ Added IAM ${type} and Connected.`, "success");
    } else if (nodeType === "shapeNode") {
      const type = labelType;
      newNodeId = `shape_${Date.now()}`;
      const isContainer = type === "Rectangle" || type === "Circle";
      newNode = {
        id: newNodeId,
        type: "shapeNode",
        data: {
          label: isContainer ? `${type} Group` : `${type} Note`,
          shapeType: type,
        },
        position: centeredPosition,
        zIndex: isContainer ? -1 : 0,
        style: isContainer ? { width: 350, height: 350 } : {},
      };
      addLog(`➕ Added Shape: ${type} and Connected.`, "success");
    }

    if (newNode) {
      const newEdge = {
        id: `e_${Date.now()}`,
        source: fromHandleType === "source" ? fromNodeId : newNodeId,
        target: fromHandleType === "source" ? newNodeId : fromNodeId,
        sourceHandle: fromHandleType === "source" ? fromHandleId : "bottom",
        targetHandle: fromHandleType === "source" ? "top" : fromHandleId,
        style: { strokeWidth: 2, stroke: "#94a3b8" },
      };

      setNodes((nds) => nds.concat(newNode));
      setEdges((eds) => eds.concat(newEdge));
    }
  }, [floatingConnectionSearch, setNodes, setEdges, takeSnapshot, addLog, userSettings.defaultRegion]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        floatingConnectionSearch &&
        connectionSearchRef.current &&
        !connectionSearchRef.current.contains(event.target)
      ) {
        setFloatingConnectionSearch(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [floatingConnectionSearch]);

  useEffect(() => {
    if (floatingConnectionSearch) {
      const activeElem = document.getElementById(`conn-opt-${connectionSearchActiveIndex}`);
      if (activeElem) {
        const isCycling = Math.abs(connectionSearchActiveIndex - prevConnectionIndex.current) > 1;
        activeElem.scrollIntoView({
          behavior: isCycling ? "auto" : "smooth",
          block: "nearest",
        });
      }
      prevConnectionIndex.current = connectionSearchActiveIndex;
    }
  }, [connectionSearchActiveIndex, floatingConnectionSearch]);

  useEffect(() => {
    if (isSearchFocused && searchQuery.trim() !== "") {
      const activeElem = document.getElementById(`global-opt-${searchActiveIndex}`);
      if (activeElem) {
        const isCycling = Math.abs(searchActiveIndex - prevGlobalIndex.current) > 1;
        activeElem.scrollIntoView({
          behavior: isCycling ? "auto" : "smooth",
          block: "nearest",
        });
      }
      prevGlobalIndex.current = searchActiveIndex;
    }
  }, [searchActiveIndex, isSearchFocused, searchQuery]);

  const onNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodeDragStop = useCallback(
    (event, node) => {
      const internalNode = getNode(node.id);

      // Handle detaching from group if dragged outside its parent
      if (node.parentId) {
        const parentGroupNode = getNode(node.parentId);
        if (parentGroupNode) {
          const intersections = getIntersectingNodes(node).map((n) => n.id);
          if (!intersections.includes(parentGroupNode.id)) {
            setNodes((nds) => {
              const remainingChildren = nds.filter((n) => n.parentId === parentGroupNode.id && n.id !== node.id);
              const newChildrenCount = remainingChildren.length;
              const minHeight = 100 + Math.ceil(newChildrenCount / 2) * 80;
              const minWidth = newChildrenCount > 1 ? 500 : 280;

              return nds.map((n) => {
                if (n.id === node.id) {
                  const { parentId, extent, ...rest } = n;
                  return {
                    ...rest,
                    // Use the exact absolute position from React Flow's internal store
                    position: internalNode?.positionAbsolute || {
                      x: parentGroupNode.position.x + node.position.x,
                      y: parentGroupNode.position.y + node.position.y,
                    },
                  };
                }

                if (n.id === parentGroupNode.id) {
                  const newHeight = Math.max(200, 100 + Math.ceil(newChildrenCount / 2) * 80);
                  const newWidth = newChildrenCount > 1 ? 500 : 300;
                  return {
                    ...n,
                    style: {
                      ...n.style,
                      height: newHeight,
                      width: newWidth,
                    }
                  };
                }

                if (n.parentId === parentGroupNode.id) {
                  const childIndex = remainingChildren.findIndex(child => child.id === n.id);
                  const row = Math.floor(childIndex / 2);
                  const col = childIndex % 2;
                  return {
                    ...n,
                    position: { x: 20 + col * 240, y: 60 + row * 80 }
                  };
                }

                return n;
              });
            });
            addLog(`User detached from IAM Group`, "info");
            return;
          } else {
            // Snapped user was moved within the group shape - re-snap it to its grid slot
            setNodes((nds) => {
              const children = nds.filter((n) => n.parentId === parentGroupNode.id);
              return nds.map((n) => {
                if (n.parentId === parentGroupNode.id) {
                  const childIndex = children.findIndex(child => child.id === n.id);
                  const row = Math.floor(childIndex / 2);
                  const col = childIndex % 2;
                  return {
                    ...n,
                    position: { x: 20 + col * 240, y: 60 + row * 80 }
                  };
                }
                return n;
              });
            });
            addLog(`Snapped user position reset`, "info");
            return;
          }
        }
      }

      // Handle dropping into IAM Group
      if (node.type === "iamNode" && node.data?.iamType === "User") {
        const intersections = getIntersectingNodes(node).filter(
          (n) => n.type === "iamGroupNode"
        );

        if (intersections.length > 0 && !node.parentId) {
          const groupNode = intersections[0];

          setNodes((nds) => {
            const currentChildren = nds.filter(
              (n) => n.parentId === groupNode.id
            );

            const newChildrenCount = currentChildren.length + 1;
            const minHeight = 100 + Math.ceil(newChildrenCount / 2) * 80;
            const minWidth = newChildrenCount > 1 ? 500 : 280;

            const updatedNodes = nds.map((n) => {
              // Expand group node if it has many children
              if (n.id === groupNode.id) {
                const currentHeight = n.style?.height || 200;
                const currentWidth = n.style?.width || 250;
                return {
                  ...n,
                  style: {
                    ...n.style,
                    height: Math.max(currentHeight, minHeight),
                    width: Math.max(currentWidth, minWidth),
                  },
                };
              }

              // Relayout existing children to ensure no gaps
              if (n.parentId === groupNode.id) {
                const childIndex = currentChildren.findIndex(child => child.id === n.id);
                const row = Math.floor(childIndex / 2);
                const col = childIndex % 2;
                return {
                  ...n,
                  position: { x: 20 + col * 240, y: 60 + row * 80 },
                };
              }

              // Snap newly added user node inside to its designated grid slot
              if (n.id === node.id) {
                const childIndex = currentChildren.length;
                const row = Math.floor(childIndex / 2);
                const col = childIndex % 2;
                return {
                  ...n,
                  parentId: groupNode.id,
                  position: { x: 20 + col * 240, y: 60 + row * 80 },
                };
              }

              return n;
            });

            // React Flow requires child nodes to appear AFTER their parent nodes in the array.
            const targetNode = updatedNodes.find((n) => n.id === node.id);
            const withoutTarget = updatedNodes.filter((n) => n.id !== node.id);
            return [...withoutTarget, targetNode];
          });
          addLog(`User grouped into IAM Group`, "success");
        }
      }

      // Handle dropping into S3 Bucket (s3Node)
      if (node.type === "s3ObjectNode") {
        const intersections = getIntersectingNodes(node).filter(
          (n) => n.type === "s3Node"
        );

        if (intersections.length > 0 && !node.parentId) {
          const groupNode = intersections[0];

          setNodes((nds) => {
            const currentChildren = nds.filter(
              (n) => n.parentId === groupNode.id
            );

            const newChildrenCount = currentChildren.length + 1;
            const minHeight = 100 + Math.ceil(newChildrenCount / 2) * 80;
            const minWidth = newChildrenCount > 1 ? 500 : 280;

            const updatedNodes = nds.map((n) => {
              if (n.id === groupNode.id) {
                const currentHeight = n.style?.height || 200;
                const currentWidth = n.style?.width || 250;
                return {
                  ...n,
                  style: {
                    ...n.style,
                    height: Math.max(currentHeight, minHeight),
                    width: Math.max(currentWidth, minWidth),
                  },
                };
              }

              if (n.parentId === groupNode.id) {
                const childIndex = currentChildren.findIndex(child => child.id === n.id);
                const row = Math.floor(childIndex / 2);
                const col = childIndex % 2;
                return {
                  ...n,
                  position: { x: 20 + col * 240, y: 60 + row * 80 },
                };
              }

              if (n.id === node.id) {
                const childIndex = currentChildren.length;
                const row = Math.floor(childIndex / 2);
                const col = childIndex % 2;
                return {
                  ...n,
                  parentId: groupNode.id,
                  position: { x: 20 + col * 240, y: 60 + row * 80 },
                };
              }

              return n;
            });

            const targetNode = updatedNodes.find((n) => n.id === node.id);
            const withoutTarget = updatedNodes.filter((n) => n.id !== node.id);
            return [...withoutTarget, targetNode];
          });
          addLog(`S3 Object grouped into S3 Bucket`, "success");
        }
      }
    },
    [getIntersectingNodes, getNode, setNodes, addLog]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setContextMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
    setIsProjectDropdownOpen(false);
    setIsSearchFocused(false);
    setFloatingConnectionSearch(null);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      setContextMenu(null);
      setIsProjectDropdownOpen(false);
      if (
        connectionSearchRef.current &&
        !connectionSearchRef.current.contains(e.target) &&
        !e.target.closest(".react-flow__handle")
      ) {
        setFloatingConnectionSearch(null);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const handleGlobalEscape = (e) => {
      if (e.key === "Escape") {
        setFloatingConnectionSearch(null);
      }
    };
    window.addEventListener("keydown", handleGlobalEscape);
    return () => window.removeEventListener("keydown", handleGlobalEscape);
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: "node",
      id: node.id,
    });
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, type: "pane" });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: "edge",
      id: edge.id,
    });
  }, []);

  const handleCopy = () => {
    const nodeToCopy = nodes.find((n) => n.id === contextMenu.id);
    if (nodeToCopy) {
      setClipboard(nodeToCopy);
      addLog(`📋 Copied to clipboard.`, "info");
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    takeSnapshot();
    if (contextMenu.type === "node") {
      setNodes((nds) => {
        const nodeToDelete = nds.find((n) => n.id === contextMenu.id);
        const parentId = nodeToDelete?.parentId;
        const nextNodesFiltered = nds.filter((n) => n.id !== contextMenu.id);

        if (parentId) {
          const remainingChildren = nextNodesFiltered.filter((n) => n.parentId === parentId);
          const newChildrenCount = remainingChildren.length;
          
          const newHeight = Math.max(200, 100 + Math.ceil(newChildrenCount / 2) * 80);
          const newWidth = newChildrenCount > 1 ? 500 : 300;

          return nextNodesFiltered.map((n) => {
            if (n.id === parentId) {
              return {
                ...n,
                style: {
                  ...n.style,
                  height: newHeight,
                  width: newWidth,
                }
              };
            }
            if (n.parentId === parentId) {
              const childIndex = remainingChildren.findIndex(child => child.id === n.id);
              const row = Math.floor(childIndex / 2);
              const col = childIndex % 2;
              return {
                ...n,
                position: { x: 20 + col * 240, y: 60 + row * 80 }
              };
            }
            return n;
          });
        }
        return nextNodesFiltered;
      });
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== contextMenu.id && e.target !== contextMenu.id,
        ),
      );
      if (selectedNodeId === contextMenu.id) setSelectedNodeId(null);
      addLog(`🗑️ Deleted component.`, "warn");
    } else if (contextMenu.type === "edge") {
      setEdges((eds) => eds.filter((e) => e.id !== contextMenu.id));
      addLog(`🗑️ Deleted connection.`, "warn");
    }
    setContextMenu(null);
  };

  const handleCut = () => {
    const nodeToCut = nodes.find((n) => n.id === contextMenu.id);
    if (nodeToCut) {
      setClipboard(nodeToCut);
      handleDelete();
      addLog(`✂️ Cut component from canvas.`, "warn");
    }
  };

  const handlePaste = () => {
    if (!clipboard) return;
    takeSnapshot();
    const position = screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    });
    const newId = `${clipboard.type.replace("Node", "")}_${Date.now()}`;
    setNodes((nds) =>
      nds.concat({
        ...clipboard,
        id: newId,
        position,
        selected: false,
        data: { ...clipboard.data, label: `${clipboard.data.label}-copy` },
      }),
    );
    addLog(`📋 Pasted component.`, "success");
    setContextMenu(null);
  };

  const updateNodeData = (field, value) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          const updatedData = { ...node.data, [field]: value };
          if (field === "storageGB" && node.type === "s3Node")
            updatedData.cost = parseFloat((value * 0.023).toFixed(2));
          if (node.type === "ec2Node") {
            const currentInstanceType = field === "instanceType" ? value : (node.data.instanceType || "t2.micro");
            const currentVolumeSize = field === "volumeSize" ? value : (node.data.volumeSize || 8);
            const currentRegion = field === "region" ? value : (node.data.region || "us-east-1");
            
            // Resolve OS Image & Platform
            let currentOsImage = field === "osImage" ? value : (node.data.osImage || "amazon-linux-2023");
            const activeOs = OS_IMAGES.find(img => img.id === currentOsImage) || OS_IMAGES[0];
            let currentPlatform = activeOs.platform;
            updatedData.platform = currentPlatform;

            // Handle custom vs standard AMI ID updates
            const currentUseCustomAmi = field === "useCustomAmi" ? value : !!node.data.useCustomAmi;
            let currentAmi = node.data.ami || "ami-04b70fa74e45c3917";
            
            if (!currentUseCustomAmi) {
              currentAmi = activeOs.defaultAmis[currentRegion.toLowerCase()] || activeOs.defaultAmis["us-east-1"] || "ami-04b70fa74e45c3917";
              updatedData.ami = currentAmi;
            } else if (field === "ami") {
              currentAmi = value;
            }

            const db = livePricing[currentRegion.toLowerCase()] || ALL_INSTANCE_TYPES;
            const isLive = !!livePricing[currentRegion.toLowerCase()];

            const matchedType = db.find(t => t.value === currentInstanceType);
            if (currentPlatform === "Windows" && matchedType && matchedType.pricing.Windows === null) {
              currentOsImage = "amazon-linux-2023";
              updatedData.osImage = "amazon-linux-2023";
              currentPlatform = "Linux";
              updatedData.platform = "Linux";
              if (!currentUseCustomAmi) {
                currentAmi = OS_IMAGES[0].defaultAmis[currentRegion.toLowerCase()] || OS_IMAGES[0].defaultAmis["us-east-1"] || "ami-04b70fa74e45c3917";
                updatedData.ami = currentAmi;
              }
            }

            updatedData.cost = calculateEC2Cost(currentInstanceType, currentVolumeSize, currentRegion, currentPlatform, db, isLive);
          }
          return { ...node, data: updatedData };
        }
        return node;
      }),
    );
  };


  const handleRemediate = useCallback((nodeId, ruleId) => {
    takeSnapshot();
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const updatedData = { ...n.data };
        if (ruleId === "S3_PUBLIC_EXPOSURE") {
          updatedData.isPublic = false;
          addLog(`🛡️ Remediation: Set S3 Bucket ${n.data?.label} to Private`, "success");
        } else if (ruleId === "S3_VERSIONING_DISABLED") {
          updatedData.versioning = true;
          addLog(`🛡️ Remediation: Enabled Versioning on S3 Bucket ${n.data?.label}`, "success");
        } else if (ruleId === "IAM_WILDCARD_ACTION") {
          updatedData.policyActions = "s3:GetObject";
          addLog(`🛡️ Remediation: Restrained actions to s3:GetObject on Policy ${n.data?.label}`, "success");
        } else if (ruleId === "IAM_WILDCARD_RESOURCE") {
          updatedData.policyResource = "arn:aws:s3:::primary-bucket/*";
          addLog(`🛡️ Remediation: Scoped wildcard resource on Policy ${n.data?.label}`, "success");
        }
        return { ...n, data: updatedData };
      })
    );
  }, [setNodes, takeSnapshot, addLog]);

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const spawnNode = useCallback((nodeType, labelType, position) => {
    takeSnapshot();
    const getNodeDimensions = (type, label) => {
      if (type === "s3ObjectNode" || type === "ec2Node" || type === "iamNode") {
        return { w: 220, h: 70 };
      }
      if (type === "iamGroupNode" || type === "s3Node" || label === "Group") {
        return { w: 300, h: 200 };
      }
      if (type === "shapeNode") {
        const isContainer = label === "Rectangle" || label === "Circle";
        return { w: isContainer ? 350 : 120, h: isContainer ? 350 : 40 };
      }
      return { w: 220, h: 70 };
    };

    let resolvedPosition = position;

    if (!resolvedPosition) {
      // Spawn at the center of the currently visible screen viewport
      const centerFlowPos = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const { w, h } = getNodeDimensions(nodeType, labelType);
      let candidateX = centerFlowPos.x - w / 2;
      let candidateY = centerFlowPos.y - h / 2;

      const isOverlapping = (rect1, rect2) => {
        return (
          rect1.x < rect2.x + rect2.w &&
          rect1.x + rect1.w > rect2.x &&
          rect1.y < rect2.y + rect2.h &&
          rect1.y + rect1.h > rect2.y
        );
      };

      const getAbsolutePosition = (n, nds) => {
        let x = n.position.x;
        let y = n.position.y;
        let current = n;
        while (current.parentId) {
          const parent = nds.find((p) => p.id === current.parentId);
          if (!parent) break;
          x += parent.position.x;
          y += parent.position.y;
          current = parent;
        }
        return { x, y };
      };

      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        let overlapFound = false;
        const candidateRect = { x: candidateX, y: candidateY, w, h };

        for (const existingNode of nodes) {
          const pos = getAbsolutePosition(existingNode, nodes);
          const dim = getNodeDimensions(existingNode.type, existingNode.data?.iamType || existingNode.data?.shapeType);
          const existingRect = { x: pos.x, y: pos.y, w: dim.w, h: dim.h };

          if (isOverlapping(candidateRect, existingRect)) {
            overlapFound = true;
            break;
          }
        }

        if (!overlapFound) {
          break;
        }

        // Shift candidate to the right or wrap down
        candidateX += 240;
        if (candidateX > centerFlowPos.x + 800) {
          candidateX = centerFlowPos.x - w / 2;
          candidateY += 100;
        }
        attempts++;
      }

      resolvedPosition = { x: candidateX, y: candidateY };
    }

    let newNode = null;

    if (nodeType === "s3Node") {
      newNode = {
        id: `s3_${Date.now()}`,
        type: "s3Node",
        data: {
          label: `new-bucket-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
          isPublic: false,
          versioning: false,
          storageGB: 10,
          cost: 0.23,
        },
        position: resolvedPosition,
        zIndex: -1,
        style: { width: 300, height: 200 },
      };
      addLog(`➕ Added S3 Bucket.`, "info");
    } else if (nodeType === "s3ObjectNode") {
      let parentGroupId = null;
      if (position) {
        const groupNode = nodes.find((n) => {
          if (n.type !== "s3Node") return false;
          const gx = n.position.x;
          const gy = n.position.y;
          const gw = n.style?.width || 300;
          const gh = n.style?.height || 200;

          const cx = resolvedPosition.x + 110;
          const cy = resolvedPosition.y + 35;
          return cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh;
        });

        if (groupNode) {
          parentGroupId = groupNode.id;
        }
      }

      if (parentGroupId) {
        const objId = `s3_obj_${Date.now()}`;
        setNodes((nds) => {
          const currentChildren = nds.filter((n) => n.parentId === parentGroupId);
          const newChildrenCount = currentChildren.length + 1;
          const minHeight = 100 + Math.ceil(newChildrenCount / 2) * 80;
          const minWidth = newChildrenCount > 1 ? 500 : 280;

          const childIndex = currentChildren.length;
          const row = Math.floor(childIndex / 2);
          const col = childIndex % 2;

          const nodeData = {
            label: `new-object-${Math.floor(Math.random() * 1000)}`,
            sourceType: "file",
            sourcePath: "",
            region: userSettings.defaultRegion,
          };

          const objNode = {
            id: objId,
            type: "s3ObjectNode",
            data: nodeData,
            parentId: parentGroupId,
            position: { x: 20 + col * 240, y: 60 + row * 80 },
            zIndex: 0,
            selected: true,
          };

          const updatedNodes = nds.map((n) => {
            if (n.id === parentGroupId) {
              const currentHeight = n.style?.height || 200;
              const currentWidth = n.style?.width || 250;
              return {
                ...n,
                selected: false,
                style: {
                  ...n.style,
                  height: Math.max(currentHeight, minHeight),
                  width: Math.max(currentWidth, minWidth),
                },
              };
            }
            if (n.parentId === parentGroupId) {
              const idx = currentChildren.findIndex(child => child.id === n.id);
              const r = Math.floor(idx / 2);
              const c = idx % 2;
              return {
                ...n,
                selected: false,
                position: { x: 20 + c * 240, y: 60 + r * 80 },
              };
            }
            return { ...n, selected: false };
          });

          const withoutObj = updatedNodes.filter((n) => n.id !== objNode.id);
          return [...withoutObj, objNode];
        });
        setSelectedNodeId(objId);
        addLog(`➕ Added S3 Object (Grouped).`, "success");
        return;
      } else {
        newNode = {
          id: `s3_obj_${Date.now()}`,
          type: "s3ObjectNode",
          data: {
            label: `new-object-${Math.floor(Math.random() * 1000)}`,
            sourceType: "file",
            sourcePath: "",
            region: userSettings.defaultRegion,
          },
          position: resolvedPosition,
          zIndex: 0,
        };
        addLog(`➕ Added S3 Object.`, "info");
      }
    } else if (nodeType === "ec2Node") {
      newNode = {
        id: `ec2_${Date.now()}`,
        type: "ec2Node",
        data: {
          label: `new-instance-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
          instanceType: "t2.micro",
          osImage: "amazon-linux-2023",
          platform: "Linux",
          ami: OS_IMAGES.find(img => img.id === "amazon-linux-2023")?.defaultAmis[userSettings.defaultRegion.toLowerCase()] || "ami-04b70fa74e45c3917",
          volumeSize: 8,
          cost: calculateEC2Cost("t2.micro", 8, userSettings.defaultRegion, "Linux"),
        },
        position: resolvedPosition,
        zIndex: 0,
      };
      addLog(`➕ Added EC2 Instance.`, "info");
    } else if (nodeType === "iamNode" || nodeType === "iamGroupNode") {
      const type = labelType; // "User", "Group", "Role", "Policy"

      // Check if dropping a User node inside a Group node
      let parentGroupId = null;
      if (type === "User" && position) {
        const groupNode = nodes.find((n) => {
          if (n.type !== "iamGroupNode") return false;
          const gx = n.position.x;
          const gy = n.position.y;
          const gw = n.style?.width || 300;
          const gh = n.style?.height || 200;

          // Compute cursor center (we offset top-left by -110, -35 in onDrop, so add them back)
          const cx = resolvedPosition.x + 110;
          const cy = resolvedPosition.y + 35;
          return cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh;
        });

        if (groupNode) {
          parentGroupId = groupNode.id;
        }
      }

      if (parentGroupId) {
        const userId = `iam_user_${Date.now()}`;
        setNodes((nds) => {
          const currentChildren = nds.filter((n) => n.parentId === parentGroupId);
          const newChildrenCount = currentChildren.length + 1;
          const minHeight = 100 + Math.ceil(newChildrenCount / 2) * 80;
          const minWidth = newChildrenCount > 1 ? 500 : 280;

          const childIndex = currentChildren.length;
          const row = Math.floor(childIndex / 2);
          const col = childIndex % 2;

          const nodeData = {
            label: `new-user-${Math.floor(Math.random() * 1000)}`,
            iamType: "User",
            region: userSettings.defaultRegion,
          };

          const userNode = {
            id: userId,
            type: "iamNode",
            data: nodeData,
            parentId: parentGroupId,
            position: { x: 20 + col * 240, y: 60 + row * 80 },
            zIndex: 0,
            selected: true,
          };

          const updatedNodes = nds.map((n) => {
            if (n.id === parentGroupId) {
              const currentHeight = n.style?.height || 200;
              const currentWidth = n.style?.width || 250;
              return {
                ...n,
                selected: false,
                style: {
                  ...n.style,
                  height: Math.max(currentHeight, minHeight),
                  width: Math.max(currentWidth, minWidth),
                },
              };
            }
            if (n.parentId === parentGroupId) {
              const idx = currentChildren.findIndex(child => child.id === n.id);
              const r = Math.floor(idx / 2);
              const c = idx % 2;
              return {
                ...n,
                selected: false,
                position: { x: 20 + c * 240, y: 60 + r * 80 },
              };
            }
            return { ...n, selected: false };
          });

          const withoutUser = updatedNodes.filter((n) => n.id !== userNode.id);
          return [...withoutUser, userNode];
        });
        setSelectedNodeId(userId);
        addLog(`➕ Added IAM User (Grouped).`, "success");
        return;
      } else {
        const nodeData = {
          label: `new-${type.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
          iamType: type,
          region: userSettings.defaultRegion,
        };

        if (type === "Role") {
          nodeData.roleService = "ec2.amazonaws.com";
        } else if (type === "Policy") {
          nodeData.policyActions = "s3:*";
          nodeData.policyResource = "*";
        }

        newNode = {
          id: `iam_${type.toLowerCase()}_${Date.now()}`,
          type: type === "Group" ? "iamGroupNode" : "iamNode",
          data: nodeData,
          position: resolvedPosition,
          zIndex: type === "Group" ? -1 : 0,
          ...(type === "Group" && { style: { width: 300, height: 200 } }),
        };
        addLog(`➕ Added IAM ${type}.`, "info");
      }
    } else if (nodeType === "shapeNode") {
      const type = labelType; // "Rectangle", "Circle", "Text"
      const isContainer = type === "Rectangle" || type === "Circle";
      newNode = {
        id: `shape_${Date.now()}`,
        type: "shapeNode",
        data: {
          label: isContainer ? `${type} Group` : `${type} Note`,
          shapeType: type,
        },
        position: resolvedPosition,
        zIndex: isContainer ? -1 : 0,
        style: isContainer ? { width: 350, height: 350 } : {},
      };
      addLog(`➕ Added Shape: ${type}`, "info");
    }

    if (newNode) {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat({ ...newNode, selected: true }));
      setSelectedNodeId(newNode.id);
    }
  }, [setNodes, takeSnapshot, addLog, userSettings.defaultRegion, nodes, setSelectedNodeId]);

  const addNewS3Node = () => spawnNode("s3Node");
  const addNewS3ObjectNode = () => spawnNode("s3ObjectNode");
  const addNewEC2Node = () => spawnNode("ec2Node");
  const addNewIAMNode = (type) => spawnNode(type === "Group" ? "iamGroupNode" : "iamNode", type);
  const addNewShape = (type) => spawnNode("shapeNode", type);

  const onDragStart = (event, nodeType, labelType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, labelType }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      try {
        const { nodeType, labelType } = JSON.parse(rawData);

        // Get bounding rect of the wrapper to calculate coordinates relative to the flow pane container
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Center offsets based on node type dimensions to drop exactly under cursor center
        let centeredPosition = { ...position };
        if (nodeType === "s3Node" || nodeType === "s3ObjectNode" || nodeType === "ec2Node" || (nodeType === "iamNode" && labelType !== "Group")) {
          centeredPosition.x -= 110;
          centeredPosition.y -= 35;
        } else if (nodeType === "iamGroupNode" || labelType === "Group") {
          centeredPosition.x -= 150;
          centeredPosition.y -= 100;
        } else if (nodeType === "shapeNode") {
          const isContainer = labelType === "Rectangle" || labelType === "Circle";
          if (isContainer) {
            centeredPosition.x -= 175;
            centeredPosition.y -= 175;
          } else {
            centeredPosition.x -= 60;
            centeredPosition.y -= 20;
          }
        }

        spawnNode(nodeType, labelType, centeredPosition);
      } catch (err) {
        console.error("Failed to process dropped node:", err);
      }
    },
    [screenToFlowPosition, spawnNode, reactFlowWrapper]
  );

  const clearCanvas = () => {
    takeSnapshot();
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    addLog("🗑️ Visual canvas flushed.", "warn");
  };

  const compileTerraform = async () => {
    const awsNodes = nodes.filter((n) => n.type === "s3Node" || n.type === "s3ObjectNode" || n.type === "iamNode" || n.type === "iamGroupNode" || n.type === "ec2Node");
    if (awsNodes.length === 0) {
      addLog("⚠️ Cannot synthesize environment without AWS resources.", "warn");
      return;
    }

    addLog("📡 Compiling via CDKTF...", "info");
    try {
      const response = await fetch("http://localhost:3001/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: awsNodes.map((n) => ({
            id: n.id,
            type: n.type,
            parentId: n.parentId,
            data: n.data,
          })),
          edges: edges
            .filter((e) => awsNodes.some((n) => n.id === e.source) && awsNodes.some((n) => n.id === e.target))
            .map((e) => ({
              source: e.source,
              target: e.target,
            })),
        }),
      });
      if (!response.ok) throw new Error(`Server status ${response.status}`);
      const data = await response.json();
      setGeneratedCode(JSON.stringify(data.code, null, 2));
      setIsModalOpen(true);
      addLog("✨ CDKTF Synthesis complete.", "success");
    } catch (error) {
      addLog(`❌ Compilation failed: ${error.message}`, "error");
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    addLog("📋 Schema copied.", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setModalView("code");
    checkDeploymentStatus();
  };

  const handleDeploy = () => {
    setTerminalMode("deploy");
    setModalView("terminal");
    setTerminalLogs([]);
    setAwaitingInput(false);
    setIsDeploying(true);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("http://localhost:3001/api/deploy/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "stdout" || data.type === "stderr") {
        setTerminalLogs((prev) => [...prev, data.text]);
      } else if (data.type === "awaitingInput") {
        setAwaitingInput(true);
      } else if (data.type === "exit") {
        setIsDeploying(false);
        setAwaitingInput(false);
        eventSource.close();
        checkDeploymentStatus();
      }
    };

    eventSource.onerror = (error) => {
      setTerminalLogs((prev) => [...prev, "\n❌ Deployment stream disconnected or failed to connect.\n"]);
      setIsDeploying(false);
      setAwaitingInput(false);
      eventSource.close();
      checkDeploymentStatus();
    };

    eventSourceRef.current = eventSource;
  };

  const handleDestroy = () => {
    setTerminalMode("destroy");
    setModalView("terminal");
    setTerminalLogs([]);
    setAwaitingInput(false);
    setIsDeploying(true);
    setIsModalOpen(true);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("http://localhost:3001/api/destroy/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "stdout" || data.type === "stderr") {
        setTerminalLogs((prev) => [...prev, data.text]);
      } else if (data.type === "awaitingInput") {
        setAwaitingInput(true);
      } else if (data.type === "exit") {
        setIsDeploying(false);
        setAwaitingInput(false);
        eventSource.close();
        checkDeploymentStatus();
      }
    };

    eventSource.onerror = (error) => {
      setTerminalLogs((prev) => [...prev, "\n❌ Destruction stream disconnected or failed to connect.\n"]);
      setIsDeploying(false);
      setAwaitingInput(false);
      eventSource.close();
      checkDeploymentStatus();
    };

    eventSourceRef.current = eventSource;
  };

  const handleRedeploy = async (deploymentId) => {
    try {
      const response = await fetch("http://localhost:3001/api/deployments/redeploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deploymentId }),
      });
      if (response.ok) {
        // Close deployments modal and open compilation modal
        setIsDeploymentsModalOpen(false);
        
        // Retrieve the deployment details to set generatedCode so it is shown in Code tab if they navigate back
        const depItem = deployments.find(d => d.id === deploymentId);
        if (depItem) {
          setGeneratedCode(JSON.stringify(depItem.code, null, 2));
        }
        
        setIsModalOpen(true);
        handleDeploy(); // Start the deployment stream terminal
      } else {
        addLog("❌ Failed to load deployment configuration.", "error");
      }
    } catch (err) {
      addLog(`❌ Redeployment network error: ${err.message}`, "error");
    }
  };

  const handleClearHistory = async () => {
    const confirmClear = window.confirm("Are you sure you want to clear the entire deployment history? This will delete all saved versions.");
    if (!confirmClear) return;

    try {
      const response = await fetch("http://localhost:3001/api/deployments", {
        method: "DELETE",
      });
      if (response.ok) {
        setDeployments([]);
        setSelectedDeployment(null);
        addLog("🧹 Deployment history cleared successfully.", "success");
      } else {
        addLog("❌ Failed to clear deployment history.", "error");
      }
    } catch (err) {
      console.error("Failed to clear deployments history:", err);
      addLog("❌ Network error clearing deployment history.", "error");
    }
  };

  const sendTerminalInput = async (e) => {
    e.preventDefault();
    const input = terminalInput.trim();
    if (!input) return;

    // Echo input locally on terminal
    setTerminalLogs((prev) => [...prev, `${input}\n`]);
    setTerminalInput("");
    setAwaitingInput(false);

    try {
      const response = await fetch("http://localhost:3001/api/deploy/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!response.ok) {
        setTerminalLogs((prev) => [...prev, "❌ Failed to send input to backend.\n"]);
      }
    } catch (err) {
      setTerminalLogs((prev) => [...prev, `❌ Network error sending input: ${err.message}\n`]);
    }
  };

  const downloadFile = () => {
    const blob = new Blob([generatedCode], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cdk.tf.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("💾 Downloaded cdk.tf.json", "success");
  };

  const searchResults =
    searchQuery.trim() === ""
      ? []
      : nodes.filter((n) =>
        (n.data?.label || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );

  const handleFocusNode = (nodeId) => {
    setSelectedNodeId(nodeId);
    fitView({
      nodes: [{ id: nodeId }],
      duration: 800,
      padding: 0.5,
      maxZoom: 1.2,
    });
    setSearchQuery("");
    setIsSearchFocused(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    addLog(`🔍 Located and focused on component.`, "info");
  };

  const isBudgetLegendCollapsed = !!selectedNode || userCollapsedLegend;

  return (
    <ModeContext.Provider value={activeMode}>
      <div className="h-screen w-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-300 font-sans antialiased select-none overflow-hidden relative transition-colors duration-300">
        {/* CANVAS ENGINE */}
        <main ref={reactFlowWrapper} className="absolute inset-0 z-0">
          <ReactFlow
            nodes={evaluatedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect} // ACTIVE EDGE REROUTING LISTENER
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={{
              style: { strokeWidth: 2, stroke: "#94a3b8" },
              reconnectable: true, // ENABLES GRABBERS ON CLICK
              focusable: true,
            }}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background
              color={userSettings.theme === "dark" ? "#27272a" : userSettings.theme === "forest" ? "#3C5148" : "#cbd5e1"}
              gap={24}
              size={1.5}
            />
          </ReactFlow>
        </main>

        {/* FLOATING HEADER */}
        <header className="absolute top-6 inset-x-6 flex items-center justify-between pointer-events-none z-40">
          {/* Left Island (Menu, Project & Undo/Redo) */}
          <div className="flex items-center gap-4 pointer-events-auto relative">
            <button
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className="p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-zinc-100 shadow-sm dark:shadow-xl transition-colors"
            >
              <Menu size={20} />
            </button>

            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsProjectDropdownOpen(!isProjectDropdownOpen);
              }}
              className="flex items-center gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl shadow-sm dark:shadow-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="p-1.5 rounded-md bg-gradient-to-tr from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500 text-white shadow-md">
                <Layers size={16} />
              </div>
              <div className="flex flex-col pr-2">
                <h1 className="font-bold text-slate-800 dark:text-zinc-100 text-sm tracking-wide leading-tight truncate max-w-[150px]">
                  {activeProject?.name}
                </h1>
              </div>
              <ChevronRight
                size={14}
                className={`text-slate-400 dark:text-zinc-500 transition-transform ${isProjectDropdownOpen ? "rotate-90" : ""}`}
              />
            </div>

            {/* UNDO / REDO CONTROLS */}
            <div className="flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm dark:shadow-xl transition-colors">
              <button
                onClick={undo}
                disabled={past.length === 0}
                className={`p-1.5 rounded-lg transition-colors ${past.length === 0 ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <Undo size={18} />
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-zinc-800 mx-0.5"></div>
              <button
                onClick={redo}
                disabled={future.length === 0}
                className={`p-1.5 rounded-lg transition-colors ${future.length === 0 ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <Redo size={18} />
              </button>
            </div>

            {/* MODE SWITCHER CONTROLS */}
            <div className="flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm dark:shadow-xl transition-colors h-10">
              <button
                onClick={() => setActiveMode("dev")}
                className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all h-8 ${activeMode === "dev"
                  ? "bg-slate-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500 border border-slate-200/50 dark:border-zinc-700/50 shadow-sm px-3"
                  : "text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 w-8"
                  }`}
                title="Dev/Standard Mode"
              >
                <Activity size={14} />
                {activeMode === "dev" && <span>Dev</span>}
              </button>
              <button
                onClick={() => setActiveMode("audit")}
                className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all h-8 ${activeMode === "audit"
                  ? "bg-slate-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500 border border-slate-200/50 dark:border-zinc-700/50 shadow-sm px-3"
                  : "text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 w-8"
                  }`}
                title="Audit Mode"
              >
                <Shield size={14} />
                {activeMode === "audit" && <span>Audit</span>}
              </button>
              <button
                onClick={() => setActiveMode("budgets")}
                className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all h-8 ${activeMode === "budgets"
                  ? "bg-slate-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-500 border border-slate-200/50 dark:border-zinc-700/50 shadow-sm px-3"
                  : "text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 w-8"
                  }`}
                title="Budgets Mode"
              >
                <Coins size={14} />
                {activeMode === "budgets" && <span>Budgets</span>}
              </button>
            </div>

            {/* Project Dropdown */}
            {isProjectDropdownOpen && (
              <div
                className="absolute top-full mt-2 left-14 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl rounded-xl py-2 animate-fade-in z-50 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80 mb-2 relative">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold mb-1">
                    Current Project
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white pr-6 truncate">
                    {activeProject?.name}
                  </p>
                  <button
                    onClick={() => {
                      setIsProjectDropdownOpen(false);
                      onOpenProjectsDashboard();
                    }}
                    className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                    title="Fullscreen Projects Dashboard"
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
                <div className="px-2">
                  <p className="px-3 py-1 text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                    Recent Projects
                  </p>
                  {projects
                    .filter((p) => p.id !== activeProject?.id)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, 3)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setIsProjectDropdownOpen(false);
                          onLoadProject(p.id);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left"
                      >
                        <span className="truncate pr-2">{p.name}</span>
                        <FolderOpen
                          size={14}
                          className="text-slate-400 dark:text-zinc-600 shrink-0"
                        />
                      </button>
                    ))}
                </div>
                <div className="px-2 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                  <button
                    onClick={() => onNewProjectFlow()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left"
                  >
                    <FolderPlus size={14} /> New Project
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center Island (Global Search Engine) */}
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto w-72 md:w-96">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 dark:text-zinc-500" />
              </div>
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchActiveIndex(-1);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onClick={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      setSearchActiveIndex((prev) =>
                        prev >= searchResults.length - 1 ? 0 : prev + 1
                      );
                    }
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      setSearchActiveIndex((prev) =>
                        prev <= 0 ? searchResults.length - 1 : prev - 1
                      );
                    }
                  } else if (e.key === "Enter") {
                    if (searchResults.length > 0) {
                      e.preventDefault();
                      const targetIndex = searchActiveIndex >= 0 ? searchActiveIndex : 0;
                      handleFocusNode(searchResults[targetIndex].id);
                    }
                  } else if (e.key === "Escape") {
                    setIsSearchFocused(false);
                    if (document.activeElement && typeof document.activeElement.blur === "function") {
                      document.activeElement.blur();
                    }
                  }
                }}
                className="w-full h-11 pl-10 pr-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500 shadow-sm dark:shadow-xl transition-all"
              />

              {/* Search Autocomplete Dropdown */}
              {isSearchFocused && searchQuery.trim() !== "" && (
                <div className="absolute top-full mt-2 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl rounded-xl py-2 animate-fade-in z-50 max-h-64 overflow-y-auto scroll-smooth">
                  {searchResults.length > 0 ? (
                    searchResults.map((res, index) => (
                      <button
                        key={res.id}
                        id={`global-opt-${index}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleFocusNode(res.id);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${index === searchActiveIndex
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                          }`}
                      >
                        {res.type === "s3Node" ? (
                          <Database
                            size={16}
                            className="text-amber-500 shrink-0"
                          />
                        ) : res.type === "s3ObjectNode" ? (
                          <File
                            size={16}
                            className="text-amber-500 shrink-0"
                          />
                        ) : res.type === "iamNode" ? (
                          <Shield
                            size={16}
                            className="text-violet-500 shrink-0"
                          />
                        ) : res.type === "ec2Node" ? (
                          <Server
                            size={16}
                            className="text-sky-500 shrink-0"
                          />
                        ) : (
                          <Square size={16} className="text-blue-500 shrink-0" />
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate leading-tight">
                            {res.data?.label || res.id}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono uppercase mt-0.5 tracking-wider">
                            {res.type === "s3Node"
                              ? "AWS S3 Bucket"
                              : res.type === "s3ObjectNode"
                                ? "AWS S3 Object"
                                : res.type === "iamNode"
                                  ? `AWS IAM ${res.data?.iamType || "Resource"}`
                                  : res.type === "ec2Node"
                                    ? "AWS EC2"
                                    : "Shape / Group"}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-xs font-medium text-slate-500 dark:text-zinc-500 text-center">
                      No components found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Island (Actions) */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => {
                fetchDeploymentsList();
                setIsDeploymentsModalOpen(true);
              }}
              className="p-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 shadow-sm dark:shadow-xl transition-colors"
              title="Deployment History"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 shadow-sm dark:shadow-xl transition-colors"
            >
              <Settings size={18} />
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-zinc-800 mx-1" />
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="flex items-center gap-2 px-4 h-11 text-xs font-bold rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 shadow-sm dark:shadow-xl transition-all"
            >
              <Terminal size={14} /> Diagnostics
            </button>
            <button
              onClick={compileTerraform}
              className="flex items-center gap-2 px-6 h-11 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-white dark:text-zinc-950 shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all"
            >
              <Play size={14} fill="currentColor" /> Review & Export
            </button>
          </div>
        </header>

        {/* FLOATING LEFT SIDEBAR (Accordion IDE Style) */}
        <aside
          className={`absolute top-24 bottom-6 z-30 overflow-hidden transition-all duration-300 ease-in-out border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl flex flex-col rounded-2xl shadow-xl dark:shadow-2xl ${isLeftPanelOpen ? "left-6 w-72 translate-x-0 pointer-events-auto" : "left-0 w-0 -translate-x-full opacity-0 pointer-events-none"}`}
        >
          <div className="flex flex-col w-72 h-full overflow-y-auto custom-scrollbar p-3">
            {/* CATEGORY: AWS RESOURCES */}
            <div className="flex flex-col gap-1 mb-2">
              <button
                onClick={() => toggleCategory("aws")}
                className="flex items-center gap-2 px-2 py-2 w-full hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors text-left group"
              >
                <ChevronRight
                  size={14}
                  className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${expandedCategories.aws ? "rotate-90" : ""}`}
                />
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors">
                  Storage
                </span>
              </button>
              <div
                className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out origin-top ${expandedCategories.aws ? "max-h-96 opacity-100 scale-y-100 mt-1" : "max-h-0 opacity-0 scale-y-0"}`}
              >
                <div className="pl-6 pr-2 pb-1 flex flex-col gap-2">
                  <button
                    onClick={addNewS3Node}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "s3Node")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-amber-100 dark:bg-amber-500/10 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20 rounded-md text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 transition-all">
                        <Database size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        S3 Bucket
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                      + Add
                    </span>
                  </button>
                  <button
                    onClick={addNewS3ObjectNode}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "s3ObjectNode")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-amber-100 dark:bg-amber-500/10 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20 rounded-md text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 transition-all">
                        <File size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        S3 Object
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                      + Add
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* CATEGORY: COMPUTE */}
            <div className="flex flex-col gap-1 mb-2">
              <button
                onClick={() => toggleCategory("compute")}
                className="flex items-center gap-2 px-2 py-2 w-full hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors text-left group"
              >
                <ChevronRight
                  size={14}
                  className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${expandedCategories.compute ? "rotate-90" : ""}`}
                />
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors">
                  Compute
                </span>
              </button>
              <div
                className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out origin-top ${expandedCategories.compute ? "max-h-96 opacity-100 scale-y-100 mt-1" : "max-h-0 opacity-0 scale-y-0"}`}
              >
                <div className="pl-6 pr-2 pb-1">
                  <button
                    onClick={addNewEC2Node}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "ec2Node")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-sky-100 dark:bg-sky-500/10 group-hover:bg-sky-200 dark:group-hover:bg-sky-500/20 rounded-md text-sky-600 dark:text-sky-500 border border-sky-200 dark:border-sky-500/20 transition-all">
                        <Server size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        EC2 Instance
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                      + Add
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* CATEGORY: IAM */}
            <div className="flex flex-col gap-1 mb-2">
              <button
                onClick={() => toggleCategory("iam")}
                className="flex items-center gap-2 px-2 py-2 w-full hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors text-left group"
              >
                <ChevronRight
                  size={14}
                  className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${expandedCategories.iam ? "rotate-90" : ""}`}
                />
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors">
                  IAM
                </span>
              </button>
              <div
                className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out origin-top ${expandedCategories.iam ? "max-h-96 opacity-100 scale-y-100 mt-1" : "max-h-0 opacity-0 scale-y-0"}`}
              >
                <div className="pl-6 pr-2 pb-1 flex flex-col gap-2">
                  <button
                    onClick={() => addNewIAMNode("User")}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "iamNode", "User")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-violet-100 dark:bg-violet-500/10 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/20 rounded-md text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20 transition-all">
                        <User size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        IAM User
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                      + Add
                    </span>
                  </button>
                  <button
                    onClick={() => addNewIAMNode("Group")}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "iamGroupNode", "Group")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-violet-100 dark:bg-violet-500/10 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/20 rounded-md text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20 transition-all">
                        <Users size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        IAM Group
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                      + Add
                    </span>
                  </button>
                  <button
                    onClick={() => addNewIAMNode("Role")}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "iamNode", "Role")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-violet-100 dark:bg-violet-500/10 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/20 rounded-md text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20 transition-all">
                        <Shield size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        IAM Role
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                      + Add
                    </span>
                  </button>
                  <button
                    onClick={() => addNewIAMNode("Policy")}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "iamNode", "Policy")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-violet-100 dark:bg-violet-500/10 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/20 rounded-md text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20 transition-all">
                        <Key size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        IAM Policy
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                      + Add
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* CATEGORY: SHAPES */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => toggleCategory("shapes")}
                className="flex items-center gap-2 px-2 py-2 w-full hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors text-left group"
              >
                <ChevronRight
                  size={14}
                  className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${expandedCategories.shapes ? "rotate-90" : ""}`}
                />
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors">
                  Shapes & Groups
                </span>
              </button>
              <div
                className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out origin-top ${expandedCategories.shapes ? "max-h-96 opacity-100 scale-y-100 mt-1" : "max-h-0 opacity-0 scale-y-0"}`}
              >
                <div className="pl-6 pr-2 pb-1 flex flex-col gap-2">
                  <button
                    onClick={() => addNewShape("Rectangle")}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "shapeNode", "Rectangle")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 rounded-md text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20 transition-all">
                        <Square size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        Rectangle Group
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => addNewShape("Circle")}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "shapeNode", "Circle")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 rounded-md text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20 transition-all">
                        <CircleIcon size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        Circle Group
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => addNewShape("Text")}
                    draggable={true}
                    onDragStart={(e) => onDragStart(e, "shapeNode", "Text")}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 rounded-md text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20 transition-all">
                        <Type size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        Text Label
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* FLOATING RIGHT SIDEBAR */}
        {selectedNode && (
          <aside className="absolute top-24 right-6 bottom-6 w-80 z-30 border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl flex flex-col overflow-hidden rounded-2xl shadow-xl dark:shadow-2xl animate-fade-in">
            <div className="p-5 pb-36 flex flex-col flex-1 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <Settings2
                  size={16}
                  className={
                    selectedNode.type === "s3Node"
                      ? "text-amber-500"
                      : selectedNode.type === "iamNode"
                        ? "text-violet-500"
                        : selectedNode.type === "ec2Node"
                          ? "text-sky-500"
                          : "text-blue-500"
                  }
                />
                <h2 className="font-bold text-xs text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  {selectedNode.type === "s3Node"
                    ? "S3 Bucket Settings"
                    : selectedNode.type === "iamNode"
                      ? `${selectedNode.data?.iamType || "IAM"} Settings`
                      : selectedNode.type === "ec2Node"
                        ? "EC2 Instance Settings"
                        : "Group Settings"}
                </h2>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                  Label / Name
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.label || ""}
                  onChange={(e) => updateNodeData("label", e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                />
              </div>

              {selectedNode.type === "iamNode" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      IAM Type
                    </label>
                    <div className="w-full h-10 px-3 bg-slate-100 dark:bg-zinc-800 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center shadow-inner">
                      {selectedNode.data?.iamType}
                    </div>
                  </div>

                  {selectedNode.data?.iamType === "Role" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                          Trust Policy Type
                        </label>
                        <CustomSelect
                          value={selectedNode.data?.trustType || "service"}
                          onChange={(val) => {
                            updateNodeData("trustType", val);
                            if (val === "service") {
                              updateNodeData("roleService", "ec2.amazonaws.com");
                            } else {
                              updateNodeData("roleService", "");
                            }
                          }}
                          className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                          options={[
                            { value: "service", label: "AWS Service" },
                            { value: "aws_arn", label: "AWS Account / IAM Entity (ARN)" },
                            { value: "federated", label: "Federated Identity (OIDC/SAML)" },
                          ]}
                        />
                      </div>

                      {(selectedNode.data?.trustType === "service" || !selectedNode.data?.trustType) && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                            Trust Service
                          </label>
                          <CustomSelect
                            value={selectedNode.data?.roleService || "ec2.amazonaws.com"}
                            onChange={(val) => updateNodeData("roleService", val)}
                            className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                            options={[
                              { value: "ec2.amazonaws.com", label: "EC2 (ec2.amazonaws.com)" },
                              { value: "lambda.amazonaws.com", label: "Lambda (lambda.amazonaws.com)" },
                              { value: "ecs-tasks.amazonaws.com", label: "ECS Tasks (ecs-tasks.amazonaws.com)" },
                              { value: "apigateway.amazonaws.com", label: "API Gateway (apigateway.amazonaws.com)" },
                            ]}
                          />
                        </div>
                      )}

                      {selectedNode.data?.trustType === "aws_arn" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                            AWS IAM Principal ARN
                          </label>
                          <input
                            type="text"
                            value={selectedNode.data?.trustPrincipal || ""}
                            onChange={(e) => updateNodeData("trustPrincipal", e.target.value)}
                            placeholder="arn:aws:iam::123456789012:root"
                            className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                          />
                        </div>
                      )}

                      {selectedNode.data?.trustType === "federated" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                            Federated Provider ARN (OIDC/SAML)
                          </label>
                          <input
                            type="text"
                            value={selectedNode.data?.trustPrincipal || ""}
                            onChange={(e) => updateNodeData("trustPrincipal", e.target.value)}
                            placeholder="arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
                            className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {selectedNode.data?.iamType === "Policy" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                          Allowed Actions (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={selectedNode.data?.policyActions || ""}
                          onChange={(e) => updateNodeData("policyActions", e.target.value)}
                          placeholder="e.g. s3:*, dynamodb:GetItem"
                          className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                          Resource ARN
                        </label>
                        <input
                          type="text"
                          value={selectedNode.data?.policyResource || ""}
                          onChange={(e) => updateNodeData("policyResource", e.target.value)}
                          placeholder="e.g. *, arn:aws:s3:::my-bucket/*"
                          className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Region
                    </label>
                    <RegionSelect
                      value={selectedNode.data?.region}
                      onChange={(val) => updateNodeData("region", val)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                    />
                  </div>
                </>
              )}

              {selectedNode.type === "ec2Node" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Instance Type
                    </label>
                    <CustomSelect
                      value={["t2.micro", "t2.small", "t3.medium"].includes(selectedNode.data?.instanceType || "t2.micro") ? (selectedNode.data?.instanceType || "t2.micro") : "custom"}
                      onChange={(val) => {
                        if (val === "more") {
                          setIsInstanceModalOpen(true);
                        } else {
                          updateNodeData("instanceType", val);
                        }
                      }}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                      options={[
                        { value: "t2.micro", label: "t2.micro ($8.50/mo)" },
                        { value: "t2.small", label: "t2.small ($17.00/mo)" },
                        { value: "t3.medium", label: "t3.medium ($34.00/mo)" },
                        ...(!["t2.micro", "t2.small", "t3.medium"].includes(selectedNode.data?.instanceType || "t2.micro") ? [{ value: "custom", label: `${selectedNode.data?.instanceType} (Selected)` }] : []),
                        { value: "more", label: "More Instance Types..." },
                      ]}
                    />
                  </div>

                  {!selectedNode.data?.useCustomAmi && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                        OS / Base Image
                      </label>
                      <CustomSelect
                        value={selectedNode.data?.osImage || "amazon-linux-2023"}
                        onChange={(val) => updateNodeData("osImage", val)}
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                        options={OS_IMAGES.map(img => ({ value: img.id, label: img.name }))}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      id="useCustomAmi"
                      checked={!!selectedNode.data?.useCustomAmi}
                      onChange={(e) => updateNodeData("useCustomAmi", e.target.checked)}
                      className="rounded border-slate-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="useCustomAmi" className="text-xs font-semibold text-slate-600 dark:text-zinc-400 select-none cursor-pointer">
                      Advanced: Use Custom AMI ID
                    </label>
                  </div>

                  {selectedNode.data?.useCustomAmi ? (
                    <div className="flex flex-col gap-1.5 animate-fade-in">
                      <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                        Custom AMI ID
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data?.ami || ""}
                        onChange={(e) => updateNodeData("ami", e.target.value)}
                        placeholder="e.g. ami-0c55b159cbfafe1f0"
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 bg-slate-100/50 dark:bg-zinc-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60 font-mono">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                        <span>Standard AMI ID</span>
                        <span className="text-[9px] bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-extrabold text-slate-500 dark:text-zinc-400">Auto-mapped</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-1">
                        {selectedNode.data?.ami || "No AMI mapped for region"}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Root Volume Size ({selectedNode.data?.volumeSize || 8} GB)
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="2000"
                      value={selectedNode.data?.volumeSize || 8}
                      onChange={(e) =>
                        updateNodeData("volumeSize", parseInt(e.target.value))
                      }
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Region
                    </label>
                    <RegionSelect
                      value={selectedNode.data?.region}
                      onChange={(val) => updateNodeData("region", val)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                    />
                  </div>
                </>
              )}

              {selectedNode.type === "s3Node" && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Storage Capacity
                    </label>
                    {selectedNode.data?.isAutoSized ? (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl">
                        <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <span>Auto-calculated:</span>
                          <span className="font-mono bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                            {selectedNode.data?.storageGB >= 1 
                              ? `${(selectedNode.data?.storageGB).toFixed(3)} GB`
                              : `${(selectedNode.data?.storageGB * 1024).toFixed(1)} MB`}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500/80 font-medium mt-1.5 leading-normal">
                          Calculated automatically from the actual filesystem files/folders inside your nested S3 Objects.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
                          <span>Manual Estimation:</span>
                          <span className="font-mono text-amber-500 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded">
                            {selectedNode.data?.storageGB || 10} GB
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="1000"
                          value={selectedNode.data?.storageGB || 10}
                          onChange={(e) =>
                             updateNodeData("storageGB", parseInt(e.target.value))
                          }
                          className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-normal italic">
                          Slide to estimate cost. Auto-calculates if nested S3 Objects are added.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Target Region
                    </label>
                    <RegionSelect
                      value={selectedNode.data?.region}
                      onChange={(val) => updateNodeData("region", val)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                    />
                  </div>
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                          Versioning
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!selectedNode.data?.versioning}
                        onChange={(e) =>
                          updateNodeData("versioning", e.target.checked)
                        }
                        className="accent-amber-500 h-4 w-4 rounded border-slate-300 dark:border-zinc-800 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                          Public Access
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!selectedNode.data?.isPublic}
                        onChange={(e) =>
                          updateNodeData("isPublic", e.target.checked)
                        }
                        className="accent-amber-500 h-4 w-4 rounded border-slate-300 dark:border-zinc-800 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* SNAPPED OBJECTS LIST */}
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Snapped Objects
                    </label>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {nodes.filter((n) => n.parentId === selectedNode.id).length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No objects snapped inside this bucket.</p>
                      ) : (
                        nodes.filter((n) => n.parentId === selectedNode.id).map((child) => (
                          <div key={child.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 hover:border-amber-400/50 dark:hover:border-amber-500/30 transition-colors shadow-sm dark:shadow-none">
                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">
                                {child.data?.label || "S3 Object"}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate" title={child.data?.sourcePath || ""}>
                                {child.data?.sourcePath ? child.data.sourcePath.split(/[\\/]/).pop() : "No path selected"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                takeSnapshot();
                                setNodes((nds) => nds.filter((n) => n.id !== child.id));
                                setEdges((eds) => eds.filter((e) => e.source !== child.id && e.target !== child.id));
                                addLog(`🗑️ Deleted S3 Object: ${child.data?.label || child.id}`, "warn");
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                              title="Delete S3 Object"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedNode.type === "s3ObjectNode" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Source Type
                    </label>
                    <div className="flex bg-slate-50 dark:bg-zinc-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => updateNodeData("sourceType", "file")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                          (selectedNode.data?.sourceType || "file") === "file"
                            ? "bg-white dark:bg-zinc-850 text-amber-500 shadow-sm"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        File
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNodeData("sourceType", "folder")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                          selectedNode.data?.sourceType === "folder"
                            ? "bg-white dark:bg-zinc-850 text-amber-500 shadow-sm"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        Folder
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Source Path
                    </label>
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={2}
                        readOnly
                        value={selectedNode.data?.sourcePath || "No path selected"}
                        placeholder="Click browse to select a path..."
                        className="w-full p-2 bg-slate-50 dark:bg-zinc-900 text-xs font-mono text-slate-600 dark:text-zinc-400 rounded-lg border border-slate-200 dark:border-zinc-800 resize-none shadow-inner select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => openFsBrowser(selectedNode.data?.sourcePath, async (path) => {
                          let sizeGB = 0;
                          try {
                            const res = await fetch(`http://localhost:3001/api/fs/size?path=${encodeURIComponent(path)}`);
                            if (res.ok) {
                              const sizeData = await res.json();
                              sizeGB = sizeData.sizeBytes / (1024 * 1024 * 1024);
                            }
                          } catch (e) {
                            console.error("Failed to fetch folder/file size:", e);
                          }
                          
                          setNodes((nds) =>
                            nds.map((node) => {
                              if (node.id === selectedNodeId) {
                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    sourcePath: path,
                                    sizeGB,
                                  },
                                };
                              }
                              return node;
                            })
                          );
                        })}
                        className="w-full flex items-center justify-center gap-2 h-10 text-xs font-bold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors shadow-sm"
                      >
                        <FolderOpen size={14} className="text-amber-500" /> Browse Filesystem...
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 italic">
                      Note: Choose a folder prefix or file to sync with S3. Avoid adding thousands of individual file nodes to keep the canvas fast.
                    </span>
                  </div>
                </>
              )}

              {selectedNode.type === "iamGroupNode" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Region
                    </label>
                    <RegionSelect
                      value={selectedNode.data?.region}
                      onChange={(val) => updateNodeData("region", val)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                    />
                  </div>

                  {/* GROUP MEMBERS LIST */}
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Group Members
                    </label>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {nodes.filter((n) => n.parentId === selectedNode.id).length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No members snapped inside this group.</p>
                      ) : (
                        nodes.filter((n) => n.parentId === selectedNode.id).map((child) => (
                          <div key={child.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 hover:border-violet-400/50 dark:hover:border-violet-500/30 transition-colors shadow-sm dark:shadow-none">
                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">
                                {child.data?.label || "IAM User"}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                                Type: {child.data?.iamType || "User"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                takeSnapshot();
                                setNodes((nds) => nds.filter((n) => n.id !== child.id));
                                setEdges((eds) => eds.filter((e) => e.source !== child.id && e.target !== child.id));
                                addLog(`🗑️ Deleted Group Member: ${child.data?.label || child.id}`, "warn");
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                              title="Delete Group Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedNode.type === "shapeNode" && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-700 dark:text-blue-400 text-xs font-medium">
                  Groups & Shapes are visual notes only and will be ignored by the
                  compiler when generating infrastructure code.
                </div>
              )}

              <div className="pt-6 mt-auto border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  onClick={() => {
                    takeSnapshot();
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
                    setSelectedNodeId(null);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-500/20 transition-all cursor-pointer"
                >
                  <AlertTriangle size={14} /> Delete Component
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* SETTINGS MODAL */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-slate-900/20 dark:bg-zinc-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md flex flex-col overflow-visible shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-900">
                <div className="flex items-center gap-3 text-slate-900 dark:text-zinc-100">
                  <Settings size={20} className="text-amber-500" />
                  <h3 className="font-bold text-base">Application Settings</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Appearance
                  </h4>
                  <div className="flex items-center gap-3 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-inner">
                    <button
                      onClick={() => updateSettings("theme", "light")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${userSettings.theme === "light" ? "bg-white text-amber-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <Sun size={14} /> Light
                    </button>
                    <button
                      onClick={() => updateSettings("theme", "dark")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${userSettings.theme === "dark" ? "bg-zinc-800 text-amber-500 shadow-sm border border-zinc-700" : "text-zinc-400 hover:text-zinc-200"}`}
                    >
                      <Moon size={14} /> Dark
                    </button>
                    <button
                      onClick={() => updateSettings("theme", "forest")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${userSettings.theme === "forest" ? "bg-[#3C5148] text-[#D5DDDF] shadow-sm border border-[#6B8E4E]" : "text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
                    >
                      <Sparkles size={14} /> Forest
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Editor Preferences
                  </h4>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3">
                      <Save
                        size={18}
                        className="text-slate-500 dark:text-zinc-400"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                          Auto-Save Projects
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 mt-0.5">
                          Continuously sync to local storage
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={userSettings.autoSave}
                      onChange={(e) =>
                        updateSettings("autoSave", e.target.checked)
                      }
                      className="accent-amber-500 h-5 w-5 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    AWS Defaults
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-500 dark:text-zinc-500 uppercase">
                      Default Deployment Region
                    </label>
                    <RegionSelect
                      value={userSettings.defaultRegion}
                      onChange={(val) =>
                        updateSettings("defaultRegion", val)
                      }
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-bold text-slate-800 dark:text-zinc-100 rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MORE INSTANCE TYPES MODAL */}
        {isInstanceModalOpen && selectedNode && selectedNode.type === "ec2Node" && (() => {
          const LEGACY_UNAVAILABLE_REGIONS = [
            "ap-south-2", "ap-southeast-4", "me-central-1", "eu-south-2", "ca-west-1", "il-central-1"
          ];
          const nodeRegion = selectedNode.data?.region || "us-east-1";
          const db = livePricing[nodeRegion.toLowerCase()] || ALL_INSTANCE_TYPES;
          const isLive = !!livePricing[nodeRegion.toLowerCase()];
          const multiplier = isLive
            ? 1.00
            : (REGIONAL_MULTIPLIERS[nodeRegion.toLowerCase()] !== undefined
                ? REGIONAL_MULTIPLIERS[nodeRegion.toLowerCase()]
                : 1.15);
          const isLegacyUnavailable = LEGACY_UNAVAILABLE_REGIONS.includes(nodeRegion.toLowerCase());
          
          const filteredInstances = db.filter((inst) => {
            const instVal = inst.value.toLowerCase();
            const isLegacy = inst.legacy !== undefined ? inst.legacy : instVal.startsWith("t2");
            if (isLegacyUnavailable && isLegacy) return false;

            const resolvedFamily = inst.family || (
              instVal.startsWith("t2") ? "t2" :
              instVal.startsWith("t3") ? "t3" :
              instVal.startsWith("t4g") ? "t4g" :
              instVal.startsWith("m5") ? "m5" :
              instVal.startsWith("m6g") ? "m6g" :
              instVal.startsWith("c5") ? "c5" :
              instVal.startsWith("c6g") ? "c6g" :
              instVal.startsWith("r5") ? "r5" :
              instVal.startsWith("r6g") ? "r6g" : "Other"
            );
            
            const resolvedCategory = (
              resolvedFamily.startsWith("t") || resolvedFamily.startsWith("m") ? "General Purpose" :
              resolvedFamily.startsWith("c") ? "Compute Optimized" :
              resolvedFamily.startsWith("r") ? "Memory Optimized" : "Other"
            );

            if (instanceActiveTab !== "All" && resolvedCategory !== instanceActiveTab) return false;
            if (instanceSearchQuery.trim() !== "") {
              const q = instanceSearchQuery.toLowerCase();
              return inst.value.toLowerCase().includes(q) || resolvedFamily.toLowerCase().includes(q);
            }
            return true;
          });

          return (
            <div className="fixed inset-0 bg-slate-900/50 dark:bg-zinc-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-900">
                  <div className="flex items-center gap-3">
                    <Server size={20} className="text-sky-500" />
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100">
                        Select EC2 Instance Type
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                        Region: {nodeRegion} | Pricing Multiplier: {multiplier.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsInstanceModalOpen(false);
                      setInstanceSearchQuery("");
                      setInstanceActiveTab("All");
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Search & Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-900">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search instance type... (e.g. t3, m5)"
                      value={instanceSearchQuery}
                      onChange={(e) => setInstanceSearchQuery(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900/60 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 overflow-x-auto shrink-0">
                    {["All", "General Purpose", "Compute Optimized", "Memory Optimized"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setInstanceActiveTab(tab)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                          instanceActiveTab === tab
                            ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-500 shadow-sm border border-slate-200/50 dark:border-zinc-700/50"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main List */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50 dark:bg-zinc-900/10">
                  {filteredInstances.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 dark:text-zinc-500 font-medium">
                      No matching instance types found for region "{nodeRegion}".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredInstances.map((inst) => {
                        const currentPlatform = selectedNode.data?.platform || "Linux";
                        const hourlyPrice = inst.pricing[currentPlatform] !== null ? inst.pricing[currentPlatform] : inst.pricing["Linux"];
                        const cost = parseFloat(((hourlyPrice || 0) * 730 * multiplier).toFixed(2));
                        const isSelected = selectedNode.data?.instanceType === inst.value;
                        
                        const instVal = inst.value.toLowerCase();
                        const resolvedFamily = inst.family || (
                          instVal.startsWith("t2") ? "t2" :
                          instVal.startsWith("t3") ? "t3" :
                          instVal.startsWith("t4g") ? "t4g" :
                          instVal.startsWith("m5") ? "m5" :
                          instVal.startsWith("m6g") ? "m6g" :
                          instVal.startsWith("c5") ? "c5" :
                          instVal.startsWith("c6g") ? "c6g" :
                          instVal.startsWith("r5") ? "r5" :
                          instVal.startsWith("r6g") ? "r6g" : "Other"
                        );

                        const isFreeTier = inst.freeTier !== undefined ? inst.freeTier : (
                          instVal === "t2.micro" || instVal === "t3.micro" || instVal === "t4g.micro"
                        );
                        
                        const isCurrentGen = inst.currentGen !== undefined ? inst.currentGen : !instVal.startsWith("t2");
                        
                        return (
                          <div
                            key={inst.value}
                            onClick={() => {
                              updateNodeData("instanceType", inst.value);
                              setIsInstanceModalOpen(false);
                              setInstanceSearchQuery("");
                              setInstanceActiveTab("All");
                            }}
                            className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer group gap-3 text-left ${
                              isSelected
                                ? "bg-amber-500/5 dark:bg-amber-500/5 border-amber-500 shadow-sm"
                                : "bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${
                                  isSelected 
                                    ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500" 
                                    : "bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 group-hover:bg-white dark:group-hover:bg-zinc-700"
                                }`}>
                                  <Server size={18} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                    {inst.label || inst.value}
                                    {isSelected && (
                                      <span className="text-[9px] bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                                        Active
                                      </span>
                                    )}
                                    {isFreeTier && (
                                      <span className="text-[9px] bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 px-1.5 py-0.5 rounded font-bold">
                                        Free tier eligible
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase mt-0.5">
                                    Family: {resolvedFamily.split(" ")[0].toLowerCase()}  •  {inst.cpu} vCPU  •  {inst.ram} Memory  •  Current generation: {isCurrentGen ? "true" : "false"}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                                  ${cost.toFixed(2)}<span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">/mo</span>
                                </p>
                                <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase mt-0.5">
                                  Est. Cost ({currentPlatform})
                                </p>
                              </div>
                            </div>

                            {/* OS Hourly Rates Grid */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[10px] font-mono text-slate-500 dark:text-zinc-400/80">
                              <div>
                                Linux: <span className="font-bold font-sans text-slate-700 dark:text-zinc-300">${(inst.pricing.Linux * multiplier).toFixed(4)}/hr</span>
                              </div>
                              {inst.pricing.Windows !== null ? (
                                <div>
                                  Windows: <span className="font-bold font-sans text-slate-700 dark:text-zinc-300">${(inst.pricing.Windows * multiplier).toFixed(4)}/hr</span>
                                </div>
                              ) : (
                                <div className="text-slate-400 dark:text-zinc-600 italic font-sans text-[9px]">
                                  Windows not supported (ARM)
                                </div>
                              )}
                              <div>
                                RHEL: <span className="font-bold font-sans text-slate-700 dark:text-zinc-300">${(inst.pricing.RHEL * multiplier).toFixed(4)}/hr</span>
                              </div>
                              <div>
                                Ubuntu Pro: <span className="font-bold font-sans text-slate-700 dark:text-zinc-300">${(inst.pricing.UbuntuPro * multiplier).toFixed(4)}/hr</span>
                              </div>
                              <div>
                                SUSE: <span className="font-bold font-sans text-slate-700 dark:text-zinc-300">${(inst.pricing.SUSE * multiplier).toFixed(4)}/hr</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* FILESYSTEM BROWSER MODAL */}
        {isFsModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in p-4">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl h-[500px] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20">
                <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                  <FolderOpen size={18} className="text-amber-500" />
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    Select Local File or Folder
                  </h3>
                </div>
                <button
                  onClick={() => setIsFsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Current Path Breadcrumbs */}
              <div className="px-4 py-2 bg-slate-100/50 dark:bg-zinc-900/40 border-b border-slate-200/50 dark:border-zinc-900 flex items-center gap-1 overflow-x-auto custom-scrollbar font-mono text-xs text-slate-500 dark:text-zinc-400">
                <button
                  onClick={() => fetchFsDirectory("")}
                  className="hover:text-amber-500 hover:underline shrink-0"
                >
                  Root
                </button>
                {(() => {
                  const parts = fsCurrentPath.split(/[\\/]/).filter(Boolean);
                  let currentBuild = "";
                  const hasDrive = fsCurrentPath.match(/^[a-zA-Z]:/);
                  
                  return parts.map((part, index) => {
                    if (index === 0 && hasDrive) {
                      currentBuild = part + "\\";
                    } else {
                      currentBuild += (currentBuild.endsWith("\\") || currentBuild.endsWith("/") ? "" : "/") + part;
                    }
                    const thisPath = currentBuild;
                    return (
                      <React.Fragment key={index}>
                        <span>/</span>
                        <button
                          onClick={() => fetchFsDirectory(thisPath)}
                          className="hover:text-amber-500 hover:underline shrink-0"
                        >
                          {part}
                        </button>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>

              {/* List of files/folders */}
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-white dark:bg-zinc-950">
                <div className="flex flex-col gap-1">
                  {/* Go Up (Parent) row */}
                  {fsParentPath && fsParentPath !== fsCurrentPath && (
                    <div
                      onDoubleClick={() => fetchFsDirectory(fsParentPath)}
                      onClick={() => setFsSelectedItem({ name: "..", path: fsParentPath, isDir: true })}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        fsSelectedItem?.name === ".."
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-transparent"
                      }`}
                    >
                      <FolderOpen size={16} className="text-amber-500/70 shrink-0" />
                      <span>.. (Parent Directory)</span>
                    </div>
                  )}

                  {/* Folders */}
                  {fsFolders.map((folder) => (
                    <div
                      key={folder.path}
                      onDoubleClick={() => fetchFsDirectory(folder.path)}
                      onClick={() => setFsSelectedItem(folder)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        fsSelectedItem?.path === folder.path
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-transparent"
                      }`}
                    >
                      <Folder size={16} className="text-amber-500 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                  ))}

                  {/* Files */}
                  {fsFiles.map((file) => (
                    <div
                      key={file.path}
                      onDoubleClick={() => {
                        fsOnSelect(file.path, false);
                        setIsFsModalOpen(false);
                      }}
                      onClick={() => setFsSelectedItem(file)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        fsSelectedItem?.path === file.path
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-transparent"
                      }`}
                    >
                      <File size={16} className="text-slate-400 dark:text-zinc-600 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}

                  {fsFolders.length === 0 && fsFiles.length === 0 && (
                    <div className="py-12 text-center text-xs font-medium text-slate-400 dark:text-zinc-600">
                      This directory is empty.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 flex items-center justify-between gap-4">
                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate flex-1">
                  <span className="font-bold font-sans text-slate-400 dark:text-zinc-500 uppercase mr-1">Selected:</span>
                  {fsSelectedItem ? fsSelectedItem.path : "None"}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setIsFsModalOpen(false)}
                    className="px-4 h-9 text-xs font-bold rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!fsSelectedItem || fsSelectedItem.name === ".."}
                    onClick={() => {
                      if (fsSelectedItem) {
                        fsOnSelect(fsSelectedItem.path, fsSelectedItem.isDir);
                        setIsFsModalOpen(false);
                      }
                    }}
                    className="px-4 h-9 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-zinc-950 transition-colors shadow-md"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIAGNOSTICS OVERLAY */}
        {isDiagnosticsOpen && (
          <div className="fixed inset-0 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl z-[60] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30">
              <div className="flex items-center gap-3 text-slate-900 dark:text-zinc-100">
                <Terminal size={24} className="text-amber-500" />
                <h2 className="font-bold text-lg">Live Engine Diagnostics</h2>
              </div>
              <button
                onClick={() => setIsDiagnosticsOpen(false)}
                className="text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <span className="text-xs font-bold uppercase tracking-wider">
                  Close
                </span>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto font-mono text-sm flex flex-col gap-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`leading-relaxed p-3 rounded-lg border font-medium shadow-sm dark:shadow-none ${log.type === "error" ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-950/30" : log.type === "success" ? "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-zinc-800 bg-emerald-50 dark:bg-zinc-900/30" : log.type === "warn" ? "text-amber-700 dark:text-amber-400 border-amber-200 dark:border-zinc-800 bg-amber-50 dark:bg-zinc-900/30" : "text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30"}`}
                >
                  <span className="text-slate-400 dark:text-zinc-600 mr-4 border-r border-slate-200 dark:border-zinc-800 pr-4">
                    {new Date(log.id).toLocaleTimeString()}
                  </span>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTEXT MENU */}
        {contextMenu && (
          <div
            className="absolute z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-xl py-1.5 min-w-[160px] text-sm animate-fade-in font-medium"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === "node" && (
              <>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white text-left transition-colors"
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  onClick={handleCut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white text-left transition-colors"
                >
                  <Scissors size={14} /> Cut
                </button>
                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1"></div>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-left font-bold transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
            {contextMenu.type === "edge" && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-left font-bold transition-colors"
              >
                <Trash2 size={14} /> Delete Connection
              </button>
            )}
            {contextMenu.type === "pane" && (
              <>
                <button
                  onClick={handlePaste}
                  disabled={!clipboard}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${clipboard ? "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" : "text-slate-400 dark:text-zinc-600 cursor-not-allowed"}`}
                >
                  <ClipboardPaste size={14} /> Paste Node
                </button>
                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1"></div>
                <button
                  onClick={() => {
                    clearCanvas();
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-left font-bold transition-colors"
                >
                  <Trash2 size={14} /> Clear Canvas
                </button>
              </>
            )}
          </div>
        )}

        {/* DRAG-TO-CREATE FLOATING CONNECTION SEARCH */}
        {floatingConnectionSearch && (
          <div
            ref={connectionSearchRef}
            style={{
              top: Math.min(floatingConnectionSearch.clientY, window.innerHeight - 300),
              left: Math.min(floatingConnectionSearch.clientX, window.innerWidth - 260),
            }}
            className="fixed z-50 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-2 w-60 animate-fade-in flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-900 pb-2 px-1 pt-1">
              <Search size={14} className="text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                autoFocus
                placeholder="Connect to new..."
                value={connectionSearchQuery}
                onChange={(e) => {
                  setConnectionSearchQuery(e.target.value);
                  setConnectionSearchActiveIndex(0);
                }}
                onKeyDown={(e) => {
                  const connectionResourceOptions = [
                    { value: "s3", label: "S3 Bucket", icon: Database, nodeType: "s3Node", labelType: null },
                    { value: "ec2", label: "EC2 Instance", icon: Server, nodeType: "ec2Node", labelType: null },
                    { value: "user", label: "IAM User", icon: User, nodeType: "iamNode", labelType: "User" },
                    { value: "group", label: "IAM Group", icon: Users, nodeType: "iamGroupNode", labelType: "Group" },
                    { value: "role", label: "IAM Role", icon: Shield, nodeType: "iamNode", labelType: "Role" },
                    { value: "policy", label: "IAM Policy", icon: Key, nodeType: "iamNode", labelType: "Policy" },
                    { value: "rect", label: "Rectangle Group", icon: Square, nodeType: "shapeNode", labelType: "Rectangle" },
                    { value: "circle", label: "Circle Group", icon: CircleIcon, nodeType: "shapeNode", labelType: "Circle" },
                    { value: "text", label: "Text Label", icon: Type, nodeType: "shapeNode", labelType: "Text" },
                  ];
                  const filtered = connectionResourceOptions.filter((opt) =>
                    opt.label.toLowerCase().includes(connectionSearchQuery.toLowerCase())
                  );

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setConnectionSearchActiveIndex((prev) =>
                      prev >= filtered.length - 1 ? 0 : prev + 1
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setConnectionSearchActiveIndex((prev) =>
                      prev <= 0 ? filtered.length - 1 : prev - 1
                    );
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (filtered[connectionSearchActiveIndex]) {
                      const selected = filtered[connectionSearchActiveIndex];
                      handleCreateAndConnect(selected.nodeType, selected.labelType);
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setFloatingConnectionSearch(null);
                  }
                }}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none placeholder-slate-400 dark:placeholder-zinc-600"
              />
            </div>
            <div className="flex flex-col max-h-48 overflow-y-auto scroll-smooth custom-scrollbar p-0.5 gap-0.5">
              {(() => {
                const connectionResourceOptions = [
                  { value: "s3", label: "S3 Bucket", icon: Database, nodeType: "s3Node", labelType: null },
                  { value: "ec2", label: "EC2 Instance", icon: Server, nodeType: "ec2Node", labelType: null },
                  { value: "user", label: "IAM User", icon: User, nodeType: "iamNode", labelType: "User" },
                  { value: "group", label: "IAM Group", icon: Users, nodeType: "iamGroupNode", labelType: "Group" },
                  { value: "role", label: "IAM Role", icon: Shield, nodeType: "iamNode", labelType: "Role" },
                  { value: "policy", label: "IAM Policy", icon: Key, nodeType: "iamNode", labelType: "Policy" },
                  { value: "rect", label: "Rectangle Group", icon: Square, nodeType: "shapeNode", labelType: "Rectangle" },
                  { value: "circle", label: "Circle Group", icon: CircleIcon, nodeType: "shapeNode", labelType: "Circle" },
                  { value: "text", label: "Text Label", icon: Type, nodeType: "shapeNode", labelType: "Text" },
                ];
                const filtered = connectionResourceOptions.filter((opt) =>
                  opt.label.toLowerCase().includes(connectionSearchQuery.toLowerCase())
                );
                return (
                  <>
                    {filtered.map((opt, idx) => {
                      const isActive = idx === connectionSearchActiveIndex;
                      return (
                        <button
                          key={opt.value}
                          id={`conn-opt-${idx}`}
                          onClick={() => handleCreateAndConnect(opt.nodeType, opt.labelType)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 w-full text-left text-xs font-bold rounded-lg transition-colors group ${
                            isActive
                              ? "bg-slate-100 dark:bg-zinc-900 text-amber-500 dark:text-amber-400"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className={`p-1 rounded transition-colors ${
                            isActive
                              ? "bg-amber-100 dark:bg-amber-500/10 text-amber-500"
                              : "bg-slate-100 dark:bg-zinc-850 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/10 text-slate-500 dark:text-zinc-400 group-hover:text-amber-500"
                          }`}>
                            <opt.icon size={12} />
                          </div>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                    {filtered.length === 0 && (
                      <div className="text-[10px] text-center text-slate-400 dark:text-zinc-600 py-3 font-semibold">
                        No resources found
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* COMPILER MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl h-[550px] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  {modalView === "code" ? (
                    <>
                      <Code size={18} className="text-amber-500" />
                      <h3 className="font-bold text-sm">
                        Compiled Infrastructure Architecture
                      </h3>
                    </>
                  ) : (
                    <>
                      {terminalMode === "deploy" ? (
                        <Terminal size={18} className="text-emerald-500 animate-pulse" />
                      ) : (
                        <Trash2 size={18} className="text-rose-500 animate-pulse" />
                      )}
                      <h3 className="font-bold text-sm font-mono">
                        {terminalMode === "deploy" ? "Terraform Deployment Console" : "Terraform Destruction Console"}
                      </h3>
                    </>
                  )}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>
              {modalView === "code" ? (
                <div className="flex-1 bg-slate-50 dark:bg-[#09090b] p-6 overflow-auto font-mono text-xs text-slate-800 dark:text-zinc-300 leading-relaxed relative">
                  <div className="relative group max-w-full">
                    <pre className="p-5 pr-12 bg-white dark:bg-transparent rounded-xl shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent overflow-x-auto selection:bg-amber-500/20">
                      <code>{generatedCode}</code>
                    </pre>
                    <button
                      onClick={copyCodeToClipboard}
                      className="absolute top-3 right-3 p-2.5 rounded-xl bg-white/95 hover:bg-slate-50 dark:bg-zinc-900/95 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all shadow-sm hover:shadow active:scale-95 z-10"
                      title={isCopied ? "Copied" : "Copy Code"}
                    >
                      {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-[#09090b] p-6 overflow-auto font-mono text-xs text-zinc-300 leading-relaxed flex flex-col justify-between">
                  <div className="flex-1 overflow-y-auto max-h-[380px] bg-black/40 border border-zinc-800 rounded-xl p-4 custom-scrollbar">
                    <pre className="whitespace-pre-wrap select-text font-mono text-[11px] text-zinc-300">
                      {terminalLogs.join("")}
                      {isDeploying && terminalLogs.length === 0 && (
                        <span className="text-zinc-500 animate-pulse">
                          {terminalMode === "deploy"
                            ? "Initializing Terraform execution environment..."
                            : "Initializing Terraform destruction environment..."}
                        </span>
                      )}
                    </pre>
                    <div ref={terminalEndRef} />
                  </div>
                  {awaitingInput && (
                    <form onSubmit={sendTerminalInput} className="flex items-center gap-3 mt-4 border-t border-zinc-800/80 pt-4 font-mono text-xs text-amber-500">
                      <span className="shrink-0 animate-pulse font-bold">$ Enter value:</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-100 flex-1 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="type 'yes' and press Enter..."
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-5 h-9 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold transition-all shadow-md active:scale-95 shrink-0"
                      >
                        Submit
                      </button>
                    </form>
                  )}
                </div>
              )}
              {modalView === "code" ? (
                <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-[11px] font-bold font-mono">
                    <CheckCircle2 size={14} /> Schema mapped securely.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeploy}
                      className="flex items-center gap-1.5 px-4 h-10 text-xs font-bold rounded-xl transition-all border shadow-sm bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-800"
                    >
                      <CloudLightning size={14} className="text-amber-500 animate-pulse" /> Deploy
                    </button>
                    <button
                      onClick={downloadFile}
                      className="flex items-center gap-1.5 px-5 h-10 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md"
                    >
                      <Download size={14} /> Download File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono">
                    {isDeploying ? (
                      <span className="flex items-center gap-2 text-amber-500 font-bold">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        {terminalMode === "deploy" ? "Running Terraform commands..." : "Tearing down infrastructure..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-emerald-500 font-bold">
                        <CheckCircle2 size={14} />
                        Process exited.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModalView("code")}
                      disabled={isDeploying}
                      className="flex items-center gap-1.5 px-4 h-10 text-xs font-bold rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowLeft size={14} /> Back to Code
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="flex items-center gap-1.5 px-5 h-10 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 shadow-md"
                    >
                      Close Console
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEPLOYMENTS HISTORY MODAL */}
        {isDeploymentsModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-6xl h-[650px] flex overflow-hidden shadow-2xl animate-scale-up">
              
              {/* Left Panel: List of Deployments */}
              <div className="w-80 shrink-0 border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-slate-50 dark:bg-zinc-900/30">
                <div className="h-16 shrink-0 px-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <History size={16} className="text-amber-500" /> Deployments History
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
                  {deployments.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 dark:text-zinc-500 mt-8 font-medium">
                      No deployments recorded yet.
                    </div>
                  ) : (
                    deployments.map((dep, idx) => {
                      const isLatest = dep.id === latestDeploymentId;
                      const isSelected = selectedDeployment?.id === dep.id;
                      const formattedDate = new Date(dep.timestamp).toLocaleString();
                      
                      return (
                        <button
                          key={dep.id}
                          onClick={() => setSelectedDeployment(dep)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 group select-none ${
                            isSelected
                              ? "bg-amber-100/50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30"
                              : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-750"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className={`text-[11px] font-bold font-mono tracking-wide ${
                              isSelected ? "text-amber-700 dark:text-amber-500" : "text-slate-600 dark:text-zinc-400"
                            }`}>
                              Deploy #{deployments.length - idx}
                            </span>
                            {isLatest && hasDeployment && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                Active Live
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                            <Clock size={11} /> {formattedDate}
                          </div>

                          {isLatest && hasDeployment && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDeploymentsModalOpen(false);
                                handleDestroy();
                              }}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 text-[11px] font-bold rounded-lg transition-all border border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:hover:bg-rose-950/30 dark:text-rose-400"
                            >
                              <Trash2 size={12} /> Destroy Infrastructure
                            </button>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-center">
                  <button
                    onClick={handleClearHistory}
                    disabled={deployments.length === 0}
                    className="w-full h-9 text-xs font-bold rounded-xl border border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> Clear History
                  </button>
                </div>
              </div>

              {/* Right Panel: Deployment Details / Code View */}
              <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-zinc-950">
                <div className="h-16 shrink-0 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
                  <div>
                    {selectedDeployment ? (
                      <>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                          Deployment Configuration
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                          ID: {selectedDeployment.id}
                        </p>
                      </>
                    ) : (
                      <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                        Deployment Details
                      </h4>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedDeployment && (
                      <button
                        onClick={() => handleRedeploy(selectedDeployment.id)}
                        className="flex items-center gap-1.5 px-4 h-9 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md transition-all active:scale-95"
                      >
                        <CloudLightning size={13} className="animate-pulse" /> Deploy This Version
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsDeploymentsModalOpen(false);
                        setSelectedDeployment(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Close History"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {selectedDeployment ? (
                  <div className="flex-1 p-6 overflow-auto bg-slate-50 dark:bg-[#09090b] font-mono text-xs text-slate-800 dark:text-zinc-300 leading-relaxed relative">
                    <div className="relative group max-w-full">
                      <pre className="p-5 pr-12 bg-white dark:bg-transparent rounded-xl shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent overflow-x-auto selection:bg-amber-500/20">
                        <code>{JSON.stringify(selectedDeployment.code, null, 2)}</code>
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedDeployment.code, null, 2));
                          addLog("📋 Configuration copied.", "success");
                        }}
                        className="absolute top-3 right-3 p-2.5 rounded-xl bg-white/95 hover:bg-slate-50 dark:bg-zinc-900/95 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all shadow-sm hover:shadow active:scale-95 z-10"
                        title="Copy Configuration"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 gap-3">
                    <History size={48} className="stroke-[1.5]" />
                    <p className="text-sm font-medium">Select a deployment from the history panel to view details</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Floating Cost Heatmap Legend & Summary */}
        {activeMode === "budgets" && isBudgetLegendCollapsed && (
          <button
            onClick={() => setUserCollapsedLegend(false)}
            className="absolute bottom-6 z-30 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 h-10 px-3 rounded-xl shadow-xl dark:shadow-2xl flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all duration-300 pointer-events-auto select-none"
            style={{ right: selectedNode ? '360px' : '24px' }}
            title="Expand Budget Summary"
          >
            <Coins size={16} className="text-emerald-500" />
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-500">
              ${nodes.reduce((acc, node) => acc + (node.data?.cost || 0), 0).toFixed(2)}/mo
            </span>
          </button>
        )}

        {activeMode === "budgets" && !isBudgetLegendCollapsed && (
          <div
            className="absolute bottom-6 z-30 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xl dark:shadow-2xl flex flex-col gap-3 pointer-events-auto min-w-[240px] transition-all duration-300 animate-fade-in"
            style={{ right: selectedNode ? '360px' : '24px' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Monthly Cost</h3>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-500 mt-1 font-mono">
                  ${nodes.reduce((acc, node) => acc + (node.data?.cost || 0), 0).toFixed(2)}/mo
                </p>
              </div>
              <button
                onClick={() => setUserCollapsedLegend(true)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                title="Minimize"
              >
                <X size={14} />
              </button>
            </div>
            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-2 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Heatmap Legend</span>
              <div className="flex flex-col gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-slate-400/50 border border-slate-400/20 shadow-sm"></span>
                  <span>Free Resources ($0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                  <span>Low Cost (&lt; $5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-yellow-500 shadow-sm shadow-yellow-500/50"></span>
                  <span>Medium-Low (&lt; $20)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                  <span>Medium-High (&lt; $100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse"></span>
                  <span>High Cost ($100+)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Audit Summary Collapsed Badge */}
        {activeMode === "audit" && isAuditLegendCollapsed && (
          <button
            onClick={() => setIsAuditLegendCollapsed(false)}
            className="absolute bottom-6 z-30 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 h-10 px-3 rounded-xl shadow-xl dark:shadow-2xl flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all duration-300 pointer-events-auto select-none font-bold text-xs"
            style={{ right: selectedNode ? '360px' : '24px' }}
            title="Expand Audit Summary"
          >
            {(() => {
              const score = Math.max(0, 100 - allFindings.reduce((acc, f) => {
                const weights = { critical: 25, high: 15, medium: 8, info: 2 };
                return acc + (weights[f.severity] || 0);
              }, 0));
              const strokeColor = score > 80 ? "rgb(16, 185, 129)" : score > 50 ? "rgb(245, 158, 11)" : "rgb(244, 63, 94)";
              
              return (
                <>
                  <Shield size={16} style={{ color: strokeColor }} />
                  <span style={{ color: strokeColor }} className="font-mono">
                    {score}% Compliant
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                    ({allFindings.length} {allFindings.length === 1 ? "Issue" : "Issues"})
                  </span>
                </>
              );
            })()}
          </button>
        )}

        {/* Floating Cloud Audit findings summary panel */}
        {activeMode === "audit" && !isAuditLegendCollapsed && (
          <div
            className="absolute bottom-6 z-30 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xl dark:shadow-2xl flex flex-col gap-3 pointer-events-auto min-w-[320px] max-w-[360px] max-h-[420px] overflow-hidden transition-all duration-300 animate-fade-in"
            style={{ right: selectedNode ? '360px' : '24px' }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Cloud Audit Findings</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  allFindings.length === 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500 animate-pulse"
                }`}>
                  {allFindings.length} {allFindings.length === 1 ? "Issue" : "Issues"}
                </span>
                <button
                  onClick={() => setIsAuditLegendCollapsed(true)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Compliance Score Circular Indicator */}
            {(() => {
              const score = Math.max(0, 100 - allFindings.reduce((acc, f) => {
                const weights = { critical: 25, high: 15, medium: 8, info: 2 };
                return acc + (weights[f.severity] || 0);
              }, 0));
              const scoreColor = score > 80 ? "text-emerald-500" : score > 50 ? "text-amber-500" : "text-rose-500";
              const scoreBg = score > 80 ? "bg-emerald-500/10" : score > 50 ? "bg-amber-500/10" : "bg-rose-500/10";
              return (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Security Posture Score</span>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${scoreBg} ${scoreColor} font-mono font-black text-xs`}>
                    <span>{score}%</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest">{score > 80 ? "Pass" : score > 50 ? "Warn" : "Fail"}</span>
                  </div>
                </div>
              );
            })()}

            {/* Scrollable Findings list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
              {allFindings.map((f, idx) => {
                const badgeStyle = f.severity === "critical" 
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" 
                  : f.severity === "high" 
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  : f.severity === "medium"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
                  : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
                return (
                  <div key={idx} className="flex flex-col gap-1 p-2 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/50 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
                        {f.severity}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 truncate max-w-[150px]">
                        {f.nodeLabel}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 leading-tight">
                      {f.message}
                    </p>
                    {f.fixable && (
                      <button
                        onClick={() => handleRemediate(f.nodeId, f.ruleId)}
                        className="mt-1 self-end text-[9px] font-extrabold text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Quick Fix
                      </button>
                    )}
                  </div>
                );
              })}
              {allFindings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-zinc-600 gap-1">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-emerald-500">100% Compliant</span>
                  <span className="text-[9px] text-center max-w-[200px]">No security or policy violations detected on the canvas.</span>
                </div>
              )}
            </div>

            {/* Remediate All button */}
            {allFindings.some((f) => f.fixable) && (
              <button
                onClick={() => {
                  allFindings.forEach((f) => {
                    if (f.fixable) {
                      handleRemediate(f.nodeId, f.ruleId);
                    }
                  });
                }}
                className="w-full h-8 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Remediate All Fixable Issues</span>
              </button>
            )}
          </div>
        )}
      </div>
    </ModeContext.Provider>
  );
}

// ==========================================
// 3.5 PROJECTS DASHBOARD (FULLSCREEN)
// ==========================================
const ProjectsDashboard = ({
  projects,
  projectsDir,
  activeProjectId,
  onClose,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onUpdateProjectsDir,
  onCreateProject,
  onImportProject,
  userSettings
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [dirInput, setDirInput] = useState(projectsDir);
  const [newProjName, setNewProjName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setDirInput(projectsDir);
  }, [projectsDir]);

  const handleRenameSubmit = (id) => {
    if (editName.trim()) {
      onRenameProject(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newProjName.trim()) {
      onCreateProject(newProjName.trim());
      setNewProjName("");
      setIsCreating(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') return;
        const project = JSON.parse(content);

        if (!project.name) {
          alert("Invalid project file: missing 'name' attribute.");
          return;
        }

        if (!project.id) {
          project.id = `proj_${Date.now()}`;
        }
        if (!project.nodes) {
          project.nodes = [];
        }
        if (!project.edges) {
          project.edges = [];
        }

        onImportProject(project);
      } catch (err) {
        alert("Failed to parse project file. Make sure it is valid JSON.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className={`min-h-screen w-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col p-8 transition-colors duration-300 font-sans antialiased overflow-y-auto ${userSettings.theme === "forest" ? "forest" : ""}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: "none" }}
      />
      {/* Header bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between mb-8 pb-5 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95 shadow-sm"
            title="Back to Editor"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              CloudForge Projects Manager
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 h-11 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 h-11 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FolderPlus size={16} /> New Project
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="max-w-5xl w-full mx-auto flex flex-col gap-6 flex-1">
        {/* Storage path configure card */}
        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-zinc-800/60 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
              Active Storage Directory
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              Your projects are persisted on your hard drive as `.json` files inside this directory path.
            </p>
            <div className="mt-3 flex items-center gap-3 w-full max-w-2xl">
              <input
                type="text"
                value={dirInput}
                onChange={(e) => setDirInput(e.target.value)}
                className="flex-1 h-10 px-3 bg-slate-50 dark:bg-zinc-950/60 text-xs font-mono font-medium text-slate-800 dark:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                placeholder="C:\path\to\projects"
              />
              <button
                onClick={() => onUpdateProjectsDir(dirInput)}
                className="h-10 px-4 text-xs font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-200/50 dark:border-amber-500/20 shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Change Path
              </button>
            </div>
          </div>
        </div>

        {/* Modal-like card for new project creation inline */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white/95 dark:bg-zinc-900/90 border border-amber-200 dark:border-amber-500/30 p-5 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-fade-in"
          >
            <div className="flex-1 flex items-center gap-3">
              <FolderPlus className="text-amber-500 shrink-0" size={20} />
              <input
                type="text"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="Enter project name..."
                autoFocus
                className="flex-1 h-10 px-3 bg-slate-50 dark:bg-zinc-950 text-sm font-bold text-slate-800 dark:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 h-10 rounded-lg bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-bold cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewProjName("");
                }}
                className="px-4 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Projects list */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-1">
            Projects List ({projects.length})
          </h3>

          {projects.length === 0 ? (
            <div className="bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/50 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
              <FolderOpen size={48} className="text-slate-300 dark:text-zinc-700 mb-3" />
              <h4 className="text-slate-700 dark:text-zinc-300 font-bold text-sm">No Projects Found</h4>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm">
                No project `.json` configuration files are present in the active storage directory. Create a new one above to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border p-4 rounded-xl flex items-center justify-between gap-4 transition-all ${activeProjectId === proj.id
                      ? "border-slate-200 dark:border-zinc-800/80 bg-amber-50/5 dark:bg-amber-500/5 shadow-md shadow-amber-500/5 pl-3"
                      : "border-slate-200 dark:border-zinc-800/80 hover:border-amber-500/40"
                    }`}
                  style={activeProjectId === proj.id ? { borderLeft: '4px solid #f59e0b' } : {}}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl ${activeProjectId === proj.id
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                      }`}>
                      <Layers size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === proj.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleRenameSubmit(proj.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameSubmit(proj.id);
                              else if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="h-8 px-2 bg-slate-50 dark:bg-zinc-950 font-bold text-sm text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 max-w-[280px]"
                          />
                          <button
                            onMouseDown={() => handleRenameSubmit(proj.id)}
                            className="p-1 text-emerald-600 dark:text-emerald-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onMouseDown={() => setEditingId(null)}
                            className="p-1 text-rose-600 dark:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => onOpenProject(proj.id)}
                            className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate hover:text-amber-500 cursor-pointer select-none"
                          >
                            {proj.name}
                          </h4>
                          {/* Active highlight on left edge is sufficient */}
                          <button
                            onClick={() => {
                              setEditingId(proj.id);
                              setEditName(proj.name);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                            title="Rename Project"
                          >
                            <Edit size={12} />
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-1">
                        Last saved: {new Date(proj.updatedAt).toLocaleString()} • {proj.nodes?.length || 0} nodes
                      </p>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenProject(proj.id)}
                      className="px-4 h-9 text-xs font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-200/50 dark:border-amber-500/20 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      Open
                    </button>

                    {confirmDeleteId === proj.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 p-0.5 rounded-lg">
                        <button
                          onClick={() => {
                            onDeleteProject(proj.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 h-7 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(proj.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// ==========================================
// 4. ROOT COMPONENT: State & Storage Manager
// ==========================================
export default function App() {
  const [appState, setAppState] = useState("welcome");
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectsDir, setProjectsDir] = useState("");

  const [userSettings, setUserSettings] = useState({
    theme: "dark",
    autoSave: true,
    defaultRegion: "us-east-1",
  });

  useEffect(() => {
    document.documentElement.classList.remove("dark", "forest");
    if (userSettings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (userSettings.theme === "forest") {
      document.documentElement.classList.add("forest");
    }
  }, [userSettings.theme]);

  const fetchProjectsAndSettings = useCallback(async () => {
    try {
      const settingsRes = await fetch("http://localhost:3001/api/settings");
      const settingsData = await settingsRes.json();
      setProjectsDir(settingsData.projectsDir);

      const projectsRes = await fetch("http://localhost:3001/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);
    } catch (err) {
      console.error("Error loading settings/projects from backend:", err);
    }
  }, []);

  useEffect(() => {
    fetchProjectsAndSettings();
  }, [fetchProjectsAndSettings]);

  useEffect(() => {
    const savedSettings = localStorage.getItem("cloudforge_settings");
    if (savedSettings) setUserSettings(JSON.parse(savedSettings));
  }, []);

  const updateSettings = (key, value) => {
    const newSettings = { ...userSettings, [key]: value };
    setUserSettings(newSettings);
    localStorage.setItem("cloudforge_settings", JSON.stringify(newSettings));
  };

  const handleCreateProject = async (name) => {
    const newProject = {
      id: `proj_${Date.now()}`,
      name,
      edges: [],
      updatedAt: Date.now(),
      nodes: [
        {
          id: "s3_bucket_primary",
          type: "s3Node",
          data: {
            label: "production-assets-bucket",
            region: userSettings.defaultRegion,
            isPublic: false,
            versioning: true,
            storageGB: 10,
            cost: 0.23,
          },
          position: { x: 250, y: 150 },
          zIndex: 0,
        },
      ],
    };
    try {
      const res = await fetch("http://localhost:3001/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        await fetchProjectsAndSettings();
        setActiveProjectId(newProject.id);
        setAppState("editor");
      }
    } catch (err) {
      console.error("Error creating project on filesystem:", err);
    }
  };

  const handleSaveProject = async (id, nodes, edges) => {
    if (!userSettings.autoSave) return;
    const existingProj = projects.find((p) => p.id === id);
    if (!existingProj) return;

    const updatedProj = { ...existingProj, nodes, edges, updatedAt: Date.now() };
    setProjects((prev) => prev.map((p) => p.id === id ? updatedProj : p));

    try {
      await fetch("http://localhost:3001/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProj),
      });
    } catch (err) {
      console.error("Error saving project to filesystem:", err);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProjectsAndSettings();
        if (activeProjectId === id) {
          const remaining = projects.filter((p) => p.id !== id);
          if (remaining.length > 0) {
            setActiveProjectId(remaining[0].id);
          } else {
            setActiveProjectId(null);
            setAppState("welcome");
          }
        }
      }
    } catch (err) {
      console.error("Error deleting project on filesystem:", err);
    }
  };

  const handleUpdateProjectName = async (id, newName) => {
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        await fetchProjectsAndSettings();
      }
    } catch (err) {
      console.error("Error renaming project on filesystem:", err);
    }
  };

  const handleUpdateProjectsDir = async (pathStr) => {
    try {
      const res = await fetch("http://localhost:3001/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectsDir: pathStr }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjectsDir(data.projectsDir);
        const projectsRes = await fetch("http://localhost:3001/api/projects");
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
        if (projectsData.length > 0) {
          setActiveProjectId(projectsData[0].id);
        } else {
          setActiveProjectId(null);
        }
      }
    } catch (err) {
      console.error("Error updating settings directory path:", err);
    }
  };

  const handleImportProject = async (projectObj) => {
    try {
      const res = await fetch("http://localhost:3001/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectObj),
      });
      if (res.ok) {
        await fetchProjectsAndSettings();
        setActiveProjectId(projectObj.id);
        setAppState("editor");
      }
    } catch (err) {
      console.error("Error importing project:", err);
    }
  };

  if (appState === "welcome") {
    return (
      <WelcomeScreen
        projects={projects}
        onCreateProject={handleCreateProject}
        onLoadProject={(id) => {
          setActiveProjectId(id);
          setAppState("editor");
        }}
      />
    );
  }

  if (appState === "projects-dashboard") {
    return (
      <ProjectsDashboard
        projects={projects}
        projectsDir={projectsDir}
        activeProjectId={activeProjectId}
        onClose={() => {
          if (activeProjectId) {
            setAppState("editor");
          } else if (projects.length > 0) {
            setActiveProjectId(projects[0].id);
            setAppState("editor");
          } else {
            setAppState("welcome");
          }
        }}
        onOpenProject={(id) => {
          setActiveProjectId(id);
          setAppState("editor");
        }}
        onRenameProject={handleUpdateProjectName}
        onDeleteProject={handleDeleteProject}
        onUpdateProjectsDir={handleUpdateProjectsDir}
        onCreateProject={handleCreateProject}
        onImportProject={handleImportProject}
        userSettings={userSettings}
      />
    );
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (!activeProject) {
    if (projects.length > 0) {
      setActiveProjectId(projects[0].id);
      return <div className="h-screen w-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-500 font-medium">Loading project...</div>;
    } else {
      setAppState("welcome");
      return null;
    }
  }

  return (
    <div
      className={`transition-colors duration-300 ${userSettings.theme === "dark" ? "dark" : userSettings.theme === "forest" ? "forest" : ""}`}
    >
      <ReactFlowProvider>
        <CloudForgeEditor
          key={activeProject.id}
          activeProject={activeProject}
          projects={projects}
          onLoadProject={(id) => setActiveProjectId(id)}
          onSave={handleSaveProject}
          onNewProjectFlow={() => setAppState("welcome")}
          userSettings={userSettings}
          updateSettings={updateSettings}
          onOpenProjectsDashboard={() => setAppState("projects-dashboard")}
        />
      </ReactFlowProvider>
    </div>
  );
}
