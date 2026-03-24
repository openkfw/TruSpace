import { config } from "../../config/config";
import logger from "../../config/winston";
import { IChatsModule } from "./interfaces";

export const processLanguage = async (
  textWithJson: string,
  chatsModule: IChatsModule
) => {
  let language: string = "";
  try {
    // cut off only part with with JSON between '{"language"' and '}' for cases when LLM is chatty
    const jsonStringMatch = textWithJson.match(/"language"\s*:\s*"([^"]*)"/);
    if (!jsonStringMatch || !jsonStringMatch[1]) {
      throw new Error("No language found in response");
    }
    logger.debug("jsonStringMatch for language");
    logger.debug(jsonStringMatch[1]);

    language = jsonStringMatch[1];
    return language;
  } catch (error) {
    logger.debug("Error parsing language from first prompt", error);

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
      // cut off only part with with JSON between '{"language"' and '}' for cases when LLM is chatty
      const jsonStringMatchSecondAttempt =
        ollamaFormattingResponse?.choices[0]?.message?.content?.match(
          /"language"\s*:\s*"([^"]*)"/
        );
      if (!jsonStringMatchSecondAttempt || !jsonStringMatchSecondAttempt[1]) {
        throw new Error("No language found in second response");
      }
      logger.debug("jsonStringMatchSecondAttempt for language");
      logger.debug(jsonStringMatchSecondAttempt[1]);
      language = jsonStringMatchSecondAttempt[1];
      return language;
    } catch (error) {
      // Final fallback: if the response is not in JSON format, log the error and throw
      console.log("Error parsing language", error);
      logger.error("Error parsing language", error);
      return "-";
    }
  }
};
