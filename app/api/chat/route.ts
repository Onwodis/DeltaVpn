import { ragChat } from '@/app/ai/rag'; // Import your RAG service
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { prompt, history } = await req.json();

    // 1. CALL THE RAG SERVICE
    // This fetches the context from your vector store
    // Ensure ragChat returns the streamed response from Groq
    const stream = await ragChat(prompt, history);

    // 2. STREAMING RESPONSE
    // We transform the Groq stream into a standard Web ReadableStream
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[AGENT_ERROR]:', error);
    return NextResponse.json({ error: 'Inference failed' }, { status: 500 });
  }
}
