import React, { useState, useEffect } from "react";
import { 
  Lock, Settings, Plus, Trash2, ArrowUp, ArrowDown, Edit2, 
  Save, RefreshCw, LogOut, FileText, Briefcase, Eye, Upload,
  GraduationCap, User, Code
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  tags: string[];
  image: string;
  screenshot?: string;
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

interface Education {
  id: string;
  type: "education" | "certification";
  title_pt: string;
  title_en: string;
  institution: string;
  year: string;
  url?: string;
  skills: string[];
  order: number;
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  category: "frontend" | "backend" | "design" | "cms" | "other";
}

interface Profile {
  name: string;
  image: string;
  subtitle_pt: string;
  subtitle_en: string;
  bio_pt: string;
  bio_en: string;
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
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projectsSha, setProjectsSha] = useState("");
  const [postsSha, setPostsSha] = useState("");
  const [educationSha, setEducationSha] = useState("");
  const [skillsSha, setSkillsSha] = useState("");
  const [profileSha, setProfileSha] = useState("");
  const [activeTab, setActiveTab] = useState<"projects" | "posts" | "education" | "skills" | "profile" | "settings">("projects");

  // Editing Forms State
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [editingEducation, setEditingEducation] = useState<Partial<Education> | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);
  const [editingProfile, setEditingProfile] = useState<Partial<Profile> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // File Upload State
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
  const [uploadImageBase64, setUploadImageBase64] = useState<string>("");
  const [uploadScreenshotFile, setUploadScreenshotFile] = useState<File | null>(null);
  const [uploadScreenshotBase64, setUploadScreenshotBase64] = useState<string>("");
  const [uploadSkillIconFile, setUploadSkillIconFile] = useState<File | null>(null);
  const [uploadSkillIconBase64, setUploadSkillIconBase64] = useState<string>("");
  const [uploadProfileImgFile, setUploadProfileImgFile] = useState<File | null>(null);
  const [uploadProfileImgBase64, setUploadProfileImgBase64] = useState<string>("");

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
    setEducation([]);
    setSkills([]);
    setProfile(null);
    setEditingProfile(null);
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

      // Fetch education.json
      try {
        const educationRes = await fetch(
          `https://api.github.com/repos/${own}/${rep}/contents/src/data/education.json?ref=${br}`,
          {
            headers: { Authorization: `token ${tok}` },
          }
        );
        if (educationRes.ok) {
          const data = await educationRes.json();
          setEducationSha(data.sha);
          const content = decodeBase64(data.content);
          const parsed = JSON.parse(content) as Education[];
          const normalized = parsed.map((e, idx) => ({
            ...e,
            order: typeof e.order === "number" ? e.order : idx + 1,
          })).sort((a, b) => (a.order || 0) - (b.order || 0));
          setEducation(normalized);
        }
      } catch (err) {
        console.error("Erro ao carregar education.json:", err);
      }

      // Fetch skills.json
      try {
        const skillsRes = await fetch(
          `https://api.github.com/repos/${own}/${rep}/contents/src/data/skills.json?ref=${br}`,
          {
            headers: { Authorization: `token ${tok}` },
          }
        );
        if (skillsRes.ok) {
          const data = await skillsRes.json();
          setSkillsSha(data.sha);
          const content = decodeBase64(data.content);
          setSkills(JSON.parse(content));
        }
      } catch (err) {
        console.error("Erro ao carregar skills.json:", err);
      }

      // Fetch profile.json
      try {
        const profileRes = await fetch(
          `https://api.github.com/repos/${own}/${rep}/contents/src/data/profile.json?ref=${br}`,
          {
            headers: { Authorization: `token ${tok}` },
          }
        );
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfileSha(data.sha);
          const content = decodeBase64(data.content);
          const parsed = JSON.parse(content) as Profile;
          setProfile(parsed);
          setEditingProfile(parsed);
        }
      } catch (err) {
        console.error("Erro ao carregar profile.json:", err);
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
  const uploadImageToGithub = async (fileName: string, base64Content: string, folder: string = "public/assets") => {
    // Check if image already exists
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${folder}/${fileName}?ref=${branch}`,
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
      `https://api.github.com/repos/${owner}/${repo}/contents/${folder}/${fileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload image: ${fileName} to ${folder}`,
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

  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadScreenshotBase64(reader.result as string);
        if (editingProject) {
          setEditingProject({ ...editingProject, screenshot: file.name });
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
          throw new Error("Falha no upload da imagem de capa.");
        }
        setUploadImageFile(null);
        setUploadImageBase64("");
      }

      // If we have a screenshot file uploading, upload it too
      if (uploadScreenshotFile && uploadScreenshotBase64) {
        const uploadSuccess = await uploadImageToGithub(uploadScreenshotFile.name, uploadScreenshotBase64);
        if (!uploadSuccess) {
          throw new Error("Falha no upload do print da página.");
        }
        setUploadScreenshotFile(null);
        setUploadScreenshotBase64("");
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
      screenshot: "",
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

  // --- Education actions ---
  const saveEducation = async (newEducation: Education[]) => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Salvando formação e certificados..." });
    try {
      const educationStr = JSON.stringify(newEducation, null, 2);
      const res = await commitFile(
        "src/data/education.json",
        educationStr,
        educationSha,
        "Update education.json from admin dashboard"
      );

      if (res.ok) {
        const data = await res.json();
        setEducationSha(data.content.sha);
        setEducation(newEducation);
        setEditingEducation(null);
        setIsCreatingNew(false);
        setStatusMessage({ type: "success", text: "Formação e certificados salvos no GitHub!" });
      } else {
        setStatusMessage({ type: "error", text: "Erro ao salvar formação e certificados no GitHub." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Erro de rede ao salvar." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducation({ ...edu });
    setIsCreatingNew(false);
  };

  const handleAddNewEducation = () => {
    setEditingEducation({
      id: "edu-" + Date.now(),
      type: "education",
      title_pt: "",
      title_en: "",
      institution: "",
      year: new Date().getFullYear().toString(),
      url: "",
      skills: [],
      order: education.length + 1,
    });
    setIsCreatingNew(true);
  };

  const handleEducationFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEducation || !editingEducation.title_pt || !editingEducation.id) return;

    let updatedEdu = [...education];

    if (isCreatingNew) {
      updatedEdu.push(editingEducation as Education);
    } else {
      updatedEdu = updatedEdu.map((e) =>
        e.id === editingEducation.id ? (editingEducation as Education) : e
      );
    }

    // Normalize order
    updatedEdu = updatedEdu.map((e, idx) => ({ ...e, order: idx + 1 }));

    saveEducation(updatedEdu);
  };

  const handleDeleteEducation = (eduId: string) => {
    if (confirm("Tem certeza que deseja remover esta formação/certificado?")) {
      const updated = education
        .filter((e) => e.id !== eduId)
        .map((e, idx) => ({ ...e, order: idx + 1 }));
      saveEducation(updated);
    }
  };

  const moveEducation = (index: number, direction: "up" | "down") => {
    const updated = [...education];
    if (direction === "up" && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === "down" && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }

    const reordered = updated.map((e, idx) => ({ ...e, order: idx + 1 }));
    saveEducation(reordered);
  };

  // --- Skills actions ---
  const saveSkills = async (newSkills: Skill[]) => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Salvando habilidades..." });
    try {
      let finalSkills = [...newSkills];

      // If we have a skill icon file uploading, upload it first
      if (uploadSkillIconFile && uploadSkillIconBase64 && editingSkill) {
        const folder = "public/assets/icons";
        const uploadSuccess = await uploadImageToGithub(uploadSkillIconFile.name, uploadSkillIconBase64, folder);
        if (!uploadSuccess) {
          throw new Error("Falha no upload do ícone da habilidade.");
        }
        
        // Update the editing skill icon path
        const updatedIconPath = `/assets/icons/${uploadSkillIconFile.name}`;
        editingSkill.icon = updatedIconPath;
        
        // Update inside finalSkills list
        finalSkills = finalSkills.map((sk) =>
          sk.id === editingSkill.id ? { ...sk, icon: updatedIconPath } : sk
        );

        setUploadSkillIconFile(null);
        setUploadSkillIconBase64("");
      }

      const skillsStr = JSON.stringify(finalSkills, null, 2);
      const res = await commitFile(
        "src/data/skills.json",
        skillsStr,
        skillsSha,
        "Update skills.json from admin dashboard"
      );

      if (res.ok) {
        const data = await res.json();
        setSkillsSha(data.content.sha);
        setSkills(finalSkills);
        setEditingSkill(null);
        setIsCreatingNew(false);
        setStatusMessage({ type: "success", text: "Habilidades salvas e publicadas no GitHub!" });
      } else {
        setStatusMessage({ type: "error", text: "Erro ao salvar as habilidades no GitHub." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Erro de rede ao salvar habilidades." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSkill = (sk: Skill) => {
    setEditingSkill({ ...sk });
    setIsCreatingNew(false);
  };

  const handleAddNewSkill = () => {
    setEditingSkill({
      id: "skill-" + Date.now(),
      name: "",
      icon: "",
      category: "frontend",
    });
    setIsCreatingNew(true);
  };

  const handleSkillFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill || !editingSkill.name || !editingSkill.id) return;

    let updatedSkills = [...skills];

    if (isCreatingNew) {
      updatedSkills.push(editingSkill as Skill);
    } else {
      updatedSkills = updatedSkills.map((sk) =>
        sk.id === editingSkill.id ? (editingSkill as Skill) : sk
      );
    }

    saveSkills(updatedSkills);
  };

  const handleDeleteSkill = (skId: string) => {
    if (confirm("Tem certeza que deseja remover esta habilidade?")) {
      const updated = skills.filter((sk) => sk.id !== skId);
      saveSkills(updated);
    }
  };

  const handleSkillIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadSkillIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadSkillIconBase64(reader.result as string);
        if (editingSkill) {
          setEditingSkill({ ...editingSkill, icon: `/assets/icons/${file.name}` });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Profile actions ---
  const saveProfile = async (newProfile: Profile) => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Salvando perfil..." });
    try {
      let updatedProfile = { ...newProfile };

      // Upload profile image if present
      if (uploadProfileImgFile && uploadProfileImgBase64) {
        const uploadSuccess = await uploadImageToGithub(uploadProfileImgFile.name, uploadProfileImgBase64, "public/assets");
        if (!uploadSuccess) {
          throw new Error("Falha no upload da foto de perfil.");
        }
        updatedProfile.image = `/assets/${uploadProfileImgFile.name}`;
        setUploadProfileImgFile(null);
        setUploadProfileImgBase64("");
      }

      const profileStr = JSON.stringify(updatedProfile, null, 2);
      const res = await commitFile(
        "src/data/profile.json",
        profileStr,
        profileSha,
        "Update profile.json from admin dashboard"
      );

      if (res.ok) {
        const data = await res.json();
        setProfileSha(data.content.sha);
        setProfile(updatedProfile);
        setEditingProfile(updatedProfile);
        setStatusMessage({ type: "success", text: "Perfil atualizado e publicado no GitHub!" });
      } else {
        setStatusMessage({ type: "error", text: "Erro ao salvar o perfil no GitHub." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Erro de rede ao salvar perfil." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editingProfile.name) return;
    saveProfile(editingProfile as Profile);
  };

  const handleProfileImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadProfileImgFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadProfileImgBase64(reader.result as string);
        if (editingProfile) {
          setEditingProfile({ ...editingProfile, image: `/assets/${file.name}` });
        }
      };
      reader.readAsDataURL(file);
    }
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
                  setEditingEducation(null);
                  setEditingSkill(null);
                  setEditingProfile(profile);
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
                  setEditingEducation(null);
                  setEditingSkill(null);
                  setEditingProfile(profile);
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
                  setActiveTab("education");
                  setEditingProject(null);
                  setEditingPost(null);
                  setEditingEducation(null);
                  setEditingSkill(null);
                  setEditingProfile(profile);
                }}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === "education"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <GraduationCap size={18} />
                Educação & Cursos
              </button>
              <button
                onClick={() => {
                  setActiveTab("skills");
                  setEditingProject(null);
                  setEditingPost(null);
                  setEditingEducation(null);
                  setEditingSkill(null);
                  setEditingProfile(profile);
                }}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === "skills"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Code size={18} />
                Habilidades
              </button>
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setEditingProject(null);
                  setEditingPost(null);
                  setEditingEducation(null);
                  setEditingSkill(null);
                  setEditingProfile(profile);
                }}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === "profile"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <User size={18} />
                Perfil
              </button>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setEditingProject(null);
                  setEditingPost(null);
                  setEditingEducation(null);
                  setEditingSkill(null);
                  setEditingProfile(profile);
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
                          className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
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

                    {/* Screenshot Upload/Field */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Nome do Arquivo de Print/Screenshot (Opcional)
                        </label>
                        <input
                          type="text"
                          value={editingProject.screenshot || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, screenshot: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-850 text-slate-100 text-sm focus:outline-none mb-3"
                          placeholder="ex: screenshot-gestaotributaria.png"
                        />
                        <span className="text-slate-500 text-xxs block">
                          Se deixado em branco, o print no modal de detalhes usará a imagem de capa padrão acima.
                        </span>
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <label className="w-full px-4 py-3.5 rounded-xl border border-dashed border-slate-800 hover:border-blue-500 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-white transition-all bg-slate-900">
                          <Upload size={16} />
                          Upload de Print
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotFileChange}
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

              {/* --- EDUCATION TAB --- */}
              {activeTab === "education" && !editingEducation && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Educação, Cursos & Certificados</h2>
                    <button
                      onClick={handleAddNewEducation}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm transition-all flex items-center gap-1.5"
                    >
                      <Plus size={16} />
                      Adicionar Registro
                    </button>
                  </div>

                  {isLoading && education.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : education.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhum registro cadastrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {education.map((edu, idx) => (
                        <div
                          key={edu.id}
                          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-colors"
                        >
                          <div>
                            <span className="text-slate-500 text-xs font-semibold block mb-1">
                              ORDEM #{edu.order} • {edu.type === "education" ? "Formação Acadêmica" : "Certificação/Curso"}
                            </span>
                            <h3 className="font-bold text-white text-base">{edu.title_pt} ({edu.year})</h3>
                            <span className="text-slate-400 text-xs block">{edu.institution}</span>
                            {edu.skills && edu.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {edu.skills.map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => moveEducation(idx, "up")}
                              disabled={idx === 0 || isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white transition-all disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveEducation(idx, "down")}
                              disabled={idx === education.length - 1 || isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white transition-all disabled:opacity-30"
                              title="Descer"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => handleEditEducation(edu)}
                              disabled={isLoading}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-blue-400 hover:bg-blue-600/5 transition-all"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEducation(edu.id)}
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

              {/* EDUCATION FORM EDIT */}
              {activeTab === "education" && editingEducation && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-6">
                    {isCreatingNew ? "Adicionar Formação/Curso" : `Editar Registro`}
                  </h2>

                  <form onSubmit={handleEducationFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Tipo de Registro *
                        </label>
                        <select
                          value={editingEducation.type || "education"}
                          onChange={(e) => setEditingEducation({ ...editingEducation, type: e.target.value as "education" | "certification" })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        >
                          <option value="education">Formação Acadêmica (Graduação, etc.)</option>
                          <option value="certification">Curso / Certificação</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Instituição *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingEducation.institution || ""}
                          onChange={(e) => setEditingEducation({ ...editingEducation, institution: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          placeholder="Ex: Estácio, Rocketseat, AWS"
                        />
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
                          value={editingEducation.title_pt || ""}
                          onChange={(e) => setEditingEducation({ ...editingEducation, title_pt: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          placeholder="Ex: Tecnólogo em Análise e Desenvolvimento de Sistemas"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Título (Inglês) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingEducation.title_en || ""}
                          onChange={(e) => setEditingEducation({ ...editingEducation, title_en: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          placeholder="Ex: Associate Degree in Systems Analysis and Development"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Ano / Período *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingEducation.year || ""}
                          onChange={(e) => setEditingEducation({ ...editingEducation, year: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          placeholder="Ex: 2023 - 2026 ou 2024"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Link da Credencial / Curso (Opcional)
                        </label>
                        <input
                          type="url"
                          value={editingEducation.url || ""}
                          onChange={(e) => setEditingEducation({ ...editingEducation, url: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          placeholder="Ex: https://..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Skills Conquistadas (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={editingEducation.skills?.join(", ") || ""}
                        onChange={(e) => setEditingEducation({ ...editingEducation, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors mb-2"
                        placeholder="Ex: React, TypeScript, Node.js"
                      />
                      
                      {/* Suggest some skills from existing ones in case they want a quick click */}
                      {Array.from(new Set(education.flatMap((e) => e.skills || []))).filter(Boolean).length > 0 && (
                        <div className="mt-2">
                          <span className="text-slate-400 text-xs block mb-1.5">Skills existentes (clique para adicionar/remover):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(new Set(education.flatMap((e) => e.skills || []))).filter(Boolean).map((skill) => {
                              const isSelected = editingEducation.skills?.includes(skill);
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => {
                                    const currentSkills = editingEducation.skills || [];
                                    let updatedSkills;
                                    if (isSelected) {
                                      updatedSkills = currentSkills.filter((s) => s !== skill);
                                    } else {
                                      updatedSkills = [...currentSkills, skill];
                                    }
                                    setEditingEducation({ ...editingEducation, skills: updatedSkills });
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                    isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingEducation(null)}
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

              {/* --- SKILLS TAB --- */}
              {activeTab === "skills" && !editingSkill && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Minhas Habilidades</h2>
                    <button
                      onClick={handleAddNewSkill}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm transition-all flex items-center gap-1.5"
                    >
                      <Plus size={16} />
                      Nova Habilidade
                    </button>
                  </div>

                  {isLoading && skills.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : skills.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhuma habilidade cadastrada.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {skills.map((sk) => (
                        <div
                          key={sk.id}
                          className="flex justify-between items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {sk.icon ? (
                              <img
                                src={sk.icon}
                                alt={sk.name}
                                className="w-8 h-8 object-contain flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xs flex-shrink-0">
                                {sk.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-sm truncate">{sk.name}</h3>
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-405 capitalize">
                                {sk.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditSkill(sk)}
                              disabled={isLoading}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-blue-400 hover:bg-blue-600/5 transition-all"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteSkill(sk.id)}
                              disabled={isLoading}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-750 text-red-400 hover:bg-red-500/5 transition-all"
                              title="Remover"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SKILLS FORM EDIT */}
              {activeTab === "skills" && editingSkill && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-6">
                    {isCreatingNew ? "Adicionar Habilidade" : `Editar: ${editingSkill.name}`}
                  </h2>

                  <form onSubmit={handleSkillFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          ID Único / Slug *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isCreatingNew}
                          value={editingSkill.id || ""}
                          onChange={(e) => setEditingSkill({ ...editingSkill, id: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors disabled:opacity-50"
                          placeholder="ex: javascript"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Nome da Habilidade *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSkill.name || ""}
                          onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                          placeholder="Ex: React"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Categoria *
                      </label>
                      <select
                        value={editingSkill.category || "frontend"}
                        onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                      >
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="design">Design / UI / UX</option>
                        <option value="cms">CMS (WordPress, etc.)</option>
                        <option value="other">Outros</option>
                      </select>
                    </div>

                    {/* Skill Icon File Upload / Path */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Caminho do Ícone (.svg ou imagem) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSkill.icon || ""}
                          onChange={(e) => setEditingSkill({ ...editingSkill, icon: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-850 text-slate-100 text-sm focus:outline-none mb-3"
                          placeholder="Ex: /assets/icons/react.svg"
                        />
                        <span className="text-slate-500 text-xxs block">
                          Ao fazer upload de um ícone, este campo será preenchido automaticamente com o caminho correto.
                        </span>
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <label className="w-full px-4 py-3.5 rounded-xl border border-dashed border-slate-800 hover:border-blue-500 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-white transition-all bg-slate-900">
                          <Upload size={16} />
                          Upload de Ícone
                          <input
                            type="file"
                            accept="image/*,.svg"
                            onChange={handleSkillIconFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingSkill(null)}
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

              {/* --- PROFILE TAB --- */}
              {activeTab === "profile" && editingProfile && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Perfil Pessoal</h2>

                  <form onSubmit={handleProfileFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Seu Nome *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProfile.name || ""}
                          onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                      
                      {/* Image Upload/Field */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                            Foto de Perfil (Caminho) *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingProfile.image || ""}
                            onChange={(e) => setEditingProfile({ ...editingProfile, image: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-850 text-slate-100 text-sm focus:outline-none mb-3"
                          />
                          <span className="text-slate-500 text-xxs block">
                            Ao fazer upload da foto, o campo será preenchido com a pasta `/assets/` correta.
                          </span>
                        </div>
                        
                        <div className="flex flex-col justify-end">
                          <label className="w-full px-4 py-3.5 rounded-xl border border-dashed border-slate-800 hover:border-blue-500 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-white transition-all bg-slate-900">
                            <Upload size={16} />
                            Upload Foto
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Subtítulo (Português) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProfile.subtitle_pt || ""}
                          onChange={(e) => setEditingProfile({ ...editingProfile, subtitle_pt: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                          Subtítulo (Inglês) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProfile.subtitle_en || ""}
                          onChange={(e) => setEditingProfile({ ...editingProfile, subtitle_en: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Biografia / Sobre Mim (Português)
                      </label>
                      <textarea
                        rows={4}
                        value={editingProfile.bio_pt || ""}
                        onChange={(e) => setEditingProfile({ ...editingProfile, bio_pt: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                        Biografia / Sobre Mim (Inglês)
                      </label>
                      <textarea
                        rows={4}
                        value={editingProfile.bio_en || ""}
                        onChange={(e) => setEditingProfile({ ...editingProfile, bio_en: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-blue-500 focus:outline-none text-slate-100 text-sm transition-colors resize-y"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(profile)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 text-sm font-semibold transition-colors"
                      >
                        Resetar
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
