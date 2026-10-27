import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";

const CONTENT_PATH = path.join(process.cwd(), "src/resources/content.json");
const FILENAME = "content.json";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fs.readFile(CONTENT_PATH, "utf8");
    
    // Remove access: 'public' because the store is private
    await put(FILENAME, data, {
      contentType: 'application/json',
    });

    return NextResponse.json({ message: "Successfully migrated content.json to Vercel Blob!" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ message: "Migration failed", error: String(error) }, { status: 500 });
  }
}
