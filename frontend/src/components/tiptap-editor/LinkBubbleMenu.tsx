import { BubbleMenu } from "./plugins/bubble-menu-plugin/BubbleMenu";

export default function LinkBubbleMenu({ editor }) {
   if (!editor) return null;

   return (
      <BubbleMenu
         editor={editor}
         tippyOptions={{ duration: 100 }}
         pluginKey={"linkMenu"}
         shouldShow={({ editor }) => {
            // only show the bubble menu for tables
            return editor
               .can()
               .chain()
               .focus()
               .extendMarkRange("link")
               .setLink({ href: "" })
               .run();
         }}
         contextMenuElement={editor?.view.dom}
      >
         <div className="bubble-menu link-bubble-menu flex items-center flex-wrap max-w-xs" />
      </BubbleMenu>
   );
}
