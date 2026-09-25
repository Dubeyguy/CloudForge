import React, { useState, useEffect, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ProjectsDashboard } from "./components/ProjectsDashboard";
import CloudForgeEditor from "./components/CloudForgeEditor";

import "@xyflow/react/dist/style.css";

export default function App() {
  const [appState, setAppState] = useState("welcome");
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectsDir, setProjectsDir] = useState("");

  const [userSettings, setUserSettings] = useState({
    theme: "dark",
    autoSave: true,
    defaultRegion: "us-east-1",
    showMinimap: true,
    fontSize: "medium",
    nodeOverlayZoomedOut: true,
  });

  useEffect(() => {
    document.documentElement.classList.remove("dark", "forest");
    if (userSettings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (userSettings.theme === "forest") {
      document.documentElement.classList.add("forest");
    }
  }, [userSettings.theme]);

  useEffect(() => {
    if (userSettings.fontSize === "small") {
      document.documentElement.style.fontSize = "14px";
    } else if (userSettings.fontSize === "large") {
      document.documentElement.style.fontSize = "18px";
    } else {
      document.documentElement.style.fontSize = "16px";
    }
  }, [userSettings.fontSize]);

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
    if (savedSettings) {
      setUserSettings((prev) => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
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
      nodes: [],
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
          onCreateProject={handleCreateProject}
          onRenameProject={handleUpdateProjectName}
          onDeleteProject={handleDeleteProject}
        />
      </ReactFlowProvider>
    </div>
  );
}