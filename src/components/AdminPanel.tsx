import React, { useState, useEffect } from "react";
import { 
  Lock, Settings, Plus, Trash2, ArrowUp, ArrowDown, Edit2, 
  Save, RefreshCw, LogOut, FileText, Briefcase, Eye, Upload 
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  tags: string[];
  image: string;
  description_pt: string;
  description_en: string;
  url: string;
  order: number;
}

interface Post {
  id: string;
  title_pt: string;
  title_en: string;
  summary_pt: string;
  summary_en: string;
  content_pt: string;
  content_en: string;
  date: string;
  tags: string[];
  published: boolean;
  category?: string;
  order?: number;
  image?: string;
}

export default function AdminPanel() {
  // Authentication & Configuration State
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("italo-dorea");
  const [repo, setRepo] = useState("portfolio-italo");
  const [branch, setBranch] = useState("main");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [projectsSha, setProjectsSha] = useState("");
  const [postsSha, setPostsSha] = useState("");
  const [activeTab, setActiveTab] = useState<"projects" | "posts" | "settings">("projects");

  // Editing Forms State
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // File Upload State
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
  const [uploadImageBase64, setUploadImageBase64] = useState<string>("");

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const existingCategories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[];
  const existingTags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).filter(Boolean) as string[];

  useEffect(() => {
    // Load credentials from localStorage or environment variables (client-side)
    const savedToken = localStorage.getItem("gh_token") || (import.meta.env.PUBLIC_GITHUB_TOKEN as string) || "";
    const savedOwner = localStorage.getItem("gh_owner") || "italo-dorea";
    const savedRepo = localStorage.getItem("gh_repo") || "portfolio-italo";
    const savedBranch = localStorage.getItem("gh_branch") || "main";

    if (savedToken) setToken(savedToken);
    if (savedOwner) setOwner(savedOwner);
    if (savedRepo) setRepo(savedRepo);
    if (savedBranch) setBranch(savedBranch);

    if (savedToken && savedOwner && savedRepo) {
      testConnection(savedToken, savedOwner, savedRepo, savedBranch);
    }
  }, []);

  const testConnection = async (tok: string, own: string, rep: string, br: string) => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Conectando ao GitHub..." });
    try {
      const response = await fetch(`https://api.github.com/repos/${own}/${rep}`, {
        headers: {
          Authorization: `token ${tok}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        localStorage.setItem("gh_token", tok);
        localStorage.setItem("gh_owner", own);
        localStorage.setItem("gh_repo", rep);
        localStorage.setItem("gh_branch", br);
        setIsConnected(true);
        setStatusMessage({ type: "success", text: "Conexão estabelecida com sucesso!" });
        loadData(tok, own, rep, br);
      } else {
        setIsConnected(false);
        setStatusMessage({ type: "error", text: "Falha na autenticação. Verifique seu token e repositório." });
      }
    } catch (err) {
      setIsConnected(false);
      setStatusMessage({ type: "error", text: "Erro de rede ao conectar com a API do GitHub." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !owner || !repo) {
      setStatusMessage({ type: "error", text: "Preencha todos os campos obrigatórios." });
      return;
    }
    testConnection(token, owner, repo, branch);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("gh_token");
    setIsConnected(false);
    setProjects([]);
    setPosts([]);
    setStatusMessage({ type: "info", text: "Desconectado do painel administrativo." });
  };

  const loadData = async (tok: string, own: string, rep: string, br: string) => {
    setIsLoading(true);
    try {
      // Fetch projects.json
      const projectsRes = await fetch(
        `https://api.github.com/repos/${own}/${rep}/contents/src/data/projects.json?ref=${br}`,
        {
          headers: { Authorization: `token ${tok}` },
        }
      );
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjectsSha(data.sha);
        const content = decodeBase64(data.content);
        setProjects(JSON.parse(content));
      }

      // Fetch posts.json
      const postsRes = await fetch(
        `https://api.github.com/repos/${own}/${rep}/contents/src/data/posts.json?ref=${br}`,
        {
          headers: { Authorization: `token ${tok}` },
        }
      );
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPostsSha(data.sha);
        const content = decodeBase64(data.content);
        const parsed = JSON.parse(content) as Post[];
        // Assign default orders if missing and sort by order ascending
        const normalized = parsed.map((p, idx) => ({
          ...p,
          order: typeof p.order === "number" ? p.order : idx + 1,
        })).sort((a, b) => (a.order || 0) - (b.order || 0));
        setPosts(normalized);
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Erro ao carregar os dados do repositório." });
    } finally {
      setIsLoading(false);
    }
  };

  const decodeBase64 = (str: string) => {
    return decodeURIComponent(
      atob(str.replace(/\s/g, ""))
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  };

  const encodeBase64 = (str: string) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  };

  // Commit updated files back to GitHub
  const commitFile = async (path: string, contentStr: string, sha: string, commitMsg: string) => {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMsg,
        content: encodeBase64(contentStr),
        sha: sha,
        branch: branch,
      }),
    });
    return response;
  };

  // Commit dynamic image upload
  const uploadImageToGithub = async (fileName: string, base64Content: string) => {
    // Check if image already exists
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/public/assets/${fileName}?ref=${branch}`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    
    let sha = undefined;
    if (checkRes.ok) {
      const data = await checkRes.json();
      sha = data.sha;
    }

    const cleanBase64 = base64Content.split(",")[1] || base64Content;

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/public/assets/${fileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload image: ${fileName}`,
          content: cleanBase64,
          sha: sha,
          branch: branch,
        }),
      }
    );
    return response.ok;
  };

  // Image Upload helper
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "project" | "post") => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadImageBase64(reader.result as string);
        if (target === "project" && editingProject) {
          setEditingProject({ ...editingProject, image: file.name });
        } else if (target === "post" && editingPost) {
          setEditingPost({ ...editingPost, image: file.name });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Project actions ---
  const saveProjects = async (newProjects: Project[]) => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Salvando projetos..." });
    try {
      // If we have an image file uploading, upload it first
      if (uploadImageFile && uploadImageBase64) {
        const uploadSuccess = await uploadImageToGithub(uploadImageFile.name, uploadImageBase64);
        if (!uploadSuccess) {
          throw new Error("Falha no upload da imagem.");
        }
        setUploadImageFile(null);
        setUploadImageBase64("");
      }

      const projectsStr = JSON.stringify(newProjects, null, 2);
      const res = await commitFile(
        "src/data/projects.json",
        projectsStr,
        projectsSha,
        "Update projects.json from admin dashboard"
      );

      if (res.ok) {
        const data = await res.json();
        setProjectsSha(data.content.sha);
        setProjects(newProjects);
        setEditingProject(null);
        setIsCreatingNew(false);
        setStatusMessage({ type: "success", text: "Projetos salvos e publicados no GitHub!" });
      } else {
        setStatusMessage({ type: "error", text: "Erro ao salvar os projetos no GitHub." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Erro de rede ao salvar projetos." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProject = (proj: Project) => {
    setEditingProject({ ...proj });
    setIsCreatingNew(false);
  };

  const handleAddNewProject = () => {
    setEditingProject({
      id: "",
      title: "",
      tags: [],
      image: "",
      description_pt: "",
      description_en: "",
      url: "",
      order: projects.length + 1,
    });
    setIsCreatingNew(true);
  };

  const handleProjectFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.title || !editingProject.id) return;

    let updatedProjects = [...projects];

    if (isCreatingNew) {
      updatedProjects.push(editingProject as Project);
    } else {
      updatedProjects = updatedProjects.map((p) =>
        p.id === editingProject.id ? (editingProject as Project) : p
      );
    }

    // Ensure order property
    updatedProjects = updatedProjects.map((p, idx) => ({ ...p, order: idx + 1 }));

    saveProjects(updatedProjects);
  };

  const handleDeleteProject = (projId: string) => {
    if (confirm("Tem certeza que deseja remover este projeto?")) {
      const updated = projects
        .filter((p) => p.id !== projId)
        .map((p, idx) => ({ ...p, order: idx + 1 }));
      saveProjects(updated);
    }
  };

  const moveProject = (index: number, direction: "up" | "down") => {
    const updated = [...projects];
    if (direction === "up" && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === "down" && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }

    const reordered = updated.map((p, idx) => ({ ...p, order: idx + 1 }));
    saveProjects(reordered);
  };

  // --- Post actions ---
  const savePosts = async (newPosts: Post[]) => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Salvando postagens..." });
    try {
      // If we have an image file uploading, upload it first
      if (uploadImageFile && uploadImageBase64) {
        const uploadSuccess = await uploadImageToGithub(uploadImageFile.name, uploadImageBase64);
        if (!uploadSuccess) {
          throw new Error("Falha no upload da imagem.");
        }
        setUploadImageFile(null);
        setUploadImageBase64("");
      }

      const postsStr = JSON.stringify(newPosts, null, 2);
      const res = await commitFile(
        "src/data/posts.json",
        postsStr,
        postsSha,
        "Update posts.json from admin dashboard"
      );

      if (res.ok) {
        const data = await res.json();
        setPostsSha(data.content.sha);
        setPosts(newPosts);
        setEditingPost(null);
        setIsCreatingNew(false);
        setStatusMessage({ type: "success", text: "Postagens salvas e publicadas no GitHub!" });
      } else {
        setStatusMessage({ type: "error", text: "Erro ao salvar as postagens no GitHub." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Erro de rede ao salvar postagens." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost({ ...post });
    setIsCreatingNew(false);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const handleAddNewPost = () => {
    setEditingPost({
      id: "",
      title_pt: "",
      title_en: "",
      summary_pt: "",
      summary_en: "",
      content_pt: "",
      content_en: "",
      date: new Date().toISOString().split("T")[0],
      tags: [],
      published: true,
      category: "",
      order: posts.length + 1,
    });
    setIsCreatingNew(true);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const handlePostFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title_pt || !editingPost.id) return;

    let updatedPosts = [...posts];

    if (isCreatingNew) {
      updatedPosts.push(editingPost as Post);
    } else {
      updatedPosts = updatedPosts.map((p) =>
        p.id === editingPost.id ? (editingPost as Post) : p
      );
    }

    // Ensure order is normalized
    updatedPosts = updatedPosts.map((p, idx) => ({
      ...p,
      order: typeof p.order === "number" ? p.order : idx + 1,
    }));

    savePosts(updatedPosts);
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Tem certeza que deseja remover esta postagem?")) {
      const updated = posts
        .filter((p) => p.id !== postId)
        .map((p, idx) => ({ ...p, order: idx + 1 }));
      savePosts(updated);
    }
  };

  const movePost = (index: number, direction: "up" | "down") => {
    const updated = [...posts];
    if (direction === "up" && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === "down" && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }

    const reordered = updated.map((p, idx) => ({ ...p, order: idx + 1 }));
    savePosts(reordered);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pt-24 pb-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex-1 w-full">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              <Settings className="text-blue-500" />
              Painel Admin CMS
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gerencie seus projetos e postagens diretamente no GitHub
            </p>
          </div>
          {isConnected && (
            <div className="flex gap-3">
              <a
                href="/"
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 hover:bg-slate-850 text-sm font-semibold transition-all duration-300 flex items-center gap-1.5"
              >
                <Eye size={16} />
                Visualizar Site
              </a>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-transparent text-sm font-semibold transition-all duration-300 flex items-center gap-1.5"
              >
                <LogOut size={16} />
                Desconectar
              </button>
            </div>
          )}
        </div>

        {/* Global Notifications */}
        {statusMessage.text && (
          <div
            className={`p-4 rounded-xl mb-6 border text-sm flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : statusMessage.type === "error"
                ? "bg-rose-500/10 border-rose-500/25 text-rose-450"
                : "bg-blue-500/10 border-blue-500/25 text-blue-400"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage({ type: "", text: "" })}
              className="text-slate-400 hover:text-white ml-4 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Auth / Connection Form */}
        {!isConnected ? (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl mt-12">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
              <Lock className="text-blue-500" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Conectar ao GitHub</h2>
            <p className="text-slate-400 text-sm mb-6">
              Forneça seu Token de Acesso Pessoal (PAT) com escopo `repo` para ler/escrever arquivos no repositório.
            </p>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  GitHub Token
                </label>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-105 text-sm transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                    Usuário GitHub
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                    Repositório
                  </label>
                  <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  "Conectar"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard Main Content */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              <button
                onClick={() => {
                  setActiveTab("projects");
                  setEditingProject(null);
                  setEditingPost(null);
                }}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === "projects"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Briefcase size={18} />
                Projetos
              </button>
              <button
                onClick={() => {
                  setActiveTab("posts");
                  setEditingProject(null);
                  setEditingPost(null);
                }}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === "posts"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <FileText size={18} />
                Posts do Blog
              </button>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setEditingProject(null);
                  setEditingPost(null);
                }}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === "settings"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Settings size={18} />
                Configurações
              </button>
            </div>

            {/* Editing Views / Lists */}
            <div className="lg:col-span-3">
              {/* --- PROJECTS TAB --- */}
              {activeTab === "projects" && !editingProject && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Lista de Projetos</h2>
                    <button
                      onClick={handleAddNewProject}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm transition-all flex items-center gap-1.5"
                    >
                      <Plus size={16} />
                      Novo Projeto
                    </button>
                  </div>

                  {isLoading && projects.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : projects.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhum projeto cadastrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((proj, idx) => (
                        <div
                          key={proj.id}
                          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-colors"
                        >
                          <div>
                            <span className="text-slate-500 text-xs font-semibold block mb-1">
                              ORDEM #{proj.order} • {proj.tags.slice(0, 2).join(", ")}
                            </span>
                            <h3 className="font-bold text-white text-base">{proj.title}</h3>
                            <span className="text-slate-400 text-xs line-clamp-1">{proj.url}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => moveProject(idx, "up")}
                              disabled={idx === 0 || isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white transition-all disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveProject(idx, "down")}
                              disabled={idx === projects.length - 1 || isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white transition-all disabled:opacity-30"
                              title="Descer"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => handleEditProject(proj)}
                              disabled={isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-blue-400 hover:bg-blue-600/5 transition-all"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              disabled={isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-red-400 hover:bg-red-500/5 transition-all"
                              title="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROJECT FORM EDIT */}
              {activeTab === "projects" && editingProject && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-6">
                    {isCreatingNew ? "Criar Novo Projeto" : `Editar: ${editingProject.title}`}
                  </h2>

                  <form onSubmit={handleProjectFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          ID Único / Slug *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isCreatingNew}
                          value={editingProject.id || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Título do Projeto *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProject.title || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          URL do Projeto / Link
                        </label>
                        <input
                          type="url"
                          value={editingProject.url || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, url: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Tags (separadas por vírgula)
                        </label>
                        <input
                          type="text"
                          value={editingProject.tags?.join(", ") || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                    </div>

                    {/* Image Upload/Field */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Nome do Arquivo de Imagem *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProject.image || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-850 text-slate-100 text-sm focus:outline-none mb-3"
                          placeholder="ex: gestaotributaria.png"
                        />
                        <span className="text-slate-500 text-xxs block">
                          Ao fazer upload, este nome será preenchido automaticamente com o arquivo selecionado.
                        </span>
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <label className="w-full px-4 py-3.5 rounded-xl border border-dashed border-slate-800 hover:border-blue-500 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-white transition-all bg-slate-900">
                          <Upload size={16} />
                          Upload de Imagem
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, "project")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Descrição (Português)
                      </label>
                      <textarea
                        rows={3}
                        value={editingProject.description_pt || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, description_pt: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Descrição (Inglês)
                      </label>
                      <textarea
                        rows={3}
                        value={editingProject.description_en || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, description_en: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors resize-y"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 text-sm font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
                      >
                        <Save size={16} />
                        Salvar e Publicar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* --- POSTS TAB --- */}
              {activeTab === "posts" && !editingPost && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Postagens do Blog</h2>
                    <button
                      onClick={handleAddNewPost}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm transition-all flex items-center gap-1.5"
                    >
                      <Plus size={16} />
                      Nova Postagem
                    </button>
                  </div>

                  {isLoading && posts.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : posts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhuma postagem cadastrada.</p>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post, idx) => (
                        <div
                          key={post.id}
                          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 rounded-xl bg-slate-955 border border-slate-855 hover:border-slate-800 transition-colors"
                        >
                          <div>
                            <span className="text-slate-500 text-xs font-semibold block mb-1">
                              ORDEM #{post.order || (idx + 1)} • {post.date} • {post.category || "Sem Categoria"} • {post.published ? "PUBLICADO" : "RASCUNHO"}
                            </span>
                            <h3 className="font-bold text-white text-base">{post.title_pt}</h3>
                            <span className="text-slate-400 text-xs line-clamp-1">{post.tags.join(", ")}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => movePost(idx, "up")}
                              disabled={idx === 0 || isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white transition-all disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => movePost(idx, "down")}
                              disabled={idx === posts.length - 1 || isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white transition-all disabled:opacity-30"
                              title="Descer"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => handleEditPost(post)}
                              disabled={isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-blue-400 hover:bg-blue-600/5 transition-all"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-red-400 hover:bg-red-500/5 transition-all"
                              title="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* POST FORM EDIT */}
              {activeTab === "posts" && editingPost && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-6">
                    {isCreatingNew ? "Criar Nova Postagem" : `Editar: ${editingPost.title_pt}`}
                  </h2>

                  <form onSubmit={handlePostFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Slug / ID Único *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isCreatingNew}
                          value={editingPost.id || ""}
                          onChange={(e) => setEditingPost({ ...editingPost, id: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Data de Publicação
                        </label>
                        <input
                          type="date"
                          required
                          value={editingPost.date || ""}
                          onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Status
                        </label>
                        <div className="flex items-center mt-3">
                          <input
                            type="checkbox"
                            id="published"
                            checked={editingPost.published || false}
                            onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 focus:ring-blue-500"
                          />
                          <label htmlFor="published" className="ml-2 text-slate-300 text-sm font-medium">
                            Publicado (Visível no site)
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Título (Português) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPost.title_pt || ""}
                          onChange={(e) => setEditingPost({ ...editingPost, title_pt: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Título (Inglês) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPost.title_en || ""}
                          onChange={(e) => setEditingPost({ ...editingPost, title_en: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                    </div>

                    {/* Categoria */}
                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Categoria
                      </label>
                      {!showNewCategoryInput ? (
                        <div className="flex gap-2">
                          <select
                            value={editingPost.category || ""}
                            onChange={(e) => {
                              if (e.target.value === "__new__") {
                                setShowNewCategoryInput(true);
                              } else {
                                setEditingPost({ ...editingPost, category: e.target.value });
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          >
                            <option value="">Sem Categoria</option>
                            {existingCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                            <option value="__new__">+ Adicionar Nova Categoria...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nome da nova categoria"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCategoryName.trim()) {
                                setEditingPost({ ...editingPost, category: newCategoryName.trim() });
                                setNewCategoryName("");
                                setShowNewCategoryInput(false);
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCategoryInput(false);
                              setNewCategoryName("");
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Tags (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={editingPost.tags?.join(", ") || ""}
                        onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors mb-3"
                        placeholder="ex: React, SEO, CSS"
                      />
                      {existingTags.length > 0 && (
                        <div className="mt-2">
                          <span className="text-slate-500 text-xs block mb-1.5">Tags sugeridas (clique para adicionar/remover):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {existingTags.map((tag) => {
                              const isSelected = editingPost.tags?.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    const currentTags = editingPost.tags || [];
                                    let updatedTags;
                                    if (isSelected) {
                                      updatedTags = currentTags.filter((t) => t !== tag);
                                    } else {
                                      updatedTags = [...currentTags, tag];
                                    }
                                    setEditingPost({ ...editingPost, tags: updatedTags });
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                    isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Imagem do Post */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Nome do Arquivo de Imagem do Post (Opcional)
                        </label>
                        <input
                          type="text"
                          value={editingPost.image || ""}
                          onChange={(e) => setEditingPost({ ...editingPost, image: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-850 text-slate-100 text-sm focus:outline-none mb-3"
                          placeholder="ex: my-post-image.png"
                        />
                        <span className="text-slate-550 text-xxs block">
                          Ao fazer upload, este nome será preenchido automaticamente com o arquivo selecionado.
                        </span>
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <label className="w-full px-4 py-3.5 rounded-xl border border-dashed border-slate-800 hover:border-blue-500 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-white transition-all bg-slate-900">
                          <Upload size={16} />
                          Upload de Imagem
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, "post")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Resumo / Sumário (Português)
                        </label>
                        <textarea
                          rows={2}
                          value={editingPost.summary_pt || ""}
                          onChange={(e) => setEditingPost({ ...editingPost, summary_pt: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors resize-y"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Resumo / Sumário (Inglês)
                        </label>
                        <textarea
                          rows={2}
                          value={editingPost.summary_en || ""}
                          onChange={(e) => setEditingPost({ ...editingPost, summary_en: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors resize-y"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Conteúdo do Post (Português - Suporta Markdown)
                      </label>
                      <textarea
                        rows={12}
                        value={editingPost.content_pt || ""}
                        onChange={(e) => setEditingPost({ ...editingPost, content_pt: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors font-mono resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Conteúdo do Post (Inglês - Suporta Markdown)
                      </label>
                      <textarea
                        rows={12}
                        value={editingPost.content_en || ""}
                        onChange={(e) => setEditingPost({ ...editingPost, content_en: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors font-mono resize-y"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingPost(null)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 text-sm font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
                      >
                        <Save size={16} />
                        Salvar e Publicar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* --- SETTINGS TAB --- */}
              {activeTab === "settings" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-4">Configurações de Acesso</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Abaixo estão os parâmetros salvos no navegador para comunicação com o GitHub.
                  </p>

                  <form onSubmit={handleConnect} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Token de Acesso Pessoal (PAT)
                      </label>
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Usuário
                        </label>
                        <input
                          type="text"
                          value={owner}
                          onChange={(e) => setOwner(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Repositório
                        </label>
                        <input
                          type="text"
                          value={repo}
                          onChange={(e) => setRepo(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
                      >
                        {isLoading ? (
                          <RefreshCw className="animate-spin" size={16} />
                        ) : (
                          "Atualizar Conexão"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
