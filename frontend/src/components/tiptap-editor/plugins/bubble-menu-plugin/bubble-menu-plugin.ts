import {
   Editor,
   isNodeSelection,
   isTextSelection,
   posToDOMRect
} from "@tiptap/core";
import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import tippy, { Instance, Props } from "tippy.js";

export interface BubbleMenuPluginProps {
   /**
    * The plugin key.
    * @type {PluginKey | string}
    * @default 'bubbleMenu'
    */
   pluginKey: PluginKey | string;

   /**
    * The editor instance.
    */
   editor: Editor;

   /**
    * The DOM element that contains your menu.
    * @type {HTMLElement}
    * @default null
    */
   element: HTMLElement;

   /**
    * The options for the tippy.js instance.
    * @see https://atomiks.github.io/tippyjs/v6/all-props/
    */
   tippyOptions?: Partial<Props>;

   /**
    * The delay in milliseconds before the menu should be updated.
    * This can be useful to prevent performance issues.
    * @type {number}
    * @default 250
    */
   updateDelay?: number;

   /**
    * A function that determines whether the menu should be shown or not.
    * If this function returns `false`, the menu will be hidden, otherwise it will be shown.
    */
   shouldShow?:
      | ((props: {
           editor: Editor;
           element: HTMLElement;
           view: EditorView;
           state: EditorState;
           oldState?: EditorState;
           from: number;
           to: number;
           trigger: string;
        }) => boolean)
      | null;

   /**
    * The DOM element in which custom context menu should be triggered.
    * @type {HTMLElement}
    * @default null
    */
   contextMenuElement?: HTMLElement;
}

export type BubbleMenuViewProps = BubbleMenuPluginProps & {
   view: EditorView;
};

export class BubbleMenuView {
   public editor: Editor;

   public element: HTMLElement;

   public contextMenuElement: HTMLElement;

   public view: EditorView;

   public preventHide = false;

   public tippy: Instance | undefined;

   public tippyOptions?: Partial<Props>;

   public updateDelay: number;

   private updateDebounceTimer: number | undefined;

   public shouldShow: Exclude<BubbleMenuPluginProps["shouldShow"], null> = ({
      view,
      state,
      from,
      to
   }) => {
      const { doc, selection } = state;
      const { empty } = selection;

      // Sometime check for `empty` is not enough.
      // Doubleclick an empty paragraph returns a node size of 2.
      // So we check also for an empty text size.
      const isEmptyTextBlock =
         !doc.textBetween(from, to).length && isTextSelection(state.selection);

      // When clicking on a element inside the bubble menu the editor "blur" event
      // is called and the bubble menu item is focussed. In this case we should
      // consider the menu as part of the editor and keep showing the menu
      const isChildOfMenu = this.element.contains(document.activeElement);

      const hasEditorFocus = view.hasFocus() || isChildOfMenu;

      if (
         !hasEditorFocus ||
         empty ||
         isEmptyTextBlock ||
         !this.editor.isEditable
      ) {
         return false;
      }

      return true;
   };

   constructor({
      editor,
      element,
      view,
      tippyOptions = {},
      updateDelay = 250,
      shouldShow,
      contextMenuElement
   }: BubbleMenuViewProps) {
      this.editor = editor;
      this.element = element;
      this.view = view;
      this.updateDelay = updateDelay;

      if (shouldShow) {
         this.shouldShow = shouldShow;
      }
      if (contextMenuElement) {
         this.contextMenuElement = contextMenuElement;
         this.contextMenuElement.addEventListener("contextmenu", (event) => {
            this.update(this.editor.view, undefined, "contextmenu");
            event.preventDefault();
            event.stopPropagation();
         });
      }

      this.element.addEventListener("mousedown", this.mousedownHandler, {
         capture: true
      });

      this.view.dom.addEventListener("dragstart", this.dragstartHandler);
      this.editor.on("focus", this.focusHandler);
      this.editor.on("blur", this.blurHandler);
      this.tippyOptions = tippyOptions;
      // Detaches menu content from its current parent
      this.element.remove();
      this.element.style.visibility = "visible";
   }

   mousedownHandler = () => {
      this.preventHide = true;
   };

   dragstartHandler = () => {
      this.hide();
   };

   focusHandler = () => {
      // we use `setTimeout` to make sure `selection` is already updated
      setTimeout(() => this.update(this.editor.view));
   };

