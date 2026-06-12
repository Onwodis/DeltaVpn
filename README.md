# Delta VPN AI Support Terminal

An enterprise-ready, high-concurrency diagnostic dashboard engineered for Delta VPN. This terminal leverages Groq’s ultra-low-latency Llama 3.3 70B inference to provide real-time network telemetry and intelligent infrastructure insights.

## Tech Stack

* **Framework:** Next.js (App Router)
* **AI Core Runtime:** Groq API (Llama 3.3 70B Versatile)
* **Package Manager:** pnpm
* **Styling:** Tailwind CSS + Lucide Icons
* **Animation:** Framer Motion

## Architectural Overview & Data Persistence

Currently, this dashboard utilizes `localStorage` to manage conversation history, serving as a rapid prototyping mechanism.

> **⚠️ Production Roadmap Warning:** This is a temporary local solution. For the production-grade deployment, we are transitioning to a hardened IAM architecture including:
> * **Authentication:** Robust OAuth2/OIDC flows using `HttpOnly` JWT cookies for secure session management.
> * **Persistence:** Migrating from client-side storage to a secure backend database (PostgreSQL or MongoDB) to ensure data integrity, audit trails, and cross-device session synchronization.
> * **Security:** Strict server-side authorization and request validation to protect sensitive network telemetry and infrastructure configurations.

## Setup & Local Run Instructions

### Prerequisites
* Node.js (LTS version)
* `pnpm` installed globally

### Installation

1. Clone the repository and install dependencies:
   ```bash
   pnpm install