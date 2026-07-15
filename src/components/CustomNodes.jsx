import React, { useState } from "react";
import { NodeResizer, Handle, Position, useReactFlow, useStore } from "@xyflow/react";
import {
  Database,
  Layers,
  X,
  Trash2,
  File,
  Folder,
  Cpu,
  User,
  Users,
  Shield,
  Key,
  Network,
  Globe,
} from "lucide-react";

export const ModeContext = React.createContext("dev");
export const SettingsContext = React.createContext({ theme: "dark", nodeOverlayZoomedOut: true });

export const AuditBadge = ({ data }) => {
  const activeMode = React.useContext(ModeContext);
  if (activeMode !== "audit") return null;

  const findings = data?.auditFindings || [];
  if (findings.length === 0) {
    return (
      <span className="absolute -top-2 -right-2 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full shadow-md z-[60] border border-white dark:border-zinc-900 bg-emerald-500 text-white">
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
    <span className={`absolute -top-2 -right-2 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full shadow-md z-[60] border border-white dark:border-zinc-900 ${badgeColor}`}>
      {label}
    </span>
  );
};

export const ZoomedOutOverlay = ({ type, name, colorClass = "bg-amber-500", borderClass = "border-amber-500", isCard = false, circle = false }) => {
  const isZoomedOut = false;

  if (!isZoomedOut) return null;

  const textColorClass = colorClass
    .replace("bg-amber-500", "text-amber-600 dark:text-amber-400")
    .replace("bg-sky-500", "text-sky-600 dark:text-sky-400")
    .replace("bg-violet-500", "text-violet-600 dark:text-violet-400")
    .replace("bg-blue-500", "text-blue-600 dark:text-blue-450");

  if (isCard) {
    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-white dark:bg-zinc-950 border border-dashed ${borderClass} z-50 pointer-events-none select-none text-center rounded-xl p-2.5 animate-fade-in`}
      >
        <span className={`text-[14px] font-black uppercase tracking-widest ${textColorClass} shrink-0`}>
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
      className={`absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 border-4 border-dashed ${borderClass} z-50 pointer-events-none select-none text-center p-5 transition-all duration-300 ${circle ? "rounded-full" : "rounded-3xl"
        } gap-1`}
    >
      <span className={`text-[22px] font-black uppercase tracking-widest ${textColorClass} shrink-0`}>
        {type}
      </span>
      <span className="text-slate-900 dark:text-zinc-100 font-black text-[26px] tracking-wide leading-tight line-clamp-3 max-w-full px-3 shrink-0">
        {name}
      </span>
    </div>
  );
};

export const S3Node = ({ id, data, selected }) => {
  const activeMode = React.useContext(ModeContext);
  const isBudgetMode = activeMode === "budgets";
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
                className={`p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all ${isListOpen ? "bg-amber-100 dark:bg-amber-500/30" : ""
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
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded transition-colors shrink-0"
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

export const S3ObjectNode = ({ data, id }) => {
  const parentId = useStore((s) => s.nodes.find((n) => n.id === id)?.parentId);
  const isZoomedOut = false;

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

export const IAMNode = ({ data, id }) => {
  const parentId = useStore((s) => s.nodes.find((n) => n.id === id)?.parentId);
  const isZoomedOut = false;

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

export const ShapeNode = ({ data, selected }) => {
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

export const IAMGroupNode = ({ id, data, selected }) => {
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
                className={`p-1 rounded text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all ${isListOpen ? "bg-violet-100 dark:bg-violet-500/30" : ""
                  }`}
                title="Toggle Group Members List"
              >
                <Layers size={11} />
              </button>
            )}
          </div>
        </div>

        {isListOpen && children.length > 0 && (
          <div className="absolute top-12 left-4 right-4 bottom-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 overflow-y-auto custom-scrollbar pointer-events-auto cursor-default flex flex-col gap-1.5 z-20 shadow-lg animate-fade-in nodrag">
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
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded transition-colors shrink-0"
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

export const EC2Node = ({ id, data }) => {
  const activeMode = React.useContext(ModeContext);
  const isBudgetMode = activeMode === "budgets";
  const isAuditMode = activeMode === "audit";
  const cost = data?.cost || 8.50;
  const findings = data?.auditFindings || [];
  const { setNodes } = useReactFlow();

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

  const handleSgClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, isSgPopupOpen: true } }
          : n
      )
    );
  };

  const hasCustomSg = !!data?.hasCustomSecurityGroup;
  let sgName = "default (AWS)";
  if (hasCustomSg) {
    if (Array.isArray(data?.securityGroups)) {
      if (data.securityGroups.length === 0) {
        sgName = "No SGs Attached";
      } else if (data.securityGroups.length === 1) {
        sgName = data.securityGroups[0]?.name || "custom-sg";
      } else {
        sgName = `${data.securityGroups[0]?.name || "custom-sg"} (+${data.securityGroups.length - 1} more)`;
      }
    } else if (data?.securityGroup) {
      sgName = data.securityGroup.name || "custom-sg";
    } else {
      sgName = "No SGs Attached";
    }
  }

  return (
    <div className="relative w-[360px] group">
      <div className={`bg-white dark:bg-zinc-900 border rounded-xl shadow-lg dark:shadow-xl w-full flex flex-row overflow-hidden transition-all cursor-grab active:cursor-grabbing ${borderClass} ${glowClass}`}>
        <ZoomedOutOverlay type="EC2 Instance" name={data?.label} colorClass="bg-sky-500" borderClass="border-sky-500" isCard={true} />

        {/* Left side: EC2 info */}
        <div className="flex-1 p-3 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-lg text-sky-600 dark:text-sky-500 border border-sky-100 dark:border-sky-500/20 shadow-inner shrink-0">
              <Cpu size={16} />
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

        {/* Right side: Security Group info */}
        <div 
          onClick={handleSgClick}
          className={`w-[130px] border-l border-slate-100 dark:border-zinc-800/80 p-3 flex flex-row items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors nodrag select-none shrink-0`}
        >
          <div className={`p-1.5 rounded-md shrink-0 border ${hasCustomSg ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-100 dark:border-zinc-700/50"}`}>
            <Shield size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">
              Security Group
            </span>
            <span className={`text-xs font-bold truncate ${hasCustomSg ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-400"}`}>
              {sgName}
            </span>
          </div>
        </div>
      </div>

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
      </Handle>
    </div>
  );
};

export const VPCNode = ({ id, data, selected }) => {
  return (
    <>
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={350}
        minHeight={250}
      />
      <div
        className="w-full h-full relative border-4 border-dashed border-indigo-400/60 dark:border-indigo-500/40 bg-indigo-500/5 transition-colors hover:border-indigo-500 cursor-grab active:cursor-grabbing group rounded-3xl"
      >
        <ZoomedOutOverlay type="VPC" name={data?.label} colorClass="bg-indigo-500" borderClass="border-indigo-500" />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>

        <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none select-none z-10 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 pointer-events-auto">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-md text-indigo-600 dark:text-indigo-400 shrink-0">
              <Network size={18} />
            </div>
            <span className="text-indigo-700 dark:text-indigo-300 font-extrabold text-sm uppercase tracking-widest truncate">
              {data?.label || "VPC"}
            </span>
          </div>

          {data?.cidrBlock && (
            <div className="pointer-events-auto shrink-0 bg-indigo-50/80 dark:bg-zinc-900/80 border border-indigo-200 dark:border-indigo-900/30 px-3 py-1 rounded-full text-indigo-700 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
              {data.cidrBlock}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const SubnetNode = ({ id, data, selected }) => {
  return (
    <>
      <NodeResizer
        color="#0d9488"
        isVisible={selected}
        minWidth={300}
        minHeight={180}
      />
      <div
        className="w-full h-full relative border-4 border-dashed border-teal-400/60 dark:border-teal-500/40 bg-teal-500/5 transition-colors hover:border-teal-500 cursor-grab active:cursor-grabbing group rounded-3xl"
      >
        <ZoomedOutOverlay type="Subnet" name={data?.label} colorClass="bg-teal-500" borderClass="border-teal-500" />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-12 !h-12 !bg-transparent !border-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-zinc-900 shadow-md" />
        </Handle>

        <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none select-none z-10 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 pointer-events-auto">
            <div className="p-2 bg-teal-100 dark:bg-teal-500/20 rounded-md text-teal-600 dark:text-teal-400 shrink-0">
              <Layers size={18} />
            </div>
            <span className="text-teal-700 dark:text-teal-300 font-extrabold text-sm uppercase tracking-widest truncate">
              {data?.label || "Subnet"}{data?.cidrBlock ? ` - ${data.cidrBlock}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto shrink-0">
            {data?.hasNatGateway && (
              <span className="w-8 h-8 rounded-full border border-teal-200 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-black flex items-center justify-center shadow-sm select-none" title="NAT Gateway (NG)">
                NG
              </span>
            )}
            {data?.hasRouteTable !== false && (
              <span className="w-8 h-8 rounded-full border border-teal-200 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-black flex items-center justify-center shadow-sm select-none" title="Route Table (RT)">
                RT
              </span>
            )}
            {data?.hasNetworkAcl !== false && (
              <span className="w-8 h-8 rounded-full border border-teal-200 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-black flex items-center justify-center shadow-sm select-none" title="Network ACL (ACL)">
                ACL
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const InternetGatewayNode = ({ data, id }) => {
  const parentId = useStore((s) => s.nodes.find((n) => n.id === id)?.parentId);
  const isZoomedOut = false;

  if (isZoomedOut && parentId) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-lg dark:shadow-xl w-[280px] transition-all cursor-grab active:cursor-grabbing group relative hover:border-indigo-400 dark:hover:border-indigo-500/50">
      <ZoomedOutOverlay type="Internet Gateway" name={data?.label} colorClass="bg-indigo-500" borderClass="border-indigo-500" isCard={true} />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-10 !h-10 !bg-transparent !border-0 flex items-center justify-center"
      >
        <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 shadow-md" />
      </Handle>
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-500 border border-indigo-100 dark:border-indigo-500/20 shadow-inner shrink-0">
          <Globe size={20} />
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="text-slate-800 dark:text-zinc-100 font-bold text-base leading-tight tracking-wide truncate">
            {data?.label || "Internet Gateway"}
          </h4>
          <p className="text-slate-400 dark:text-zinc-500 text-[12px] uppercase tracking-widest mt-0.5 font-bold truncate">
            AWS Gateway
          </p>
        </div>
      </div>
    </div>
  );
};

export const nodeTypes = { s3Node: S3Node, s3ObjectNode: S3ObjectNode, shapeNode: ShapeNode, iamNode: IAMNode, iamGroupNode: IAMGroupNode, ec2Node: EC2Node, vpcNode: VPCNode, subnetNode: SubnetNode, internetGatewayNode: InternetGatewayNode };

export const defaultInitialNodes = [
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
