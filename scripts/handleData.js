import * as fs from 'node:fs/promises';
import fglob from 'fast-glob';
import { fileURLToPath, URL } from 'node:url';
import { remark } from 'remark';
import remarkParse from 'remark-parse';
import matter from 'gray-matter';
import { tagMapping } from './tag.js';
import dayjs from 'dayjs';
const wordsPerMinute = 200;

const calculateReadingTime = (content) => {
  const ast = remark().use(remarkParse).parse(content);
  const countWords = (node) => {
    if (node.type === 'text') {
      return node.value.split(/\s+/).length;
    }
    if (node.children) {
      return node.children.map(countWords).reduce((a, b) => a + b, 0);
    }
    return 0;
  };
  const wordCount = countWords(ast);
  return Math.ceil(wordCount / wordsPerMinute);
};

const extractTags = (content) => {
  const tags = new Set();
  const words = content.toLowerCase().split(/\W+/);

  for (const word of words) {
    if (tagMapping[word]) {
      tags.add(tagMapping[word]);
    }
  }

  return Array.from(tags);
};

const processMarkdownFiles = async (pattern, exclude = ['index.md']) => {
  return fglob(pattern).then(async (files) => {
    const articles = [];
    for (const file of files) {
      if (exclude.includes(file.split('/').pop())) {
        continue;
      }
      const fileContent = await fs.readFile(file, 'utf8');
      let title = file.split('/').pop().replace('.md', '');
      let isTranslate = false;
      const path = file.split('/').pop().replace('.md', '.html');
      // 是否翻译的文章
      if (title.endsWith('$ZH_CH')) {
        title = title.replace('$ZH_CH', '');
        isTranslate = true;
      }

      // 获取创建时间和修改时间
      const date = await fs.stat(file).then((stats) => {
        return {
          birthtime: stats.birthtime,
          mtime: stats.mtime,
        };
      });
      const readingTime = calculateReadingTime(fileContent);
      const tags = extractTags(fileContent);
      articles.push({
        year: dayjs(date.birthtime).format('YYYY'),
        title,
        createTime: dayjs(date.birthtime).format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs(date.mtime).format('YYYY-MM-DD HH:mm:ss'),
        time: `${readingTime} 分钟`,
        tags,
        isTranslate,
        path,
      });
    }

    const result = articles.reduce((acc, cur) => {
      const year = cur.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(cur);
      return acc;
    }, {});
    return result;
  });
};

const __path = '../docs/blog';
const globPattern = fileURLToPath(new URL(`${__path}/*.md`, import.meta.url));
// 示例用法
const result = await processMarkdownFiles(globPattern);
// 写入文件
await fs.writeFile(
  fileURLToPath(new URL(`${__path}/articles.ts`, import.meta.url)),
  `export const articles = ${JSON.stringify(result, null, 2)};`
);
