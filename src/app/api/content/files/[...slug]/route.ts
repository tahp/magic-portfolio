import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";

async function isAuthenticated(request: NextRequest) {
  const session = await auth();
  return !!session;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const [type, ...fileParts] = resolvedParams.slug;
    const filename = fileParts.join("/");
    
    if (type !== "blog" && type !== "work") {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    const dir = type === "blog" 
      ? path.join(process.cwd(), "src/app/blog/posts") 
      : path.join(process.cwd(), "src/app/work/projects");

    const filePath = path.join(dir, filename);
    const content = await fs.readFile(filePath, "utf8");
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const [type, ...fileParts] = resolvedParams.slug;
    const filename = fileParts.join("/");
    
    if (type !== "blog" && type !== "work") {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    const dir = type === "blog" 
      ? path.join(process.cwd(), "src/app/blog/posts") 
      : path.join(process.cwd(), "src/app/work/projects");

    const filePath = path.join(dir, filename);
    await fs.unlink(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
