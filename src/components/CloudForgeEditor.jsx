import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
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
  reconnectEdge,
  useStore,
  applyNodeChanges,
  MiniMap,
} from "@xyflow/react";
import {
  Play, Download, Code, Layers, Terminal, Trash2, Settings2, X, CheckCircle2, Check, Database,
  Scissors, ClipboardPaste, Copy, Menu, HardDrive, CloudLightning, ChevronRight, ChevronLeft, ChevronDown,
  Activity, FolderOpen, Plus, AlertTriangle, FolderPlus, ArrowLeft, Clock, Settings, Moon, Sun,
  Sparkles, Save, Search, Square, Circle as CircleIcon, Type, Undo, Redo, User, Users, Key,
  Shield, Coins, Maximize2, Edit, File, Folder, Upload, Server, History, Cpu, ArrowUpRight,
  ArrowUpDown, Edit3, Keyboard, BookOpen, Network, Globe, Compass, ShieldAlert, ArrowRight
} from "lucide-react";
import { CustomSelect, RegionSelect, STANDARD_REGIONS } from "./CustomSelect";
import { nodeTypes, ModeContext, SettingsContext, AuditBadge } from "./CustomNodes";
import { ALL_INSTANCE_TYPES, REGIONAL_MULTIPLIERS, OS_IMAGES, calculateEC2Cost } from "./EC2PricingDb";

