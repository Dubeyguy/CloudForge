import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  FolderPlus,
  Layers,
  Check,
  X,
  Edit,
  Trash2,
  FolderOpen,
} from "lucide-react";

export const ProjectsDashboard = ({
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
    <div className={`min-h-screen w-screen bg-slate-50 dark:bg-zinc-955 text-slate-800 dark:text-zinc-100 flex flex-col p-8 transition-colors duration-300 font-sans antialiased overflow-y-auto ${userSettings.theme === "forest" ? "forest" : ""}`}>
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
