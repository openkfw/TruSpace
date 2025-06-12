type SlateNode = {
   type?: string;
   children?: SlateNode[];
   text?: string;
   bold?: boolean;
   italic?: boolean;
   code?: boolean;
   underline?: boolean;
   strikethrough?: boolean;
   [key: string]: string | boolean | SlateNode[] | undefined;
};

export const slateToMarkdown = (nodes: SlateNode[]): string => {
   const serializeNode = (node: SlateNode): string => {
      if (node.text) {
         let text = node.text;
         if (node.bold) text = `**${text}**`;
         if (node.italic) text = `*${text}*`;
         if (node.code) text = `\`${text}\``;
         if (node.underline) text = `<u>${text}</u>`;
         if (node.strikethrough) text = `~~${text}~~`;

         return text;
      }

      if (!node.children) return "";

      const childrenText = node.children.map(serializeNode).join("");

      switch (node.type) {
         case "h1":
            return `# ${childrenText}\n\n`;
         case "h2":
            return `## ${childrenText}\n\n`;
         case "h3":
            return `### ${childrenText}\n\n`;
         case "h4":
            return `#### ${childrenText}\n\n`;
         case "h5":
            return `##### ${childrenText}\n\n`;
         case "h6":
            return `###### ${childrenText}\n\n`;
         case "paragraph":
            return `${childrenText}\n\n`;
         case "blockquote":
            return `> ${childrenText}\n\n`;
         case "code-block":
            return `\`\`\`\n${childrenText}\n\`\`\`\n\n`;
         case "bulleted-list":
            return (
               node.children.map((n) => `- ${serializeNode(n)}`).join("\n") +
               "\n\n"
            );
         case "numbered-list":
            return (
               node.children
                  .map((n, i) => `${i + 1}. ${serializeNode(n)}`)
                  .join("\n") + "\n\n"
            );
         case "link":
            return `[${childrenText}](${node.url})`;
         default:
            return childrenText;
      }
   };

   return nodes.map(serializeNode).join("").trim();
};
