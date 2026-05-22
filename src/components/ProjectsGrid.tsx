import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import initialProjects from "../data/projects.json";

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

export const ProjectsGrid: React.FC<{ locale: string }> = ({ locale }) => {
  const isPt = locale === "pt";
  const t = (pt: string, en: string) => (isPt ? pt : en);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [allTags, setAllTags] = useState<string[]>([]);

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
                {/* Project Image */}
                <div className="relative h-48 w-full overflow-hidden bg-background border-b border-border">
                  <img
                    src={`/assets/${project.image}`}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-background/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-accent hover:opacity-90 text-accent-foreground font-semibold flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110"
                      title={t("Visitar Site", "Visit Website")}
                    >
                      <ExternalLink size={20} />
                    </a>
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

                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">
                      {project.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                      {isPt ? project.description_pt : project.description_en}
                    </p>
                  </div>

                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-foreground hover:text-accent transition-colors group/link"
                  >
                    <span>{t("Acessar Projeto", "Visit Project")}</span>
                    <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
