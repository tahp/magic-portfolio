import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
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
    const types = ["blog", "work"];
    const dirs = {
      blog: path.join(process.cwd(), "src/app/blog/posts"),
      work: path.join(process.cwd(), "src/app/work/projects"),
    };

    let uploadCount = 0;

    for (const type of types) {
      const dir = dirs[type as keyof typeof dirs];
      const files = await fs.readdir(dir);
      const mdxFiles = files.filter(f => f.endsWith(".mdx"));

      for (const file of mdxFiles) {
        const content = await fs.readFile(path.join(dir, file), "utf8");
        const blobPath = type + "/" + file;
        
        await put(blobPath, content, {
          access: 'public',
          contentType: 'text/markdown',
        });
        uploadCount++;
      }
    }

    return NextResponse.json({ 
      message: "Successfully migrated " + uploadCount + " files to Vercel Blob!" 
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ message: "Migration failed", error: String(error) }, { status: 500 });
  }
}