const SgRulesEditorSubView = ({ sg, onBack, onSave }) => {
  const [name, setName] = useState(sg.name || "");
  const [rules, setRules] = useState(sg.rules || []);

  const addRule = (type = "ingress") => {
    const newRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      protocol: "tcp",
      fromPort: 80,
      toPort: 80,
      cidr: "0.0.0.0/0",
      description: ""
    };
    setRules([...rules, newRule]);
  };

  const deleteRule = (ruleId) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const updateRuleField = (ruleId, field, value) => {
    setRules(rules.map(r => {
      if (r.id === ruleId) {
        const updated = { ...r, [field]: value };
        if (field === "fromPort" && (r.protocol === "tcp" || r.protocol === "udp")) {
          updated.toPort = value;
        }
        return updated;
      }
      return r;
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl h-[600px] flex flex-col shadow-2xl overflow-hidden animate-scale-up nodrag text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            <button
              onClick={onBack}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-805 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-500 ml-1">
              <Shield size={18} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Edit Security Group Rules
            </h3>
          </div>
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
              Security Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="e.g. web-server-sg"
              className="w-full h-11 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-semibold text-slate-850 dark:text-zinc-150 rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
          </div>

          {/* Rules Section */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2 shrink-0">
              <span className="text-xs font-bold text-slate-850 dark:text-zinc-200 font-mono uppercase tracking-wider">
                Inbound & Outbound Rules ({rules.length})
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addRule("ingress")}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/20 rounded-lg transition-colors"
                >
                  <Plus size={12} /> Add Inbound Rule
                </button>
                <button
                  type="button"
                  onClick={() => addRule("egress")}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-slate-50 dark:bg-zinc-850 text-slate-600 dark:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-700/60 border border-slate-200 dark:border-zinc-800 rounded-lg transition-colors"
                >
                  <Plus size={12} /> Add Outbound Rule
                </button>
              </div>
            </div>

            {rules.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8 text-center bg-slate-50/30 dark:bg-zinc-950/20 my-4">
                <Shield className="text-slate-350 dark:text-zinc-700 mb-2" size={32} />
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">No active rules configured.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {rules.map((rule, idx) => (
                  <div 
                    key={rule.id}
                    className="flex flex-row items-center gap-2.5 p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-250/60 dark:border-zinc-800/80 rounded-xl hover:border-slate-350 dark:hover:border-zinc-750 transition-all text-xs"
                  >
                    <div className="font-mono text-slate-450 text-[10px] w-6 text-center shrink-0">
                      #{idx + 1}
                    </div>

                    {/* Rule Type */}
                    <div className="w-[100px] shrink-0">
                      <select
                        value={rule.type}
                        onChange={(e) => updateRuleField(rule.id, "type", e.target.value)}
                        className="w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-slate-250 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ingress">Inbound</option>
                        <option value="egress">Outbound</option>
                      </select>
                    </div>

                    {/* Protocol */}
                    <div className="w-[90px] shrink-0">
                      <select
                        value={rule.protocol}
                        onChange={(e) => updateRuleField(rule.id, "protocol", e.target.value)}
                        className="w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-slate-255 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                        <option value="icmp">ICMP</option>
                        <option value="all">All Traffic</option>
                      </select>
                    </div>

                    {/* Port Range */}
                    <div className="flex items-center gap-1.5 w-[140px] shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="65535"
                        disabled={rule.protocol === "all" || rule.protocol === "icmp"}
                        value={rule.protocol === "all" || rule.protocol === "icmp" ? "" : rule.fromPort}
                        onChange={(e) => updateRuleField(rule.id, "fromPort", parseInt(e.target.value) || 0)}
                        placeholder="Port"
                        className="w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-center focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-zinc-900 disabled:opacity-50"
                      />
                      <span className="text-slate-450 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="65535"
                        disabled={rule.protocol === "all" || rule.protocol === "icmp"}
                        value={rule.protocol === "all" || rule.protocol === "icmp" ? "" : rule.toPort}
                        onChange={(e) => updateRuleField(rule.id, "toPort", parseInt(e.target.value) || 0)}
                        placeholder="Port"
                        className="w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-center focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-zinc-900 disabled:opacity-50"
                      />
                    </div>

                    {/* Source / Destination CIDR */}
                    <div className="w-[130px] shrink-0">
                      <input
                        type="text"
                        value={rule.cidr}
                        onChange={(e) => updateRuleField(rule.id, "cidr", e.target.value)}
                        placeholder="0.0.0.0/0"
                        className="w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={rule.description}
                        onChange={(e) => updateRuleField(rule.id, "description", e.target.value)}
                        placeholder="Rule description..."
                        className="w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Actions */}
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <button
            onClick={onBack}
            className="h-10 px-4 text-xs font-bold text-slate-500 dark:text-zinc-450 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...sg, name, rules })}
            className="h-10 px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all"
          >
            Save Rules
          </button>
        </div>
      </div>
    </div>
  );
};

const SubnetNatModal = ({ node, onClose, onUpdateNodeData }) => {
  const [hasNat, setHasNat] = useState(!!node.data?.hasNatGateway);
  const [connectivity, setConnectivity] = useState(node.data?.natConfig?.connectivityType || "public");
  const [eip, setEip] = useState(node.data?.natConfig?.allocationId || "");

  const handleAllocateEip = () => {
    const randomId = `eipalloc-${Math.random().toString(16).substring(2, 18)}`;
    setEip(randomId);
  };

  const handleSave = () => {
    onUpdateNodeData("hasNatGateway", hasNat);
    onUpdateNodeData("natConfig", hasNat ? { connectivityType: connectivity, allocationId: eip } : null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-scale-up nodrag text-left font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            <div className="p-1.5 bg-teal-100 dark:bg-teal-500/20 rounded-lg text-teal-600 dark:text-teal-400">
              <Network size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide">NAT Gateway Configuration</h3>
              <p className="text-[10px] text-slate-405 dark:text-zinc-550 mt-0.5 uppercase tracking-wider">Subnet: {node.data?.label || node.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-850">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Enable NAT Gateway</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Allows private subnet resources to connect to the internet</span>
            </div>
            <input
              type="checkbox"
              checked={hasNat}
              onChange={(e) => setHasNat(e.target.checked)}
              className="accent-teal-500 h-5 w-5 rounded cursor-pointer"
            />
          </div>

          {hasNat && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Connectivity Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="connectivity"
                      value="public"
                      checked={connectivity === "public"}
                      onChange={() => setConnectivity("public")}
                      className="accent-teal-500"
                    />
                    Public (Internet-facing)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="connectivity"
                      value="private"
                      checked={connectivity === "private"}
                      onChange={() => setConnectivity("private")}
                      className="accent-teal-500"
                    />
                    Private (Internal VPC)
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Elastic IP Allocation ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eip}
                    onChange={(e) => setEip(e.target.value)}
                    placeholder="eipalloc-..."
                    className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleAllocateEip}
                    className="px-3 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 border border-teal-200 dark:border-teal-900/35 rounded-xl transition-all"
                  >
                    Allocate EIP
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <button onClick={onClose} className="h-10 px-4 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="h-10 px-5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-sm transition-all">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

const SubnetRtModal = ({ node, onClose, onUpdateNodeData }) => {
  const currentConfig = node.data?.routeTableConfig || { isCustom: false, routes: [] };
  const [isCustom, setIsCustom] = useState(currentConfig.isCustom);
  const [routes, setRoutes] = useState(
    currentConfig.routes.length > 0
      ? currentConfig.routes
      : [{ destination: "10.0.0.0/16", target: "local" }]
  );

  const handleAddRoute = () => {
    setRoutes([...routes, { destination: "0.0.0.0/0", target: "Internet Gateway" }]);
  };

  const handleRemoveRoute = (index) => {
    setRoutes(routes.filter((_, i) => i !== index));
  };

  const handleRouteChange = (index, field, value) => {
    setRoutes(
      routes.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = () => {
    onUpdateNodeData("hasRouteTable", true);
    onUpdateNodeData("routeTableConfig", {
      isCustom,
      routes: isCustom ? routes : [{ destination: "10.0.0.0/16", target: "local" }]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-scale-up nodrag text-left font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            <div className="p-1.5 bg-teal-100 dark:bg-teal-500/20 rounded-lg text-teal-600 dark:text-teal-400">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide">Route Table Configuration</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-0.5 uppercase tracking-wider">Subnet: {node.data?.label || node.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          <div className="flex flex-col gap-3 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-850">
            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={!isCustom}
                onChange={() => setIsCustom(false)}
                className="accent-teal-500 h-5 w-5 rounded"
              />
              <div>
                <span>Use Default AWS Route Table rules</span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal mt-0.5">Built according to standard AWS rules (Local VPC routing only)</p>
              </div>
            </label>
            <div className="border-t border-slate-200 dark:border-zinc-800 my-1" />
            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                className="accent-teal-500 h-5 w-5 rounded"
              />
              <div>
                <span>Create a custom configuration</span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal mt-0.5">Allows adding custom routes for internet access, peer links, or NAT gateways</p>
              </div>
            </label>
          </div>

          {isCustom && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider">Routes List</h4>
                <button
                  onClick={handleAddRoute}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm"
                >
                  <Plus size={10} /> Add Route
                </button>
              </div>

              <div className="border border-slate-150 dark:border-zinc-850 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-850 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <th className="p-3">Destination CIDR</th>
                      <th className="p-3">Target</th>
                      <th className="p-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route, index) => (
                      <tr key={index} className="border-b border-slate-100 dark:border-zinc-900/50 last:border-0 bg-white dark:bg-zinc-950/40">
                        <td className="p-3">
                          <input
                            type="text"
                            value={route.destination}
                            onChange={(e) => handleRouteChange(index, "destination", e.target.value)}
                            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 w-full text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={route.target}
                            onChange={(e) => handleRouteChange(index, "target", e.target.value)}
                            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 w-full text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                          >
                            <option value="local">local</option>
                            <option value="Internet Gateway">Internet Gateway</option>
                            <option value="NAT Gateway">NAT Gateway</option>
                            <option value="VPC Peering">VPC Peering</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveRoute(index)}
                            disabled={routes.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <button onClick={onClose} className="h-10 px-4 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="h-10 px-5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-sm transition-all">
            Save Route Table
          </button>
        </div>
      </div>
    </div>
  );
};

const SubnetNaclModal = ({ node, onClose, onUpdateNodeData }) => {
  const currentConfig = node.data?.naclConfig || { isCustom: false, inboundRules: [], outboundRules: [] };
  const [isCustom, setIsCustom] = useState(currentConfig.isCustom);
  const [activeTab, setActiveTab] = useState("inbound");

  const defaultInbound = [
    { ruleNumber: 100, type: "All Traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", action: "Allow" },
    { ruleNumber: "*", type: "All Traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", action: "Deny" }
  ];
  const defaultOutbound = [
    { ruleNumber: 100, type: "All Traffic", protocol: "All", portRange: "All", destination: "0.0.0.0/0", action: "Allow" },
    { ruleNumber: "*", type: "All Traffic", protocol: "All", portRange: "All", destination: "0.0.0.0/0", action: "Deny" }
  ];

  const [inboundRules, setInboundRules] = useState(
    currentConfig.inboundRules.length > 0 ? currentConfig.inboundRules : defaultInbound
  );
  const [outboundRules, setOutboundRules] = useState(
    currentConfig.outboundRules.length > 0 ? currentConfig.outboundRules : defaultOutbound
  );

  const handleAddRule = () => {
    const newRule = { ruleNumber: 110, type: "HTTP (80)", protocol: "TCP", portRange: "80", source: "0.0.0.0/0", action: "Allow" };
    if (activeTab === "inbound") {
      const updated = [...inboundRules];
      updated.splice(updated.length - 1, 0, newRule);
      setInboundRules(updated);
    } else {
      const newOutRule = { ruleNumber: 110, type: "HTTP (80)", protocol: "TCP", portRange: "80", destination: "0.0.0.0/0", action: "Allow" };
      const updated = [...outboundRules];
      updated.splice(updated.length - 1, 0, newOutRule);
      setOutboundRules(updated);
    }
  };

  const handleRemoveRule = (index) => {
    if (activeTab === "inbound") {
      setInboundRules(inboundRules.filter((_, i) => i !== index));
    } else {
      setOutboundRules(outboundRules.filter((_, i) => i !== index));
    }
  };

  const handleRuleChange = (index, field, value) => {
    const updater = (rules) =>
      rules.map((r, i) => {
        if (i !== index) return r;
        if (field === "type") {
          let protocol = "TCP";
          let portRange = "80";
          if (value === "HTTP (80)") { protocol = "TCP"; portRange = "80"; }
          else if (value === "HTTPS (443)") { protocol = "TCP"; portRange = "443"; }
          else if (value === "SSH (22)") { protocol = "TCP"; portRange = "22"; }
          else if (value === "RDP (3389)") { protocol = "TCP"; portRange = "3389"; }
          else if (value === "All Traffic") { protocol = "All"; portRange = "All"; }
          else if (value === "Custom TCP") { protocol = "TCP"; portRange = "1024-65535"; }
          return { ...r, type: value, protocol, portRange };
        }
        return { ...r, [field]: value };
      });

    if (activeTab === "inbound") {
      setInboundRules(updater(inboundRules));
    } else {
      setOutboundRules(updater(outboundRules));
    }
  };

  const handleSave = () => {
    onUpdateNodeData("hasNetworkAcl", true);
    onUpdateNodeData("naclConfig", {
      isCustom,
      inboundRules: isCustom ? inboundRules : defaultInbound,
      outboundRules: isCustom ? outboundRules : defaultOutbound
    });
    onClose();
  };

  const rulesToRender = activeTab === "inbound" ? inboundRules : outboundRules;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden animate-scale-up nodrag text-left font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            <div className="p-1.5 bg-teal-100 dark:bg-teal-500/20 rounded-lg text-teal-600 dark:text-teal-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide">Network ACL Configuration</h3>
              <p className="text-[10px] text-slate-405 dark:text-zinc-550 mt-0.5 uppercase tracking-wider">Subnet: {node.data?.label || node.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto max-h-[420px] custom-scrollbar">
          <div className="flex flex-col gap-3 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-850">
            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={!isCustom}
                onChange={() => setIsCustom(false)}
                className="accent-teal-500 h-5 w-5 rounded"
              />
              <div>
                <span>Use Default AWS Network ACL rules</span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal mt-0.5">Allows all inbound and outbound traffic (AWS default subnet ruleset)</p>
              </div>
            </label>
            <div className="border-t border-slate-200 dark:border-zinc-800 my-1" />
            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                className="accent-teal-500 h-5 w-5 rounded"
              />
              <div>
                <span>Create a custom configuration</span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal mt-0.5">Define custom stateless security rules for inbound and outbound traffic</p>
              </div>
            </label>
          </div>

          {isCustom && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-850 pb-1">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveTab("inbound")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === "inbound"
                        ? "bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100 dark:border-teal-900/25"
                        : "text-slate-550 dark:text-zinc-450 hover:bg-slate-50 dark:hover:bg-zinc-900/30"
                    }`}
                  >
                    Inbound Rules
                  </button>
                  <button
                    onClick={() => setActiveTab("outbound")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === "outbound"
                        ? "bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100 dark:border-teal-900/25"
                        : "text-slate-550 dark:text-zinc-450 hover:bg-slate-50 dark:hover:bg-zinc-900/30"
                    }`}
                  >
                    Outbound Rules
                  </button>
                </div>
                <button
                  onClick={handleAddRule}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-extrabold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm"
                >
                  <Plus size={10} /> Add Rule
                </button>
              </div>

              <div className="border border-slate-150 dark:border-zinc-850 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-850 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <th className="p-2.5 w-16">Rule #</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 w-20">Protocol</th>
                      <th className="p-2.5 w-24">Port Range</th>
                      <th className="p-2.5">{activeTab === "inbound" ? "Source" : "Destination"}</th>
                      <th className="p-2.5 w-20">Action</th>
                      <th className="p-2.5 w-12 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rulesToRender.map((rule, index) => {
                      const isCatchAll = rule.ruleNumber === "*";
                      return (
                        <tr key={index} className="border-b border-slate-100 dark:border-zinc-900/50 last:border-0 bg-white dark:bg-zinc-950/40">
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={rule.ruleNumber}
                              disabled={isCatchAll}
                              onChange={(e) => handleRuleChange(index, "ruleNumber", e.target.value)}
                              className="bg-slate-50 dark:bg-zinc-900 disabled:opacity-60 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 w-full text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 text-center font-semibold"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={rule.type}
                              disabled={isCatchAll}
                              onChange={(e) => handleRuleChange(index, "type", e.target.value)}
                              className="bg-slate-50 dark:bg-zinc-900 disabled:opacity-60 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 w-full text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                            >
                              <option value="All Traffic">All Traffic</option>
                              <option value="HTTP (80)">HTTP (80)</option>
                              <option value="HTTPS (443)">HTTPS (443)</option>
                              <option value="SSH (22)">SSH (22)</option>
                              <option value="RDP (3389)">RDP (3389)</option>
                              <option value="Custom TCP">Custom TCP</option>
                            </select>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={rule.protocol}
                              disabled={isCatchAll || rule.type !== "Custom TCP"}
                              onChange={(e) => handleRuleChange(index, "protocol", e.target.value)}
                              className="bg-slate-50 dark:bg-zinc-900 disabled:opacity-60 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 w-full text-xs text-slate-800 dark:text-zinc-100 text-center focus:outline-none focus:border-teal-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={rule.portRange}
                              disabled={isCatchAll || (rule.type !== "Custom TCP" && rule.type !== "All Traffic")}
                              onChange={(e) => handleRuleChange(index, "portRange", e.target.value)}
                              className="bg-slate-50 dark:bg-zinc-900 disabled:opacity-60 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 w-full text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={activeTab === "inbound" ? rule.source : rule.destination}
                              disabled={isCatchAll}
                              onChange={(e) => handleRuleChange(index, activeTab === "inbound" ? "source" : "destination", e.target.value)}
                              className="bg-slate-50 dark:bg-zinc-900 disabled:opacity-60 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 w-full text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={rule.action}
                              disabled={isCatchAll}
                              onChange={(e) => handleRuleChange(index, "action", e.target.value)}
                              className={`bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 w-full text-xs font-semibold focus:outline-none focus:border-teal-500 ${
                                rule.action === "Allow" ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"
                              }`}
                            >
                              <option value="Allow">Allow</option>
                              <option value="Deny">Deny</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleRemoveRule(index)}
                              disabled={isCatchAll}
                              className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <button onClick={onClose} className="h-10 px-4 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="h-10 px-5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-sm transition-all">
            Save Network ACL
          </button>
        </div>
      </div>
    </div>
  );
};

const SgManagerModal = ({ node, nodes, onClose, onUpdateSgs }) => {
  const [activeEditSgId, setActiveEditSgId] = useState(null);

  // Compute list of attached SGs
  const attachedSgs = useMemo(() => {
    return Array.isArray(node.data?.securityGroups) ? node.data.securityGroups : [];
  }, [node.data?.securityGroups]);

  // Compute all unique custom SGs on the canvas
  const globalSgs = useMemo(() => {
    const sgs = [];
    const seenIds = new Set();
    nodes.forEach((n) => {
      if (n.type === "ec2Node" && n.data?.hasCustomSecurityGroup && n.data?.securityGroups) {
        n.data.securityGroups.forEach((sg) => {
          if (sg && sg.id && !seenIds.has(sg.id)) {
            seenIds.add(sg.id);
            sgs.push(sg);
          }
        });
      } else if (n.type === "ec2Node" && n.data?.hasCustomSecurityGroup && n.data?.securityGroup) {
        const sg = n.data.securityGroup;
        if (sg && sg.id && !seenIds.has(sg.id)) {
          seenIds.add(sg.id);
          sgs.push(sg);
        }
      }
    });
    return sgs;
  }, [nodes]);

  // If editing a specific SG, show the rules editor sub-view
  if (activeEditSgId !== null) {
    const targetSg = globalSgs.find(sg => sg.id === activeEditSgId);
    if (targetSg) {
      return (
        <SgRulesEditorSubView
          sg={targetSg}
          onBack={() => setActiveEditSgId(null)}
          onSave={(updatedSg) => {
            onUpdateSgs("edit", updatedSg);
            setActiveEditSgId(null);
          }}
        />
      );
    }
  }

  // Create new SG
  const handleCreateNewSg = () => {
    const newSgId = `sg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newSg = {
      id: newSgId,
      name: `${node.data?.label || "ec2"}-sg-${globalSgs.length + 1}`,
      rules: [
        { id: "default-ssh", type: "ingress", protocol: "tcp", fromPort: 22, toPort: 22, cidr: "0.0.0.0/0", description: "Allow SSH" },
        { id: "default-http", type: "ingress", protocol: "tcp", fromPort: 80, toPort: 80, cidr: "0.0.0.0/0", description: "Allow HTTP" }
      ]
    };
    onUpdateSgs("create-attach", newSg);
    setActiveEditSgId(newSgId);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl h-[550px] flex flex-col shadow-2xl overflow-hidden animate-scale-up nodrag text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-sans">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-500">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Security Groups Manager
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5 uppercase tracking-wider">
                Instance: {node.data?.label || node.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {/* Section 1: Currently Associated SGs */}
          <div className="flex flex-col gap-2 font-sans">
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono shrink-0">
              Associated Security Groups ({attachedSgs.length})
            </h4>
            
            {attachedSgs.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-center text-slate-450 dark:text-zinc-500 text-xs bg-slate-50/50 dark:bg-zinc-900/20">
                No custom security groups attached. This instance will use the AWS Default security group.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attachedSgs.map((sg) => (
                  <div 
                    key={sg.id}
                    className="p-3 bg-emerald-50/15 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded text-emerald-600 dark:text-emerald-500 shrink-0">
                        <Shield size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-700 dark:text-zinc-200 truncate">{sg.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{sg.rules?.length || 0} rules configured</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 font-sans">
                      <button
                        type="button"
                        onClick={() => setActiveEditSgId(sg.id)}
                        title="Edit Rules"
                        className="p-1.5 text-slate-450 hover:text-sky-550 hover:bg-sky-50 dark:hover:bg-sky-500/10 border border-slate-200 dark:border-zinc-800 rounded-lg transition-all"
                      >
                        <Edit size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateSgs("detach", sg.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-zinc-800 rounded-lg transition-all"
                      >
                        Detach
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Global SGs Library */}
          <div className="flex flex-col gap-2 flex-1 min-h-[200px] font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2 shrink-0">
              <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
                Global Security Groups Library ({globalSgs.length})
              </h4>
              <button
                type="button"
                onClick={handleCreateNewSg}
                className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              >
                <Plus size={11} /> Create New Security Group
              </button>
            </div>

            {globalSgs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-zinc-650">
                <Shield size={28} className="mb-2 opacity-50 text-slate-350" />
                <p className="text-xs font-bold">No security groups created yet.</p>
                <p className="text-[10px] max-w-[280px] mt-1 leading-normal">Create a new security group to manage network access controls globally across your instances.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {globalSgs.map((sg) => {
                  const isAttached = attachedSgs.some(asg => asg.id === sg.id);
                  return (
                    <div 
                      key={sg.id}
                      className="p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-slate-100 dark:bg-zinc-800 rounded text-slate-500 dark:text-zinc-400 shrink-0">
                          <Shield size={14} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-700 dark:text-zinc-200 truncate">{sg.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{sg.rules?.length || 0} rules</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isAttached ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg select-none border border-emerald-100 dark:border-emerald-500/20">
                            Attached
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateSgs("attach", sg)}
                            className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg transition-all"
                          >
                            Attach
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveEditSgId(sg.id)}
                          title="Edit Rules"
                          className="p-1.5 text-slate-450 hover:text-sky-550 hover:bg-sky-50 dark:hover:bg-sky-955/20 border border-slate-205 dark:border-zinc-800 rounded-lg transition-all"
                        >
                          <Edit size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateSgs("delete", sg.id)}
                          title="Delete Globally"
                          className="p-1.5 text-slate-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 border border-slate-205 dark:border-zinc-800 rounded-lg transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/20 shrink-0 font-sans">
          <button
            onClick={onClose}
            className="h-10 px-5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 rounded-xl shadow-sm hover:shadow transition-all"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};

const reconstructCanvasFromCode = (code) => {
  const nodes = [];
  const edges = [];
  
  if (!code || !code.resource) return { nodes, edges };
  
  const resources = code.resource;
  
  // Maps to help resolve connections by name/id
  const nameToNodeId = {};
  const arnToNodeId = {};
  
  let gridX = 100;
  let gridY = 100;
  const getNextPosition = () => {
    const pos = { x: gridX, y: gridY };
    gridX += 280;
    if (gridX > 900) {
      gridX = 100;
      gridY += 240;
    }
    return pos;
  };

  // 1. Reconstruct S3 Buckets
  if (resources.aws_s3_bucket) {
    Object.entries(resources.aws_s3_bucket).forEach(([tfId, config]) => {
      const bucketName = config.bucket || tfId;
      const nodeId = `s3_${tfId}`;
      nameToNodeId[bucketName] = nodeId;
      nameToNodeId[tfId] = nodeId;
      
      let versioning = false;
      if (resources.aws_s3_bucket_versioning) {
        const vConfig = Object.values(resources.aws_s3_bucket_versioning).find(
          (v) => v.bucket === `\${aws_s3_bucket.${tfId}.id}` || v.bucket === bucketName
        );
        if (vConfig?.versioning_configuration?.status === "Enabled") {
          versioning = true;
        }
      }
      
      let isPublic = true;
      if (resources.aws_s3_bucket_public_access_block) {
        const pConfig = Object.values(resources.aws_s3_bucket_public_access_block).find(
          (p) => p.bucket === `\${aws_s3_bucket.${tfId}.id}` || p.bucket === bucketName
        );
        if (pConfig?.block_public_acls === true) {
          isPublic = false;
        }
      }

      nodes.push({
        id: nodeId,
        type: "s3Node",
        position: getNextPosition(),
        style: { width: 300, height: 200 },
        data: {
          label: bucketName,
          versioning,
          isPublic,
          cost: 0.23
        }
      });
    });
  }

  // 2. Pre-process IAM Group Memberships
  // We map: userTfId -> array of groupTfIds
  const userGroupsMap = {};
  if (resources.aws_iam_user_group_membership) {
    Object.values(resources.aws_iam_user_group_membership).forEach((config) => {
      const userRef = config.user || "";
      let userTfId = null;
      const userMatch = userRef.match(/\${aws_iam_user\.(.+)\.name}/);
      if (userMatch) {
        userTfId = userMatch[1];
      } else {
        const cleanUser = userRef.trim();
        const found = Object.entries(resources.aws_iam_user || {}).find(([tfId, val]) => {
          return tfId === cleanUser || val.name === cleanUser;
        });
        if (found) userTfId = found[0];
      }
      
      if (!userTfId) return;
      
      if (!userGroupsMap[userTfId]) {
        userGroupsMap[userTfId] = [];
      }
      
      const groups = config.groups || [];
      groups.forEach((groupRef) => {
        let groupTfId = null;
        const groupMatch = groupRef.match(/\${aws_iam_group\.(.+)\.name}/);
        if (groupMatch) {
          groupTfId = groupMatch[1];
        } else {
          const cleanGroup = groupRef.trim();
          const found = Object.entries(resources.aws_iam_group || {}).find(([tfId, val]) => {
            return tfId === cleanGroup || val.name === cleanGroup;
          });
          if (found) groupTfId = found[0];
        }
        
        if (groupTfId && !userGroupsMap[userTfId].includes(groupTfId)) {
          userGroupsMap[userTfId].push(groupTfId);
        }
      });
    });
  }

  // 3. Reconstruct IAM Groups
  const groupChildrenCount = {};
  if (resources.aws_iam_group) {
    Object.entries(resources.aws_iam_group).forEach(([tfId, config]) => {
      const groupName = config.name || tfId;
      const nodeId = `iam_group_${tfId}`;
      nameToNodeId[groupName] = nodeId;
      nameToNodeId[tfId] = nodeId;
      groupChildrenCount[tfId] = 0;
      
      nodes.push({
        id: nodeId,
        type: "iamGroupNode",
        position: getNextPosition(),
        style: { width: 300, height: 200 },
        data: {
          label: groupName,
          iamType: "Group"
        }
      });
    });
  }

  // 4. Reconstruct IAM Users
  if (resources.aws_iam_user) {
    Object.entries(resources.aws_iam_user).forEach(([tfId, config]) => {
      const userName = config.name || tfId;
      const memberGroupTfIds = userGroupsMap[tfId] || [];
      
      if (memberGroupTfIds.length === 0) {
        const nodeId = `iam_user_${tfId}`;
        nameToNodeId[userName] = nodeId;
        nameToNodeId[tfId] = nodeId;
        nodes.push({
          id: nodeId,
          type: "iamNode",
          position: getNextPosition(),
          data: {
            label: userName,
            iamType: "User"
          }
        });
      } else {
        memberGroupTfIds.forEach((groupTfId, idx) => {
          const groupNodeId = `iam_group_${groupTfId}`;
          const nodeId = `iam_user_${tfId}_in_${groupTfId}`;
          
          // Map userName and tfId to the first instance of the user node for other references (e.g. policy attachments)
          if (idx === 0) {
            nameToNodeId[userName] = nodeId;
            nameToNodeId[tfId] = nodeId;
          }
          
          const childIndex = groupChildrenCount[groupTfId];
          groupChildrenCount[groupTfId]++;
          
          const row = Math.floor(childIndex / 2);
          const col = childIndex % 2;
          const relativePos = { x: 20 + col * 240, y: 60 + row * 80 };
          
          nodes.push({
            id: nodeId,
            type: "iamNode",
            parentId: groupNodeId,
            position: relativePos,
            data: {
              label: userName,
              iamType: "User"
            }
          });
        });
      }
    });
  }

  // 4.5 Adjust IAM Group Sizes based on child count
  nodes.forEach((node) => {
    if (node.type === "iamGroupNode") {
      const tfId = node.id.replace("iam_group_", "");
      const childCount = groupChildrenCount[tfId] || 0;
      if (childCount > 0) {
        const rows = Math.ceil(childCount / 2);
        const minHeight = 60 + rows * 80 + 20;
        const minWidth = childCount > 1 ? 500 : 280;
        node.style = { width: minWidth, height: minHeight };
      }
    }
  });

  // 5. Reconstruct IAM Roles
  if (resources.aws_iam_role) {
    Object.entries(resources.aws_iam_role).forEach(([tfId, config]) => {
      const roleName = config.name || tfId;
      const nodeId = `iam_role_${tfId}`;
      nameToNodeId[roleName] = nodeId;
      nameToNodeId[tfId] = nodeId;
      nodes.push({
        id: nodeId,
        type: "iamNode",
        position: getNextPosition(),
        data: {
          label: roleName,
          iamType: "Role"
        }
      });
    });
  }

  // 6. Reconstruct IAM Policies
  if (resources.aws_iam_policy) {
    Object.entries(resources.aws_iam_policy).forEach(([tfId, config]) => {
      const policyName = config.name || tfId;
      const nodeId = `iam_policy_${tfId}`;
      nameToNodeId[policyName] = nodeId;
      nameToNodeId[tfId] = nodeId;
      arnToNodeId[`\${aws_iam_policy.${tfId}.arn}`] = nodeId;
      nodes.push({
        id: nodeId,
        type: "iamNode",
        position: getNextPosition(),
        data: {
          label: policyName,
          iamType: "Policy"
        }
      });
    });
  }

  // 7. Reconstruct EC2 Instances
  if (resources.aws_instance) {
    Object.entries(resources.aws_instance).forEach(([tfId, config]) => {
      const instanceName = config.tags?.Name || tfId;
      const nodeId = `ec2_${tfId}`;
      nameToNodeId[instanceName] = nodeId;
      nameToNodeId[tfId] = nodeId;

      // Extract referenced security group configurations if available
      let hasCustomSecurityGroup = false;
      const securityGroups = [];
      if (config.vpc_security_group_ids && Array.isArray(config.vpc_security_group_ids)) {
        config.vpc_security_group_ids.forEach((sgRef) => {
          if (!sgRef) return;
          const sgTfId = sgRef.replace(/\${aws_security_group\.(.+)\.id}/, '$1');
          if (resources.aws_security_group && resources.aws_security_group[sgTfId]) {
            const sgConfig = resources.aws_security_group[sgTfId];
            hasCustomSecurityGroup = true;
            const rules = [];

            // Ingress rules
            if (sgConfig.ingress) {
              const ingressRules = Array.isArray(sgConfig.ingress) ? sgConfig.ingress : [sgConfig.ingress];
              ingressRules.forEach((rule, idx) => {
                rules.push({
                  id: `rule-ingress-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                  type: "ingress",
                  protocol: rule.protocol || "tcp",
                  fromPort: rule.from_port || 80,
                  toPort: rule.to_port || 80,
                  cidr: Array.isArray(rule.cidr_blocks) ? rule.cidr_blocks[0] : (rule.cidr_blocks || "0.0.0.0/0"),
                  description: rule.description || ""
                });
              });
            }

            // Egress rules
            if (sgConfig.egress) {
              const egressRules = Array.isArray(sgConfig.egress) ? sgConfig.egress : [sgConfig.egress];
              egressRules.forEach((rule, idx) => {
                rules.push({
                  id: `rule-egress-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                  type: "egress",
                  protocol: rule.protocol || "all",
                  fromPort: rule.from_port || 0,
                  toPort: rule.to_port || 0,
                  cidr: Array.isArray(rule.cidr_blocks) ? rule.cidr_blocks[0] : (rule.cidr_blocks || "0.0.0.0/0"),
                  description: rule.description || ""
                });
              });
            }

            securityGroups.push({
              id: `sg-${sgTfId}`,
              name: sgConfig.name || sgTfId,
              rules
            });
          }
        });
      }

      nodes.push({
        id: nodeId,
        type: "ec2Node",
        position: getNextPosition(),
        data: {
          label: instanceName,
          instanceType: config.instance_type || "t2.micro",
          ami: config.ami || "",
          volumeSize: config.root_block_device?.volume_size || 8,
          cost: 8.50,
          hasCustomSecurityGroup,
          securityGroups
        }
      });
    });
  }

  // Note: We completely skip the group membership edges recreation because visual nesting replaces it.

  // 8. Reconstruct Policy Attachments (Edges)
  if (resources.aws_iam_user_policy_attachment) {
    Object.values(resources.aws_iam_user_policy_attachment).forEach((config) => {
      const user = config.user;
      const policyArn = config.policy_arn;
      
      const cleanUser = user.replace(/\${aws_iam_user\.(.+)\.name}/, '$1');
      const userNodeId = nameToNodeId[cleanUser] || Object.values(nameToNodeId).find((id) => id.includes(cleanUser));
      const policyNodeId = arnToNodeId[policyArn] || Object.values(arnToNodeId).find((id) => id.includes(policyArn));
      
      if (userNodeId && policyNodeId) {
        edges.push({
          id: `e_pat_${userNodeId}_${policyNodeId}`,
          source: userNodeId,
          target: policyNodeId,
          sourceHandle: "right",
          targetHandle: "left",
          style: { strokeWidth: 2, stroke: "#94a3b8" }
        });
      }
    });
  }
  
  if (resources.aws_iam_group_policy_attachment) {
    Object.values(resources.aws_iam_group_policy_attachment).forEach((config) => {
      const group = config.group;
      const policyArn = config.policy_arn;
      
      const cleanGroup = group.replace(/\${aws_iam_group\.(.+)\.name}/, '$1');
      const groupNodeId = nameToNodeId[cleanGroup] || Object.values(nameToNodeId).find((id) => id.includes(cleanGroup));
      const policyNodeId = arnToNodeId[policyArn] || Object.values(arnToNodeId).find((id) => id.includes(policyArn));
      
      if (groupNodeId && policyNodeId) {
        edges.push({
          id: `e_pat_${groupNodeId}_${policyNodeId}`,
          source: groupNodeId,
          target: policyNodeId,
          sourceHandle: "right",
          targetHandle: "left",
          style: { strokeWidth: 2, stroke: "#94a3b8" }
        });
      }
    });
  }

  if (resources.aws_iam_role_policy_attachment) {
    Object.values(resources.aws_iam_role_policy_attachment).forEach((config) => {
      const role = config.role;
      const policyArn = config.policy_arn;
      
      const cleanRole = role.replace(/\${aws_iam_role\.(.+)\.name}/, '$1');
      const roleNodeId = nameToNodeId[cleanRole] || Object.values(nameToNodeId).find((id) => id.includes(cleanRole));
      const policyNodeId = arnToNodeId[policyArn] || Object.values(arnToNodeId).find((id) => id.includes(policyArn));
      
      if (roleNodeId && policyNodeId) {
        edges.push({
          id: `e_pat_${roleNodeId}_${policyNodeId}`,
          source: roleNodeId,
          target: policyNodeId,
          sourceHandle: "right",
          targetHandle: "left",
          style: { strokeWidth: 2, stroke: "#94a3b8" }
        });
      }
    });
  }

  return { nodes, edges };
}

const isValidParentForChild = (parentType, childType, childIamType = null) => {
  if (parentType === "iamGroupNode" && childType === "iamNode" && childIamType === "User") return true;
  if (parentType === "s3Node" && childType === "s3ObjectNode") return true;
  if (parentType === "vpcNode" && childType === "subnetNode") return true;
  if (parentType === "subnetNode" && childType === "ec2Node") return true;
  return false;
};

const getGroupLayoutConfig = (parentType, childCount) => {
  if (parentType === "vpcNode") {
    // VPC hosts subnets (480x300) in a 2-column grid layout
    const minHeight = 100 + Math.ceil(childCount / 2) * 325;
    const minWidth = childCount > 1 ? 1035 : 530;
    return {
      minHeight: childCount === 0 ? 200 : Math.max(200, minHeight),
      minWidth: Math.max(530, minWidth),
      getChildPosition: (index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        return { x: 25 + col * 505, y: 80 + row * 325 };
      }
    };
  }
  if (parentType === "subnetNode") {
    // Subnet hosts EC2 instances (360x70) in a 1-column vertical stack
    const minHeight = 120 + childCount * 100;
    const minWidth = 480;
    return {
      minHeight: Math.max(300, minHeight),
      minWidth: Math.max(480, minWidth),
      getChildPosition: (index) => {
        // Center the EC2 nodes inside the 480px width subnet container
        // EC2 is 360px wide, so offset is (480 - 360) / 2 = 60px!
        return { x: 60, y: 80 + index * 100 };
      }
    };
  }
  // Default for S3 Bucket / IAM Group
  const minHeight = 100 + Math.ceil(childCount / 2) * 80;
  const minWidth = childCount > 1 ? 500 : 280;
  return {
    minHeight: Math.max(200, minHeight),
    minWidth: Math.max(300, minWidth),
    getChildPosition: (index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      return { x: 20 + col * 240, y: 60 + row * 80 };
    }
  };
};
const layoutSubnetsInVpc = (vpcId, nds) => {
  // Find all subnets belonging to this VPC
  const subnets = nds.filter((n) => n.parentId === vpcId && n.type === "subnetNode");
  
  // Divide subnets into 2 columns:
  // Column 0: subnets[0], subnets[2], subnets[4]...
  // Column 1: subnets[1], subnets[3], subnets[5]...
  const col0 = [];
  const col1 = [];
  subnets.forEach((sub, idx) => {
    if (idx % 2 === 0) col0.push(sub);
    else col1.push(sub);
  });

  // Helper to layout a single column and return total height used
  const layoutColumn = (colSubnets, startX) => {
    let currentY = 80; // Offset below VPC header
    colSubnets.forEach((sub) => {
      // Find EC2 instances inside this subnet
      const ec2Count = nds.filter((n) => n.parentId === sub.id && n.type === "ec2Node").length;
      const subnetHeight = Math.max(300, 120 + ec2Count * 100);
      
      sub.tempHeight = subnetHeight;
      sub.tempPosition = { x: startX, y: currentY };
      
      currentY += subnetHeight + 25; // 25px gap
    });
    return currentY;
  };

  const col0Height = layoutColumn(col0, 25);
  const col1Height = layoutColumn(col1, 530); // 480px width + 25px spacing + 25px margin = 530px

  const maxColHeight = Math.max(col0Height, col1Height);
  const vpcHeight = subnets.length === 0 ? 200 : Math.max(200, maxColHeight + 25); // 25px bottom padding
  const vpcWidth = subnets.length > 1 ? 1035 : 530;

  const subnetIds = subnets.map((s) => s.id);
  const ec2Instances = nds.filter((n) => n.parentId && subnetIds.includes(n.parentId) && n.type === "ec2Node");

  return nds.map((n) => {
    if (n.id === vpcId) {
      return {
        ...n,
        style: {
          ...n.style,
          height: vpcHeight,
          width: vpcWidth,
        }
      };
    }
    const matchingSubnet = subnets.find((sub) => sub.id === n.id);
    if (matchingSubnet && matchingSubnet.tempPosition) {
      return {
        ...n,
        position: matchingSubnet.tempPosition,
        style: {
          ...n.style,
          width: 480,
          height: matchingSubnet.tempHeight,
        }
      };
    }
    // Auto-center and stack EC2 nodes inside the VPC subnets
    if (n.type === "ec2Node" && n.parentId && subnetIds.includes(n.parentId)) {
      const siblings = ec2Instances.filter((e) => e.parentId === n.parentId);
      const childIndex = siblings.findIndex((e) => e.id === n.id);
      return {
        ...n,
        position: { x: 60, y: 80 + childIndex * 100 }
      };
    }
    return n;
  });
};

const layoutAllVpcs = (nds) => {
  const vpcs = nds.filter((n) => n.type === "vpcNode");
  let updated = [...nds];
  vpcs.forEach((vpc) => {
    updated = layoutSubnetsInVpc(vpc.id, updated);
  });
  return updated;
};

const updateParentLayoutAndVpcs = (parentId, nds) => {
  if (!parentId) return layoutAllVpcs(nds);

  const parentNode = nds.find((n) => n.id === parentId);
  if (!parentNode) return layoutAllVpcs(nds);

  const remainingChildren = nds.filter((n) => n.parentId === parentId);
  const isGridGroup = parentNode.type === "iamGroupNode" || parentNode.type === "s3Node" || parentNode.type === "subnetNode";

  let updatedNodes = nds;
  if (isGridGroup) {
    const cfg = getGroupLayoutConfig(parentNode.type, remainingChildren.length);
    updatedNodes = nds.map((n) => {
      if (n.id === parentId) {
        return {
          ...n,
          style: {
            ...n.style,
            height: cfg.minHeight,
            width: cfg.minWidth,
          }
        };
      }
      if (n.parentId === parentId) {
        const childIndex = remainingChildren.findIndex(child => child.id === n.id);
        return {
          ...n,
          position: cfg.getChildPosition(childIndex)
        };
      }
      return n;
    });
  }

  return layoutAllVpcs(updatedNodes);
};

const getNodeAbsolutePosition = (node, nds) => {
  let x = node.position.x;
  let y = node.position.y;
  let curr = node;
  while (curr.parentId) {
    const parent = nds.find((p) => p.id === curr.parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    curr = parent;
  }
  return { x, y };
};

const CONNECTION_RESOURCE_OPTIONS = [
  { value: "vpc", label: "VPC", icon: Network, nodeType: "vpcNode", labelType: null },
  { value: "subnet", label: "Subnet", icon: Layers, nodeType: "subnetNode", labelType: null },
  { value: "igw", label: "Internet Gateway", icon: Globe, nodeType: "internetGatewayNode", labelType: null },
  { value: "ec2", label: "EC2 Instance", icon: Server, nodeType: "ec2Node", labelType: null },
  { value: "s3", label: "S3 Bucket", icon: Database, nodeType: "s3Node", labelType: null },
  { value: "s3object", label: "S3 Object", icon: File, nodeType: "s3ObjectNode", labelType: null },
  { value: "user", label: "IAM User", icon: User, nodeType: "iamNode", labelType: "User" },
  { value: "group", label: "IAM Group", icon: Users, nodeType: "iamGroupNode", labelType: "Group" },
  { value: "role", label: "IAM Role", icon: Shield, nodeType: "iamNode", labelType: "Role" },
  { value: "policy", label: "IAM Policy", icon: Key, nodeType: "iamNode", labelType: "Policy" },
  { value: "rect", label: "Rectangle Group", icon: Square, nodeType: "shapeNode", labelType: "Rectangle" },
  { value: "circle", label: "Circle Group", icon: CircleIcon, nodeType: "shapeNode", labelType: "Circle" },
  { value: "text", label: "Text Label", icon: Type, nodeType: "shapeNode", labelType: "Text" },
];
// ==========================================
// 2.5 BUILDER WORKSPACE FLOW CANVAS COMPONENTS
// ==========================================
const BuilderCanvasHelper = ({
  project,
  onSaveProject,
  isBuildingLive,
  setIsBuildingLive,
  pendingNodes,
  pendingEdges,
  nodes,
  setNodes,
  edges,
  setEdges
}) => {
  const { setCenter, fitView } = useReactFlow();
  const [statusText, setStatusText] = useState("");
  const [liveNodesCount, setLiveNodesCount] = useState(0);

  // Load existing project nodes if not building live
  useEffect(() => {
    if (!isBuildingLive) {
      setNodes(project.nodes || []);
      setEdges(project.edges || []);
    }
  }, [project.id, isBuildingLive]);

  // Live build animation sequence
  useEffect(() => {
    if (isBuildingLive && pendingNodes.length > 0) {
      setNodes([]);
      setEdges([]);
      setStatusText("Initializing live canvas...");
      setLiveNodesCount(0);
      
      let nodeIdx = 0;
      let edgeIdx = 0;

      const interval = setInterval(() => {
        if (nodeIdx < pendingNodes.length) {
          const nextNode = pendingNodes[nodeIdx];
          setStatusText(`Adding ${nextNode.data?.label || "Resource Node"}...`);
          
          setNodes((prev) => {
            const updated = [...prev, {
              ...nextNode,
              className: "animate-pulse border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]"
            }];
            return updated;
          });

          setCenter(nextNode.position.x + 80, nextNode.position.y + 40, { zoom: 1.1, duration: 600 });
          setLiveNodesCount(nodeIdx + 1);
          nodeIdx++;
        } else if (edgeIdx < pendingEdges.length) {
          const nextEdge = pendingEdges[edgeIdx];
          setStatusText(`Connecting networks...`);
          setEdges((prev) => [...prev, nextEdge]);
          edgeIdx++;
        } else {
          clearInterval(interval);
          setStatusText("Architecture successfully compiled!");
          setIsBuildingLive(false);
          
          // Remove pulsing highlights
          setNodes((prev) => prev.map(n => ({ ...n, className: "" })));
          
          onSaveProject(project.id, pendingNodes, pendingEdges);
          
          setTimeout(() => {
            fitView({ duration: 800, padding: 0.2 });
          }, 400);
        }
      }, 900);

      return () => clearInterval(interval);
    }
  }, [isBuildingLive, pendingNodes, pendingEdges]);

  return (
    <>
      {isBuildingLive && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-amber-500/30 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-scale-up">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7 shrink-0 flex items-center justify-center bg-amber-500/10 rounded-lg text-amber-500">
              <Sparkles size={16} className="animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider block">
                AI Architect Live Building
              </span>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-0.5 animate-pulse">
                {statusText}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-black text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-zinc-800">
              Nodes: {liveNodesCount} / {pendingNodes.length}
            </div>
            <div className="text-[9px] font-black text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-zinc-800">
              Edges: {edges.length} / {pendingEdges.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const BuilderCanvas = ({ 
  project, 
  onSaveProject, 
  isBuildingLive, 
  setIsBuildingLive, 
  pendingNodes, 
  pendingEdges 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="builder-flow-canvas"
      >
        <Background color="#cbd5e1" darkColor="#18181b" gap={18} size={1} />
      </ReactFlow>

      <BuilderCanvasHelper
        project={project}
        onSaveProject={onSaveProject}
        isBuildingLive={isBuildingLive}
        setIsBuildingLive={setIsBuildingLive}
        pendingNodes={pendingNodes}
        pendingEdges={pendingEdges}
        nodes={nodes}
        setNodes={setNodes}
        edges={edges}
        setEdges={setEdges}
      />
    </div>
  );
};

// ==========================================
// 3. MAIN APP: The Floating Editor
// ==========================================
export default function CloudForgeEditor({
  activeProject,
  projects,
  onLoadProject,
  onSave,
  onNewProjectFlow,
  userSettings,
  updateSettings,
  onOpenProjectsDashboard,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}) {
  const { screenToFlowPosition, fitView, getIntersectingNodes, getNode } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const [isSecondaryScreenOpen, setIsSecondaryScreenOpen] = useState(false);
  const [sideEditingId, setSideEditingId] = useState(null);
  const [sideEditName, setSideEditName] = useState("");
  const [sideConfirmDeleteId, setSideConfirmDeleteId] = useState(null);
  const [sideNewProjName, setSideNewProjName] = useState("");
  const [sideIsCreating, setSideIsCreating] = useState(false);
  const [sideProjectManagerOpen, setSideProjectManagerOpen] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newProjName, setNewProjName] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("gemini"); // "gemini" | "claude"
  const [selectedModel, setSelectedModel] = useState("gemini-3.6-flash");
  const [apiKey, setApiKey] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyHistory, setSurveyHistory] = useState([]);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [userAnswerText, setUserAnswerText] = useState("");
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [pendingNodes, setPendingNodes] = useState([]);
  const [pendingEdges, setPendingEdges] = useState([]);
  const [isBuildingLive, setIsBuildingLive] = useState(false);

  const [builderProjects, setBuilderProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("builder_projects");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load builder projects", e);
      return [];
    }
  });

  const [activeBuilderProjectId, setActiveBuilderProjectId] = useState(() => {
    try {
      const saved = localStorage.getItem("active_builder_project_id");
      return saved || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem("builder_projects", JSON.stringify(builderProjects));
  }, [builderProjects]);

  useEffect(() => {
    if (activeBuilderProjectId) {
      localStorage.setItem("active_builder_project_id", activeBuilderProjectId);
    } else {
      localStorage.removeItem("active_builder_project_id");
    }
  }, [activeBuilderProjectId]);

  const handleCreateBuilderProject = (name, provider, model, key, baseUrl) => {
    const newProj = {
      id: `bp_${Date.now()}`,
      name: name,
      updatedAt: Date.now(),
      nodes: [],
      edges: [],
      provider: provider,
      model: model,
      apiKey: key,
      customBaseUrl: baseUrl || "",
    };
    setBuilderProjects((prev) => [...prev, newProj]);
    setActiveBuilderProjectId(newProj.id);
  };

  const handleVerifyApiKey = async () => {
    setIsVerifyingKey(true);
    setVerificationSuccess(false);
    setVerificationError(null);

    try {
      const response = await fetch("http://localhost:3001/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          apiKey: apiKey.trim(),
          customBaseUrl: customBaseUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationSuccess(true);
        setTimeout(() => {
          setIsVerifyingKey(false);
          setVerificationSuccess(false);
          startSurveyFlow();
        }, 1500);
      } else {
        setVerificationError(data.error || "Connection failed. Please check your credentials.");
        setIsVerifyingKey(false);
      }
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Connection failed. Please check backend server status.");
      setIsVerifyingKey(false);
    }
  };

  const startSurveyFlow = async () => {
    setCreateStep(4);
    setSurveyStep(0);
    setSurveyHistory([]);
    setUserAnswerText("");
    setIsGeneratingQuestion(true);
    setVerificationError(null);

    try {
      const response = await fetch("http://localhost:3001/api/survey/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          apiKey: apiKey.trim(),
          customBaseUrl: customBaseUrl.trim() || undefined,
          history: [],
          topicIndex: 0
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentQuestionText(data.question);
      } else {
        setVerificationError(data.error || "Failed to generate first survey question.");
      }
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Failed to connect to backend server.");
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleNextSurveyStep = async () => {
    if (!userAnswerText.trim()) return;

    const updatedHistory = [
      ...surveyHistory,
      { question: currentQuestionText, answer: userAnswerText.trim() }
    ];
    setSurveyHistory(updatedHistory);
    setUserAnswerText("");
    setVerificationError(null);

    const nextStep = surveyStep + 1;
    setSurveyStep(nextStep);

    if (nextStep >= 5) {
      setIsGeneratingDiagram(true);
      try {
        const response = await fetch("http://localhost:3001/api/survey/generate-diagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: selectedProvider,
            model: selectedModel,
            apiKey: apiKey.trim(),
            customBaseUrl: customBaseUrl.trim() || undefined,
            history: updatedHistory
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          const nodes = data.diagram.nodes || [];
          const edges = data.diagram.edges || [];

          // Assign default node shapes/types or let standard mapping handle it
          const finalNodes = nodes.map((node, i) => {
            const defaultPos = { x: 100 + (i % 3) * 300, y: 150 + Math.floor(i / 3) * 250 };
            return {
              id: node.id || `node_${Date.now()}_${i}`,
              type: node.type || "ec2Node",
              position: node.position || defaultPos,
              data: {
                label: node.data?.label || "Node",
                region: node.data?.region || "us-east-1",
                ...node.data
              }
            };
          });

          const finalEdges = edges.map((edge, i) => ({
            id: `edge_${Date.now()}_${i}`,
            source: edge.source,
            target: edge.target,
            animated: true,
            style: { stroke: "#f59e0b", strokeWidth: 2 }
          }));

          const newProj = {
            id: `bp_${Date.now()}`,
            name: newProjName.trim(),
            updatedAt: Date.now(),
            nodes: [],
            edges: [],
            provider: selectedProvider,
            model: selectedModel,
            apiKey: apiKey.trim(),
            customBaseUrl: customBaseUrl.trim() || "",
          };
          setBuilderProjects((prev) => [...prev, newProj]);
          setActiveBuilderProjectId(newProj.id);
          setPendingNodes(finalNodes);
          setPendingEdges(finalEdges);
          setIsBuildingLive(true);
          setSideProjectManagerOpen(false);
          setShowCreateModal(false);
        } else {
          setVerificationError(data.error || "Failed to generate initial cloud architecture layout.");
          setSurveyStep(4);
        }
      } catch (err) {
        setVerificationError(err instanceof Error ? err.message : "Failed to connect to server during canvas generation.");
        setSurveyStep(4);
      } finally {
        setIsGeneratingDiagram(false);
      }
    } else {
      setIsGeneratingQuestion(true);
      try {
        const response = await fetch("http://localhost:3001/api/survey/next-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: selectedProvider,
            model: selectedModel,
            apiKey: apiKey.trim(),
            customBaseUrl: customBaseUrl.trim() || undefined,
            history: updatedHistory,
            topicIndex: nextStep
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setCurrentQuestionText(data.question);
        } else {
          setVerificationError(data.error || "Failed to generate next question.");
          setSurveyStep(surveyStep);
          setSurveyHistory(surveyHistory);
        }
      } catch (err) {
        setVerificationError(err instanceof Error ? err.message : "Failed to connect to backend server.");
        setSurveyStep(surveyStep);
        setSurveyHistory(surveyHistory);
      } finally {
        setIsGeneratingQuestion(false);
      }
    }
  };

  const handleBackSurveyStep = () => {
    if (surveyStep === 0) {
      setCreateStep(3);
      return;
    }

    const prevStep = surveyStep - 1;
    setSurveyStep(prevStep);
    const prevHistory = [...surveyHistory];
    const lastQA = prevHistory.pop();
    setSurveyHistory(prevHistory);
    
    if (lastQA) {
      setCurrentQuestionText(lastQA.question);
      setUserAnswerText(lastQA.answer);
    }
    setVerificationError(null);
  };

  const handleRenameBuilderProject = (id, newName) => {
    setBuilderProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p))
    );
  };

  const handleDeleteBuilderProject = (id) => {
    setBuilderProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeBuilderProjectId === id) {
      setActiveBuilderProjectId(null);
    }
  };

  const handleSaveBuilderProject = (id, updatedNodes, updatedEdges) => {
    setBuilderProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, nodes: updatedNodes, edges: updatedEdges, updatedAt: Date.now() }
          : p
      )
    );
  };

  const activeBuilderProject = builderProjects.find((p) => p.id === activeBuilderProjectId) || null;

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

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    activeProject?.edges || [],
  );

  const isEdgeValuable = useCallback((edge, currentNodes) => {
    const source = currentNodes.find((n) => n.id === edge.source);
    const target = currentNodes.find((n) => n.id === edge.target);
    if (!source || !target) return false;

    const isUser = (n) => n.type === "iamNode" && n.data?.iamType === "User";
    const isGroup = (n) => n.type === "iamGroupNode" || (n.type === "iamNode" && n.data?.iamType === "Group");
    const isPolicy = (n) => n.type === "iamNode" && n.data?.iamType === "Policy";
    const isRole = (n) => n.type === "iamNode" && n.data?.iamType === "Role";
    const isEC2 = (n) => n.type === "ec2Node";

    // 1. User <-> Group
    if ((isUser(source) && isGroup(target)) || (isGroup(source) && isUser(target))) {
      return true;
    }

    // 2. Policy <-> User/Group/Role
    if (isPolicy(source) || isPolicy(target)) {
      const other = isPolicy(source) ? target : source;
      if (isUser(other) || isGroup(other) || isRole(other)) {
        return true;
      }
    }

    // 3. Role <-> EC2
    if ((isRole(source) && isEC2(target)) || (isEC2(source) && isRole(target))) {
      return true;
    }

    return false;
  }, []);

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const valuable = isEdgeValuable(edge, nodes);
      return {
        ...edge,
        style: valuable
          ? { ...edge.style, strokeDasharray: undefined }
          : { ...edge.style, strokeDasharray: "5, 5" },
      };
    });
  }, [edges, nodes, isEdgeValuable]);

  const isDisallowedConnection = useCallback((sourceId, targetId) => {
    const source = nodes.find((n) => n.id === sourceId);
    const target = nodes.find((n) => n.id === targetId);
    if (!source || !target) return false;

    const isUser = (n) => n.type === "iamNode" && n.data?.iamType === "User";
    const isGroup = (n) => n.type === "iamGroupNode" || (n.type === "iamNode" && n.data?.iamType === "Group");
    const isS3Bucket = (n) => n.type === "s3Node";
    const isS3Object = (n) => n.type === "s3ObjectNode";

    if ((isGroup(source) && isUser(target)) || (isUser(source) && isGroup(target))) {
      return true;
    }

    if ((isS3Bucket(source) && isS3Object(target)) || (isS3Object(source) && isS3Bucket(target))) {
      return true;
    }

    return false;
  }, [nodes]);

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

  const [budgetSearch, setBudgetSearch] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("all");
  const [expandedBudgetNodes, setExpandedBudgetNodes] = useState(new Set());

  const toggleBudgetNode = (nodeId) => {
    setExpandedBudgetNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

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
  const [sortBy, setSortBy] = useState("date"); // "date", "numerical", "alphabetic"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc", "desc"
  const [editingDeploymentId, setEditingDeploymentId] = useState(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [toast, setToast] = useState(null);
  const [activeSubnetModal, setActiveSubnetModal] = useState(null); // null | 'nat' | 'rt' | 'nacl'

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "warning",
  });

  const showConfirm = ({ title, message, onConfirm, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      type,
    });
  };

  const eventSourceRef = useRef(null);
  const terminalEndRef = useRef(null);

  const sortedDeployments = useMemo(() => {
    const chronologicalList = [...deployments].sort((a, b) => a.timestamp - b.timestamp);
    const chronologicalMap = new Map();
    chronologicalList.forEach((dep, idx) => {
      chronologicalMap.set(dep.id, {
        defaultName: `Deploy #${idx + 1}`,
        defaultIndex: idx + 1
      });
    });

    const list = [...deployments];

    const getName = (dep) => {
      return dep.name || chronologicalMap.get(dep.id)?.defaultName || "";
    };

    const getNumericalValue = (dep) => {
      if (dep.name) {
        const match = dep.name.match(/\d+/);
        if (match) return parseInt(match[0], 10);
      }
      return chronologicalMap.get(dep.id)?.defaultIndex || 0;
    };

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = a.timestamp - b.timestamp;
      } else if (sortBy === "numerical") {
        comparison = getNumericalValue(a) - getNumericalValue(b);
      } else if (sortBy === "alphabetic") {
        comparison = getName(a).localeCompare(getName(b), undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [deployments, sortBy, sortOrder]);

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
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("appearance");
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const modeColors = useMemo(() => {
    const isAudit = activeMode === "audit";
    const isBudgets = activeMode === "budgets";
    return {
      text: isAudit ? "text-indigo-600 dark:text-indigo-500" : isBudgets ? "text-emerald-600 dark:text-emerald-500" : "text-amber-600 dark:text-amber-500",
      text500: isAudit ? "text-indigo-500" : isBudgets ? "text-emerald-500" : "text-amber-500",
      textHover: isAudit ? "hover:text-indigo-600 dark:hover:text-indigo-500" : isBudgets ? "hover:text-emerald-600 dark:hover:text-emerald-500" : "hover:text-amber-600 dark:hover:text-amber-500",
      textHover500: isAudit ? "hover:text-indigo-500 dark:hover:text-indigo-400" : isBudgets ? "hover:text-emerald-500 dark:hover:text-emerald-400" : "hover:text-amber-500 dark:hover:text-amber-400",
      bg: isAudit ? "bg-indigo-600" : isBudgets ? "bg-emerald-600" : "bg-amber-500",
      bg500: isAudit ? "bg-indigo-500" : isBudgets ? "bg-emerald-500" : "bg-amber-500",
      bgHover: isAudit ? "hover:bg-indigo-500" : isBudgets ? "hover:bg-emerald-500" : "hover:bg-amber-400",
      focusBorder: isAudit ? "focus:border-indigo-500" : isBudgets ? "focus:border-emerald-500" : "focus:border-amber-500",
      focusRing: isAudit ? "focus:ring-indigo-500" : isBudgets ? "focus:ring-emerald-500" : "focus:ring-amber-500",
      border300: isAudit ? "border-indigo-300 dark:border-indigo-500/30" : isBudgets ? "border-emerald-300 dark:border-emerald-500/30" : "border-amber-300 dark:border-amber-500/30",
      accent: isAudit ? "accent-indigo-500" : isBudgets ? "accent-emerald-500" : "accent-amber-500",
      selectedItem: isAudit ? "bg-indigo-100/50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30" : isBudgets ? "bg-emerald-100/50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30" : "bg-amber-100/50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30",
      selectedText: isAudit ? "text-indigo-700 dark:text-indigo-500" : isBudgets ? "text-emerald-700 dark:text-emerald-500" : "text-amber-700 dark:text-amber-500",
    };
  }, [activeMode]);

  // Filesystem directory browser states
  const [isFsModalOpen, setIsFsModalOpen] = useState(false);
  const [fsCurrentPath, setFsCurrentPath] = useState("");
  const [fsParentPath, setFsParentPath] = useState("");
  const [fsFolders, setFsFolders] = useState([]);
  const [fsFiles, setFsFiles] = useState([]);
  const [fsSelectedItem, setFsSelectedItem] = useState(null);
  const [fsOnSelect, setFsOnSelect] = useState(() => () => { });

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
    networking: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [nodePaletteSearch, setNodePaletteSearch] = useState("");
  const searchInputRef = useRef(null);
  const mainSearchInputRef = useRef(null);
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
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      
      // Ctrl + / -> Focus main search input (globally accessible)
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setTimeout(() => {
          mainSearchInputRef.current?.focus();
          mainSearchInputRef.current?.select();
        }, 50);
        return;
      }

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.shiftKey && e.key === "Tab") {
        // Shift + Tab -> Toggle Nodes Panel
        e.preventDefault();
        setIsLeftPanelOpen((prev) => !prev);
      } else if (!e.shiftKey && e.key === "Tab") {
        // Tab -> Cycle between modes
        e.preventDefault();
        setActiveMode((prev) => {
          if (prev === "dev") return "audit";
          if (prev === "audit") return "budgets";
          return "dev";
        });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, setIsLeftPanelOpen, setActiveMode]);

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

  const onNodesChange = useCallback(
    (changes) => {
      const removeChanges = changes.filter((c) => c.type === "remove");
      if (removeChanges.length > 0) {
        // Inspect if any of the nodes being removed is a group with children
        const groupRemoveChanges = removeChanges.filter((c) => {
          const node = nodes.find((n) => n.id === c.id);
          if (node) {
            const isGroup = node.type === "iamGroupNode" || node.type === "s3Node" || node.type === "vpcNode" || node.type === "subnetNode";
            if (isGroup) {
              const children = nodes.filter((n) => n.parentId === node.id);
              if (children.length > 0) return true;
            }
          }
          return false;
        });

        if (groupRemoveChanges.length > 0) {
          // Intercept group deletion and show warning dialog
          const firstGroupChange = groupRemoveChanges[0];
          const node = nodes.find((n) => n.id === firstGroupChange.id);
          const children = nodes.filter((n) => n.parentId === node.id);

          showConfirm({
            title: "Delete Group and Children?",
            message: "The items inside that group will also get deleted. It is advised to relocate them to another group before proceeding. Do you want to proceed?",
            type: "danger",
            confirmText: "Yes, Delete All",
            cancelText: "No, Keep Group",
            onConfirm: () => {
              takeSnapshot();
              // Delete parent group and all its nested children
              setNodes((nds) => {
                let updated = nds.filter((n) => n.id !== node.id && n.parentId !== node.id);
                return layoutAllVpcs(updated);
              });
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== node.id &&
                    e.target !== node.id &&
                    !children.some((child) => e.source === child.id || e.target === child.id)
                )
              );
              if (selectedNodeId === node.id || children.some((child) => selectedNodeId === child.id)) {
                setSelectedNodeId(null);
              }
              addLog(`🗑️ Deleted group ${node.data?.label || node.id} and its children.`, "warn");
            },
          });

          // If there are other (non-intercepted) changes, process them.
          const remainingChanges = changes.filter((c) => !groupRemoveChanges.some((gr) => gr.id === c.id));
          if (remainingChanges.length > 0) {
            onNodesChange(remainingChanges);
          }
          return;
        }

        // Process normal removals
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

              const cfg = getGroupLayoutConfig(parentGroupNode.type, newChildrenCount);

              nextNodes = nextNodes.map((n) => {
                if (n.id === parentId) {
                  return {
                    ...n,
                    style: {
                      ...n.style,
                      height: cfg.minHeight,
                      width: cfg.minWidth,
                    },
                  };
                }
                if (n.parentId === parentId) {
                  const childIndex = remainingChildren.findIndex((child) => child.id === n.id);
                  return {
                    ...n,
                    position: cfg.getChildPosition(childIndex),
                  };
                }
                return n;
              });
            }
          });

          return layoutAllVpcs(nextNodes);
        });
      } else {
        standardOnNodesChange(changes);
      }
    },
    [standardOnNodesChange, setNodes, nodes, selectedNodeId, showConfirm, takeSnapshot, setEdges, setSelectedNodeId, addLog]
  );


  // CONNECT HANDLER
  const onConnect = useCallback(
    (params) => {
      if (isDisallowedConnection(params.source, params.target)) {
        setToast("Nest components inside the parent instead of connecting via edge");
        addLog("⚠️ Connection disallowed: Nest components inside the parent instead of connecting via edge.", "warn");
        return;
      }
      takeSnapshot();
      setEdges((eds) => addEdge(params, eds));
      connectionMade.current = true;
    },
    [setEdges, takeSnapshot, isDisallowedConnection, addLog],
  );

  // RECONNECT HANDLER: Allows user to drag existing edges to new handles
  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      if (isDisallowedConnection(newConnection.source, newConnection.target)) {
        setToast("Nest components inside the parent instead of connecting via edge");
        addLog("⚠️ Connection disallowed: Nest components inside the parent instead of connecting via edge.", "warn");
        return;
      }
      takeSnapshot();
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      addLog(`🔌 Edge re-routed successfully.`, "info");
      connectionMade.current = true;
    },
    [setEdges, takeSnapshot, addLog, isDisallowedConnection],
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
    if (nodeType === "vpcNode") {
      centeredPosition.x -= 265;
      centeredPosition.y -= 100;
    } else if (nodeType === "subnetNode") {
      centeredPosition.x -= 240;
      centeredPosition.y -= 150;
    } else if (nodeType === "internetGatewayNode") {
      centeredPosition.x -= 140;
      centeredPosition.y -= 40;
    } else if (nodeType === "s3ObjectNode" || nodeType === "ec2Node" || (nodeType === "iamNode" && labelType !== "Group")) {
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
    } else if (nodeType === "vpcNode") {
      newNodeId = `vpc_${Date.now()}`;
      newNode = {
        id: newNodeId,
        type: "vpcNode",
        data: {
          label: `vpc-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
          cidrBlock: "10.0.0.0/16",
        },
        position: centeredPosition,
        zIndex: -1,
        style: { width: 530, height: 200 },
      };
      addLog(`➕ Added VPC and Connected.`, "success");
    } else if (nodeType === "subnetNode") {
      newNodeId = `subnet_${Date.now()}`;
      newNode = {
        id: newNodeId,
        type: "subnetNode",
        data: {
          label: `subnet-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
          cidrBlock: "10.0.1.0/24",
          hasNatGateway: false,
          hasRouteTable: true,
          hasNetworkAcl: true,
        },
        position: centeredPosition,
        zIndex: -1,
        style: { width: 480, height: 300 },
      };
      addLog(`➕ Added Subnet and Connected.`, "success");
    } else if (nodeType === "internetGatewayNode") {
      newNodeId = `igw_${Date.now()}`;
      newNode = {
        id: newNodeId,
        type: "internetGatewayNode",
        data: {
          label: `igw-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
        },
        position: centeredPosition,
        zIndex: 0,
      };
      addLog(`➕ Added Internet Gateway and Connected.`, "success");
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
      let targetHandleOnNew = "top";
      const fromNode = nodes.find((n) => n.id === fromNodeId);
      if (fromNode) {
        const fromAbsPos = getNodeAbsolutePosition(fromNode, nodes);
        const fromWidth = fromNode.style?.width || (fromNode.type === "vpcNode" ? 530 : fromNode.type === "subnetNode" ? 480 : fromNode.type === "s3Node" || fromNode.type === "iamGroupNode" ? 300 : 220);
        const fromHeight = fromNode.style?.height || (fromNode.type === "vpcNode" ? 200 : fromNode.type === "subnetNode" ? 300 : fromNode.type === "s3Node" || fromNode.type === "iamGroupNode" ? 200 : 70);

        const fromCenterX = fromAbsPos.x + fromWidth / 2;
        const fromCenterY = fromAbsPos.y + fromHeight / 2;
        
        let newWidth = 220;
        let newHeight = 80;
        if (nodeType === "vpcNode") {
          newWidth = 530;
          newHeight = 200;
        } else if (nodeType === "subnetNode") {
          newWidth = 480;
          newHeight = 300;
        } else if (nodeType === "internetGatewayNode") {
          newWidth = 280;
          newHeight = 80;
        } else if (nodeType === "s3Node" || nodeType === "iamGroupNode" || (nodeType === "iamNode" && labelType === "Group")) {
          newWidth = 300;
          newHeight = 200;
        } else if (nodeType === "shapeNode") {
          const isContainer = labelType === "Rectangle" || labelType === "Circle";
          newWidth = isContainer ? 350 : 120;
          newHeight = isContainer ? 350 : 40;
        }
        
        const newCenterX = centeredPosition.x + newWidth / 2;
        const newCenterY = centeredPosition.y + newHeight / 2;
        
        const dx = fromCenterX - newCenterX;
        const dy = fromCenterY - newCenterY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          targetHandleOnNew = dx > 0 ? "right" : "left";
        } else {
          targetHandleOnNew = dy > 0 ? "bottom" : "top";
        }
      }

      const newEdge = {
        id: `e_${Date.now()}`,
        source: fromHandleType === "source" ? fromNodeId : newNodeId,
        target: fromHandleType === "source" ? newNodeId : fromNodeId,
        sourceHandle: fromHandleType === "source" ? fromHandleId : targetHandleOnNew,
        targetHandle: fromHandleType === "source" ? targetHandleOnNew : fromHandleId,
        style: { strokeWidth: 2, stroke: "#94a3b8" },
      };

      setNodes((nds) => nds.concat(newNode));
      setEdges((eds) => eds.concat(newEdge));
    }
  }, [floatingConnectionSearch, setNodes, setEdges, takeSnapshot, addLog, userSettings.defaultRegion, nodes]);

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

  const deleteNodeAndResizeParent = useCallback((nodeId, nds) => {
    const nodeToDelete = nds.find((n) => n.id === nodeId);
    if (!nodeToDelete) return nds.filter((n) => n.id !== nodeId);

    const parentId = nodeToDelete.parentId;
    const nextNodesFiltered = nds.filter((n) => n.id !== nodeId);

    return updateParentLayoutAndVpcs(parentId, nextNodesFiltered);
  }, []);

  const onNodeDragStop = useCallback(
    (event, node) => {
      const internalNode = getNode(node.id);

      // Find if there is a valid parent node under the drag coordinates
      const intersections = getIntersectingNodes(node);
      const validNewParent = intersections.find((n) => 
        isValidParentForChild(n.type, node.type, node.data?.iamType)
      );

      // Handle node that has a current parent
      if (node.parentId) {
        const parentGroupNode = getNode(node.parentId);
        if (parentGroupNode) {
          if (validNewParent && validNewParent.id === node.parentId) {
            // Moved within same parent -> re-snap to correct grid slot
            setNodes((nds) => {
              return updateParentLayoutAndVpcs(node.parentId, nds);
            });
            addLog(`Position updated within group`, "info");
            return;
          } else {
            // Dragged OUTSIDE current parent -> either transition to new parent or detach to canvas
            setNodes((nds) => {
              const oldParentId = node.parentId;
              const newParentId = validNewParent?.id || null;

              let updatedNodes = nds.map((n) => {
                // Dragged node
                if (n.id === node.id) {
                  if (newParentId) {
                    return {
                      ...n,
                      parentId: newParentId,
                      ...(validNewParent.type === "vpcNode" ? { extent: "parent" } : { extent: undefined }),
                    };
                  } else {
                    const { parentId, extent, ...rest } = n;
                    return {
                      ...rest,
                      position: internalNode?.positionAbsolute || {
                        x: nds.find((p) => p.id === oldParentId).position.x + node.position.x,
                        y: nds.find((p) => p.id === oldParentId).position.y + node.position.y,
                      },
                    };
                  }
                }
                return n;
              });

              if (oldParentId) {
                updatedNodes = updateParentLayoutAndVpcs(oldParentId, updatedNodes);
              }
              if (newParentId) {
                updatedNodes = updateParentLayoutAndVpcs(newParentId, updatedNodes);
              }

              const targetNode = updatedNodes.find((n) => n.id === node.id);
              const withoutTarget = updatedNodes.filter((n) => n.id !== node.id);
              return [...withoutTarget, targetNode];
            });

            if (newParentId) {
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    !(
                      (e.source === node.id && e.target === newParentId) ||
                      (e.source === newParentId && e.target === node.id)
                    )
                )
              );
              addLog(`Component moved from old parent directly to new parent group`, "success");
            } else {
              addLog(`${node.type === "subnetNode" ? "Subnet" : node.type === "ec2Node" ? "EC2" : "Component"} detached from parent group`, "info");
            }
            return;
          }
        }
      }

      // Handle node that starts free on the canvas and is dropped into a group
      if (!node.parentId && validNewParent) {
        const newParentId = validNewParent.id;
        setNodes((nds) => {
          const updatedNodes = nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                parentId: newParentId,
                extent: "parent",
              };
            }
            return n;
          });

          const res = updateParentLayoutAndVpcs(newParentId, updatedNodes);
          const targetNode = res.find((n) => n.id === node.id);
          const withoutTarget = res.filter((n) => n.id !== node.id);
          return [...withoutTarget, targetNode];
        });

        setEdges((eds) =>
          eds.filter(
            (e) =>
              !(
                (e.source === node.id && e.target === newParentId) ||
                (e.source === newParentId && e.target === node.id)
              )
          )
        );

        addLog(`Component dropped into parent group`, "success");
        return;
      }
    },
    [getIntersectingNodes, getNode, setNodes, setEdges, addLog]
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

  const contextMenuRef = useRef(null);

  useLayoutEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const menuEl = contextMenuRef.current;
      const rect = menuEl.getBoundingClientRect();
      
      let x = contextMenu.x;
      let y = contextMenu.y;

      if (x + rect.width > window.innerWidth) {
        x = window.innerWidth - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }

      if (y + rect.height > window.innerHeight) {
        y = window.innerHeight - rect.height - 10;
      }
      if (y < 10) {
        y = 10;
      }

      menuEl.style.left = `${x}px`;
      menuEl.style.top = `${y}px`;
    }
  }, [contextMenu]);

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
    if (contextMenu.type === "node") {
      const node = nodes.find((n) => n.id === contextMenu.id);
      if (node) {
        const isGroup = node.type === "iamGroupNode" || node.type === "s3Node" || node.type === "vpcNode" || node.type === "subnetNode";
        const children = isGroup ? nodes.filter((n) => n.parentId === node.id) : [];

        if (isGroup && children.length > 0) {
          setContextMenu(null);
          showConfirm({
            title: "Delete Group and Children?",
            message: "The items inside that group will also get deleted. It is advised to relocate them to another group before proceeding. Do you want to proceed?",
            type: "danger",
            confirmText: "Yes, Delete All",
            cancelText: "No, Keep Group",
            onConfirm: () => {
              takeSnapshot();
              setNodes((nds) => {
                let updated = nds.filter((n) => n.id !== node.id && n.parentId !== node.id);
                return layoutAllVpcs(updated);
              });
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== node.id &&
                    e.target !== node.id &&
                    !children.some((child) => e.source === child.id || e.target === child.id)
                )
              );
              if (selectedNodeId === node.id || children.some((child) => selectedNodeId === child.id)) {
                setSelectedNodeId(null);
              }
              addLog(`🗑️ Deleted group ${node.data?.label || node.id} and its children.`, "warn");
            },
          });
          return;
        }
      }
      takeSnapshot();
      setNodes((nds) => deleteNodeAndResizeParent(contextMenu.id, nds));
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== contextMenu.id && e.target !== contextMenu.id,
        ),
      );
      if (selectedNodeId === contextMenu.id) setSelectedNodeId(null);
      addLog(`🗑️ Deleted component.`, "warn");
    } else if (contextMenu.type === "edge") {
      takeSnapshot();
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
    setNodes((nds) => {
      const newNodeObj = {
        ...clipboard,
        id: newId,
        position,
        selected: false,
        data: { ...clipboard.data, label: `${clipboard.data.label}-copy` },
      };
      const nextNodes = nds.concat(newNodeObj);
      return updateParentLayoutAndVpcs(clipboard.parentId, nextNodes);
    });
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
      if (type === "vpcNode") {
        return { w: 600, h: 400 };
      }
      if (type === "subnetNode") {
        return { w: 400, h: 250 };
      }
      if (type === "s3ObjectNode" || type === "ec2Node" || type === "iamNode" || type === "internetGatewayNode") {
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
    } else if (nodeType === "vpcNode") {
      newNode = {
        id: `vpc_${Date.now()}`,
        type: "vpcNode",
        data: {
          label: `vpc-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
          cidrBlock: "10.0.0.0/16",
        },
        position: resolvedPosition,
        zIndex: -1,
        style: { width: 530, height: 200 },
      };
      addLog(`➕ Added VPC.`, "info");
    } else if (nodeType === "subnetNode") {
      let parentGroupId = null;
      if (position) {
        const vpcNode = nodes.find((n) => {
          if (n.type !== "vpcNode") return false;
          const gx = n.position.x;
          const gy = n.position.y;
          const gw = n.style?.width || 600;
          const gh = n.style?.height || 400;

          // Compute cursor center (offset top-left by -200, -125 in onDrop, so add them back)
          const cx = resolvedPosition.x + 200;
          const cy = resolvedPosition.y + 125;
          return cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh;
        });

        if (vpcNode) {
          parentGroupId = vpcNode.id;
        }
      }

      if (parentGroupId) {
        const subnetId = `subnet_${Date.now()}`;
        setNodes((nds) => {
          const subnetNode = {
            id: subnetId,
            type: "subnetNode",
            data: {
              label: `subnet-${Math.floor(Math.random() * 1000)}`,
              region: userSettings.defaultRegion,
              cidrBlock: "10.0.1.0/24",
              hasNatGateway: false,
              hasRouteTable: true,
              hasNetworkAcl: true,
            },
            parentId: parentGroupId,
            position: { x: 0, y: 0 },
            zIndex: -1,
            style: { width: 480, height: 300 },
            extent: "parent",
          };
          const nextNodes = nds.concat(subnetNode);
          return updateParentLayoutAndVpcs(parentGroupId, nextNodes);
        });
        setSelectedNodeId(subnetId);
        addLog(`➕ Added Subnet (Grouped).`, "success");
        return;
      } else {
        newNode = {
          id: `subnet_${Date.now()}`,
          type: "subnetNode",
          data: {
            label: `subnet-${Math.floor(Math.random() * 1000)}`,
            region: userSettings.defaultRegion,
            cidrBlock: "10.0.1.0/24",
            hasNatGateway: false,
            hasRouteTable: true,
            hasNetworkAcl: true,
          },
          position: resolvedPosition,
          zIndex: -1,
          style: { width: 480, height: 300 },
        };
        addLog(`➕ Added Subnet.`, "info");
      }
    } else if (nodeType === "internetGatewayNode") {
      newNode = {
        id: `igw_${Date.now()}`,
        type: "internetGatewayNode",
        data: {
          label: `igw-${Math.floor(Math.random() * 1000)}`,
          region: userSettings.defaultRegion,
        },
        position: resolvedPosition,
        zIndex: 0,
      };
      addLog(`➕ Added Internet Gateway.`, "info");
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
          const objNode = {
            id: objId,
            type: "s3ObjectNode",
            data: {
              label: `new-object-${Math.floor(Math.random() * 1000)}`,
              sourceType: "file",
              sourcePath: "",
              region: userSettings.defaultRegion,
            },
            parentId: parentGroupId,
            position: { x: 0, y: 0 },
            zIndex: 0,
            selected: true,
          };
          const nextNodes = nds.map(n => ({ ...n, selected: false })).concat(objNode);
          return updateParentLayoutAndVpcs(parentGroupId, nextNodes);
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
      let parentGroupId = null;
      if (position) {
        const subnetNode = nodes.find((n) => {
          if (n.type !== "subnetNode") return false;
          // Get absolute position of the Subnet in case it is nested inside a VPC
          const getAbsPos = (node) => {
            let x = node.position.x;
            let y = node.position.y;
            let curr = node;
            while (curr.parentId) {
              const parent = nodes.find((p) => p.id === curr.parentId);
              if (!parent) break;
              x += parent.position.x;
              y += parent.position.y;
              curr = parent;
            }
            return { x, y };
          };
          const pos = getAbsPos(n);
          const gw = n.style?.width || 400;
          const gh = n.style?.height || 250;

          // Compute cursor center (offset top-left by -110, -35 in onDrop, so add them back)
          const cx = resolvedPosition.x + 110;
          const cy = resolvedPosition.y + 35;
          return cx >= pos.x && cx <= pos.x + gw && cy >= pos.y && cy <= pos.y + gh;
        });

        if (subnetNode) {
          parentGroupId = subnetNode.id;
        }
      }

      if (parentGroupId) {
        const ec2Id = `ec2_${Date.now()}`;
        setNodes((nds) => {
          const ec2Node = {
            id: ec2Id,
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
            parentId: parentGroupId,
            position: { x: 60, y: 0 },
            zIndex: 0,
          };
          const nextNodes = nds.concat(ec2Node);
          return updateParentLayoutAndVpcs(parentGroupId, nextNodes);
        });
        setSelectedNodeId(ec2Id);
        addLog(`➕ Added EC2 Instance (Grouped).`, "success");
        return;
      } else {
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
      }
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
          const userNode = {
            id: userId,
            type: "iamNode",
            data: {
              label: `new-user-${Math.floor(Math.random() * 1000)}`,
              iamType: "User",
              region: userSettings.defaultRegion,
            },
            parentId: parentGroupId,
            position: { x: 0, y: 0 },
            zIndex: 0,
            selected: true,
          };
          const nextNodes = nds.map(n => ({ ...n, selected: false })).concat(userNode);
          return updateParentLayoutAndVpcs(parentGroupId, nextNodes);
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
  const addNewVpcNode = () => spawnNode("vpcNode");
  const addNewSubnetNode = () => spawnNode("subnetNode");
  const addNewInternetGatewayNode = () => spawnNode("internetGatewayNode");

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
        if (nodeType === "s3Node" || nodeType === "s3ObjectNode" || nodeType === "ec2Node" || (nodeType === "iamNode" && labelType !== "Group") || nodeType === "internetGatewayNode") {
          centeredPosition.x -= 110;
          centeredPosition.y -= 35;
        } else if (nodeType === "iamGroupNode" || labelType === "Group") {
          centeredPosition.x -= 150;
          centeredPosition.y -= 100;
        } else if (nodeType === "vpcNode") {
          centeredPosition.x -= 300;
          centeredPosition.y -= 200;
        } else if (nodeType === "subnetNode") {
          centeredPosition.x -= 200;
          centeredPosition.y -= 125;
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
    const hasGroupWithChildren = nodes.some((node) => {
      const isGroup = node.type === "iamGroupNode" || node.type === "s3Node" || node.type === "vpcNode" || node.type === "subnetNode";
      if (isGroup) {
        const hasChildren = nodes.some((child) => child.parentId === node.id);
        if (hasChildren) return true;
      }
      return false;
    });

    const executeClear = () => {
      takeSnapshot();
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      addLog("🗑️ Visual canvas flushed.", "warn");
    };

    if (hasGroupWithChildren) {
      showConfirm({
        title: "Clear Canvas?",
        message: "There are one or multiple groups with items inside, which will get deleted. Do you wish to proceed?",
        type: "danger",
        confirmText: "Yes, Clear All",
        cancelText: "No, Keep Canvas",
        onConfirm: executeClear,
      });
    } else {
      executeClear();
    }
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
          canvasState: { nodes, edges },
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

  const handleClearHistory = () => {
    showConfirm({
      title: "Clear Deployment History",
      message: "Are you sure you want to clear the entire deployment history? This will delete all saved versions.",
      confirmText: "Clear History",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
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
      }
    });
  };

  const handleSaveName = async (id, newName) => {
    if (!newName.trim()) return;
    try {
      const response = await fetch(`http://localhost:3001/api/deployments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (response.ok) {
        setDeployments((prev) =>
          prev.map((dep) => (dep.id === id ? { ...dep, name: newName.trim() } : dep))
        );
        setSelectedDeployment((prev) =>
          prev && prev.id === id ? { ...prev, name: newName.trim() } : prev
        );
        addLog(`📝 Deployment name updated successfully.`, "success");
      } else {
        addLog(`❌ Failed to update deployment name.`, "error");
      }
    } catch (err) {
      console.error("Failed to update deployment name:", err);
      addLog(`❌ Error updating deployment name.`, "error");
    } finally {
      setEditingDeploymentId(null);
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

  const getLogoGradientClass = () => {
    switch (activeMode) {
      case "audit":
        return "from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600";
      case "budgets":
        return "from-emerald-600 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600";
      default:
        return "from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500";
    }
  };

  const getExportButtonClass = () => {
    switch (activeMode) {
      case "audit":
        return "bg-indigo-600/70 hover:bg-indigo-600/80 backdrop-blur-md text-white border border-indigo-500/30 shadow-[0_4px_15px_rgba(79,70,229,0.2)]";
      case "budgets":
        return "bg-emerald-600/70 hover:bg-emerald-600/80 backdrop-blur-md text-white border border-emerald-500/30 shadow-[0_4px_15px_rgba(16,185,129,0.2)]";
      default:
        return "bg-amber-500/70 hover:bg-amber-500/80 backdrop-blur-md text-white dark:text-zinc-950 border border-amber-500/30 shadow-[0_4px_15px_rgba(245,158,11,0.2)]";
    }
  };

  const getMenuHoverClass = () => {
    switch (activeMode) {
      case "audit":
        return "hover:text-indigo-600 dark:hover:text-indigo-500";
      case "budgets":
        return "hover:text-emerald-600 dark:hover:text-emerald-500";
      default:
        return "hover:text-amber-600 dark:hover:text-amber-500";
    }
  };

  const sidebarItems = useMemo(() => {
    const commonCompute = {
      id: "ec2Node",
      label: "EC2 Instance",
      category: "compute",
      icon: <Cpu size={14} />,
      iconBgClass: "bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-500 border border-sky-200 dark:border-sky-500/20",
      action: addNewEC2Node,
      dragType: "ec2Node",
      dragLabelType: null,
    };

    if (activeMode === "audit") {
      return [
        {
          id: "vpcNode",
          label: "VPC",
          category: "networking",
          icon: <Network size={14} />,
          iconBgClass: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border border-indigo-200 dark:border-indigo-500/20",
          action: addNewVpcNode,
          dragType: "vpcNode",
          dragLabelType: null,
        },
        {
          id: "subnetNode",
          label: "Subnet",
          category: "networking",
          icon: <Layers size={14} />,
          iconBgClass: "bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-500 border border-teal-200 dark:border-teal-500/20",
          action: addNewSubnetNode,
          dragType: "subnetNode",
          dragLabelType: null,
        },
        {
          id: "internetGatewayNode",
          label: "Internet Gateway",
          category: "networking",
          icon: <Globe size={14} />,
          iconBgClass: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border border-indigo-200 dark:border-indigo-500/20",
          action: addNewInternetGatewayNode,
          dragType: "internetGatewayNode",
          dragLabelType: null,
        },
        commonCompute
      ];
    }

    return [
      {
        id: "s3Node",
        label: "S3 Bucket",
        category: "aws",
        icon: <Database size={14} />,
        iconBgClass: "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20",
        action: addNewS3Node,
        dragType: "s3Node",
        dragLabelType: null,
      },
      {
        id: "s3ObjectNode",
        label: "S3 Object",
        category: "aws",
        icon: <File size={14} />,
        iconBgClass: "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20",
        action: addNewS3ObjectNode,
        dragType: "s3ObjectNode",
        dragLabelType: null,
      },
      commonCompute,
      {
        id: "iamUser",
        label: "IAM User",
        category: "iam",
        icon: <User size={14} />,
        iconBgClass: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20",
        action: () => addNewIAMNode("User"),
        dragType: "iamNode",
        dragLabelType: "User",
      },
      {
        id: "iamGroup",
        label: "IAM Group",
        category: "iam",
        icon: <Users size={14} />,
        iconBgClass: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20",
        action: () => addNewIAMNode("Group"),
        dragType: "iamGroupNode",
        dragLabelType: "Group",
      },
      {
        id: "iamRole",
        label: "IAM Role",
        category: "iam",
        icon: <Shield size={14} />,
        iconBgClass: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20",
        action: () => addNewIAMNode("Role"),
        dragType: "iamNode",
        dragLabelType: "Role",
      },
      {
        id: "iamPolicy",
        label: "IAM Policy",
        category: "iam",
        icon: <Key size={14} />,
        iconBgClass: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-500/20",
        action: () => addNewIAMNode("Policy"),
        dragType: "iamNode",
        dragLabelType: "Policy",
      },
      {
        id: "shapeRectangle",
        label: "Rectangle Group",
        category: "shapes",
        icon: <Square size={14} />,
        iconBgClass: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20",
        action: () => addNewShape("Rectangle"),
        dragType: "shapeNode",
        dragLabelType: "Rectangle",
      },
      {
        id: "shapeCircle",
        label: "Circle Group",
        category: "shapes",
        icon: <CircleIcon size={14} />,
        iconBgClass: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20",
        action: () => addNewShape("Circle"),
        dragType: "shapeNode",
        dragLabelType: "Circle",
      },
      {
        id: "shapeText",
        label: "Text Label",
        category: "shapes",
        icon: <Type size={14} />,
        iconBgClass: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20",
        action: () => addNewShape("Text"),
        dragType: "shapeNode",
        dragLabelType: "Text",
      }
    ];
  }, [activeMode, addNewS3Node, addNewS3ObjectNode, addNewEC2Node, addNewIAMNode, addNewShape, addNewVpcNode, addNewSubnetNode, addNewInternetGatewayNode]);

  const categories = useMemo(() => {
    if (activeMode === "audit") {
      return [
        { id: "networking", label: "Networking" },
        { id: "compute", label: "Compute" }
      ];
    }
    return [
      { id: "aws", label: "Storage" },
      { id: "compute", label: "Compute" },
      { id: "iam", label: "IAM" },
      { id: "shapes", label: "Shapes & Groups" }
    ];
  }, [activeMode]);

  const filteredCategories = useMemo(() => {
    const query = nodePaletteSearch.toLowerCase().trim();

    // Helper to compare two nodes
    const compareNodes = (a, b) => {
      if (!query) return 0; // Keep original order if query is empty

      const labelA = a.label.toLowerCase();
      const labelB = b.label.toLowerCase();

      const startsWithA = labelA.startsWith(query);
      const startsWithB = labelB.startsWith(query);

      if (startsWithA && !startsWithB) return -1;
      if (!startsWithA && startsWithB) return 1;

      // If both start with the query, or both don't start with it, sort alphabetically
      return a.label.localeCompare(b.label);
    };

    // Map categories, filter items, and sort items inside each category
    const mapped = categories.map((cat) => {
      const items = sidebarItems.filter(
        (item) =>
          item.category === cat.id &&
          item.label.toLowerCase().includes(query)
      );

      // Sort items inside this category
      const sortedItems = [...items].sort(compareNodes);

      return { ...cat, items: sortedItems };
    }).filter((cat) => cat.items.length > 0);

    // If query is active, sort categories by their best (first) item
    if (query) {
      mapped.sort((catA, catB) => {
        const bestA = catA.items[0];
        const bestB = catB.items[0];
        return compareNodes(bestA, bestB);
      });
    }

    return mapped;
  }, [categories, sidebarItems, nodePaletteSearch]);

  const isRightPanelOpen = !!selectedNode || (activeMode === "audit" && !isAuditLegendCollapsed);

  const minimapStyle = useMemo(() => {
    const isDark = userSettings.theme === "dark";
    const isForest = userSettings.theme === "forest";
    const showAuditBadge = activeMode === "audit" && !selectedNode && isAuditLegendCollapsed;

    let backgroundColor = "rgba(255, 255, 255, 0.85)";
    let borderColor = "#e2e8f0";

    if (isDark) {
      backgroundColor = "rgba(9, 9, 11, 0.8)";
      borderColor = "#27272a";
    } else if (isForest) {
      backgroundColor = "rgba(16, 28, 23, 0.8)";
      borderColor = "#2C3E35";
    }

    return {
      right: isRightPanelOpen ? 368 : 24,
      bottom: showAuditBadge ? 80 : 24,
      margin: 0,
      width: 140,
      height: 100,
      backgroundColor,
      border: `1px solid ${borderColor}`,
      borderRadius: "16px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      transition: "right 0.3s ease-in-out, bottom 0.3s ease-in-out, background-color 0.3s, border-color 0.3s",
    };
  }, [userSettings.theme, isRightPanelOpen, activeMode, selectedNode, isAuditLegendCollapsed]);

  const minimapNodeColor = useCallback((node) => {
    if (node.type === "s3Node" || node.type === "s3ObjectNode") return "#f59e0b"; // amber
    if (node.type === "ec2Node") return "#0ea5e9"; // sky
    if (node.type === "iamNode" || node.type === "iamGroupNode") return "#8b5cf6"; // violet
    if (node.type === "shapeNode") return "#3b82f6"; // blue
    return userSettings.theme === "light" ? "#e2e8f0" : "#27272a";
  }, [userSettings.theme]);

  const minimapMaskColor = useMemo(() => {
    if (userSettings.theme === "dark") return "rgba(255, 255, 255, 0.04)";
    if (userSettings.theme === "forest") return "rgba(255, 255, 255, 0.03)";
    return "rgba(0, 0, 0, 0.06)";
  }, [userSettings.theme]);

  return (
    <ModeContext.Provider value={activeMode}>
      <SettingsContext.Provider value={userSettings}>
      <div className={`h-screen w-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-300 font-sans antialiased select-none overflow-hidden relative transition-colors duration-300 mode-${activeMode}`}>
        {/* CANVAS ENGINE */}
        <main ref={reactFlowWrapper} className="absolute inset-0 z-0">
          <ReactFlow
            nodes={evaluatedNodes}
            edges={styledEdges}
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
            {userSettings.showMinimap && (
              <MiniMap
                position="bottom-right"
                style={minimapStyle}
                nodeColor={minimapNodeColor}
                nodeBorderRadius={4}
                maskColor={minimapMaskColor}
                maskStrokeColor={userSettings.theme === "light" ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)"}
                maskStrokeWidth={1.5}
              />
            )}
          </ReactFlow>
        </main>

        {/* FLOATING HEADER */}
        <header className="absolute top-6 inset-x-6 flex items-center justify-between pointer-events-none z-40">
          {/* Left Island (Menu, Project & Undo/Redo) */}
          <div className="flex items-center gap-4 pointer-events-auto relative">
            <button
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className={`p-3 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-xl text-slate-600 dark:text-zinc-400 ${getMenuHoverClass()} hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 shadow-sm dark:shadow-xl transition-colors`}
            >
              <Menu size={20} />
            </button>

            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsProjectDropdownOpen(!isProjectDropdownOpen);
              }}
              className="flex items-center gap-3 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 px-4 py-2.5 rounded-xl shadow-sm dark:shadow-xl cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className={`p-1.5 rounded-md bg-gradient-to-tr ${getLogoGradientClass()} text-white shadow-md`}>
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
            <div className="flex items-center gap-1 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 p-1 rounded-xl shadow-sm dark:shadow-xl transition-colors">
              <button
                onClick={undo}
                disabled={past.length === 0}
                className={`p-1.5 rounded-lg transition-colors ${past.length === 0 ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <Undo size={18} />
              </button>
              <div className="w-px h-4 bg-slate-200/50 dark:bg-zinc-800/50 mx-0.5"></div>
              <button
                onClick={redo}
                disabled={future.length === 0}
                className={`p-1.5 rounded-lg transition-colors ${future.length === 0 ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <Redo size={18} />
              </button>
            </div>

            {/* MODE SWITCHER CONTROLS */}
            <div className="flex items-center gap-1 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 p-1 rounded-xl shadow-sm dark:shadow-xl transition-colors h-10">
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
                  ? "bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-500 border border-slate-200/50 dark:border-zinc-700/50 shadow-sm px-3"
                  : "text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 w-8"
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
                className="project-dropdown absolute top-full mt-2 left-14 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl rounded-xl py-2 animate-fade-in z-50 flex flex-col"
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
                    className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
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
                ref={mainSearchInputRef}
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
                className="w-full h-11 pl-10 pr-4 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-xl text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500 shadow-sm dark:shadow-xl transition-all"
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
                          <Cpu
                            size={16}
                            className="text-sky-500 shrink-0"
                          />
                        ) : res.type === "vpcNode" ? (
                          <Network
                            size={16}
                            className="text-indigo-500 shrink-0"
                          />
                        ) : res.type === "subnetNode" ? (
                          <Layers
                            size={16}
                            className="text-teal-500 shrink-0"
                          />
                        ) : res.type === "internetGatewayNode" ? (
                          <Globe
                            size={16}
                            className="text-indigo-500 shrink-0"
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
                                    : res.type === "vpcNode"
                                      ? "AWS VPC"
                                      : res.type === "subnetNode"
                                        ? "AWS Subnet"
                                        : res.type === "internetGatewayNode"
                                          ? "AWS Internet Gateway"
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
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 shadow-sm dark:shadow-xl transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setIsDocsOpen(true)}
              className="p-2.5 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 shadow-sm dark:shadow-xl transition-colors"
              title="Documentations"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => {
                fetchDeploymentsList();
                setIsDeploymentsModalOpen(true);
              }}
              className="p-2.5 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 shadow-sm dark:shadow-xl transition-colors"
              title="Deployment History"
            >
              <History size={18} />
            </button>
            <div className="h-6 w-px bg-slate-300/50 dark:bg-zinc-800/50 mx-1" />
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="flex items-center gap-2 px-4 h-11 text-xs font-bold rounded-xl bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-zinc-300 shadow-sm dark:shadow-xl transition-all"
            >
              <Terminal size={14} /> Diagnostics
            </button>
            <button
              onClick={compileTerraform}
              className={`flex items-center gap-2 px-6 h-11 text-xs font-bold rounded-xl active:scale-95 transition-all ${getExportButtonClass()}`}
            >
              <Play size={14} fill="currentColor" /> Review & Export
            </button>
          </div>
        </header>

        {/* FLOATING LEFT SIDEBAR (Accordion IDE Style) */}
        <aside
          className={`absolute top-24 bottom-6 left-6 w-72 z-30 overflow-hidden transition-all duration-300 ease-in-out border border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl flex flex-col rounded-2xl shadow-xl dark:shadow-2xl ${
            isLeftPanelOpen
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "-translate-x-[calc(100%+1.5rem)] opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col w-72 h-full overflow-hidden">
            {/* SEARCH INPUT BAR */}
            <div className="p-3 border-b border-slate-100 dark:border-zinc-900/50">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search nodes..."
                  value={nodePaletteSearch}
                  onChange={(e) => setNodePaletteSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-xl text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" size={13} />
                {nodePaletteSearch && (
                  <button
                    onClick={() => setNodePaletteSearch("")}
                    className="absolute right-3 top-2.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* SCROLLABLE CATEGORIES LIST */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
                  <FolderOpen size={32} className="text-slate-300 dark:text-zinc-700 mb-1 animate-pulse" />
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">No projects created</p>
                  <button
                    onClick={onNewProjectFlow}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white dark:text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Create New Project
                  </button>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Search size={24} className="text-slate-300 dark:text-zinc-700 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">No nodes found</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Try searching for another term</p>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isExpanded = nodePaletteSearch ? true : expandedCategories[cat.id];
                  return (
                    <div key={cat.id} className="flex flex-col gap-1 mb-2">
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="flex items-center gap-2 px-2 py-2 w-full hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors text-left group"
                      >
                        <ChevronRight
                          size={14}
                          className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors">
                          {cat.label}
                        </span>
                      </button>
                      <div
                        className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out origin-top ${isExpanded ? "max-h-[500px] opacity-100 scale-y-100 mt-1" : "max-h-0 opacity-0 scale-y-0"}`}
                      >
                        <div className="pl-6 pr-2 pb-1 flex flex-col gap-2">
                          {cat.items.map((item) => (
                            <button
                              key={item.id}
                              onClick={item.action}
                              draggable={true}
                              onDragStart={(e) => {
                                if (item.dragLabelType) {
                                  onDragStart(e, item.dragType, item.dragLabelType);
                                } else {
                                  onDragStart(e, item.dragType);
                                }
                              }}
                              className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all group shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md transition-all ${item.iconBgClass}`}>
                                  {item.icon}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                                  {item.label}
                                </span>
                              </div>
                              {item.category !== "shapes" && (
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 transition-all">
                                  + Add
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* FLOATING RIGHT SIDEBAR */}
        {selectedNode && (
          <aside className="absolute top-24 right-6 bottom-6 w-96 z-30 border border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl flex flex-col overflow-hidden rounded-2xl shadow-xl dark:shadow-2xl animate-fade-in">
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
                          : selectedNode.type === "vpcNode" || selectedNode.type === "subnetNode" || selectedNode.type === "internetGatewayNode"
                            ? "text-indigo-500"
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
                        : selectedNode.type === "vpcNode"
                          ? "VPC Settings"
                          : selectedNode.type === "subnetNode"
                            ? "Subnet Settings"
                            : selectedNode.type === "internetGatewayNode"
                              ? "Internet Gateway Settings"
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

                  {/* SECURITY GROUP SECTION */}
                  <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 mt-2 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
                        Security Group
                      </span>
                    </div>

                    <div className="flex items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        id="hasCustomSecurityGroup"
                        checked={!!selectedNode.data?.hasCustomSecurityGroup}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          if (enabled) {
                            const currentSgs = selectedNode.data?.securityGroups || (selectedNode.data?.securityGroup ? [selectedNode.data.securityGroup] : []);
                            const nextSgs = currentSgs.length > 0 ? currentSgs : [
                              {
                                id: `sg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                name: `${selectedNode.data?.label || "ec2"}-sg`,
                                rules: [
                                  { id: "default-ssh", type: "ingress", protocol: "tcp", fromPort: 22, toPort: 22, cidr: "0.0.0.0/0", description: "Allow SSH" },
                                  { id: "default-http", type: "ingress", protocol: "tcp", fromPort: 80, toPort: 80, cidr: "0.0.0.0/0", description: "Allow HTTP" }
                                ]
                              }
                            ];
                            setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, hasCustomSecurityGroup: true, securityGroups: nextSgs } } : n));
                          } else {
                            setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, hasCustomSecurityGroup: false } } : n));
                          }
                          takeSnapshot();
                        }}
                        className="rounded border-slate-300 dark:border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <label htmlFor="hasCustomSecurityGroup" className="text-xs font-semibold text-slate-600 dark:text-zinc-400 select-none cursor-pointer">
                        Enable Custom Security Group
                      </label>
                    </div>

                    {selectedNode.data?.hasCustomSecurityGroup ? (
                      <div className="flex flex-col gap-3 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, isSgPopupOpen: true } } : n));
                          }}
                          className="flex items-center justify-center gap-2 w-full h-10 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl border border-emerald-100 dark:border-emerald-500/20 transition-all shadow-sm"
                        >
                          <Shield size={14} />
                          Configure Security Groups
                        </button>

                        {/* List of currently attached SGs */}
                        <div className="flex flex-col gap-1.5 mt-1 font-sans">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                            Attached SGs ({selectedNode.data?.securityGroups?.length || 0})
                          </label>
                          {(selectedNode.data?.securityGroups || []).length === 0 ? (
                            <div className="p-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-center text-[10px] text-slate-450 dark:text-zinc-500 italic bg-slate-50 dark:bg-zinc-900/10">
                              No SGs attached. Default AWS SG will be used.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto custom-scrollbar">
                              {(selectedNode.data?.securityGroups || []).map((sg) => (
                                <div key={sg?.id || Math.random().toString()} className="p-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-zinc-800/60 rounded-lg flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
                                  <span className="font-bold truncate max-w-[150px]">{sg?.name || "custom-sg"}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">({sg?.rules?.length || 0} rules)</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/60 rounded-xl flex items-center gap-2.5 text-slate-450 dark:text-zinc-550 font-mono text-[10px]">
                        <Shield size={14} className="shrink-0 text-slate-400" />
                        <span>Using default AWS security group. Enable custom SG to define inbound/outbound rules.</span>
                      </div>
                    )}
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
                                setNodes((nds) => deleteNodeAndResizeParent(child.id, nds));
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
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${(selectedNode.data?.sourceType || "file") === "file"
                          ? "bg-white dark:bg-zinc-800 text-amber-500 shadow-sm"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                          }`}
                      >
                        File
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNodeData("sourceType", "folder")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${selectedNode.data?.sourceType === "folder"
                          ? "bg-white dark:bg-zinc-800 text-amber-500 shadow-sm"
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

              {(selectedNode.type === "vpcNode" || selectedNode.type === "subnetNode") && (
                <>
                  <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase">
                      CIDR Block
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data?.cidrBlock || ""}
                      onChange={(e) => updateNodeData("cidrBlock", e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-100 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                    />
                  </div>
                </>
              )}

              {selectedNode.type === "subnetNode" && (
                <>
                  <div className="space-y-3.5 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none mb-4">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Subnet Components
                    </h4>

                    {/* NAT Gateway Button */}
                    <div className="flex flex-col gap-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          NAT Gateway (NG)
                        </span>
                        {selectedNode.data?.hasNatGateway ? (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold text-slate-505 bg-slate-100 dark:bg-zinc-800 rounded-full border border-slate-200 dark:border-zinc-800">
                            Disabled
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSubnetModal("nat")}
                        className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 border border-teal-200 dark:border-teal-900/35 rounded-xl transition-all"
                      >
                        <Network size={13} />
                        Configure NAT Gateway
                      </button>
                    </div>

                    {/* Route Table Button */}
                    <div className="flex flex-col gap-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Route Table (RT)
                        </span>
                        {selectedNode.data?.routeTableConfig?.isCustom ? (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold text-purple-600 dark:text-purple-500 bg-purple-50 dark:bg-purple-500/10 rounded-full border border-purple-100 dark:border-purple-500/20">
                            Custom
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-full border border-blue-100 dark:border-blue-500/20">
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSubnetModal("rt")}
                        className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 border border-teal-200 dark:border-teal-900/35 rounded-xl transition-all"
                      >
                        <Compass size={13} />
                        Configure Route Table
                      </button>
                    </div>

                    {/* Network ACL Button */}
                    <div className="flex flex-col gap-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Network ACL (ACL)
                        </span>
                        {selectedNode.data?.naclConfig?.isCustom ? (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold text-purple-600 dark:text-purple-500 bg-purple-50 dark:bg-purple-500/10 rounded-full border border-purple-100 dark:border-purple-500/20">
                            Custom
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-full border border-blue-100 dark:border-blue-500/20">
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSubnetModal("nacl")}
                        className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 border border-teal-200 dark:border-teal-900/35 rounded-xl transition-all"
                      >
                        <ShieldAlert size={13} />
                        Configure Network ACL
                      </button>
                    </div>
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
                                setNodes((nds) => deleteNodeAndResizeParent(child.id, nds));
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
                    const node = nodes.find((n) => n.id === selectedNodeId);
                    if (node) {
                      const isGroup = node.type === "iamGroupNode" || node.type === "s3Node" || node.type === "vpcNode" || node.type === "subnetNode";
                      const children = isGroup ? nodes.filter((n) => n.parentId === node.id) : [];

                      if (isGroup && children.length > 0) {
                        showConfirm({
                          title: "Delete Group and Children?",
                          message: "The items inside that group will also get deleted. It is advised to relocate them to another group before proceeding. Do you want to proceed?",
                          type: "danger",
                          confirmText: "Yes, Delete All",
                          cancelText: "No, Keep Group",
                          onConfirm: () => {
                            takeSnapshot();
                            setNodes((nds) => {
                              let updated = nds.filter((n) => n.id !== node.id && n.parentId !== node.id);
                              return updated;
                            });
                            setEdges((eds) =>
                              eds.filter(
                                (e) =>
                                  e.source !== node.id &&
                                  e.target !== node.id &&
                                  !children.some((child) => e.source === child.id || e.target === child.id)
                              )
                            );
                            setSelectedNodeId(null);
                            setContextMenu(null);
                            addLog(`🗑️ Deleted group ${node.data?.label || node.id} and its children.`, "warn");
                          },
                        });
                        return;
                      }
                    }
                    takeSnapshot();
                    setNodes((nds) => deleteNodeAndResizeParent(selectedNodeId, nds));
                    setEdges((eds) =>
                      eds.filter(
                        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
                      ),
                    );
                    setSelectedNodeId(null);
                    setContextMenu(null);
                    addLog(`🗑️ Deleted component.`, "warn");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-500/20 transition-all cursor-pointer"
                >
                  <AlertTriangle size={14} /> Delete Component
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* DOCUMENTATIONS MODAL */}
        {isDocsOpen && (
          <div className="fixed inset-0 bg-slate-50 dark:bg-zinc-950 z-[70] flex flex-col animate-fade-in overflow-y-auto custom-scrollbar select-text">
            {/* Top Navigation / Header */}
            <header className="h-16 px-6 border-b border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 shrink-0 select-none">
              <div className="flex-1 flex justify-start">
                <button
                  onClick={() => setIsDocsOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors bg-transparent border-none py-1.5 focus:outline-none cursor-pointer"
                >
                  <ArrowLeft size={18} className="text-slate-500 dark:text-zinc-400" /> Back to Workspace
                </button>
              </div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-bold text-sm select-none">
                <BookOpen size={18} className="text-amber-500" />
                <span>Documentations</span>
              </div>
              <div className="flex-1 flex justify-end" />
            </header>

            {/* Main Content Area */}
            <div className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-12 py-12 space-y-12">
              
              {/* App Brand & Intro */}
              <div className="space-y-4 text-center md:text-left select-text">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                  <span className="bg-gradient-to-tr from-amber-500 to-orange-600 bg-clip-text text-transparent">
                    CloudForge
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/50 font-bold tracking-wider uppercase">
                    v1.0.0
                  </span>
                </h1>
                <p className="text-lg text-slate-650 dark:text-zinc-300 font-medium leading-relaxed">
                  A visual collaborative cloud infrastructure editor designed to design, audit, cost-analyze, and compile infrastructure architectures directly into production-ready Terraform configurations.
                </p>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  With CloudForge, you can drag and drop standard AWS cloud components onto an interactive canvas, configure properties in real-time, instantly compile state into declarative Terraform files, inspect security findings in audit mode, and run automated deployments/destruction routines through our integrated management console.
                </p>
              </div>

              {/* Screenshot Section */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
                <div className="flex items-center justify-between select-none">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                    Workspace Visual Guide Reference
                  </h3>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                    Canvas Layout Map
                  </span>
                </div>
                <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-inner bg-slate-50 dark:bg-zinc-950 flex justify-center items-center p-2 select-none">
                  <img
                    src="/docs-screenshot.png"
                    alt="CloudForge Editor Workspace Element Reference Map"
                    className="w-full h-auto object-contain max-h-[80vh] rounded-xl"
                  />
                </div>
              </div>

              {/* Explanations Grid */}
              <div className="space-y-6 select-text">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight border-b border-slate-200 dark:border-zinc-900 pb-3">
                  Workspace Elements Explained
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Item 1 */}
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                      1
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        Component Palette Drawer
                      </h4>
                      <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed">
                        Houses all available cloud resources (S3 Buckets, S3 Objects, EC2 instances, IAM configurations, Shapes/Containers) organized by category. Click <strong>+ Add</strong> or drag components onto the canvas workspace.
                      </p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                      2
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        Project Navigator & Controls
                      </h4>
                      <p className="text-xs text-slate-555 dark:text-zinc-400 leading-relaxed">
                        Displays the active project name. Click to switch projects, spin up a new project workspace, or launch the fullscreen Projects Dashboard screen.
                      </p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                      3
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        Mode Switcher & History
                      </h4>
                      <p className="text-xs text-slate-555 dark:text-zinc-400 leading-relaxed">
                        Toggles undo/redo commands and cycles the active workspace mode between standard architecture drafting (<strong>Dev</strong>), compliance/security audits (<strong>Audit</strong>), and budget cost analysis (<strong>Budgets</strong>).
                      </p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                      4
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        Global Canvas Search Engine
                      </h4>
                      <p className="text-xs text-slate-555 dark:text-zinc-400 leading-relaxed">
                        Press <code>Ctrl + /</code> or click this search bar to search for any component added to the canvas. Selecting a search option centers and zooms in on that element instantly.
                      </p>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                      5
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        Deployments History Panel
                      </h4>
                      <p className="text-xs text-slate-555 dark:text-zinc-400 leading-relaxed">
                        Opens the deployment logs history. Allows users to load historical workspace configuration snapshots back onto the canvas, view code version logs, or run terminal teardowns.
                      </p>
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                      6
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        Configuration Settings Panel
                      </h4>
                      <p className="text-xs text-slate-555 dark:text-zinc-400 leading-relaxed">
                        A central system panel containing editor preferences like dark/light/forest themes, application font size scaling, auto-save toggle controls, and canvas options.
                      </p>
                    </div>
                  </div>

                  {/* Item 7 */}
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex gap-4 md:col-span-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                      7
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        Component Properties Inspector
                      </h4>
                      <p className="text-xs text-slate-555 dark:text-zinc-400 leading-relaxed">
                        Appears on selecting any item on the canvas. Configure AWS-specific fields (like instance sizes, AMI IDs, storage allocations, role access, subnet mapping) and observe pricing/logs updates dynamically.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* SETTINGS MODAL */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-slate-900/20 dark:bg-zinc-950/60 backdrop-blur-md z-[70] flex items-center justify-center p-6 animate-fade-in">
            <div className="settings-modal bg-white/85 dark:bg-zinc-950/60 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl w-full max-w-md flex flex-col overflow-visible shadow-2xl">
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
                  <div className="flex flex-col gap-3">
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

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-3">
                        <Layers
                          size={18}
                          className="text-slate-500 dark:text-zinc-400"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                            Show Canvas MiniMap
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 mt-0.5">
                            Display a miniature navigation overview in the bottom-right
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={userSettings.showMinimap}
                        onChange={(e) =>
                          updateSettings("showMinimap", e.target.checked)
                        }
                        className="accent-amber-500 h-5 w-5 rounded cursor-pointer"
                      />
                    </div>
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

        {/* SECURITY GROUP CONFIGURATION MODAL */}
        {(() => {
          const sgNode = nodes.find((n) => n.type === "ec2Node" && n.data?.isSgPopupOpen);
          if (!sgNode) return null;

          const handleUpdateSgs = (action, payload) => {
            if (action === "create-attach") {
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id === sgNode.id) {
                    const currentSgs = Array.isArray(n.data?.securityGroups) ? n.data.securityGroups : [];
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        hasCustomSecurityGroup: true,
                        securityGroups: [...currentSgs, payload]
                      }
                    };
                  }
                  return n;
                })
              );
              addLog(`Created and attached Security Group: ${payload.name}`, "info");
            } else if (action === "attach") {
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id === sgNode.id) {
                    const currentSgs = Array.isArray(n.data?.securityGroups) ? n.data.securityGroups : [];
                    if (currentSgs.some(sg => sg.id === payload.id)) return n;
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        hasCustomSecurityGroup: true,
                        securityGroups: [...currentSgs, payload]
                      }
                    };
                  }
                  return n;
                })
              );
              addLog(`Attached Security Group: ${payload.name}`, "info");
            } else if (action === "detach") {
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id === sgNode.id) {
                    const currentSgs = Array.isArray(n.data?.securityGroups) ? n.data.securityGroups : [];
                    const filtered = currentSgs.filter(sg => sg.id !== payload);
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        hasCustomSecurityGroup: filtered.length > 0,
                        securityGroups: filtered
                      }
                    };
                  }
                  return n;
                })
              );
              addLog(`Detached Security Group`, "info");
            } else if (action === "edit") {
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.type === "ec2Node" && n.data?.securityGroups) {
                    const updated = n.data.securityGroups.map((sg) =>
                      sg.id === payload.id ? { ...payload } : sg
                    );
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        securityGroups: updated
                      }
                    };
                  }
                  if (n.type === "ec2Node" && n.data?.securityGroup?.id === payload.id) {
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        securityGroup: payload
                      }
                    };
                  }
                  return n;
                })
              );
              addLog(`Updated Security Group rules for: ${payload.name}`, "info");
            } else if (action === "delete") {
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.type === "ec2Node" && n.data?.securityGroups) {
                    const filtered = n.data.securityGroups.filter((sg) => sg.id !== payload);
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        hasCustomSecurityGroup: filtered.length > 0,
                        securityGroups: filtered
                      }
                    };
                  }
                  if (n.type === "ec2Node" && n.data?.securityGroup?.id === payload) {
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        hasCustomSecurityGroup: false,
                        securityGroup: null
                      }
                    };
                  }
                  return n;
                })
              );
              addLog(`Deleted Security Group globally`, "warn");
            }
            takeSnapshot();
          };

          return (
            <SgManagerModal
              node={sgNode}
              nodes={nodes}
              onClose={() => {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.id === sgNode.id
                      ? { ...n, data: { ...n.data, isSgPopupOpen: false } }
                      : n
                  )
                );
              }}
              onUpdateSgs={handleUpdateSgs}
            />
          );
        })()}

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
                    <Cpu size={20} className="text-sky-500" />
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
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${instanceActiveTab === tab
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
                            className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer group gap-3 text-left ${isSelected
                              ? "bg-amber-500/5 dark:bg-amber-500/5 border-amber-500 shadow-sm"
                              : "bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${isSelected
                                  ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500"
                                  : "bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 group-hover:bg-white dark:group-hover:bg-zinc-700"
                                  }`}>
                                  <Cpu size={18} />
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${fsSelectedItem?.name === ".."
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${fsSelectedItem?.path === folder.path
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${fsSelectedItem?.path === file.path
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
            ref={contextMenuRef}
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
                  const filtered = CONNECTION_RESOURCE_OPTIONS.filter((opt) =>
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
                const filtered = CONNECTION_RESOURCE_OPTIONS.filter((opt) =>
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
                          className={`flex items-center gap-2.5 px-2.5 py-2 w-full text-left text-xs font-bold rounded-lg transition-colors group ${isActive
                            ? "bg-slate-100 dark:bg-zinc-900 text-amber-500 dark:text-amber-400"
                            : "hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300"
                            }`}
                        >
                          <div className={`p-1 rounded transition-colors ${isActive
                            ? "bg-amber-100 dark:bg-amber-500/10 text-amber-500"
                            : "bg-slate-100 dark:bg-zinc-800 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/10 text-slate-500 dark:text-zinc-400 group-hover:text-amber-500"
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
                <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-550 dark:text-zinc-400 text-[11px] font-mono">
                    {isDeploying ? (
                      <span className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        {terminalMode === "deploy" ? "Running Terraform commands..." : "Tearing down infrastructure..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold">
                        <CheckCircle2 size={14} />
                        Process exited.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModalView("code")}
                      disabled={isDeploying}
                      className="flex items-center gap-1.5 px-4 h-10 text-xs font-bold rounded-xl border shadow-sm bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowLeft size={14} /> Back to Code
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="flex items-center gap-1.5 px-5 h-10 text-xs font-bold rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white dark:text-zinc-100 border border-slate-950 dark:border-zinc-800 shadow-md transition-all active:scale-95"
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
            <div className="deployments-modal bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-6xl h-[650px] flex overflow-hidden shadow-2xl animate-scale-up">

              {/* Left Panel: List of Deployments */}
              <div className="w-80 shrink-0 border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-slate-50 dark:bg-zinc-900/30">
                <div className="h-16 shrink-0 px-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <History size={16} className="text-amber-500" /> Deployments History
                  </h3>
                </div>
                {/* Sorting Controls */}
                {deployments.length > 0 && (
                  <div className="px-3.5 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Sort</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <div className="w-[130px]">
                        <CustomSelect
                          value={sortBy}
                          onChange={(val) => setSortBy(val)}
                          className="w-full h-8 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                          options={[
                            { value: "date", label: "Date" },
                            { value: "numerical", label: "Numerical" },
                            { value: "alphabetic", label: "Alphabetical" }
                          ]}
                        />
                      </div>
                      <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center justify-center"
                        title={sortOrder === 'asc' ? "Sort Ascending" : "Sort Descending"}
                      >
                        <ArrowUpDown size={13} className={`transition-transform duration-250 ${sortOrder === 'asc' ? 'rotate-180 text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
                  {deployments.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 dark:text-zinc-500 mt-8 font-medium">
                      No deployments recorded yet.
                    </div>
                  ) : (
                    sortedDeployments.map((dep) => {
                      const isLatest = dep.id === latestDeploymentId;
                      const isSelected = selectedDeployment?.id === dep.id;
                      const formattedDate = new Date(dep.timestamp).toLocaleString();
                      const isEditing = editingDeploymentId === dep.id;

                      const getDisplayName = () => {
                        if (dep.name) return dep.name;
                        const chronologicalList = [...deployments].sort((a, b) => a.timestamp - b.timestamp);
                        const idx = chronologicalList.findIndex(d => d.id === dep.id);
                        return `Deploy #${idx + 1}`;
                      };

                      return (
                        <button
                          key={dep.id}
                          onClick={() => setSelectedDeployment(dep)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 group select-none ${isSelected
                            ? "bg-amber-100/50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30"
                            : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                            }`}
                        >
                          <div className="flex justify-between items-center w-full min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 w-full" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveName(dep.id, editNameValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingDeploymentId(null);
                                    }
                                  }}
                                  className="flex-1 text-[11px] font-bold font-mono px-2 py-0.5 border border-amber-300 dark:border-amber-500/30 rounded bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveName(dep.id, editNameValue)}
                                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 p-0.5 shrink-0"
                                  title="Save Name"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => setEditingDeploymentId(null)}
                                  className="text-rose-600 dark:text-rose-400 hover:text-rose-500 p-0.5 shrink-0"
                                  title="Cancel"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full group/name min-w-0 gap-1.5">
                                <span className={`text-[11px] font-bold font-mono tracking-wide truncate ${isSelected ? "text-amber-700 dark:text-amber-500" : "text-slate-600 dark:text-zinc-400"
                                  }`}>
                                  {getDisplayName()}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingDeploymentId(dep.id);
                                      setEditNameValue(getDisplayName());
                                    }}
                                    className="opacity-0 group-hover/name:opacity-100 focus:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-amber-500 dark:text-zinc-500 dark:hover:text-amber-500"
                                    title="Edit Name"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  {isLatest && hasDeployment && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                      Active Live
                                    </span>
                                  )}
                                </div>
                              </div>
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
                          {selectedDeployment.name || (() => {
                            const chronologicalList = [...deployments].sort((a, b) => a.timestamp - b.timestamp);
                            const idx = chronologicalList.findIndex(d => d.id === selectedDeployment.id);
                            return `Deploy #${idx + 1}`;
                          })()}
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
                      <>
                        <button
                          onClick={() => {
                            showConfirm({
                              title: "Load Deployment to Canvas",
                              message: "Are you sure you want to load this deployment version onto the canvas? Any current modifications on your canvas will be overwritten.",
                              confirmText: "Load Version",
                              cancelText: "Cancel",
                              type: "warning",
                              onConfirm: () => {
                                takeSnapshot();
                                
                                let targetNodes = [];
                                let targetEdges = [];
                                
                                if (selectedDeployment.canvasState) {
                                  targetNodes = selectedDeployment.canvasState.nodes || [];
                                  targetEdges = selectedDeployment.canvasState.edges || [];
                                } else {
                                  const parsed = reconstructCanvasFromCode(selectedDeployment.code);
                                  targetNodes = parsed.nodes;
                                  targetEdges = parsed.edges;
                                }
                                
                                setNodes(layoutAllVpcs(targetNodes));
                                setEdges(targetEdges);
                                addLog(`🔄 Loaded deployment version ${selectedDeployment.id} onto the canvas.`, "success");
                                setIsDeploymentsModalOpen(false);
                                setSelectedDeployment(null);
                              }
                            });
                          }}
                          className="flex items-center gap-1.5 px-4 h-9 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 shadow-sm transition-all active:scale-95"
                        >
                          <FolderOpen size={13} /> Load to Canvas
                        </button>
                        <button
                          onClick={() => handleRedeploy(selectedDeployment.id)}
                          className="flex items-center gap-1.5 px-4 h-9 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md transition-all active:scale-95"
                        >
                          <CloudLightning size={13} className="animate-pulse" /> Deploy This Version
                        </button>
                      </>
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

        {/* Dedicated Project Cost Dashboard Screen */}
        {activeMode === "budgets" && (
          <div className="absolute inset-0 bg-slate-50 dark:bg-[#09090b] z-30 flex flex-col pt-32 px-8 pb-8 overflow-y-auto select-text custom-scrollbar animate-fade-in">
            {(() => {
              const pricedNodes = nodes.filter((n) =>
                n.type === "ec2Node" ||
                n.type === "s3Node" ||
                n.type === "iamNode" ||
                n.type === "iamGroupNode"
              );
              return (
                <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto">

                  {/* Title Section */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        <Coins className="text-emerald-500" size={22} /> Cost Analysis
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        A comprehensive analysis of cloud service configurations and estimated monthly expenses.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveMode("dev")}
                      className="flex items-center gap-1.5 px-4 h-9 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors pointer-events-auto shadow-sm"
                    >
                      <Activity size={13} /> Return to Canvas
                    </button>
                  </div>

                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">

                    {/* Total Cost */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total Monthly Cost</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1 font-mono">
                          ${nodes.reduce((acc, node) => acc + (node.type !== "s3ObjectNode" && node.type !== "shapeNode" ? (node.data?.cost || 0) : 0), 0).toFixed(2)}/mo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">Estimated AWS spend</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                        <Coins size={20} />
                      </div>
                    </div>

                    {/* Compute cost */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Compute Cost</span>
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-500 mt-1 font-mono">
                          ${nodes.filter(n => n.type === "ec2Node").reduce((acc, node) => acc + (node.data?.cost || 0), 0).toFixed(2)}/mo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">
                          {nodes.filter(n => n.type === "ec2Node").length} EC2 Instance(s)
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                        <Cpu size={20} />
                      </div>
                    </div>

                    {/* Storage cost */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Storage Cost</span>
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1 font-mono">
                          ${nodes.filter(n => n.type === "s3Node").reduce((acc, node) => acc + (node.data?.cost || 0), 0).toFixed(2)}/mo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">
                          {nodes.filter(n => n.type === "s3Node").length} S3 Bucket(s)
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                        <Database size={20} />
                      </div>
                    </div>

                    {/* Free resources */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Free Tier / Config</span>
                        <span className="text-2xl font-black text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                          $0.00/mo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">
                          {nodes.filter(n => n.type === "iamNode" || n.type === "iamGroupNode").length} IAM Resource(s)
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                        <Shield size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Cost Proportion Progress Bar */}
                  {nodes.some(n => n.type === "ec2Node" || n.type === "s3Node") && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                        <span>Expense Distribution</span>
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500"></span> Compute</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500"></span> Storage</span>
                        </div>
                      </div>
                      {(() => {
                        const ec2Tot = nodes.filter(n => n.type === "ec2Node").reduce((acc, n) => acc + (n.data?.cost || 0), 0);
                        const s3Tot = nodes.filter(n => n.type === "s3Node").reduce((acc, n) => acc + (n.data?.cost || 0), 0);
                        const tot = ec2Tot + s3Tot;

                        if (tot === 0) return null;

                        const ec2Percent = (ec2Tot / tot) * 100;
                        const s3Percent = (s3Tot / tot) * 100;

                        return (
                          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex">
                            <div style={{ width: `${ec2Percent}%` }} className="bg-blue-500 h-full transition-all duration-500" title={`Compute: ${ec2Percent.toFixed(1)}%`}></div>
                            <div style={{ width: `${s3Percent}%` }} className="bg-amber-500 h-full transition-all duration-500" title={`Storage: ${s3Percent.toFixed(1)}%`}></div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Filters Bar */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 rounded-xl shadow-sm w-full md:max-w-md">
                      <Search size={16} className="text-slate-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        value={budgetSearch}
                        onChange={(e) => setBudgetSearch(e.target.value)}
                        placeholder="Search services by name or type..."
                        className="bg-transparent text-sm w-full focus:outline-none text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                      {[
                        { id: "all", label: "All Services" },
                        { id: "compute", label: "Compute" },
                        { id: "storage", label: "Storage" },
                        { id: "free", label: "Access & Security" }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setBudgetCategory(cat.id)}
                          className={`px-3.5 h-8 text-xs font-bold rounded-lg transition-all shrink-0 ${budgetCategory === cat.id
                            ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-zinc-700/50"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                            }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Cards List */}
                  <div className="flex flex-col gap-3 mt-2 pb-16">
                    {(() => {
                      const filteredNodes = pricedNodes.filter((node) => {
                        const label = (node.data?.label || "").toLowerCase();
                        const id = node.id.toLowerCase();
                        const typeLabel = node.type.toLowerCase();
                        const searchMatch = label.includes(budgetSearch.toLowerCase()) || id.includes(budgetSearch.toLowerCase()) || typeLabel.includes(budgetSearch.toLowerCase());

                        if (!searchMatch) return false;

                        if (budgetCategory === "compute") return node.type === "ec2Node";
                        if (budgetCategory === "storage") return node.type === "s3Node";
                        if (budgetCategory === "free") return node.type === "iamNode" || node.type === "iamGroupNode";
                        return true;
                      });

                      if (filteredNodes.length === 0) {
                        return (
                          <div className="py-16 text-center text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                            <Coins size={36} className="mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                            <p className="text-sm font-semibold">No services found matching the criteria.</p>
                          </div>
                        );
                      }

                      return filteredNodes.map((node) => {
                        const isExpanded = expandedBudgetNodes.has(node.id);

                        let serviceType = "AWS Resource";
                        let serviceCategory = "General";
                        let iconBg = "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400";
                        let IconComp = HardDrive;
                        let costText = `$${(node.data?.cost || 0).toFixed(2)}/mo`;

                        if (node.type === "ec2Node") {
                          serviceType = "EC2 Instance";
                          serviceCategory = "Compute";
                          iconBg = "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30";
                          IconComp = Cpu;
                        } else if (node.type === "s3Node") {
                          serviceType = "S3 Bucket";
                          serviceCategory = "Storage";
                          iconBg = "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30";
                          IconComp = Database;
                        } else if (node.type === "iamNode") {
                          serviceType = `IAM ${node.data?.iamType || "User"}`;
                          serviceCategory = "Access Control";
                          iconBg = "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30";
                          IconComp = Shield;
                          costText = "$0.00/mo (Free)";
                        } else if (node.type === "iamGroupNode") {
                          serviceType = "IAM Group";
                          serviceCategory = "Access Control";
                          iconBg = "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30";
                          IconComp = Shield;
                          costText = "$0.00/mo (Free)";
                        }

                        return (
                          <div
                            key={node.id}
                            className={`border rounded-2xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow transition-all overflow-hidden flex flex-col pointer-events-auto ${isExpanded
                              ? "border-amber-300 dark:border-zinc-700"
                              : "border-slate-200 dark:border-zinc-800"
                              }`}
                          >
                            {/* Header Row */}
                            <div
                              onClick={() => toggleBudgetNode(node.id)}
                              className="p-4 flex items-center justify-between cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl ${iconBg}`}>
                                  <IconComp size={18} />
                                </div>
                                <div className="flex flex-col">
                                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                                    {node.data?.label || node.id}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
                                      {serviceType}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
                                    <span className="text-[10px] font-bold font-mono text-slate-450 dark:text-zinc-500 uppercase">
                                      {node.data?.region || userSettings.defaultRegion || "us-east-1"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className={`text-sm font-extrabold font-mono ${node.type === "ec2Node"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : node.type === "s3Node"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-400 dark:text-zinc-500"
                                  }`}>
                                  {costText}
                                </span>
                                <div className="text-slate-400 dark:text-zinc-500">
                                  <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                </div>
                              </div>
                            </div>

                            {/* Expanded details container */}
                            {isExpanded && (
                              <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 p-5 flex flex-col gap-4 animate-slide-down">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                  {/* Left Column: Metrics list */}
                                  <div>
                                    <h5 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                                      Cost & Size Metrics
                                    </h5>

                                    {node.type === "ec2Node" && (() => {
                                      const instanceType = node.data?.instanceType || "t2.micro";
                                      const volumeSize = node.data?.volumeSize || 8;
                                      const region = node.data?.region || userSettings.defaultRegion || "us-east-1";
                                      const platform = node.data?.platform || "Linux";

                                      const matchedType = ALL_INSTANCE_TYPES.find(t => t.value === instanceType);
                                      const hourlyPrice = matchedType?.pricing?.[platform] || matchedType?.pricing?.Linux || 0.0116;
                                      const multiplier = REGIONAL_MULTIPLIERS[region.toLowerCase()] || 1.15;

                                      const hourlyTotal = hourlyPrice;
                                      const monthlyCompute = hourlyPrice * 730 * multiplier;
                                      const monthlyStorage = volumeSize * 0.08;

                                      return (
                                        <ul className="flex flex-col gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                                          <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                            <span className="font-medium text-slate-450 dark:text-zinc-500">Compute Tier:</span>
                                            <span className="font-bold font-mono bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded">
                                              {instanceType} ({matchedType?.cpu || 1} vCPU, {matchedType?.ram || "1 GiB"})
                                            </span>
                                          </li>
                                          <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                            <span className="font-medium text-slate-450 dark:text-zinc-500">Compute Rate:</span>
                                            <span className="font-bold font-mono">
                                              ${hourlyTotal.toFixed(4)}/hour &times; 730 hrs
                                            </span>
                                          </li>
                                          <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                            <span className="font-medium text-slate-450 dark:text-zinc-500">EBS Volume:</span>
                                            <span className="font-bold font-mono">
                                              {volumeSize} GB EBS @ $0.08/GB-mo
                                            </span>
                                          </li>
                                          <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                            <span className="font-medium text-slate-450 dark:text-zinc-500">Regional Multiplier:</span>
                                            <span className="font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                              {region} ({multiplier.toFixed(2)}x)
                                            </span>
                                          </li>
                                          <li className="flex justify-between items-center font-bold text-slate-800 dark:text-zinc-100 pt-1 text-[13px]">
                                            <span>Subtotals:</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">
                                              ${monthlyCompute.toFixed(2)} (Compute) + ${monthlyStorage.toFixed(2)} (Storage)
                                            </span>
                                          </li>
                                        </ul>
                                      );
                                    })()}

                                    {node.type === "s3Node" && (() => {
                                      const storageGB = node.data?.storageGB || 10;
                                      const isAuto = !!node.data?.isAutoSized;
                                      const childObjects = nodes.filter(n => n.type === "s3ObjectNode" && n.parentId === node.id);

                                      return (
                                        <div className="flex flex-col gap-3">
                                          <ul className="flex flex-col gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                                            <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                              <span className="font-medium text-slate-450 dark:text-zinc-500">Capacity Type:</span>
                                              <span className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded">
                                                {isAuto ? "Auto-Calculated" : "Manual Estimate"}
                                              </span>
                                            </li>
                                            <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                              <span className="font-medium text-slate-450 dark:text-zinc-500">Storage Quantity:</span>
                                              <span className="font-bold font-mono">
                                                {storageGB >= 1 ? `${storageGB.toFixed(3)} GB` : `${(storageGB * 1024).toFixed(1)} MB`}
                                              </span>
                                            </li>
                                            <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                              <span className="font-medium text-slate-450 dark:text-zinc-500">Storage Class Pricing:</span>
                                              <span className="font-bold font-mono">
                                                Amazon S3 Standard @ $0.023/GB-mo
                                              </span>
                                            </li>
                                            <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                              <span className="font-medium text-slate-450 dark:text-zinc-500">Versioning:</span>
                                              <span className="font-bold">
                                                {node.data?.versioning ? "Enabled" : "Disabled"}
                                              </span>
                                            </li>
                                          </ul>

                                          {childObjects.length > 0 && (
                                            <div className="mt-2 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col gap-2">
                                              <h6 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                                Nested Objects ({childObjects.length})
                                              </h6>
                                              <div className="max-h-24 overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar text-[11px]">
                                                {childObjects.map(obj => (
                                                  <div key={obj.id} className="flex justify-between items-center font-mono">
                                                    <span className="text-slate-600 dark:text-zinc-400 truncate max-w-[160px]" title={obj.data?.key}>
                                                      📄 {obj.data?.key || "object"}
                                                    </span>
                                                    <span className="text-slate-400 font-medium">
                                                      {obj.data?.sizeGB >= 0.001
                                                        ? `${(obj.data?.sizeGB).toFixed(3)} GB`
                                                        : `${((obj.data?.sizeGB || 0) * 1024).toFixed(1)} MB`}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {(node.type === "iamNode" || node.type === "iamGroupNode") && (
                                      <ul className="flex flex-col gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                                        <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                          <span className="font-medium text-slate-450 dark:text-zinc-500">Access Type:</span>
                                          <span className="font-bold">
                                            {node.type === "iamGroupNode" ? "IAM User Group" : `IAM User (${node.data?.iamType || "User"})`}
                                          </span>
                                        </li>
                                        <li className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/80">
                                          <span className="font-medium text-slate-450 dark:text-zinc-500">Billing Category:</span>
                                          <span className="font-bold text-emerald-600 dark:text-emerald-500">
                                            Included / Free Tier
                                          </span>
                                        </li>
                                      </ul>
                                    )}
                                  </div>

                                  {/* Right Column: Billing Explanation */}
                                  <div className="flex flex-col justify-between">
                                    <div>
                                      <h5 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                                        Billing Explanation
                                      </h5>
                                      <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal font-medium p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-inner">
                                        {node.type === "ec2Node" && (
                                          "Amazon EC2 instances compute fees are computed on an hourly billing rate multiplied by 730 base hours per month. Elastic Block Store (EBS) volume storage fees are appended using a flat rate of $0.08 per Gigabyte-month. The combined pricing is scaled based on the target deployment region's multiplier."
                                        )}
                                        {node.type === "s3Node" && (
                                          "Amazon Simple Storage Service (S3) Standard Tier charges a linear storage billing rate of $0.023 per Gigabyte-month. S3 Object assets nested inside this S3 Bucket container are indexed automatically and directly accumulate into the bucket's storage size metric."
                                        )}
                                        {(node.type === "iamNode" || node.type === "iamGroupNode") && (
                                          "AWS IAM (Identity and Access Management) resources (Users, Groups, Policies, Roles, and Attachments) are security configurations that reside inside the AWS billing control plane at no cost. AWS does not levy any base compute, storage, or operational fees for IAM."
                                        )}
                                      </p>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                      <button
                                        onClick={() => {
                                          setActiveMode("dev");
                                          setTimeout(() => {
                                            handleFocusNode(node.id);
                                          }, 50);
                                        }}
                                        className="flex items-center gap-1.5 px-4 h-8 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors pointer-events-auto"
                                      >
                                        <ArrowUpRight size={13} /> Locate on Canvas
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Floating Audit Summary Collapsed Badge */}
        {activeMode === "audit" && !selectedNode && isAuditLegendCollapsed && (
          <button
            onClick={() => setIsAuditLegendCollapsed(false)}
            className="absolute bottom-6 right-6 z-30 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 h-10 px-3 rounded-xl shadow-xl dark:shadow-2xl flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all duration-300 pointer-events-auto select-none font-bold text-xs"
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
        {activeMode === "audit" && !selectedNode && !isAuditLegendCollapsed && (
          <aside
            className="absolute top-24 right-6 bottom-6 w-96 z-30 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 p-4 rounded-2xl shadow-xl dark:shadow-2xl flex flex-col gap-3 pointer-events-auto overflow-hidden transition-all duration-300 animate-fade-in"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Cloud Audit Findings</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${allFindings.length === 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500 animate-pulse"
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
                  <div
                    key={idx}
                    onClick={() => handleFocusNode(f.nodeId)}
                    className="flex flex-col gap-2 p-3.5 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/50 rounded-xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
                        {f.severity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 truncate max-w-[150px]">
                        {f.nodeLabel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-normal">
                      {f.message}
                    </p>
                    {f.fixable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemediate(f.nodeId, f.ruleId);
                        }}
                        className="mt-1 self-end text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
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
                className="w-full h-8 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Remediate All Fixable Issues</span>
              </button>
            )}
          </aside>
        )}

        {/* Dynamic Confirmation Dialog Overlay */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-up flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/5 dark:text-rose-500'
                    : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/5 dark:text-amber-500'
                }`}>
                  <AlertTriangle size={22} className="animate-bounce-subtle" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => {
                    if (confirmModal.onCancel) confirmModal.onCancel();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 h-9 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 transition-all active:scale-95 cursor-pointer"
                >
                  {confirmModal.cancelText || "Cancel"}
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className={`px-4 h-9 text-xs font-bold rounded-xl text-white transition-all active:scale-95 cursor-pointer ${
                    confirmModal.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-500/10 hover:shadow-rose-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 dark:text-zinc-950 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20'
                  }`}
                >
                  {confirmModal.confirmText || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBNET MODALS */}
        {activeSubnetModal === "nat" && selectedNode && (
          <SubnetNatModal
            node={selectedNode}
            onClose={() => setActiveSubnetModal(null)}
            onUpdateNodeData={(key, val) => {
              takeSnapshot();
              setNodes((nds) =>
                nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: val } } : n))
              );
            }}
          />
        )}
        {activeSubnetModal === "rt" && selectedNode && (
          <SubnetRtModal
            node={selectedNode}
            onClose={() => setActiveSubnetModal(null)}
            onUpdateNodeData={(key, val) => {
              takeSnapshot();
              setNodes((nds) =>
                nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: val } } : n))
              );
            }}
          />
        )}
        {activeSubnetModal === "nacl" && selectedNode && (
          <SubnetNaclModal
            node={selectedNode}
            onClose={() => setActiveSubnetModal(null)}
            onUpdateNodeData={(key, val) => {
              takeSnapshot();
              setNodes((nds) =>
                nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: val } } : n))
              );
            }}
          />
        )}

        {/* RIGHT BOUNDARY PULL BUTTON */}
        <button
          onClick={() => setIsSecondaryScreenOpen(true)}
          className={`fixed top-1/2 right-0 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-24 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 border-l border-y border-slate-200/80 dark:border-zinc-800/80 rounded-l-2xl shadow-2xl backdrop-blur-md text-slate-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group hover:w-10 ${
            isSecondaryScreenOpen ? "opacity-0 pointer-events-none translate-x-full" : "opacity-100"
          }`}
          title="Pull for Secondary Screen"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
        </button>

        {/* SECONDARY SCREEN SLIDE-OVER */}
        <div
          className={`fixed inset-0 z-[60] bg-slate-50 dark:bg-zinc-955 text-slate-800 dark:text-zinc-200 transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex gap-6 items-stretch justify-start p-6 shadow-2xl overflow-hidden ${
            isSecondaryScreenOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        >
          {/* LEFT BOUNDARY PULL-BACK BUTTON */}
          <button
            onClick={() => setIsSecondaryScreenOpen(false)}
            className="absolute top-1/2 left-0 -translate-y-1/2 z-50 flex items-center justify-center w-8 h-24 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 border-r border-y border-slate-200/80 dark:border-zinc-800/80 rounded-r-2xl shadow-2xl backdrop-blur-md text-slate-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 transition-all duration-300 group hover:w-10"
            title="Pull Back to Main Screen"
          >
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
          
          <button
            onClick={() => setSideProjectManagerOpen(!sideProjectManagerOpen)}
            className="absolute top-0 left-0 z-50 w-24 h-24 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border-r border-b border-slate-200/50 dark:border-zinc-800/80 rounded-br-full flex items-start justify-start p-5 text-slate-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 shadow-md transition-all duration-300 ease-in-out hover:scale-110 origin-top-left group cursor-pointer"
            title={sideProjectManagerOpen ? "Close Side Projects Manager" : "Open Side Projects Manager"}
          >
            <FolderOpen size={22} className="group-hover:rotate-6 transition-transform duration-300" />
          </button>

          {/* BUILDER SECTION: SIDE PROJECTS MANAGER DASHBOARD */}
          {sideProjectManagerOpen && (
            <div className="w-80 shrink-0 h-full flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-6 rounded-3xl shadow-xl animate-slide-right text-left z-10 overflow-hidden shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 mb-6 shrink-0 mt-8">
                <div>
                  <h2 className="text-sm font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">
                    Workspaces
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    Local architecture builders.
                  </p>
                </div>
                <button
                  onClick={() => setSideIsCreating(true)}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-955 shadow transition-all active:scale-95 cursor-pointer"
                  title="New Project"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Inline New Project Form */}
              {sideIsCreating && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (sideNewProjName.trim()) {
                      handleCreateBuilderProject(sideNewProjName.trim());
                      setSideNewProjName("");
                      setSideIsCreating(false);
                    }
                  }}
                  className="mb-4 bg-white dark:bg-zinc-900 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-3 shadow-md animate-fade-in shrink-0"
                >
                  <input
                    type="text"
                    value={sideNewProjName}
                    onChange={(e) => setSideNewProjName(e.target.value)}
                    placeholder="Workspace name..."
                    autoFocus
                    className="flex-1 h-8 px-2 bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold text-slate-800 dark:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="submit"
                      className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-450 text-white dark:text-zinc-955 text-[10px] font-bold cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSideIsCreating(false);
                        setSideNewProjName("");
                      }}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 text-[10px] font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Projects List Container */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 custom-scrollbar">
                {builderProjects.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-inner">
                    <FolderOpen size={24} className="text-slate-300 dark:text-zinc-700 animate-pulse" />
                    <h4 className="text-slate-700 dark:text-zinc-300 font-bold text-xs">No workspaces</h4>
                    <button
                      onClick={() => {
                        setNewProjName("");
                        setSelectedProvider("gemini");
                        setSelectedModel("gemini-3.6-flash");
                        setApiKey("");
                        setCustomBaseUrl("");
                        setCreateStep(1);
                        setShowCreateModal(true);
                      }}
                      className="mt-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-450 text-white dark:text-zinc-955 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Create First
                    </button>
                  </div>
                ) : (
                  builderProjects
                    .slice()
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((proj) => {
                      const isActive = proj.id === activeBuilderProjectId;
                      const isEditing = sideEditingProjectId === proj.id;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => {
                            if (!isEditing) {
                              setActiveBuilderProjectId(proj.id);
                            }
                          }}
                          className={`group border p-3 rounded-xl flex items-center justify-between gap-3 transition-all ${
                            isActive
                              ? "bg-amber-500/10 border-amber-500/30 text-slate-800 dark:text-zinc-100"
                              : "bg-white/80 dark:bg-zinc-900/40 border-slate-105 dark:border-zinc-900 text-slate-700 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                          }`}
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2.5">
                            <span className={`p-1.5 rounded-lg text-xs ${
                              isActive ? "bg-amber-500 text-white dark:text-zinc-955" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                            }`}>
                              <CloudLightning size={14} />
                            </span>
                            <div className="flex-1 min-w-0 text-left">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={sideEditName}
                                  onChange={(e) => setSideEditName(e.target.value)}
                                  className="w-full h-7 px-2 bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold text-slate-800 dark:text-zinc-200 rounded border border-amber-500 focus:outline-none"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && sideEditName.trim()) {
                                      handleRenameBuilderProject(proj.id, sideEditName.trim());
                                      setSideEditingProjectId(null);
                                    }
                                  }}
                                />
                              ) : (
                                <>
                                  <h4 className="font-bold text-xs truncate leading-snug">
                                    {proj.name}
                                  </h4>
                                  <p className="text-[8px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wide truncate">
                                    {proj.provider} • {proj.model}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isEditing ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (sideEditName.trim()) {
                                    handleRenameBuilderProject(proj.id, sideEditName.trim());
                                    setSideEditingProjectId(null);
                                  }
                                }}
                                className="p-1 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded cursor-pointer"
                              >
                                <Check size={12} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSideEditingProjectId(proj.id);
                                  setSideEditName(proj.name);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                                title="Rename Project"
                              >
                                <Edit size={12} />
                              </button>
                            )}

                            {sideConfirmDeleteId === proj.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBuilderProject(proj.id);
                                    setSideConfirmDeleteId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-[8px] font-black uppercase cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSideConfirmDeleteId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-505 dark:text-zinc-400 rounded text-[8px] font-black uppercase cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSideConfirmDeleteId(proj.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded cursor-pointer"
                                title="Delete Project"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* BUILDER SECTION: MAIN VIEW SCREEN */}
          <div className="flex-1 h-full flex flex-col gap-4 relative overflow-hidden ml-16 mt-8">
            {activeBuilderProject ? (
              <>
                {/* Header */}
                <div className="h-16 px-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between shadow-sm shrink-0 text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                      <CloudLightning size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 leading-snug">
                        {activeBuilderProject.name}
                      </h3>
                      <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {activeBuilderProject.provider} • {activeBuilderProject.model}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNewProjName(activeBuilderProject.name);
                        setSelectedProvider(activeBuilderProject.provider);
                        setSelectedModel(activeBuilderProject.model);
                        setApiKey(activeBuilderProject.apiKey);
                        setCustomBaseUrl(activeBuilderProject.customBaseUrl);
                        setCreateStep(1);
                        setShowCreateModal(true);
                      }}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={12} className="text-amber-500" /> Rebuild
                    </button>
                    <button
                      onClick={() => setActiveBuilderProjectId(null)}
                      className="px-3.5 py-2 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[10px] cursor-pointer transition-all border border-rose-200/20"
                    >
                      Close Project
                    </button>
                  </div>
                </div>

                {/* Canvas Wrapper */}
                <div className="flex-1 relative overflow-hidden">
                  <ReactFlowProvider>
                    <BuilderCanvas
                      project={activeBuilderProject}
                      onSaveProject={handleSaveBuilderProject}
                      isBuildingLive={isBuildingLive}
                      setIsBuildingLive={setIsBuildingLive}
                      pendingNodes={pendingNodes}
                      pendingEdges={pendingEdges}
                    />
                  </ReactFlowProvider>
                </div>
              </>
            ) : (
              /* Welcome Screen (No project loaded) */
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 select-none max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white dark:text-zinc-955 font-bold shadow-[0_8px_30px_rgba(245,158,11,0.25)] animate-bounce-slow">
                    <CloudLightning size={44} />
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase bg-gradient-to-r from-amber-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent py-2">
                      Builder Workspace
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-md mt-1 leading-relaxed">
                      Build production-grade infrastructure with the latest AI models. Click below to start the dynamic survey questionnaire.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <button
                      onClick={() => {
                        setNewProjName("");
                        setSelectedProvider("gemini");
                        setSelectedModel("gemini-3.6-flash");
                        setApiKey("");
                        setCustomBaseUrl("");
                        setCreateStep(1);
                        setShowCreateModal(true);
                      }}
                      className="px-6 py-3 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-955 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 group"
                    >
                      <FolderPlus size={16} /> Create Project
                    </button>
                    <button
                      onClick={() => setIsSecondaryScreenOpen(false)}
                      className="px-6 py-3 bg-white/80 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      Back to Canvas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MULTI-STEP CREATION MODAL OVERLAY */}
          {showCreateModal && (
            <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl min-h-[500px] flex flex-col justify-between overflow-hidden transition-all duration-300 animate-scale-up max-h-[90vh]">
                
                {/* Progress Indicator */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 flex">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${(createStep / 3) * 100}%` }}
                  />
                </div>

                {/* Modal Body */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
                  
                  {/* Step 1: Project Name */}
                  {createStep === 1 && (
                    <div className="flex-1 flex flex-col justify-start animate-fade-in text-left pt-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                          Create New Workspace
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">
                          Give your cloud architecture builder project a unique local name.
                        </p>
                      </div>
                      <div className="mt-8">
                        <input
                          type="text"
                          value={newProjName}
                          onChange={(e) => setNewProjName(e.target.value)}
                          placeholder="e.g. production-kubernetes-cluster"
                          autoFocus
                          className="w-full h-14 px-5 bg-slate-50 dark:bg-zinc-950 text-base font-bold text-slate-800 dark:text-zinc-200 rounded-2xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Select AI Model */}
                  {createStep === 2 && (
                    <div className="flex-1 flex flex-col justify-start animate-fade-in text-left pt-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                          Select AI Model
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">
                          Choose the AI model variant from Google Gemini or Anthropic Claude to generate your infrastructure nodes.
                        </p>
                      </div>

                      {/* Custom Grouped Dropdown Selector */}
                      <div className="mt-8 relative">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Model Variant</label>
                        <div className="relative mt-2">
                          <button
                            type="button"
                            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                            className="w-full h-12 px-4 bg-slate-50 dark:bg-zinc-950 text-xs font-bold text-slate-800 dark:text-zinc-200 rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-all cursor-pointer shadow-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-900"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                {selectedProvider}
                              </span>
                              <span>{selectedModel}</span>
                            </span>
                            <ChevronDown size={16} className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${modelDropdownOpen ? "rotate-180" : ""}`} />
                          </button>
                          
                          {modelDropdownOpen && (
                            <>
                              {/* Backdrop to close on click outside */}
                              <div className="fixed inset-0 z-10" onClick={() => setModelDropdownOpen(false)} />
                              
                              <div className="absolute left-0 right-0 mt-2 z-20 bg-white dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1.5 animate-scale-up max-h-[230px] overflow-y-auto custom-scrollbar">
                                {[
                                  { type: "header", label: "Google Gemini" },
                                  { value: "gemini-3.6-flash", label: "gemini-3.6-flash (Default)", provider: "gemini" },
                                  { value: "gemini-3.5-flash", label: "gemini-3.5-flash", provider: "gemini" },
                                  { value: "gemini-3.5-flash-lite", label: "gemini-3.5-flash-lite", provider: "gemini" },
                                  { value: "gemini-3.5-pro", label: "gemini-3.5-pro", provider: "gemini" },
                                  
                                  { type: "header", label: "Anthropic Claude" },
                                  { value: "claude-sonnet-5", label: "claude-sonnet-5 (Default)", provider: "claude" },
                                  { value: "claude-fable-5", label: "claude-fable-5 (Reasoning)", provider: "claude" },
                                  { value: "claude-sonnet-4.6", label: "claude-sonnet-4.6", provider: "claude" },
                                  { value: "claude-haiku-4.5", label: "claude-haiku-4.5", provider: "claude" },
                                  { value: "claude-opus-4.8", label: "claude-opus-4.8", provider: "claude" }
                                ].map((opt, idx) => {
                                  if (opt.type === "header") {
                                    return (
                                      <div 
                                        key={`header-${idx}`} 
                                        className="px-4 py-2 mt-2 first:mt-0 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900/40 select-none border-y border-slate-100 dark:border-zinc-800/60"
                                      >
                                        {opt.label}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div
                                      key={opt.value}
                                      onClick={() => {
                                        setSelectedModel(opt.value);
                                        setSelectedProvider(opt.provider);
                                        setModelDropdownOpen(false);
                                      }}
                                      className={`px-6 py-2.5 text-xs font-bold cursor-pointer transition-colors ${
                                        selectedModel === opt.value
                                          ? "bg-amber-500 text-white dark:text-zinc-950"
                                          : "text-slate-700 dark:text-zinc-300 hover:bg-amber-500/10 hover:text-amber-500"
                                      }`}
                                    >
                                      {opt.label}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Authentication */}
                  {createStep === 3 && (
                    <div className="flex-1 flex flex-col justify-start animate-fade-in text-left pt-4 relative min-h-[220px]">
                      {isVerifyingKey ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-900/90 z-30 transition-all rounded-2xl">
                          {verificationSuccess ? (
                            <div className="flex flex-col items-center gap-3 animate-scale-up">
                              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={36} className="animate-bounce-slow" />
                              </div>
                              <span className="text-sm font-black text-slate-800 dark:text-zinc-100 animate-pulse">Connection Successful!</span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Creating workspace project...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="relative h-14 w-14">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-zinc-800" />
                                <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
                              </div>
                              <span className="text-sm font-black text-slate-800 dark:text-zinc-100">Verifying API Credentials...</span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Establishing test handshake with {selectedProvider}...</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                          Configure Provider Credentials
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">
                          Authenticate with the provider's API. Keys are stored locally in your browser workspace.
                        </p>
                      </div>

                      {verificationError && (
                        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2.5 animate-shake">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <span>{verificationError}</span>
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-6">
                        {/* API Key */}
                        <div>
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">API Key (Required)</label>
                            <button 
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="text-xs font-bold text-amber-500 hover:text-amber-450 focus:outline-none"
                            >
                              {showApiKey ? "Hide Key" : "Show Key"}
                            </button>
                          </div>
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={selectedProvider === "gemini" ? "AIzaSy..." : "sk-ant-..."}
                            className="w-full h-12 px-4 mt-2 bg-slate-50 dark:bg-zinc-950 text-xs font-bold text-slate-800 dark:text-zinc-200 rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                          />
                        </div>

                        {/* Custom Base URL (Optional) */}
                        <div>
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Custom Base URL (Optional)</label>
                          <input
                            type="text"
                            value={customBaseUrl}
                            onChange={(e) => setCustomBaseUrl(e.target.value)}
                            placeholder={selectedProvider === "gemini" ? "https://generativelanguage.googleapis.com" : "https://api.anthropic.com"}
                            className="w-full h-12 px-4 mt-2 bg-slate-50 dark:bg-zinc-955 text-xs font-bold text-slate-800 dark:text-zinc-200 rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: AI Survey Stage */}
                  {createStep === 4 && (
                    <div className="flex-1 flex flex-col justify-start animate-fade-in text-left pt-4 relative min-h-[250px]">
                      {isGeneratingQuestion || isGeneratingDiagram ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-900/90 z-30 transition-all rounded-2xl">
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative h-14 w-14">
                              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-zinc-800" />
                              <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
                            </div>
                            <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                              {isGeneratingDiagram 
                                ? "Generating Architecture Layout..." 
                                : `Formulating Question ${surveyStep + 1} of 5...`
                              }
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {isGeneratingDiagram 
                                ? "Analyzing requirements to design your workspace canvas..." 
                                : `Selected model (${selectedModel}) is reading history...`
                              }
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                            AI Survey Stage
                          </span>
                          <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-2">
                            Question {surveyStep + 1} of 5
                          </h3>
                        </div>
                        <div className="h-8 px-3 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center">
                          <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400">
                            {surveyStep === 0 && "Topic: Organization"}
                            {surveyStep === 1 && "Topic: Cloud Drivers"}
                            {surveyStep === 2 && "Topic: Workload Specification"}
                            {surveyStep === 3 && "Topic: Business Goals"}
                            {surveyStep === 4 && "Topic: Tech Preferences"}
                          </span>
                        </div>
                      </div>

                      {verificationError && (
                        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2.5 animate-shake">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <span>{verificationError}</span>
                        </div>
                      )}

                      <div className="mt-6 flex-1 flex flex-col justify-between">
                        <div className="flex flex-col gap-4">
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-200 leading-relaxed bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/60 shadow-inner">
                            {currentQuestionText || "AI surveyor is processing..."}
                          </p>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                              Your Answer
                            </label>
                            <textarea
                              value={userAnswerText}
                              onChange={(e) => setUserAnswerText(e.target.value)}
                              placeholder="e.g. We are a scaling e-commerce startup, or we want high availability for a postgres database..."
                              className="w-full h-24 p-4 mt-2 bg-slate-50 dark:bg-zinc-955 text-xs font-bold text-slate-800 dark:text-zinc-200 rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 transition-colors shadow-sm resize-none"
                              autoFocus
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Controls */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 pt-6 mt-8">
                    <div>
                      {createStep === 4 ? (
                        <button
                          onClick={handleBackSurveyStep}
                          disabled={isGeneratingQuestion || isGeneratingDiagram}
                          className={`px-6 py-3 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                            isGeneratingQuestion || isGeneratingDiagram
                              ? "bg-slate-100/50 dark:bg-zinc-800/50 text-slate-400 dark:text-zinc-600 cursor-not-allowed" 
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300"
                          }`}
                        >
                          Back
                        </button>
                      ) : createStep > 1 ? (
                        <button
                          onClick={() => setCreateStep((s) => s - 1)}
                          disabled={isVerifyingKey}
                          className={`px-6 py-3 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                            isVerifyingKey 
                              ? "bg-slate-100/50 dark:bg-zinc-800/50 text-slate-400 dark:text-zinc-600 cursor-not-allowed" 
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300"
                          }`}
                        >
                          Back
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowCreateModal(false)}
                          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <div>
                      {createStep === 4 ? (
                        <button
                          onClick={handleNextSurveyStep}
                          disabled={!userAnswerText.trim() || isGeneratingQuestion || isGeneratingDiagram}
                          className={`px-7 py-3 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                            !userAnswerText.trim() || isGeneratingQuestion || isGeneratingDiagram
                              ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md"
                          }`}
                        >
                          {surveyStep === 4 
                            ? (isGeneratingDiagram ? "Generating..." : "Generate Diagram")
                            : (isGeneratingQuestion ? "Generating..." : "Next Question")
                          }
                        </button>
                      ) : createStep < 3 ? (
                        <button
                          onClick={() => setCreateStep((s) => s + 1)}
                          disabled={createStep === 1 && !newProjName.trim()}
                          className={`px-7 py-3 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                            createStep === 1 && !newProjName.trim()
                              ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md"
                          }`}
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={handleVerifyApiKey}
                          disabled={!apiKey.trim() || isVerifyingKey}
                          className={`px-7 py-3 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                            !apiKey.trim() || isVerifyingKey
                              ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-400 text-white dark:text-zinc-950 shadow-md"
                          }`}
                        >
                          {isVerifyingKey ? "Verifying..." : "Verify & Create"}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-rose-500 dark:bg-rose-600 text-white text-xs font-extrabold rounded-xl shadow-2xl border border-rose-400 dark:border-rose-500 flex items-center gap-2.5 animate-scale-up pointer-events-none select-none tracking-wide">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{toast}</span>
          </div>
        )}
      </div>
      </SettingsContext.Provider>
    </ModeContext.Provider>
  );
}