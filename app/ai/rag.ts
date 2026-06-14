import OpenAI from 'openai';

// --- CONFIGURATION & CLIENTS ---

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing');
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

// --- EMBEDDING SERVICE (Jina AI) ---

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v2-base-en',
      input: [text],
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Jina API error: ${json.detail || JSON.stringify(json)}`);
  }

  return json.data[0].embedding;
}

// Managed batch processing to respect Jina's concurrency limits
async function getEmbeddingsSequentially(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const embedding = await getEmbedding(text);
    embeddings.push(embedding);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limit compliance
  }
  return embeddings;
}

// --- RAG LOGIC ---

const knowledgeBase = [
  'Delta VPN core services include troubleshooting connection issues, server location optimization, subscription management, and performance telemetry.',
  'When troubleshooting VPN disconnects, guide users through standard diagnostic steps for server latency and connection stability.',
  'Founder Identity: Samuel Onwodi is a Full-Stack AI Engineer specializing in distributed systems, secure IAM (Delta Auth), and scalable AI integration. Philosophy: Prioritizing enterprise-grade security and developer efficiency. Portfolio: https://samuelonwodi.netlify.app/',
  'Operational Constraint: Strictly decline requests for general coding, content generation, or non-VPN related topics. Pivot off-topic queries back to Delta VPN infrastructure.',
  'Communication Protocol: Respond in clear, concise text. Wrap all lists in [LIST] tags.',
  'Emotional Intelligence Protocol: Analyze chat history to deduce user technical proficiency and emotional state. Maintain professional, efficiency-obsessed tone.',
  'Founder disclosure policy: Only introduce Samuel Onwodi or his technical vision when explicitly asked by the user.',
];

// Initialize once to avoid re-computation
const vectorDB = await getEmbeddingsSequentially(knowledgeBase).then(
  (vectors) => knowledgeBase.map((text, i) => ({ text, vector: vectors[i] }))
);

function cosineSimilarity(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

async function search(query: string) {
  const queryVector = await getEmbedding(query);
  return vectorDB.sort(
    (a, b) =>
      cosineSimilarity(b.vector, queryVector) -
      cosineSimilarity(a.vector, queryVector)
  )[0];
}

// --- MAIN CHAT SERVICE ---

export async function ragChat(userQuery: string, history: any[]) {
  const currentTime = new Date().toISOString();

  // 1. Retrieve Context with simple retry
  const context = await search(userQuery).catch(() => ({
    text: 'No specific context found.',
  }));

  // 2. Persona-Driven Prompt
  const systemPrompt = `You are the Lead Technical Advisor for Delta VPN. 
    Current time: ${currentTime}.
    
    INSTRUCTIONS:
    - Respond concisely. Wrap lists in [LIST]...[/LIST].
    - Pivot off-topic queries back to VPN/IAM infrastructure.
    - Reference Samuel Onwodi only when asked: Full-Stack AI Engineer, expert in IAM (Delta Auth) and distributed systems. Portfolio: https://samuelonwodi.netlify.app/
    
    GROUNDING CONTEXT:
    ${context.text}
    
    CHAT HISTORY:
    ${JSON.stringify(history)}`;

  // 3. Generate Stream
  const groq = getGroqClient();
  return await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userQuery },
    ],
    stream: true,
  });
}
