import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";

async function isAuthenticated(request: NextRequest) {
  const session = await auth();
  return !!session;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const blogPath = path.join(process.cwd(), "src/app/blog/posts");
    const workPath = path.join(process.cwd(), "src/app/work/projects");

    const blogFiles = await fs.readdir(blogPath);
    const workFiles = await fs.readdir(workPath);

    const posts = blogFiles
      .filter(f => f.endsWith(".mdx"))
      .map(f => ({ name: f, path: `blog/${f}`, content: "" })); // Content loaded on demand

    const projects = workFiles
      .filter(f => f.endsWith(".mdx"))
      .map(f => ({ name: f, path: `work/${f}`, content: "" }));

    return NextResponse.json({ posts, projects });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, filename, content } = await request.json();
    
    if (!type || !filename || content === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const dir = type === "blog" 
      ? path.join(process.cwd(), "src/app/blog/posts") 
      : path.join(process.cwd(), "src/app/work/projects");

    const filePath = path.join(dir, filename.endsWith(".mdx") ? filename : `${filename}.mdx`);
    
    await fs.writeFile(filePath, content, "utf8");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing file:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
