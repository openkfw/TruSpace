import { Extension } from "@tiptap/react";

/**
 * BackgroundColor - Custom Extension
 * editor.commands.setBackgroundColor(e.target.value) :set the background color.
 */

declare module "@tiptap/core" {
   interface Commands<ReturnType> {
      backgroundColor: {
         /**
          * Set the background color
          */
         setBackgroundColor: (color: string) => ReturnType;
         /**
          * Unset the background color
          */
         unsetBackgroundColor: () => ReturnType;
      };
   }
}

export const BackgroundColor = Extension.create({
   name: "backgroundColor",
   addOptions() {
      return {
         types: ["textStyle", "heading", "paragraph"]
      };
   },
   addGlobalAttributes() {
      return [
         {
            types: this.options.types,
            attributes: {
               backgroundColor: {
                  default: null,
                  parseHTML: (element) =>
                     element.style.backgroundColor.replace(/['"]+/g, ""),
                  renderHTML: (attributes) => {
                     if (!attributes.backgroundColor) {
                        return {};
                     }
                     return {
                        style: `background-color: ${attributes.backgroundColor}`
                     };
                  }
               }
            }
         }
      ];
   },
   addCommands() {
      return {
         setBackgroundColor:
            (color) =>
            ({ chain }) => {
               return chain()
                  .setMark("textStyle", { backgroundColor: color })
                  .run();
            },
         unsetBackgroundColor:
            () =>
            ({ chain }) => {
               return chain()
                  .setMark("textStyle", { backgroundColor: null })
                  .removeEmptyTextStyle()
                  .run();
            }
      };
   }
});
