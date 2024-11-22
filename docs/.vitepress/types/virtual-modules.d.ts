declare module 'virtual:blog-meta' {
  interface BlogMeta {
    name: string;
    path: string;
    createTime: number;
    updateTime: number;
    readingTime: number;
    wordCount: number;
    frontmatter: Record<string, any>;
  }

  export const blogMeta: BlogMeta[];
}
