import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { streamChatCompletion, ChatMessage } from '@/lib/ai/deepseek';
import { getAgent, formatPatientContextForAgent, AgentType } from '@/lib/ai/agents';
import { prisma } from '@/lib/db';
import { suggestAgent, getAgentKnowledge } from '@/lib/services/agent-routing';

// Note: Using Node runtime (not edge) because we need Prisma database access

/**
 * POST /api/chat - Stream chat responses from AI doctor agents
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      messages, 
      agentId = 'general-doctor',
      patientId,
      includePatientContext = false,
      files = []
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get the selected agent
    const agent = getAgent(agentId as AgentType);

    // Analyze first message for agent suggestion (if using general-doctor)
    let agentSuggestion = null;
    if (agentId === 'general-doctor' && messages.length > 0) {
      const userMessage = messages[messages.length - 1];
      if (userMessage.role === 'user') {
        agentSuggestion = await suggestAgent(userMessage.content, patientId);
      }
    }

    // Build the messages array with system prompt
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
    ];

    // Add doctor's fine-tuned knowledge for this agent
    const customKnowledge = await getAgentKnowledge(session.user.id, agentId);
    if (customKnowledge.length > 0) {
      chatMessages.push({
        role: 'system',
        content: `DOCTOR'S CUSTOM KNOWLEDGE BASE:\n\n${customKnowledge.join('\n\n---\n\n')}\n\nUse this knowledge to provide more personalized and specialized care.`,
      });
    }

    // If patient context is requested and patientId is provided, fetch patient data
    if (includePatientContext && patientId) {
      try {
        const patient = await prisma.patient.findFirst({
          where: {
            id: patientId,
            doctorId: session.user.id,
          },
          include: {
            File: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Get most recent file for lab results
            },
          },
        });

        if (patient) {
          // Calculate age from date of birth
          let age: number | undefined;
          if (patient.dateOfBirth) {
            const dob = new Date(patient.dateOfBirth);
            age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          }

          // Extract lab results from most recent file metadata if available
          const latestFile = patient.File[0];
          let labResults: any = null;
          let vitals: any = null;

          if (latestFile?.metadata && typeof latestFile.metadata === 'object') {
            const metadata = latestFile.metadata as any;
            
            // Try to extract lab results and vitals from metadata
            if (metadata.summary) {
              labResults = {
                hba1c: metadata.summary.averageHbA1c,
                fastingBloodGlucose: metadata.summary.averageFastingGlucose,
              };
            }
          }

          const patientContext = formatPatientContextForAgent({
            name: patient.name,
            age,
            gender: patient.gender || undefined,
            dateOfBirth: patient.dateOfBirth?.toISOString(),
            notes: patient.notes || undefined,
            labResults,
            vitals,
          });

          // Add patient context as a system message
          chatMessages.push({
            role: 'system',
            content: `PATIENT CONTEXT:\n${patientContext}`,
          });
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        // Continue without patient context
      }
    }

    // Add user messages
    chatMessages.push(...messages);

    // If files are uploaded, add them to the context
    if (files && files.length > 0) {
      let filesContext = '\n\n=== UPLOADED MEDICAL RECORDS ===\n\n';
      
      for (const file of files) {
        if (file.type === 'csv' && file.content) {
          // Parse CSV content
          filesContext += `File: ${file.name}\n`;
          filesContext += `Type: CSV Medical Records\n\n`;
          
          // Extract key information from CSV
          const lines = file.content.split('\n').slice(0, 50); // First 50 lines
          filesContext += `Content Preview:\n${lines.join('\n')}\n\n`;
          
          // Try to extract summary statistics
          try {
            const rows = file.content.split('\n');
            const headers = rows[0]?.split(',') || [];
            filesContext += `Columns: ${headers.join(', ')}\n`;
            filesContext += `Total Records: ${rows.length - 1}\n\n`;
          } catch (e) {
            // Ignore parsing errors
          }
        } else if (file.type === 'image') {
          filesContext += `File: ${file.name}\n`;
          filesContext += `Type: Medical Image\n`;
          filesContext += `Note: ${file.message || 'Image uploaded - visual analysis requires additional configuration'}\n\n`;
        } else if (file.content) {
          filesContext += `File: ${file.name}\n`;
          filesContext += `Content:\n${file.content.substring(0, 2000)}\n\n`;
        }
      }
      
      filesContext += '======================\n\n';
      filesContext += 'Please analyze the uploaded medical records above and provide insights based on the data.';
      
      // Add files context as a system message
      chatMessages.push({
        role: 'system',
        content: filesContext,
      });
    }

    // Stream the response
    const stream = await streamChatCompletion(chatMessages, {
      temperature: agentId === 'diabetic-doctor' ? 0.3 : 0.5,
      maxTokens: 3000,
    });

    // Create a TransformStream to process the SSE data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Send agent suggestion first if available
    let agentSuggestionSent = false;

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Send agent suggestion before first content chunk
        if (!agentSuggestionSent && agentSuggestion) {
          const suggestionData = {
            type: 'agent_suggestion',
            suggestion: agentSuggestion,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(suggestionData)}\n\n`)
          );
          agentSuggestionSent = true;
        }

        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              // Forward the chunk as-is
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      },
    });

    return new Response(stream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat - Get available agents
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { getAllAgents } = await import('@/lib/ai/agents');
    const agents = getAllAgents();

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
