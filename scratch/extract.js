const fs = require('fs');

const srcPath = 'c:/Users/mmona/OneDrive/Documents/Code/CloudForge/src/App.jsx';
const destPath = 'c:/Users/mmona/OneDrive/Documents/Code/CloudForge/src/components/CloudForgeEditor.jsx';

console.log('Reading App.jsx from:', srcPath);
const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split(/\r?\n/);

// Lines 1453 to 7029 (0-indexed lines 1452 to 7029)
const extractedLines = lines.slice(1452, 7029);

// Add imports at the top
const imports = `import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
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
} from "@xyflow/react";
import {
  Play, Download, Code, Layers, Terminal, Trash2, Settings2, X, CheckCircle2, Check, Database,
  Scissors, ClipboardPaste, Copy, Menu, HardDrive, CloudLightning, ChevronRight, ChevronDown,
  Activity, FolderOpen, Plus, AlertTriangle, FolderPlus, ArrowLeft, Clock, Settings, Moon, Sun,
  Sparkles, Save, Search, Square, Circle as CircleIcon, Type, Undo, Redo, User, Users, Key,
  Shield, Coins, Maximize2, Edit, File, Folder, Upload, Server, History, Cpu, ArrowUpRight,
  ArrowUpDown, Edit3
} from "lucide-react";
import { CustomSelect, RegionSelect, STANDARD_REGIONS } from "./CustomSelect";
import { nodeTypes, ModeContext, AuditBadge } from "./CustomNodes";

`;

let fileContent = imports + extractedLines.join('\n');

// Replace function CloudForgeEditor with export default function CloudForgeEditor
fileContent = fileContent.replace('function CloudForgeEditor({', 'export default function CloudForgeEditor({');

console.log('Writing CloudForgeEditor.jsx to:', destPath);
fs.writeFileSync(destPath, fileContent, 'utf8');
console.log('Done!');
