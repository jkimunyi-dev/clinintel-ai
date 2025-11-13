import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkSubscriptionAccess } from "@/lib/middleware/subscription-check";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionCheck = await checkSubscriptionAccess(session.user.id);

    return NextResponse.json({
      hasAccess: subscriptionCheck.hasAccess,
      userRole: subscriptionCheck.userRole || "",
      hospitalName: subscriptionCheck.hospitalName || "N/A",
      subscriptionStatus: subscriptionCheck.subscriptionStatus || "UNKNOWN",
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
