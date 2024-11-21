declare module 'virtual:blog-meta' {
  interface BlogMeta {
    name: string;
    path: string;
    createTime: number;
    updateTime: number;
    readingTime: number;
    tags: string[];
  }

  export const blogMeta: BlogMeta[];
}
