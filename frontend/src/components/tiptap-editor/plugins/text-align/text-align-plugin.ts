import { Extension } from "@tiptap/react";

/**
 * TextAlign - Custom Extension
 * editor.commands.setTextAlign(option) :set the text alignment.
 */

declare module "@tiptap/core" {
   interface Commands<ReturnType> {
      textAlign: {
         /**
          * Set the text alignment
          */
         setTextAlign: (alignment: string) => ReturnType;
         /**
          * Unset the text alignment
          */
         unsetTextAlign: () => ReturnType;
      };
   }
}

export const TextAlign = Extension.create({
   name: "textAlign",
   addOptions() {
      return {
         types: ["heading", "paragraph"]
      };
   },
   addGlobalAttributes() {
      return [
         {
            types: this.options.types,
            attributes: {
               textAlign: {
                  default: null,
                  parseHTML: (element) => element.style.textAlign || null,
                  renderHTML: (attributes) => {
                     if (!attributes.textAlign) {
                        return {};
                     }
                     return {
                        style: `text-align: ${attributes.textAlign}`
                     };
                  }
               }
            }
         }
      ];
   },
   addCommands() {
      return {
         setTextAlign:
            (alignment) =>
            ({ chain }) => {
               return chain()
                  .setNode("paragraph", { textAlign: alignment })
                  .setNode("heading", { textAlign: alignment })
                  .run();
            },
         unsetTextAlign:
            () =>
            ({ chain }) => {
               return chain()
                  .setNode("paragraph", { textAlign: null })
                  .setNode("heading", { textAlign: null })
                  .run();
            }
      };
   }
});
