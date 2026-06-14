import OpenAI from 'openai';

// --- TYPES ---
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VectorNode {
  text: string;
  vector: number[];
}

// --- CONFIGURATION & CLIENTS ---
const getGroqClient = (): OpenAI => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

// --- EMBEDDING SERVICE ---
async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error('JINA_API_KEY is missing');
  }

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v2-base-en',
      input: [text],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Jina API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const json = await response.json();
  console.log('Received embedding from Jina API:', json.data[0].embedding);
  return json.data[0].embedding;
}

// --- MATHEMATICAL UTILITIES ---
function strictCosineSimilarity(vecA: number[], vecB: number[]): number {
  console.log("executing cosine function")
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- IN-MEMORY VECTOR STORE ---
class LocalVectorStore {
  private registry: VectorNode[] = [];

  // Seed data directly without blocking module compilation
  public async bootstrap(knowledge: string[]): Promise<void> {
    const apiKey = process.env.JINA_API_KEY;
    if (!knowledge.length) return;

    // Utilize Jina's native batch processing array capability
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v2-base-en',
        input: knowledge,
      }),
    });

    if (!response.ok)
      throw new Error('Failed to bootstrap vector knowledge base');
    const json = await response.json();
    // console.info('VectorStore bootstrapped with knowledge base:', knowledge.length, 'entries');

    this.registry = knowledge.map((text, i) => ({
      text,
      vector: json.data[i].embedding,
    }));
  }

  // O(N) linear reduction instead of O(N log N) mutations
  public findBestMatch(queryVector: number[]): string {
    if (this.registry.length === 0) return 'No specific context found.';

    let bestMatch = this.registry[0];
    let highestSimilarity = -1;

    for (const node of this.registry) {
      const score = strictCosineSimilarity(node.vector, queryVector);
      if (score > highestSimilarity) {
        highestSimilarity = score;
        bestMatch = node;
      }
    }

    return bestMatch.text;
  }
}

// --- INITIALIZATION ---
const KNOWLEDGE_BASE = [
  'Delta VPN core services include troubleshooting connection issues, server location optimization, subscription management, and performance telemetry.',
  'When troubleshooting VPN disconnects, guide users through standard diagnostic steps for server latency and connection stability.',
  'Founder Identity: Samuel Onwodi is a Full-Stack AI Engineer specializing in distributed systems, secure IAM (Delta Auth), and scalable AI integration. Philosophy: Prioritizing enterprise-grade security and developer efficiency. Portfolio: https://samuelonwodi.netlify.app/',
  'Operational Constraint: Strictly decline requests for general coding, content generation, or non-VPN related topics. Pivot off-topic queries back to Delta VPN infrastructure.',
  'Communication Protocol: Respond in clear, concise text. Wrap all lists in [LIST] tags.',
  'Emotional Intelligence Protocol: Analyze chat history to deduce user technical proficiency and emotional state. Maintain professional, efficiency-obsessed tone.',
  'You are not to be used for general coding, content generation, or non-VPN related topics, strictly decline.',
  'Founder disclosure policy: Only introduce Samuel Onwodi or his technical vision when explicitly asked by the user.',
];

const store = new LocalVectorStore();
// Non-blocking asynchronous bootstrap
store
  .bootstrap(KNOWLEDGE_BASE)
  .catch((err) => console.error('VectorStore Bootstrap Failed:', err));

// --- MAIN CHAT SERVICE ---
export async function ragChat(userQuery: string, history: ChatMessage[]) {
  const currentTime = new Date().toISOString();

  let contextText = 'No specific context found.';
  try {
    const queryVector = await getEmbedding(userQuery);
    contextText = store.findBestMatch(queryVector);
    // console.log('Retrieved context for query:', contextText);
  } catch (error) {
    console.error(
      'RAG Retrieval failed, falling back to empty context:',
      error
    );
  }

  const systemPrompt = `You are the Lead Technical Advisor for Delta VPN. 
  CURRENT TIME: ${currentTime}.

  CORE MANDATE:
  - You are a specialized diagnostic tool for Delta VPN infrastructure.
  - STRICTLY DECLINE any requests for general coding, code snippets, or software development tutorials.
  - If a user asks for code, pivot immediately: "As the Lead Technical Advisor for Delta VPN, I focus on infrastructure diagnostics and network performance. I cannot provide coding assistance."
  - Pivot all off-topic queries back to VPN/IAM infrastructure or troubleshooting.
  
  IDENTITY:
  - Reference Samuel Onwodi ONLY when explicitly asked: Full-Stack AI Engineer, expert in IAM (Delta Auth) and distributed systems. 
  - Portfolio: https://samuelonwodi.netlify.app/

  FORMATTING:
  - Respond concisely.
  - Wrap lists in [LIST]...[/LIST].
  
  GROUNDING CONTEXT:
  ${contextText}`;

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
