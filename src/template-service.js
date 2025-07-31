// Template selection and management
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  DEFAULT_CONFIG,
  DEFAULT_TEMPLATES,
  DEFAULT_TEMPLATE_PATTERNS,
  DEFAULT_COMMIT_PATTERNS,
  ERROR_MESSAGES
} from "../defaults.js";

export class TemplateService {
  constructor(templateDir, templateSelectionRules) {
    this.templateDir = templateDir;
    this.templateSelectionRules = templateSelectionRules;
  }

  // Select template based on rules
  selectTemplate(prTitle, branchName, lastCommit) {
    try {
      // Use custom rules if available
      if (this.templateSelectionRules.rules && this.templateSelectionRules.rules.length > 0) {
        return this.selectTemplateByRules(prTitle, branchName, lastCommit);
      }

      // Fallback to default logic
      return this.selectTemplateByDefault(branchName, lastCommit);
    } catch (error) {
      console.error(ERROR_MESSAGES.templateSelectionFailed, error.message);
      return this.templateSelectionRules.defaultTemplate || DEFAULT_CONFIG.defaultTemplate;
    }
  }

  // Select template using custom rules
  selectTemplateByRules(prTitle, branchName, lastCommit) {
    // Sort by priority
    const sortedRules = [...this.templateSelectionRules.rules].sort(
      (a, b) => (a.priority || 999) - (b.priority || 999)
    );

    // Test each rule
    for (const rule of sortedRules) {
      const { condition, pattern, template } = rule;
      let testValue = "";

      switch (condition) {
        case "pr_title":
          testValue = prTitle;
          break;
        case "branch":
          testValue = branchName;
          break;
        case "commit":
          testValue = lastCommit;
          break;
        default:
          continue;
      }

      if (testValue && new RegExp(pattern, "i").test(testValue)) {
        console.log(`Template selection rule matched: ${condition}="${testValue}" -> ${template}`);
        return template;
      }
    }

    return this.templateSelectionRules.defaultTemplate || DEFAULT_CONFIG.defaultTemplate;
  }

  // Default template selection logic
  selectTemplateByDefault(branchName, lastCommit) {
    // Branch name based selection
    for (const [template, patterns] of Object.entries(DEFAULT_TEMPLATE_PATTERNS)) {
      if (patterns.some(pattern => branchName.includes(pattern))) {
        return template;
      }
    }

    // Commit message based selection
    const lowerCommit = lastCommit.toLowerCase();
    for (const [template, patterns] of Object.entries(DEFAULT_COMMIT_PATTERNS)) {
      if (patterns.some(pattern => lowerCommit.startsWith(pattern))) {
        return template;
      }
    }

    return DEFAULT_CONFIG.defaultTemplate;
  }

  // Read template file
  readTemplate(templateName) {
    const templatePath = path.join(this.templateDir, `${templateName}.md`);
    
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf8");
    }

    // Create default template
    console.log(`Template file not found, creating default template: ${templatePath}`);
    return this.createDefaultTemplate(templateName);
  }

  // Create default template
  createDefaultTemplate(templateName) {
    return DEFAULT_TEMPLATES[templateName] || DEFAULT_TEMPLATES.default;
  }

  // Apply rules to template (extract and inject information)
  applyRulesToTemplate(template, extractedInfo, rules) {
    let filledTemplate = template;

    for (const rule of rules) {
      const { pattern, targetSection } = rule;
      const key = pattern;

      if (extractedInfo[key] && extractedInfo[key].length > 0) {
        const items = extractedInfo[key].map((item) => `- ${item}`).join("\n");
        const sectionRegex = new RegExp(`(${targetSection})`, "i");

        if (sectionRegex.test(filledTemplate)) {
          // Section exists, replace placeholder
          const placeholderRegex = new RegExp(
            `(${targetSection}(\\s*\\n)*?)(-\\s*\\n|-|N/A)`,
            "i"
          );
          if (placeholderRegex.test(filledTemplate)) {
            filledTemplate = filledTemplate.replace(placeholderRegex, `$1${items}\n`);
          } else {
            filledTemplate = filledTemplate.replace(sectionRegex, `$1\n${items}`);
          }
        } else {
          // Section doesn't exist, append to end
          filledTemplate += `\n\n${targetSection}\n${items}`;
        }
      } else {
        // No extracted info, mark as "N/A"
        const sectionRegex = new RegExp(`(${targetSection})`, "i");
        if (sectionRegex.test(filledTemplate)) {
          const placeholderRegex = new RegExp(
            `(${targetSection}(\\s*\\n)*?)(-\\s*\\n|-)`,
            "i"
          );
          if (placeholderRegex.test(filledTemplate)) {
            filledTemplate = filledTemplate.replace(placeholderRegex, `$1N/A\n`);
          }
        }
      }
    }

    return filledTemplate;
  }

  // Extract information based on rules
  extractInfoByRules(commitMessages, branchName, rules) {
    const extractedInfo = {};
    if (rules.length === 0) return extractedInfo;

    const sources = [commitMessages, branchName].join("\n");

    for (const rule of rules) {
      const { pattern } = rule;
      const regex = new RegExp(pattern, "g");
      const matches = sources.match(regex) || [];
      const uniqueMatches = [...new Set(matches)];

      if (uniqueMatches.length > 0) {
        if (!extractedInfo[pattern]) {
          extractedInfo[pattern] = [];
        }
        extractedInfo[pattern].push(...uniqueMatches);
      }
    }

    return extractedInfo;
  }
}