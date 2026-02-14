# 🧠 AI CV Ingestion Agent

A microservice built with **NestJS** to intelligently ingest, analyze and vectorize Curricula Vitae (CVs).

Unlike traditional parsers, this project implements a **native AI pipeline**. It uses multimodal models (Text Embbeding Small) for structured extraction from binary documents (PDF/DOCX) and plain text (HTML/MD), followed by high-fidelity semantic vectorization with OpenRouter. The result is a JSON of embeddings ready for RAG (Retrieval-Augmented Generation) architectures.

## 🚀 Architecture and Data Flow

1. **Ingest (Upload):** The endpoint receives a file (`.pdf`, `.docx`, `.md`, `.html`).
2. **Multimodal Parsing (The Brain):** The file is sent (Base64 or text) to **OpenRouter (text-embedding-3-small)**. The LLM acts as an ATS specialist, "reading" the document and returning a strictly typed JSON (Profile, Experience, Skills, Projects).
3. **Semantic Chunking:** The JSON is split into logical fragments (semantic chunks), avoiding abrupt cuts in the middle of sentences.
4. **Vectorization (The Memory):** Structured fragments are sent to **OpenRouter (`text-embedding-3-small`)** to generate vector representations.
5. **Export:** Returns a downloadable `.json` file containing texts and their embeddings.

## 🛠️ Tech Stack

* **Framework:** [NestJS](https://nestjs.com/) (Node.js/TypeScript)
* **Multimodal AI & Parsing:** [OpenRouter](https://openrouter.ai/) 
* **Embeddings:** [OpenRouter API](https://openrouter.ai/) (`text-embedding-3-small`)
* **Testing:** Jest (with full mocks of external APIs)

## 📋 Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher)
* NPM or Yarn
* Active accounts and API keys for [OpenRouter](https://openrouter.ai/) .

## ⚙️ Installation & Configuration

1. Clone the repo and install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the project root and add your credentials:
```env
# Multimodal parsing
OPENAI_API_KEY=your_openrouter_api_key

```

## 💻 Run the Project

```bash
# Development (watch mode)
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

## 📡 API Usage (Endpoint)

### `POST /cv/ingest`

Accepts a file (multipart/form-data) and returns a JSON with embeddings.

Example using cURL:
```bash
curl -X POST http://localhost:3000/cv/ingest \
    -F "file=@./path-to-your-file/Enrique_Lazo_CV.pdf" \
    -o my-embeddings.json
```

Output JSON structure:
```json
[
    {
        "id": "generated-uuid",
        "text": "Experience: Senior Software Engineer at Company X (2020-2023). Achievements: Reduced latency by 40%...",
        "embedding": [0.0123, -0.0456, ...],
        "metadata": {
            "source": "Enrique_Lazo_CV.pdf",
            "section": "experience",
            "processedAt": "2026-02-14T10:00:00.000Z"
        }
    }
]
```

## 🧪 Testing

The project includes unit tests that use advanced mocks to simulate OpenRouter responses, ensuring business logic reliability without consuming API credits.

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov
```
