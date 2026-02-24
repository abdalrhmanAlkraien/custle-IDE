📄 Task 3.1 — Model Config & Connection
=========================================

🎯 Objective
------------
Build the model configuration system that lets users add any OpenAI-compatible
model (or Anthropic/OpenAI directly), test the connection, and switch
between models at runtime.

📂 File Locations
=================
```shell
backend/src/routes/model.ts
backend/src/services/modelService.ts
frontend/src/components/modals/ModelConfigModal.tsx
frontend/src/lib/api/modelApi.ts
```
1️⃣ Backend Model Routes — /api/model
======================================
```shell
GET  /api/model/config          → returns current model config (no apiKey in response)
POST /api/model/config          → body: ModelConfig → saves and activates config
POST /api/model/test            → body: ModelConfig → tests connection, returns {ok, latency, modelList}
GET  /api/model/list            → returns saved model configs
POST /api/model/chat            → body: {messages, stream} → proxies to model
(keeps apiKey server-side, never exposed to browser)
```

**IMPORTANT**: API keys stay on the backend. The frontend sends config to backend,
backend stores in memory + .env.local. The /api/model/chat proxy endpoint is what
the frontend uses for all AI calls.

2️⃣ ModelConfigModal.tsx
========================
Triggered by clicking model pill in TitleBar. Full-screen modal:

**Saved Models list** (left panel):
- List of all saved configs
- Click to select/activate
- Delete button per config
- "Add New" button

**Config Form** (right panel):
- Provider selector: [OpenAI Compatible ▾] [OpenAI] [Anthropic]
- Model URL (for openai-compatible): input with placeholder
- Model Name: input
- API Key: password input
- Max Tokens: number input (default 4096)
- Temperature: slider 0.0-1.0
- "Test Connection" button → shows latency + available models
- "Save & Activate" button

**Presets** (quick-add buttons):
- OpenAI GPT-4o
- Anthropic Claude Sonnet
- Local Ollama
- Custom vLLM

🧪 Test Scenarios
=================

### Scenario 1: Test connection
- Enter vLLM URL and API key, click "Test Connection"
- Expected: "✓ Connected — 45ms — 1 model available"

### Scenario 2: Save config
- Fill form, click "Save & Activate"
- Expected: Config appears in saved list, model pill in titlebar updates

### Scenario 3: Switch models
- Add two configs, click between them
- Expected: Active model changes, titlebar updates

### Scenario 4: Invalid config
- Enter wrong URL, test connection
- Expected: "✗ Connection failed — ECONNREFUSED"

🔒 Non-Functional Requirements
===============================
- API keys NEVER sent to frontend after saving
- Test connection must timeout after 10 seconds

✅ Deliverable
==============
```shell
Model config modal + backend proxy for all AI calls
```

📊 Acceptance Criteria
======================
- [ ] Can add/remove/switch model configs
- [ ] Connection test works
- [ ] API key never returned to frontend
- [ ] All AI calls go through backend proxy
- [ ] No TypeScript errors

⏱️ Estimated Duration: 45-60 minutes
🔗 Dependencies: Task 1.1
🔗 Blocks: Task 3.2