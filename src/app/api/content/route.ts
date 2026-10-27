import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";

const CONTENT_PATH = path.join(process.cwd(), "src/resources/content.json");

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fs.readFile(CONTENT_PATH, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading content file:", error);
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
    await fs.writeFile(CONTENT_PATH, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error("Error writing content file:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
