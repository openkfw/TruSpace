import * as fs from "fs";
import * as path from "path";
import logger from "../config/winston";
import { Prompt } from "../types/interfaces";

export const examplePrompts = [
  {
    title: "Executive Summary",
    prompt:
      "You are an expert in development cooperation with 3rd world countries and working for a financial development bank. Use well formatted markdown format. Please provide a brief summary in english of the following text in not more than 5 bullets.",
  },
  {
    title: "Digi TSV - summary",
    prompt: `You are an expert for digital components in development cooperation projects. Summarize in not more than 5 bullet points in english and indicate if there are many more. Use well formatted markdown format. Which digital components are mentioned in the file`,
  },
];

export const tagsPrompt = {
  title: "tags",
  prompt: `Generate 1-3 broad tags categorizing the main themes of the file, along with 1-2 more specific subtopic tags.

              Guidelines:
              - Start with high-level domains (e.g. Science, Technology, Philosophy, Arts, Politics, Business, Health, Sports, Entertainment, Education)
              - Consider including relevant subfields/subdomains if they are strongly represented throughout the conversation
              - If content is too short (less than 3 messages) or too diverse, use only ["General"]
              - default to English if multilingual
              - Prioritize accuracy over specificity

              ### Output:
              CSV format: "tag1", "tag2", "tag3", "tag4", "tag5"`,
};

export const languagePrompt: Prompt = {
  title: "language",
  prompt:
    'Detect the primary language of the provided document. Your response must be *only* the name of the language in JSON format (e.g., `{ "language": "English" }`, `{ "language": "Spanish" }`, `{ "language": "French" }`).',
};

/**
 * Reads content from a prompts.json file and returns it or an empty array if file doesn't exist or data is malformed
 * @returns Content of the JSON file or empty array
 */
function readExternalPrompts(): Prompt[] {
  const filePath = "./prompts/prompts.json";
  try {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      logger.error(`File not found: ${absolutePath}, returning []`);
      return [] as Prompt[];
    }

    const fileContent = fs.readFileSync(absolutePath, "utf8");
    const parsedContent = JSON.parse(fileContent) as Prompt[];

    if (!Array.isArray(parsedContent)) {
      logger.error(
        `File content is not an array: ${absolutePath}, returning []`
      );
      return [] as Prompt[];
    }

    return parsedContent;
  } catch (error) {
    logger.error(`Error reading JSON file: ${filePath}`, error);
    return [] as Prompt[];
  }
}

function mergePromptArrays(arr1: Prompt[], arr2: Prompt[]) {
  const mergedArray = [...arr1];
  const existingTitles = new Set(arr1.map((item) => item.title));

  arr2.forEach((item) => {
    if (!existingTitles.has(item.title)) {
      mergedArray.push(item);
    }
  });

  return mergedArray;
}

export { mergePromptArrays, readExternalPrompts };
