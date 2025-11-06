"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  ImagePlus,
  Undo2,
  Redo2,
} from "lucide-react"
import "./tiptap-editor.css"

interface TiptapEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TiptapEditor({ value, onChange, placeholder = "Start typing..." }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: "text-base leading-relaxed",
          },
        },
        heading: {
          HTMLAttributes: {
            class: "font-bold",
          },
          levels: [2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-inside",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-inside",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-primary pl-4 italic text-muted-foreground",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-muted p-3 rounded-lg font-mono text-sm",
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3 min-h-[300px] border rounded-lg bg-background text-foreground",
      },
    },
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt("Enter image URL:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt("Enter URL:")
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-lg bg-muted/30 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          size="sm"
          variant={editor.isActive("bold") ? "default" : "outline"}
          title="Bold"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          size="sm"
          variant={editor.isActive("italic") ? "default" : "outline"}
          title="Italic"
          type="button"
        >
          <Italic className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          size="sm"
          variant={editor.isActive("underline") ? "default" : "outline"}
          title="Underline"
          type="button"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>

        <div className="w-px bg-border" />

        {/* Headings */}
        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          size="sm"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
          title="Heading 2"
          type="button"
        >
          <Heading2 className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          size="sm"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"}
          title="Heading 3"
          type="button"
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="w-px bg-border" />

        {/* Lists */}
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          size="sm"
          variant={editor.isActive("bulletList") ? "default" : "outline"}
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          size="sm"
          variant={editor.isActive("orderedList") ? "default" : "outline"}
          title="Ordered List"
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px bg-border" />

        {/* Block Elements */}
        <Button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          size="sm"
          variant={editor.isActive("blockquote") ? "default" : "outline"}
          title="Blockquote"
          type="button"
        >
          <Quote className="w-4 h-4" />
        </Button>

        <div className="w-px bg-border" />

        {/* Media */}
        <Button onClick={addImage} size="sm" variant="outline" title="Insert Image" type="button">
          <ImagePlus className="w-4 h-4" />
        </Button>

        <Button onClick={addLink} size="sm" variant="outline" title="Insert Link" type="button">
          <LinkIcon className="w-4 h-4" />
        </Button>

        <div className="w-px bg-border" />

        {/* Undo/Redo */}
        <Button
          onClick={() => editor.chain().focus().undo().run()}
          size="sm"
          variant="outline"
          disabled={!editor.can().undo()}
          title="Undo"
          type="button"
        >
          <Undo2 className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().redo().run()}
          size="sm"
          variant="outline"
          disabled={!editor.can().redo()}
          title="Redo"
          type="button"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
