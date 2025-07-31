// Configuration and file loading utilities
import fs from "fs";
import path from "path";
import {
  DEFAULT_MODELS,
  DEFAULT_CONFIG,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_RULES,
  ERROR_MESSAGES
} from "../defaults.js";

export class ConfigService {
  constructor() {
    this.aiProvider = process.env.AI_PROVIDER || DEFAULT_CONFIG.aiProvider;
  }

  // Get API key with priority: api-key > provider-specific key
  getAPIKey() {
    if (process.env.API_KEY) return process.env.API_KEY;

    switch (this.aiProvider) {
      case "claude":
        return process.env.ANTHROPIC_API_KEY;
      case "openai":
        return process.env.OPENAI_API_KEY;
      case "google":
        return process.env.GOOGLE_API_KEY;
      case "vertex-ai":
        return process.env.VERTEX_AI_API_KEY;
      case "groq":
        return process.env.GROQ_API_KEY;
      default:
        return process.env.ANTHROPIC_API_KEY;
    }
  }

  // Get model for the provider
  getModel() {
    if (process.env.MODEL) return process.env.MODEL;
    return DEFAULT_MODELS[this.aiProvider] || DEFAULT_MODELS.claude;
  }

  // Get update mode
  getUpdateMode() {
    return process.env.UPDATE_MODE || DEFAULT_CONFIG.updateMode;
  }

  // Load system prompt from file or return default
  loadSystemPrompt(systemPromptPath) {
    if (fs.existsSync(systemPromptPath)) {
      try {
        return fs.readFileSync(systemPromptPath, "utf8");
      } catch (error) {
        console.error("시스템 프롬프트 파일 로드 실패:", error.message);
      }
    }
    
    return DEFAULT_SYSTEM_PROMPT;
  }

  // Load rules from JSON file
  loadRules(rulesPath) {
    if (fs.existsSync(rulesPath)) {
      try {
        const content = fs.readFileSync(rulesPath, "utf8");
        return JSON.parse(content);
      } catch (error) {
        console.error(ERROR_MESSAGES.ruleLoadFailed, error.message);
        return DEFAULT_RULES;
      }
    }
    return DEFAULT_RULES;
  }

  // Initialize paths
  static initializePaths(templatePath, defaultPaths) {
    return {
      templateDir: templatePath
        ? path.join(process.cwd(), templatePath)
        : path.join(process.cwd(), defaultPaths.templateDir),
      rulesPath: path.join(process.cwd(), defaultPaths.rulesPath),
      systemPromptPath: path.join(process.cwd(), defaultPaths.systemPromptPath)
    };
  }
}