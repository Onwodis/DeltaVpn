# Delta VPN AI Support Terminal

An enterprise-ready, high-concurrency diagnostic dashboard engineered for Delta VPN. This terminal leverages Groq’s ultra-low-latency Llama 3.1 8B inference to provide real-time network telemetry and intelligent infrastructure insights.

## Tech Stack
* **Framework:** Next.js (App Router)
* **AI Core Runtime:** Groq API (Llama 3.1 8B Instant)
* **Styling:** Tailwind CSS + Lucide Icons
* **Animation:** Framer Motion

## Architectural Overview


The application utilizes a streaming-first architecture to minimize perceived latency. The system prompt is engineered to enforce a "Senior Technical Advisor" persona, ensuring the agent maintains professional boundaries and pivots off-topic queries to core VPN infrastructure.

## Engineering Write-up
### Design Decisions
* **Factory Pattern:** Client initialization is deferred to runtime to prevent build-time failures in static site generation.
* **Persona-Driven Inference:** System-level instructions are used to control the agent's depth and tone, ensuring consistency across troubleshooting sessions.

### Trade-offs
* **Context Handling:** History is managed via a sliding-window array (`slice(-10)`) to maintain conversational state within memory constraints.
* **Storage:** Current session state uses `localStorage`. This allows for rapid iteration but will be replaced by a persistent database (e.g., Supabase/PostgreSQL) for production audits.

### Future Improvements
* **RAG Integration:** Implement vector-based document retrieval for technical troubleshooting.
* **Observability:** Integration of tracing (LangSmith) to monitor cost and response quality.

## Setup & Local Run
1. `pnpm install`
2. Create `.env` from `.env.example`
3. `pnpm run dev`

## Live Deployment
[https://deltavpn.netlify.app/](https://deltavpn.netlify.app/)