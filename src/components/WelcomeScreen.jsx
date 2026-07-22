import React, { useState, useEffect } from "react";
import {
  CloudLightning,
  ChevronRight,
  Plus,
  Activity,
  FolderOpen,
  ArrowLeft,
  Layers,
} from "lucide-react";

export const WelcomeScreen = ({ projects, onCreateProject, onLoadProject }) => {
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
                className="flex-1 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 p-6 rounded-2xl font-bold text-xl flex items-center justify-between transition-all cursor-pointer shadow-sm"
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
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <span className="text-slate-400 dark:text-zinc-500 font-medium">
                    No projects created
                  </span>
                  <button
                    onClick={() => setViewMode("new")}
                    className="mt-2 bg-amber-500 hover:bg-amber-400 text-white dark:text-black font-bold px-4 py-2 rounded-xl transition-all shadow-md text-xs cursor-pointer"
                  >
                    Create New Project
                  </button>
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
                        className="text-slate-300 dark:text-zinc-650 group-hover:text-amber-500 transition-colors"
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
