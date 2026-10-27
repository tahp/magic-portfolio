import { NextRequest, NextResponse } from "next/server";
import { put, list, head } from "@vercel/blob";
import { auth } from "@/auth";

const FILENAME = "content.json";

async function getLatestContentUrl() {
  const { blobs } = await list({ prefix: FILENAME });
  if (blobs.length === 0) return null;

  // Sort by uploadedAt descending to get the most recent version
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
    
    // Upload to Vercel Blob
    const blob = await put(FILENAME, content, {
      access: 'public', // The content itself is public, but the admin panel is protected
      contentType: 'application/json',
    });

    return NextResponse.json({ success: true, data: body, url: blob.url });
  } catch (error) {
    console.error("Error writing content to Blob:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
