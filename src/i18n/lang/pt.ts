import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Início",
    posts: "Posts",
    tags: "Tags",
    about: "Sobre",
    archives: "Arquivo",
    search: "Pesquisa",
  },
  post: {
    publishedAt: "Publicado em",
    updatedAt: "Atualizado",
    sharePostIntro: "Compartilhe este post:",
    sharePostOn: "Compartilhe este post no {{platform}}",
    sharePostViaEmail: "Compartilhe este post por email",
    tagLabel: "Tags",
    backToTop: "Voltar ao topo",
    goBack: "Voltar",
    editPage: "Editar página",
    previousPost: "Post Anterior",
    nextPost: "Próximo Post",
  },
  pagination: {
    prev: "Anterior",
    next: "Próximo",
    page: "Página",
  },
  home: {
    socialLinks: "Links Sociais",
    featured: "Destaques",
    recentPosts: "Posts Recentes",
    allPosts: "Todos os Posts",
    educationTitle: "Formação Acadêmica & Certificados",
    educationSubtitle: "Minha trajetória acadêmica, cursos de especialização e certificações obtidas.",
    academicTitle: "Formação Acadêmica",
    certificationsTitle: "Cursos & Certificações",
    viewCredential: "Ver Credencial",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "Todos os direitos reservados.",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: "Todos os artigos com a tag",

    tagsTitle: "Tags",
    tagsDesc: "Todas as tags usadas nos posts.",

    postsTitle: "Posts",
    postsDesc: "Todos os artigos que publiquei.",

    archivesTitle: "Arquivo",
    archivesDesc: "Todos os artigos arquivados.",

    searchTitle: "Pesquisa",
    searchDesc: "Pesquisar qualquer artigo...",
  },
  a11y: {
    skipToContent: "Pular para o conteúdo",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    toggleTheme: "Alternar tema",
    searchPlaceholder: "Pesquisar posts...",
    noResults: "Nenhum resultado encontrado",
    goToPreviousPage: "Ir para a página anterior",
    goToNextPage: "Ir para a próxima página",
  },
  notFound: {
    title: "404 Não Encontrado",
    message: "Página Não Encontrada",
    goHome: "Voltar para o início",
  },
} satisfies UIStrings;
