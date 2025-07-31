#!/usr/bin/env node

import fs from "fs";
import * as github from "@actions/github";
import { execSync } from "child_process";

// Import services
import { importAISDKs, AIProviderService } from "./src/ai-providers.js";
import { GitService } from "./src/git-service.js";
import { TemplateService } from "./src/template-service.js";
import { ConfigService } from "./src/config-service.js";
import { PRUpdateService } from "./src/pr-update-service.js";

// Import defaults
import {
  DEFAULT_PATHS,
  OUTPUT_FILENAME,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from "./defaults.js";

class PRTemplateGenerator {
  constructor() {
    // Initialize configuration
    this.configService = new ConfigService();
    
    // Setup paths
    const paths = ConfigService.initializePaths(
      process.env.TEMPLATE_PATH,
      DEFAULT_PATHS
    );
    this.templateDir = paths.templateDir;
    this.rulesPath = paths.rulesPath;
    this.systemPromptPath = paths.systemPromptPath;

    // Load configuration
    this.aiProvider = this.configService.aiProvider;
    this.apiKey = this.configService.getAPIKey();
    this.model = this.configService.getModel();
    this.updateMode = this.configService.getUpdateMode();

    // Load rules and template selection
    const rulesData = this.configService.loadRules(this.rulesPath);
    this.rules = rulesData.rules || [];
    this.templateSelectionRules = rulesData.templateSelection;

    // Initialize services
    this.githubToken = process.env.GITHUB_TOKEN;
    this.octokit = this.githubToken ? github.getOctokit(this.githubToken) : null;
    
    this.gitService = new GitService(this.octokit);
    this.templateService = new TemplateService(this.templateDir, this.templateSelectionRules);
    this.aiProviderService = new AIProviderService(this.apiKey, this.aiProvider, this.model);
    this.prUpdateService = new PRUpdateService(this.updateMode);

    // Log initialization
    if (!this.apiKey) {
      console.log(ERROR_MESSAGES.noApiKey);
    }
  }

  // Main execution function
  async generate() {
    try {
      console.log(SUCCESS_MESSAGES.generationStarted);
      console.log(`📡 AI Provider: ${this.aiProvider}`);
      console.log(`🎯 Model: ${this.model}`);

      // 1. Get Git diff and changes
      const { diff, changedFiles } = await this.gitService.getGitDiff();
      if (!diff && changedFiles.length === 0) {
        console.log(ERROR_MESSAGES.noChanges);
        this.prUpdateService.setOutput("content-generated", "false");
        return;
      }

      // 2. Select and read template
      const prTitle = this.gitService.getPRTitle();
      const branchName = this.gitService.getCurrentBranch();
      const lastCommit = execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();
      
      const templateName = this.templateService.selectTemplate(prTitle, branchName, lastCommit);
      console.log(`${SUCCESS_MESSAGES.templateSelected} ${templateName}`);
      this.prUpdateService.setOutput("template-used", templateName);
      
      const originalTemplate = this.templateService.readTemplate(templateName);

      // 3. Generate AI content
      let aiFilledTemplate = originalTemplate;
      if (this.apiKey) {
        console.log(SUCCESS_MESSAGES.aiGenerating);
        
        const systemPrompt = this.configService.loadSystemPrompt(this.systemPromptPath);
        const userPrompt = this.prUpdateService.createUserPrompt(diff, changedFiles, originalTemplate);
        
        const aiGeneratedContent = await this.aiProviderService.generateContent(systemPrompt, userPrompt);
        if (aiGeneratedContent) {
          aiFilledTemplate = aiGeneratedContent;
        } else {
          console.log(ERROR_MESSAGES.aiGenerationFailed);
        }
      } else {
        console.log("ℹ️ No API key provided, using basic template only.");
      }

      // 4. Extract information and apply rules
      const commitMessages = await this.gitService.getCommitMessages();
      const extractedInfo = this.templateService.extractInfoByRules(
        commitMessages, 
        branchName, 
        this.rules
      );
      
      console.log("🔍 Extracted information:", JSON.stringify(extractedInfo, null, 2));
      
      const finalContent = this.templateService.applyRulesToTemplate(
        aiFilledTemplate,
        extractedInfo,
        this.rules
      );

      // 5. Handle update mode and file output
      const shouldUpdate = this.prUpdateService.shouldUpdatePRBody();
      this.prUpdateService.setOutput("should-update-body", shouldUpdate.toString());
      
      if (shouldUpdate || this.updateMode === "comment-only") {
        fs.writeFileSync(OUTPUT_FILENAME, finalContent);
      }
      
      this.prUpdateService.setOutput("content-generated", "true");
      console.log(`📝 Update mode: ${this.updateMode}`);
      console.log(`🔄 Should update PR body: ${shouldUpdate}`);
      console.log(SUCCESS_MESSAGES.generationComplete);

      return finalContent;
    } catch (error) {
      console.error("❌ PR template generation failed:", error.message);
      this.prUpdateService.setOutput("content-generated", "false");
      process.exit(1);
    }
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await importAISDKs();
  const generator = new PRTemplateGenerator();
  await generator.generate();
}

export default PRTemplateGenerator;