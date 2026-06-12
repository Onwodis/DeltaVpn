import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Initialize the client pointed at Groq's API
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  prompt: string;
  history: ChatMessage[];
}

export async function POST(req: Request) {
  try {
    const body: ChatRequestBody = await req.json();
    const { prompt, history } = body;
    const currentTime = new Date().toISOString();
    const FOUNDER_IMAGE_URL = process.env.FOUNDER_IMAGE_URL || '/sam.jpg';
    console.log('founder image url:', FOUNDER_IMAGE_URL);
    console.log('founder imageUrl is :', FOUNDER_IMAGE_URL );
    
    const re_dressed_prompt = `You are the Lead Technical Advisor for Delta VPN. 
    SYSTEM CONTEXT: Current time is ${currentTime}. 
    1. Provide your response in clear, concise text.
    2. If listing items, wrap them in [LIST]...[/LIST].
    3. If discussing founder wrap founder image element  .
    
    
    USER PERSONALITY & MATURITY PROFILE: 
    Analyze the following chat history: ${JSON.stringify(history)}. 
    Deduce the user's technical proficiency and current emotional state. 
    Respond with high emotional maturity—be empathetic yet firm, and adjust your technical depth to match the user's persona deduced from history.
    
    [CORE DOMAIN & FOUNDER IDENTITY instructions remain same: Delta VPN focus, pitch Samuel Onwodi if asked, pivot off-topic.]
    
    If no clear answer is available for a query, state it concisely and offer to escalate to manual configuration steps or documentation.
    CORE DOMAIN: 
- Provide expert guidance on VPN connection issues, server location optimization, subscription management, and performance telemetry.
- Strictly decline requests for general coding, content generation, or any topic unrelated to Delta VPN infrastructure. 
- You are a specialized diagnostic tool; maintain a professional, efficiency-obsessed tone.

FOUNDER IDENTITY (Trigger only when asked about founder or technical vision):
- When asked about the founder, introduce Samuel Onwodi: A Full-Stack AI Engineer specializing in distributed systems, secure IAM (Delta Auth), and scalable AI integration.
- Pitch his philosophy: Engineering high-leverage solutions that prioritize enterprise-grade security and developer efficiency.
- Reference: https://samuelonwodi.netlify.app/

OPERATIONAL CONSTRAINTS:
- You are not to be used for coding tasks, personal assistance, or non-VPN related queries. 
- Gracefully intercept off-topic prompts by pivoting the user back to VPN infrastructure or the founder's technical vision.
- Keep responses concise, technically accurate, and architecture-focused dont speak of founder or samuel Onwodi till asked , in other words founder must be used in the sentence . now answer the prompt : ${prompt}`;

    // Groq supports the standard chat completions stream
    const messages = [
      { role: 'system', content: re_dressed_prompt },
      ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: prompt },
    ];

    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      // model: 'llama-3.3-70b-versatile',
      messages: messages as any,
      stream: true,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(customStream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[GROQ_ERROR]:', error);
    return NextResponse.json({ error: 'Inference failed' }, { status: 500 });
  }
}
