import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { auth } from "@/auth";

const FILENAME = "content.json";

async function getLatestContentUrl() {
  const { blobs } = await list({ prefix: FILENAME });
  if (blobs.length === 0) return null;

  const sortedBlobs = blobs.sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  
  return sortedBlobs[0].url;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await getLatestContentUrl();
    if (!url) {
      return NextResponse.json({ message: "No content found" }, { status: 404 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading content from Blob:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content = JSON.stringify(body, null, 2);
    
    const blob = await put(FILENAME, content, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });

    return NextResponse.json({ success: true, data: body, url: blob.url });
  } catch (error) {
    console.error("Error writing content to Blob:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
