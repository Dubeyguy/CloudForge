import React, { useState, useEffect, useCallback } from "react";
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

// ==========================================
// 1. CUSTOM NODES
// ==========================================
const ModeContext = React.createContext("dev");

const S3Node = ({ data }) => {
  const activeMode = React.useContext(ModeContext);
  const isBudgetMode = activeMode === "budgets";
  const cost = data?.cost || 0;

  // Heatmap color logic
  let glowClass = "hover:border-amber-400 dark:hover:border-amber-500/50";
  let borderClass = "border-slate-200 dark:border-zinc-800";
  let badgeClass = "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-zinc-700/50";

  if (isBudgetMode) {
    if (cost === 0) {
      glowClass = "shadow-[0_0_15px_rgba(148,163,184,0.15)] border-slate-300 dark:border-zinc-700";
      borderClass = "border-slate-300 dark:border-zinc-700";
      badgeClass = "bg-slate-500/10 text-slate-500 border border-slate-500/20";
    } else if (cost < 5) {
      glowClass = "shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-400 dark:border-emerald-500/50";
      borderClass = "border-emerald-400 dark:border-emerald-500/50";
      badgeClass = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20";
    } else if (cost < 20) {
      glowClass = "shadow-[0_0_15px_rgba(234,179,8,0.3)] border-yellow-400 dark:border-yellow-500/50";
      borderClass = "border-yellow-400 dark:border-yellow-500/50";
      badgeClass = "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-100 dark:border-yellow-500/20";
    } else if (cost < 100) {
      glowClass = "shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-400 dark:border-orange-500/50";
      borderClass = "border-orange-400 dark:border-orange-500/50";
      badgeClass = "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-100 dark:border-orange-500/20";
    } else {
      glowClass = "shadow-[0_0_20px_rgba(239,68,68,0.5)] border-rose-500 animate-pulse";
      borderClass = "border-rose-500";
      badgeClass = "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20";
    }
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl p-3 shadow-lg dark:shadow-xl w-[220px] transition-all cursor-grab active:cursor-grabbing group relative ${borderClass} ${glowClass}`}>
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-amber-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-amber-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-amber-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-amber-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />

      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20 shadow-inner shrink-0">
            <HardDrive size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-slate-800 dark:text-zinc-100 font-bold text-sm leading-tight tracking-wide truncate">
              {data?.label || "S3 Bucket"}
            </h4>
            <p className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-semibold truncate">
              Amazon S3
            </p>
          </div>
        </div>
        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shadow-sm transition-colors ${isBudgetMode ? badgeClass : (
          data?.isPublic
            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
            : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
        )
          }`}>
          {isBudgetMode ? `$${cost.toFixed(2)}/mo` : (data?.isPublic ? "Public" : "Private")}
        </span>
      </div>
    </div>
  );
};

