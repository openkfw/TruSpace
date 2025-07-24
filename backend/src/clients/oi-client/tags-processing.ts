import { config } from "../../config/config";
import logger from "../../config/winston";
import { IChatsModule } from "./interfaces";

export const processTags = async (
  textWithJson: string,
  chatsModule: IChatsModule
) => {
  let tags: string[] = [];
  try {
    // cut off only part with with JSON between '{"tags"' and '}' for cases when LLM is chatty
    const jsonString = textWithJson.match(/"tags"\s*:\s*(\[[\s\S]*?\])/);
    if (!jsonString) {
      throw new Error("No tags found in response");
    }

    tags = JSON.parse(`{"tags":${jsonString[1]}}`).tags;
    return tags;
  } catch (error) {
    logger.debug(
      `Error parsing tags from first tags prompt ${JSON.stringify(error)}`
    );

    // In case of error, call LLM model again to format the response
    const ollamaFormattingResponse = await chatsModule.completion({
      model: config.ollama.model,
      messages: [
        {
          role: "user",
          content: `Extract only the tags in JSON format. Format JSON like \`{ "tags": [ "tag1", "tag2", "tag3" ] }\` from the following text: ${textWithJson}`,
        },
      ],
    });

    try {
      // cut off only part with with JSON between '{"tags"' and '}' for cases when LLM is chatty
      const jsonString =
        ollamaFormattingResponse?.choices[0]?.message?.content?.match(
          /"tags"\s*:\s*(\[[\s\S]*?\])/
        );
      if (!jsonString) {
        throw new Error("No tags found in second response");
      }

      tags = JSON.parse(`{"tags":${jsonString[1]}}`).tags;
      return tags;
    } catch (error) {
      // Final fallback: if the response is not in JSON format, log the error and throw
      logger.error("Error parsing tags", error);
      return [];
    }
  }
};
