'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import {
  Bold,
  Italic,
  UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImagePlus,
  Undo2,
  Redo2,
  Eraser,
  Highlighter,
  Palette,
  Table2,
  Trash2,
  Columns,
  Rows
} from 'lucide-react';

export default function TiptapEditor({
  value,
  onChange
}) {

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell
    ],

    content: value || '',

    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  if (!editor) return null;

  const addImage = () => {
  const input = document.createElement('input');

  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      // Get Cloudinary signature
      const sigRes = await fetch('/api/cloudinary/signature?folder=news');

      if (!sigRes.ok) {
        throw new Error('Failed to get Cloudinary signature');
      }

      const sigData = await sigRes.json();

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(
          uploadData.error?.message || 'Cloudinary upload failed'
        );
      }

      editor
        .chain()
        .focus()
        .setImage({
          src: uploadData.secure_url,
        })
        .run();

    } catch (err) {
      console.error(err);
      alert('Image upload failed: ' + err.message);
    }
  };

  input.click();
};

  const addLink = () => {
    const url = window.prompt('Link URL');

    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="tiptap-wrapper">

      <div className="tiptap-toolbar">

        <button
            className={editor.isActive('bold') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleBold().run()}
        >
            <Bold size={18} />
        </button>

        <button
            className={editor.isActive('italic') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleItalic().run()}
        >
            <Italic size={18} />
        </button>

        <button
            className={editor.isActive('underline') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
            <UnderlineIcon size={18} />
        </button>

        <div className="toolbar-color-group">
            <Palette size={18} />
            <input
                type="color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
        </div> 

        <button
            className={editor.isActive('highlight') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Highlight"
        >
            <Highlighter size={18} />
        </button>

        <button
            className={editor.isActive('paragraph') ? 'is-active' : ''}
            onClick={() =>
                editor.chain().focus().setParagraph().run()
            }
            title="Paragraph"
        >
            <Pilcrow size={18} />
        </button>

        <button
            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
            <Heading1 size={18} />
        </button>

        <button
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
            <Heading2 size={18} />
        </button>

        <button
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
            <Heading3 size={18} />
        </button>

        <button
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
            <List size={18} />
        </button>

        <button
            className={editor.isActive('orderedList') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
            <ListOrdered size={18} />
        </button>

        <button
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
            <Quote size={18} />
        </button>

        <button
            className={editor.isActive('link') ? 'is-active' : ''}
            onClick={addLink}
        >
            <Link2 size={18} />
        </button>

        <button
            className={editor.isActive('image') ? 'is-active' : ''}
            onClick={addImage}
        >
            <ImagePlus size={18} />
        </button>

        <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true}).run()}
        >
            <Table2 size={18} />
        </button>

        <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
            <Columns size={18} />
        </button>

        <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
        >
            <Rows size={18} />
        </button>

        <button
            onClick={() => editor.chain().focus().deleteTable().run()}
        >
            <Trash2 size={18} />
            </button>

        <button
            className={editor.isActive('undo') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().undo().run()}
        >
            <Undo2 size={18} />
        </button>

        <button
            className={editor.isActive('redo') ? 'is-active' : ''}
            onClick={() => editor.chain().focus().redo().run()}
        >
            <Redo2 size={18} />
        </button>

        <button
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
            <Eraser size={18}/>
        </button>

      </div>

      <EditorContent editor={editor} />

    </div>
  );
}