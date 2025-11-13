import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { suggestAgent } from "@/lib/services/agent-routing";

/**
 * POST /api/chat/suggest-agent - Get agent suggestion based on symptoms/message
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message, patientId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get agent suggestion
    const suggestion = await suggestAgent(message, patientId);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Agent suggestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
