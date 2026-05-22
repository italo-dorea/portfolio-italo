import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X, Maximize2, Globe } from "lucide-react";
import initialProjects from "../data/projects.json";

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

export const ProjectsGrid: React.FC<{ locale: string }> = ({ locale }) => {
  const isPt = locale === "pt";
  const t = (pt: string, en: string) => (isPt ? pt : en);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  useEffect(() => {
    // Sort projects by order ascending
    const sorted = [...initialProjects].sort((a, b) => a.order - b.order) as Project[];
    setProjects(sorted);

    // Extract unique tags for filter
    const tags = new Set<string>();
    initialProjects.forEach((proj) => {
      proj.tags.forEach((tag) => tags.add(tag));
    });
    setAllTags(["All", ...Array.from(tags)]);
  }, []);

  const filteredProjects = selectedTag === "All"
    ? projects
    : projects.filter((proj) => proj.tags.includes(selectedTag));

  return (
    <section id="projects" className="py-20 bg-background text-foreground relative overflow-hidden border-t border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            {t("Meus Projetos", "My Projects")}
          </h2>
          <div className="h-0.5 w-16 bg-accent mx-auto" />
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            {t(
              "Uma seleção de sistemas, sites e ferramentas que desenvolvi ou ajudei a construir.",
              "A selection of systems, sites, and tools I have developed or helped build."
            )}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 print:hidden">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 ${
                selectedTag === tag
                  ? "bg-accent text-accent-foreground border border-accent shadow-sm"
                  : "bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:border-accent hover:bg-background"
              }`}
            >
              {tag === "All" ? t("Todos", "All") : tag}
            </button>
          ))}
        </div>

        {/* Projects grid with animations */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group relative rounded-2xl bg-muted/40 border border-border hover:border-accent overflow-hidden flex flex-col shadow-sm transition-all duration-300"
              >
                {/* Project Cover Image */}
                <div className="relative h-48 w-full overflow-hidden bg-background border-b border-border">
                  <img
                    src={`/assets/${project.image}`}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  />
                  <div className="absolute inset-0 bg-background/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="p-3 rounded-full bg-accent hover:opacity-90 text-accent-foreground font-semibold flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110 cursor-pointer"
                      title={t("Ver Detalhes", "View Details")}
                    >
                      <Maximize2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Project Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-foreground text-xxs md:text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3
                      onClick={() => setSelectedProject(project)}
                      className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300 cursor-pointer"
                    >
                      {project.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                      {isPt ? project.description_pt : project.description_en}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedProject(project)}
                    className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-foreground hover:text-accent transition-colors group/link cursor-pointer text-left"
                  >
                    <span>{t("Ver Detalhes", "View Details")}</span>
                    <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden"
            onClick={() => {
              setSelectedProject(null);
              setIsZoomed(false);
            }}
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative w-full max-w-5xl h-[90vh] md:h-[80vh] bg-background text-foreground border-3 border-foreground rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button on absolute top-right */}
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setIsZoomed(false);
                }}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background border-2 border-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                title={t("Fechar", "Close")}
              >
                <X size={18} />
              </button>

              {/* Left Column: Screenshot Viewer */}
              <div className="w-full md:w-3/5 h-1/2 md:h-full bg-muted border-b md:border-b-0 md:border-r border-border relative flex flex-col overflow-hidden group/screen">
                <div className="px-4 py-2 border-b border-border bg-background flex justify-between items-center text-xs font-semibold text-muted-foreground">
                  <span>{t("Print da Página", "Page Screenshot")}</span>
                  <a
                    href={`/assets/${selectedProject.screenshot || selectedProject.image}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    title={t("Abrir imagem em tamanho real", "Open full-size image")}
                  >
                    <Maximize2 size={12} />
                    <span>{t("Tamanho Real", "Full Size")}</span>
                  </a>
                </div>

                {/* Container for long screenshot scrolling */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-neutral-900/5 dark:bg-black/20 flex justify-center items-start scrollbar-thin">
                  <div className="relative w-full max-w-lg shadow-md border border-border bg-background rounded-lg overflow-hidden group">
                    <img
                      src={`/assets/${selectedProject.screenshot || selectedProject.image}`}
                      alt={selectedProject.title}
                      className="w-full h-auto object-contain cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                      onClick={() => window.open(`/assets/${selectedProject.screenshot || selectedProject.image}`, "_blank")}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/70 border border-white/20">
                        {t("Clique para ampliar", "Click to enlarge")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Project Info */}
              <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col justify-between p-6 md:p-8 overflow-y-auto">
                <div className="space-y-6">
                  {/* Category/Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedProject.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-foreground text-xs font-medium uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-extrabold font-serif text-foreground tracking-tight border-b-2 border-foreground pb-3">
                    {selectedProject.title}
                  </h3>

                  {/* Description */}
                  <div className="text-muted-foreground text-sm md:text-base leading-relaxed space-y-4 max-h-[25vh] md:max-h-[35vh] overflow-y-auto pr-2 scrollbar-thin">
                    <p className="whitespace-pre-wrap">
                      {isPt ? selectedProject.description_pt : selectedProject.description_en}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-3 pt-6 border-t border-border mt-auto">
                  {selectedProject.url && (
                    <a
                      href={selectedProject.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-all border border-accent flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Globe size={16} />
                      <span>{t("Visitar Site Oficial", "Visit Official Website")}</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setIsZoomed(false);
                    }}
                    className="w-full py-3 rounded-xl bg-muted hover:bg-muted-foreground/10 text-foreground border border-border font-semibold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {t("Fechar", "Close")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
