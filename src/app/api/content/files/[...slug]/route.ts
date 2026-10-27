import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
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

    // In a real app, you'd look up the URL from a database or index.
    // For this simple setup, we can use the known pattern:
    // We need the actual URL of the blob. Since the blob name is the path, 
    // we can't just "guess" the URL without a list.
    // However, the client already has the name. 
    // Let's use the list API to find the exact URL.
    
    const { blobs } = await import("@vercel/blob").then(m => m.list({ prefix: `${type}/${filename}` }));
    const blob = blobs.find(b => b.pathname === `${type}/${filename}`);

    if (!blob) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const response = await fetch(blob.url);
    const content = await response.text();
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
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

    const path = `${type}/${filename}`;
    await del(path);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
