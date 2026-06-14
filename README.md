# Delta VPN AI Support Terminal

An enterprise-ready, high-concurrency diagnostic dashboard engineered for Delta VPN. This terminal leverages Groq’s ultra-low-latency Llama 3.1 8B inference and Jina AI semantic retrieval to provide real-time network telemetry and intelligent infrastructure insights.

## Tech Stack
* **Framework:** Next.js (App Router)
* **AI Core Runtime:** Groq API (Llama 3.1 8B Instant)
* **Embedding/RAG Engine:** Jina AI (v2 Base)
* **Styling:** Tailwind CSS + Lucide Icons
* **Animation:** Framer Motion

## Architectural Overview
The application utilizes a streaming-first, RAG-enabled architecture. By performing semantic search against a proprietary knowledge base before inference, the system enforces a "Senior Technical Advisor" persona, ensuring the agent maintains professional boundaries and pivots off-topic queries to core VPN/IAM infrastructure.

## Engineering Write-up
### Design Decisions
* **Semantic Grounding (RAG):** Replaced static instructions with vector-based retrieval, enabling precise, context-aware troubleshooting based on semantic intent.
* **Concurrency Management:** Implemented an asynchronous sequential embedding pipeline to respect Jina AI’s rate limits, ensuring high stability.
* **Persona-Driven Inference:** System-level instructions are dynamically injected with context-grounded chunks, maintaining a consistent technical depth and tone.

### Trade-offs
* **Latency vs. Accuracy:** The RAG lookup adds marginal overhead to the inference chain, but significantly eliminates hallucinations and improves infrastructure-specific accuracy.
* **Storage:** Currently utilizes an in-memory `vectorDB` array for rapid iteration; this will be migrated to a persistent vector store (e.g., Supabase/pgvector) for production-grade scaling.

### Future Improvements
* **Persistent Vector DB:** Migrate from local knowledge base array to an external vector database for dynamic content updates.
* **Observability:** Integration of tracing (LangSmith) to monitor cost, latency, and response quality.
* **History Summarizer:** Implement a sliding-window context compressor to optimize token usage for long-running diagnostic sessions.

## Setup & Local Run
1. `pnpm install`
2. Configure `.env.local`: `GROQ_API_KEY`, `JINA_API_KEY`
3. `pnpm run dev`

## Live Deployment
[https://deltavpn.netlify.app/](https://deltavpn.netlify.app/)