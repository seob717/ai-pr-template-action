// AI Provider implementations
import { DEFAULT_CONFIG } from "../defaults.js";

// AI Provider imports - dynamic loading
let Anthropic, OpenAI, GoogleGenerativeAI, Groq;

export async function importAISDKs() {
  try {
    const anthropicModule = await import("@anthropic-ai/sdk");
    Anthropic = anthropicModule.Anthropic;
  } catch (e) {
    console.debug("Anthropic SDK not available:", e.message);
  }

  try {
    const openaiModule = await import("openai");
    OpenAI = openaiModule.OpenAI;
  } catch (e) {
    console.debug("OpenAI SDK not available:", e.message);
  }

  try {
    const googleModule = await import("@google/generative-ai");
    GoogleGenerativeAI = googleModule.GoogleGenerativeAI;
  } catch (e) {
    console.debug("Google Generative AI SDK not available:", e.message);
  }

  try {
    const groqModule = await import("groq-sdk");
    Groq = groqModule.Groq;
  } catch (e) {
    console.debug("Groq SDK not available:", e.message);
  }
}

export class AIProviderService {
  constructor(apiKey, provider, model) {
    this.apiKey = apiKey;
    this.provider = provider;
    this.model = model;
  }

  async generateContent(systemPrompt, userPrompt) {
    try {
      console.log(`🤖 Using ${this.provider} with model ${this.model}`);

      switch (this.provider) {
        case "claude":
          if (!Anthropic) throw new Error("Anthropic SDK not available. Run: npm install @anthropic-ai/sdk");
          return await this.generateWithClaude(systemPrompt, userPrompt);
        case "openai":
          if (!OpenAI) throw new Error("OpenAI SDK not available. Run: npm install openai");
          return await this.generateWithOpenAI(systemPrompt, userPrompt);
        case "google":
          if (!GoogleGenerativeAI) throw new Error("Google Generative AI SDK not available. Run: npm install @google/generative-ai");
          return await this.generateWithGoogle(systemPrompt, userPrompt);
        case "vertex-ai":
          return await this.generateWithVertexAI(systemPrompt, userPrompt);
        case "groq":
          if (!Groq) throw new Error("Groq SDK not available. Run: npm install groq-sdk");
          return await this.generateWithGroq(systemPrompt, userPrompt);
        case "huggingface":
          return await this.generateWithHuggingFace(systemPrompt, userPrompt);
        default:
          throw new Error(`Unsupported AI provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`${this.provider} API 호출 실패:`, error.message);
      return null;
    }
  }

  async generateWithClaude(systemPrompt, userPrompt) {
    const anthropic = new Anthropic({ apiKey: this.apiKey });
    const message = await anthropic.messages.create({
      model: this.model,
      max_tokens: DEFAULT_CONFIG.maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return message.content[0].text;
  }

  async generateWithOpenAI(systemPrompt, userPrompt) {
    const openai = new OpenAI({ apiKey: this.apiKey });
    const completion = await openai.chat.completions.create({
      model: this.model,
      max_tokens: DEFAULT_CONFIG.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return completion.choices[0].message.content;
  }

  async generateWithGoogle(systemPrompt, userPrompt) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.model });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);
    return result.response.text();
  }

  async generateWithVertexAI(systemPrompt, userPrompt) {
    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION || DEFAULT_CONFIG.location;

    if (!projectId) {
      throw new Error("PROJECT_ID environment variable is required for Vertex AI");
    }

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${this.model}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: DEFAULT_CONFIG.maxTokens,
          temperature: DEFAULT_CONFIG.temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Vertex AI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  }

  async generateWithGroq(systemPrompt, userPrompt) {
    const groq = new Groq({ apiKey: this.apiKey });
    const completion = await groq.chat.completions.create({
      model: this.model,
      max_tokens: DEFAULT_CONFIG.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return completion.choices[0].message.content;
  }

  async generateWithHuggingFace(systemPrompt, userPrompt) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `${systemPrompt}\n\nUser: ${userPrompt}`,
        parameters: { max_length: DEFAULT_CONFIG.maxTokens },
      }),
    });

    const result = await response.json();
    return result[0]?.generated_text || result.generated_text;
  }
}