   blurHandler = ({ event }: { event: FocusEvent }) => {
      if (this.preventHide) {
         this.preventHide = false;

         return;
      }

      if (
         event?.relatedTarget &&
         this.element.parentNode?.contains(event.relatedTarget as Node)
      ) {
         return;
      }

      if (event?.relatedTarget === this.editor.view.dom) {
         return;
      }

      this.hide();
   };

   tippyBlurHandler = (event: FocusEvent) => {
      this.blurHandler({ event });
   };

   createTooltip() {
      const { element: editorElement } = this.editor.options;
      const editorIsAttached = !!editorElement.parentElement;

      if (this.tippy || !editorIsAttached) {
         return;
      }

      this.tippy = tippy(editorElement, {
         duration: 0,
         getReferenceClientRect: null,
         content: this.element,
         interactive: true,
         trigger: "manual",
         placement: "top",
         hideOnClick: "toggle",
         ...this.tippyOptions
      });

      // maybe we have to hide tippy on its own blur event as well
      if (this.tippy.popper.firstChild) {
         (this.tippy.popper.firstChild as HTMLElement).addEventListener(
            "blur",
            this.tippyBlurHandler
         );
      }
   }

   update(view: EditorView, oldState?: EditorState, trigger?: string) {
      const { state } = view;
      const hasValidSelection = state.selection.from !== state.selection.to;

      if (this.updateDelay > 0 && hasValidSelection) {
         this.handleDebouncedUpdate(view, oldState);
         return;
      }

      const selectionChanged = !oldState?.selection.eq(view.state.selection);
      const docChanged = !oldState?.doc.eq(view.state.doc);

      this.updateHandler(view, selectionChanged, docChanged, oldState, trigger);
   }

   handleDebouncedUpdate = (view: EditorView, oldState?: EditorState) => {
      const selectionChanged = !oldState?.selection.eq(view.state.selection);
      const docChanged = !oldState?.doc.eq(view.state.doc);

      if (!selectionChanged && !docChanged) {
         return;
      }

      if (this.updateDebounceTimer) {
         clearTimeout(this.updateDebounceTimer);
      }

      this.updateDebounceTimer = window.setTimeout(() => {
         this.updateHandler(view, selectionChanged, docChanged, oldState);
      }, this.updateDelay);
   };

   updateHandler = (
      view: EditorView,
      selectionChanged: boolean,
      docChanged: boolean,
      oldState?: EditorState,
      trigger = "selection"
   ) => {
      const { state, composing } = view;
      const { selection } = state;

      const isSame = !selectionChanged && !docChanged;

      if (composing || isSame) {
         return;
      }

      this.createTooltip();

      // support for CellSelections
      const { ranges } = selection;
      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));

      const shouldShow = this.shouldShow?.({
         editor: this.editor,
         element: this.element,
         view,
         state,
         oldState,
         from,
         to,
         trigger
      });

      if (!shouldShow) {
         this.hide();

         return;
      }

      this.tippy?.setProps({
         getReferenceClientRect:
            this.tippyOptions?.getReferenceClientRect ||
            (() => {
               if (isNodeSelection(state.selection)) {
                  let node = view.nodeDOM(from) as HTMLElement;

                  if (node) {
                     const nodeViewWrapper = node.dataset.nodeViewWrapper
                        ? node
                        : node.querySelector("[data-node-view-wrapper]");

                     if (nodeViewWrapper) {
                        node = nodeViewWrapper.firstChild as HTMLElement;
                     }

                     if (node) {
                        return node.getBoundingClientRect();
                     }
                  }
               }

               return posToDOMRect(view, from, to);
            })
      });

      this.show();
   };

   show() {
      this.tippy?.show();
   }

   hide() {
      this.tippy?.hide();
   }

   destroy() {
      if (this.tippy?.popper.firstChild) {
         (this.tippy.popper.firstChild as HTMLElement).removeEventListener(
            "blur",
            this.tippyBlurHandler
         );
      }
      this.tippy?.destroy();
      this.element.removeEventListener("mousedown", this.mousedownHandler, {
         capture: true
      });
      this.view.dom.removeEventListener("dragstart", this.dragstartHandler);
      this.editor.off("focus", this.focusHandler);
      this.editor.off("blur", this.blurHandler);
   }
}

export const BubbleMenuPlugin = (options: BubbleMenuPluginProps) => {
   return new Plugin({
      key:
         typeof options.pluginKey === "string"
            ? new PluginKey(options.pluginKey)
            : options.pluginKey,
      view: (view) => new BubbleMenuView({ view, ...options })
   });
};
