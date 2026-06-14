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

// Factory Return Type for strict contractual compliance
export interface VectorStore {
  bootstrap: (knowledge: string[]) => Promise<void>;
  findBestMatch: (queryVector: number[]) => string;
}

// --- CONFIGURATION & CLIENTS ---
const getGroqClient = (): OpenAI => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is unconfigured.');
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

// --- EMBEDDING SERVICE ---
async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error('JINA_API_KEY is unconfigured.');

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
      `Jina API Status ${response.status}: ${JSON.stringify(errorData)}`
    );
  }

  const json = await response.json();
  return json.data[0].embedding;
}

// --- MATHEMATICAL UTILITIES ---
function strictCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = vecA.length;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- FUNCTIONAL VECTOR STORE (REPLACES CLASS) ---
export function createVectorStore(): VectorStore {
  // Encapsulated within the function closure scope - invisible from the outside
  let registry: VectorNode[] = [];

  const bootstrap = async (knowledge: string[]): Promise<void> => {
    const apiKey = process.env.JINA_API_KEY;
    if (!knowledge.length) return;

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

    registry = knowledge.map((text, i) => ({
      text,
      vector: json.data[i].embedding,
    }));
  };

  const findBestMatch = (queryVector: number[]): string => {
    if (registry.length === 0) return 'No specific context found.';

    let bestMatch = registry[0];
    let highestSimilarity = -1;

    // Linear O(N) reduction loop
    const totalNodes = registry.length;
    for (let i = 0; i < totalNodes; i++) {
      const node = registry[i];
      const score = strictCosineSimilarity(node.vector, queryVector);
      if (score > highestSimilarity) {
        highestSimilarity = score;
        bestMatch = node;
      }
    }

    return bestMatch.text;
  };

  return {
    bootstrap,
    findBestMatch,
  };
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

// Instantiating our store utilizing the functional closure factory
export const store = createVectorStore();

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
    console.log('Retrieved context for query:', contextText);
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
- You should be able to handle questions about:
● Troubleshooting VPN connection issues (e.g., “My VPN keeps disconnecting”)
● Server location recommendations based on use case or geography
● Subscription and account-related questions
● VPN performance improvement tips

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
