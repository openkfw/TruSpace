import { config } from "../../config/config";
import logger from "../../config/winston";
import { IChatsModule } from "./interfaces";

export const processLanguage = async (
  textWithJson: string,
  chatsModule: IChatsModule
) => {
  let language: string = "";
  try {
    try {
      const parsed = JSON.parse(textWithJson);
      if (parsed && parsed.language) {
        return parsed.language;
      }
    } catch (e) {
      logger.error("Initial JSON parsing failed, trying regex:", e);
    }

    // cut off only part with with JSON between '{"language"' and '}' for cases when LLM is chatty
    const jsonStringMatch = textWithJson.match(/"language"\s*:\s*"([^"]*)"/);
    if (jsonStringMatch && jsonStringMatch[1]) {
      logger.debug("jsonStringMatch for language");
      logger.debug(jsonStringMatch[1]);
      language = jsonStringMatch[1];
      return language;
    }

    if (!textWithJson.includes("{") && !textWithJson.includes("}")) {
      const cleanedText = textWithJson.replace(/"/g, "").trim();
      if (cleanedText.length > 0 && cleanedText.length < 50) {
        // Basic validation
        return cleanedText;
      }
    }

    throw new Error("No language found in the initial response.");
  } catch (error) {
    logger.error(
      "Initial language parsing failed, attempting fallback with direct LLM formatting.",
      error
    );

    // In case of error, call LLM model again to format the response
    const ollamaFormattingResponse = await chatsModule.completion({
      model: config.ollama.model,
      messages: [
        {
          role: "user",
          content: `Extract only the language in JSON format. Format JSON like \`{ "language": "English" }\` from the following text: ${textWithJson}`,
        },
      ],
    });

    try {
      const responseContent =
        ollamaFormattingResponse?.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("No content in second response");
      }

      try {
        const parsed = JSON.parse(responseContent);
        if (parsed && parsed.language) {
          logger.debug(
            "Successfully parsed language from second attempt JSON object"
          );
          return parsed.language;
        }
      } catch (e) {
        logger.error(
          "Second attempt response is not a valid JSON, trying regex:",
          e
        );
      }

      // Fallback to regex match if parsing fails
      const jsonStringMatchSecondAttempt = responseContent.match(
        /"language"\s*:\s*"([^"]*)"/
      );

      if (jsonStringMatchSecondAttempt && jsonStringMatchSecondAttempt[1]) {
        logger.debug("jsonStringMatchSecondAttempt for language");
        logger.debug(jsonStringMatchSecondAttempt[1]);
        language = jsonStringMatchSecondAttempt[1];
        return language;
      }

      throw new Error(
        "No language found in second response after parsing and regex"
      );
    } catch (error) {
      // Final fallback: if the response is not in JSON format, log the error and throw

      logger.error("Error parsing language", error);
      return "-";
    }
  }
};
