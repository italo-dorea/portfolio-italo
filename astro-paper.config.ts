import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://ifdc2308.github.io/portfolio-italo/",
    title: "Ítalo Dórea",
    description: "Portfólio profissional de Ítalo Dórea, Desenvolvedor e Analista de Softwares.",
    author: "Ítalo Dórea",
    profile: "https://github.com/ifdc2308",
    ogImage: "default-og.jpg",
    lang: "pt",
    timezone: "America/Bahia",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/ifdc2308" },
    { name: "linkedin", url: "https://www.linkedin.com/in/italo-dorea/" },
    { name: "instagram", url: "https://www.instagram.com/italo_dorea/" },
    { name: "mail",     url: "mailto:italoiddev@gmail.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});