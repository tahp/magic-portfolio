import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { auth } from "@/auth";
import matter from "gray-matter";

async function isAuthenticated(request: NextRequest) {
  const session = await auth();
  return !!session;
}

async function getMetadataFromBlob(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  const { data } = matter(text);
  return data;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const blogBlobs = await list({ prefix: "blog/" });
    const workBlobs = await list({ prefix: "work/" });

    const posts = await Promise.all(
      blogBlobs.blobs
        .filter(b => b.pathname.endsWith(".mdx"))
        .map(async (b) => {
          const metadata = await getMetadataFromBlob(b.url);
          const slug = b.pathname.replace("blog/", "").replace(".mdx", "");
          return { name: b.pathname.replace("blog/", ""), slug, metadata };
        })
    );

    const projects = await Promise.all(
      workBlobs.blobs
        .filter(b => b.pathname.endsWith(".mdx"))
        .map(async (b) => {
          const metadata = await getMetadataFromBlob(b.url);
          const slug = b.pathname.replace("work/", "").replace(".mdx", "");
          return { name: b.pathname.replace("work/", ""), slug, metadata };
        })
    );

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

    const path = `${type}/${filename.endsWith(".mdx") ? filename : `${filename}.mdx`}`;
    
    await put(path, content, {
      access: 'public',
      contentType: 'text/markdown',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing file:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
