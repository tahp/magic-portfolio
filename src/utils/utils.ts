import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { list } from "@vercel/blob";

type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

type Metadata = {
  title: string;
  subtitle?: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  tag?: string;
  team: Team[];
  link?: string;
};

function getMDXFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found");
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(rawContent);

  const metadata: Metadata = {
    title: data.title || "",
    subtitle: data.subtitle || "",
    publishedAt: data.publishedAt,
    summary: data.summary || "",
    image: data.image || "",
    images: data.images || [],
    tag: data.tag || [],
    team: data.team || [],
    link: data.link || "",
  };

  return { metadata, content };
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getPosts(customPath = ["", "", "", ""]) {
  const postsDir = path.join(/* turbopackIgnore: true */ process.cwd(), ...customPath);
  return getMDXData(postsDir);
}

async function getMetadataFromBlob(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  const { data } = matter(text);
  return data;
}

export async function getPostsCloud(type: "blog" | "work") {
  try {
    const blobs = await list({ prefix: `${type}/` });
    const filteredBlobs = blobs.blobs.filter(b => b.pathname.endsWith(".mdx"));
    
    return await Promise.all(
      filteredBlobs.map(async (b) => {
        const metadata = await getMetadataFromBlob(b.url);
        const slug = b.pathname.replace(`${type}/`, "").replace(".mdx", "");
        return { 
          name: b.pathname.replace(`${type}/`, ""), 
          slug, 
          metadata,
          source: "cloud",
          content: "", // Content fetched on demand
          hasContent: true // Cloud posts created via admin always have content
        };
      })
    );
  } catch (error) {
    console.error(`Error fetching ${type} posts from cloud:`, error);
    return [];
  }
}

export async function getContentCloud(type: "blog" | "work", filename: string) {
  try {
    const blobs = await list({ prefix: `${type}/${filename}` });
    const blob = blobs.blobs.find(b => b.pathname === `${type}/${filename}`);

    if (!blob) return null;

    const response = await fetch(blob.url);
    return await response.text();
  } catch (error) {
    console.error(`Error fetching cloud content for ${filename}:`, error);
    return null;
  }
}

export async function getUnifiedPosts(type: "blog" | "work") {
  const dir = type === "blog" ? ["src", "app", "blog", "posts"] : ["src", "app", "work", "projects"];
  const localPosts = getPosts(dir).map(p => ({ ...p, source: "local", hasContent: !!p.content }));
  const cloudPosts = await getPostsCloud(type);
  
  return [...localPosts, ...cloudPosts];
}
