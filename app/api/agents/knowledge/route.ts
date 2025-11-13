import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/agents/knowledge - Get all knowledge entries for an agent
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType');

    const where: any = { doctorId: session.user.id };
    if (agentType) {
      where.agentType = agentType;
    }

    const knowledge = await prisma.agentKnowledge.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ knowledge });
  } catch (error) {
    console.error('Get agent knowledge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/agents/knowledge - Add new knowledge entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agentType, category, knowledge, source, priority } = await request.json();

    if (!agentType || !knowledge) {
      return NextResponse.json(
        { error: 'agentType and knowledge are required' },
        { status: 400 }
      );
    }

    const knowledgeEntry = await prisma.agentKnowledge.create({
      data: {
        doctorId: session.user.id,
        agentType,
        category: category || 'general',
        knowledge,
        source: source || null,
        priority: priority || 0,
      },
    });

    return NextResponse.json({ knowledge: knowledgeEntry }, { status: 201 });
  } catch (error) {
    console.error('Create agent knowledge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/knowledge/:id - Update knowledge entry
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Knowledge ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Verify ownership
    const existing = await prisma.agentKnowledge.findFirst({
      where: {
        id,
        doctorId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    const knowledge = await prisma.agentKnowledge.update({
      where: { id },
      data: {
        ...data,
        doctorId: session.user.id, // Ensure doctor ID doesn't change
      },
    });

    return NextResponse.json({ knowledge });
  } catch (error) {
    console.error('Update agent knowledge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/knowledge/:id - Delete knowledge entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Knowledge ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const result = await prisma.agentKnowledge.deleteMany({
      where: {
        id,
        doctorId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete agent knowledge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