const IAMNode = ({ data }) => {
  const activeMode = React.useContext(ModeContext);
  const isBudgetMode = activeMode === "budgets";

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

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl p-3 shadow-lg dark:shadow-xl w-[220px] transition-all hover:border-violet-400 dark:hover:border-violet-500/50 cursor-grab active:cursor-grabbing group relative ${isBudgetMode ? "border-slate-300 dark:border-zinc-700/50" : "border-slate-200 dark:border-zinc-800"}`}>
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
      />

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
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-3 h-3 border-2 !border-white dark:!border-zinc-900"
        />
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
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />

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

const IAMGroupNode = ({ data, selected }) => {
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
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !bg-violet-500 w-4 h-4 border-2 !border-white dark:!border-zinc-900"
        />

        <div className="absolute top-4 left-4 right-4 flex items-center gap-2 pointer-events-none select-none z-10 min-w-0">
          <div className="p-1.5 bg-violet-100 dark:bg-violet-500/20 rounded-md text-violet-600 dark:text-violet-500 shrink-0">
            <Users size={14} />
          </div>
          <span className="text-violet-700 dark:text-violet-300 font-bold text-xs uppercase tracking-widest truncate">
            {data?.label || "IAM Group"}
          </span>
        </div>
      </div>
    </>
  );
};

const nodeTypes = { s3Node: S3Node, shapeNode: ShapeNode, iamNode: IAMNode, iamGroupNode: IAMGroupNode };

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
    zIndex: 0,
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

  const [nodes, setNodes, onNodesChange] = useNodesState(
    activeProject?.nodes || [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    activeProject?.edges || [],
  );
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [activeMode, setActiveMode] = useState("dev");
  const [userCollapsedLegend, setUserCollapsedLegend] = useState(false);

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState({
    aws: true,
    iam: true,
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

  useEffect(() => {
    if (activeMode === "budgets") {
      setUserCollapsedLegend(false);
      const timer = setTimeout(() => {
        setUserCollapsedLegend(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeMode]);

  // CONNECT HANDLER
  const onConnect = useCallback(
    (params) => {
      takeSnapshot();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, takeSnapshot],
  );

  // RECONNECT HANDLER: Allows user to drag existing edges to new handles
  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      takeSnapshot();
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      addLog(`🔌 Edge re-routed successfully.`, "info");
    },
    [setEdges, takeSnapshot, addLog],
  );

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
                  return {
                    ...n,
                    style: {
                      ...n.style,
                      height: Math.max(n.style?.height || 200, minHeight),
                      width: Math.max(n.style?.width || 250, minWidth),
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
  }, []);

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setIsProjectDropdownOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
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
      setNodes((nds) => nds.filter((n) => n.id !== contextMenu.id));
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
          if (field === "storageGB")
            updatedData.cost = parseFloat((value * 0.023).toFixed(2));
          return { ...node, data: updatedData };
        }
        return node;
      }),
    );
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const addNewS3Node = () => {
    takeSnapshot();
    const newNode = {
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
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      zIndex: 0,
    };
    setNodes((nds) => nds.concat(newNode));
    addLog(`➕ Added S3 Bucket.`, "info");
  };

  const addNewIAMNode = (type) => {
    takeSnapshot();
    const nodeData = {
      label: `new-${type.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
      iamType: type,
      region: "global",
    };

    if (type === "Role") {
      nodeData.roleService = "ec2.amazonaws.com";
    } else if (type === "Policy") {
      nodeData.policyActions = "s3:*";
      nodeData.policyResource = "*";
    }

    const newNode = {
      id: `iam_${type.toLowerCase()}_${Date.now()}`,
      type: type === "Group" ? "iamGroupNode" : "iamNode",
      data: nodeData,
      position: { x: 120 + Math.random() * 200, y: 120 + Math.random() * 200 },
      zIndex: type === "Group" ? -1 : 0,
      ...(type === "Group" && { style: { width: 300, height: 200 } }),
    };
    setNodes((nds) => nds.concat(newNode));
    addLog(`➕ Added IAM ${type}.`, "info");
  };

  const addNewShape = (type) => {
    takeSnapshot();
    const isContainer = type === "Rectangle" || type === "Circle";
    const newNode = {
      id: `shape_${Date.now()}`,
      type: "shapeNode",
      data: {
        label: isContainer ? `${type} Group` : `${type} Note`,
        shapeType: type,
      },
      position: { x: 150 + Math.random() * 150, y: 150 + Math.random() * 150 },
      zIndex: isContainer ? -1 : 0,
      style: isContainer ? { width: 350, height: 350 } : {},
    };
    setNodes((nds) => nds.concat(newNode));
    addLog(`➕ Added Shape: ${type}`, "info");
  };

  const clearCanvas = () => {
    takeSnapshot();
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    addLog("🗑️ Visual canvas flushed.", "warn");
  };

  const compileTerraform = async () => {
    const awsNodes = nodes.filter((n) => n.type === "s3Node" || n.type === "iamNode" || n.type === "iamGroupNode");
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
        <main className="absolute inset-0 z-0">
          <ReactFlow
            nodes={nodes}
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
                onClick={() => setActiveMode("security")}
                className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all h-8 ${activeMode === "security"
                  ? "bg-slate-100 dark:bg-zinc-800 text-violet-600 dark:text-violet-500 border border-slate-200/50 dark:border-zinc-700/50 shadow-sm px-3"
                  : "text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 w-8"
                  }`}
                title="Security Mode"
              >
                <Shield size={14} />
                {activeMode === "security" && <span>Security</span>}
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
                      setSearchActiveIndex((prev) => (prev + 1) % searchResults.length);
                    }
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      setSearchActiveIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
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
                <div className="absolute top-full mt-2 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl rounded-xl py-2 animate-fade-in z-50 max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((res, index) => (
                      <button
                        key={res.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleFocusNode(res.id);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          index === searchActiveIndex
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {res.type === "s3Node" ? (
                          <Database
                            size={16}
                            className="text-amber-500 shrink-0"
                          />
                        ) : (
                          <Square size={16} className="text-blue-500 shrink-0" />
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate leading-tight">
                            {res.data?.label || res.id}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono uppercase mt-0.5 tracking-wider">
                            {res.type === "s3Node" ? "AWS S3" : "Shape / Group"}
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
                  AWS Resources
                </span>
              </button>
              <div
                className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out origin-top ${expandedCategories.aws ? "max-h-96 opacity-100 scale-y-100 mt-1" : "max-h-0 opacity-0 scale-y-0"}`}
              >
                <div className="pl-6 pr-2 pb-1">
                  <button
                    onClick={addNewS3Node}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none"
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
            <div className="p-5 flex flex-col flex-1 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <Settings2
                  size={16}
                  className={
                    selectedNode.type === "s3Node"
                      ? "text-amber-500"
                      : selectedNode.type === "iamNode"
                        ? "text-violet-500"
                        : "text-blue-500"
                  }
                />
                <h2 className="font-bold text-xs text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  {selectedNode.type === "s3Node"
                    ? "S3 Bucket Settings"
                    : selectedNode.type === "iamNode"
                      ? "User Settings"
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
                </>
              )}

              {selectedNode.type === "s3Node" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Storage Capacity ({selectedNode.data?.storageGB || 10} GB)
                    </label>
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
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      Target Region
                    </label>
                    <CustomSelect
                      value={selectedNode.data?.region || "us-east-1"}
                      onChange={(val) => updateNodeData("region", val)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                      options={[
                        { value: "us-east-1", label: "US East (N. Virginia)" },
                        { value: "us-west-2", label: "US West (Oregon)" },
                        { value: "eu-west-1", label: "Europe (Ireland)" },
                        { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
                      ]}
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
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl">
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
                    <CustomSelect
                      value={userSettings.defaultRegion}
                      onChange={(val) =>
                        updateSettings("defaultRegion", val)
                      }
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-bold text-slate-800 dark:text-zinc-100 rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                      options={[
                        { value: "us-east-1", label: "US East (N. Virginia)" },
                        { value: "us-west-2", label: "US West (Oregon)" },
                        { value: "eu-west-1", label: "Europe (Ireland)" },
                        { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
                      ]}
                    />
                  </div>
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
                className="text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
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

        {/* COMPILER MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl h-[550px] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <Code size={18} className="text-amber-500" />
                  <h3 className="font-bold text-sm">
                    Compiled Infrastructure Architecture
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-900"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-[#09090b] p-6 overflow-auto font-mono text-xs text-slate-800 dark:text-zinc-300 leading-relaxed">
                <pre className="p-5 bg-white dark:bg-transparent rounded-xl shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent overflow-x-auto selection:bg-amber-500/20">
                  <code>{generatedCode}</code>
                </pre>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-between items-center">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-[11px] font-bold font-mono">
                  <CheckCircle2 size={14} /> Schema mapped securely.
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyCodeToClipboard}
                    className={`flex items-center gap-1.5 px-4 h-10 text-xs font-bold rounded-xl transition-all border shadow-sm ${isCopied ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20" : "bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-800"}`}
                  >
                    {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {isCopied ? "Copied" : "Copy Code"}
                  </button>
                  <button
                    onClick={downloadFile}
                    className="flex items-center gap-1.5 px-5 h-10 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md"
                  >
                    <Download size={14} /> Download File
                  </button>
                </div>
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
  userSettings
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [dirInput, setDirInput] = useState(projectsDir);
  const [newProjName, setNewProjName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  return (
    <div className={`min-h-screen w-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col p-8 transition-colors duration-300 font-sans antialiased overflow-y-auto ${userSettings.theme === "forest" ? "forest" : ""}`}>
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
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium uppercase mt-0.5 tracking-wider">
              Local Filesystem Projects Directory
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-5 h-11 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <FolderPlus size={16} /> New Project
        </button>
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
                  className={`bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border p-4 rounded-xl flex items-center justify-between gap-4 hover:border-amber-500/40 transition-all ${
                    activeProjectId === proj.id
                      ? "border-amber-500 dark:border-amber-500 bg-amber-50/5 dark:bg-amber-500/5 shadow-md shadow-amber-500/5"
                      : "border-slate-200 dark:border-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl ${
                      activeProjectId === proj.id
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
                          {activeProjectId === proj.id && (
                            <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 shadow-sm shrink-0">
                              Active
                            </span>
                          )}
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
