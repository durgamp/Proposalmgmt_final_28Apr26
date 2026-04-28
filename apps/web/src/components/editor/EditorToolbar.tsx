import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Highlighter, Undo, Redo,
  Table, Plus, Minus, Columns, Rows, Trash2,
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'p-1.5 rounded transition-colors',
        active ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
      )}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor }: Props) {
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <Underline size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={15} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
        <AlignRight size={15} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')}>
        <Highlighter size={15} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <select
        className="text-xs border border-gray-200 rounded px-1 py-1 text-gray-600 bg-white"
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 }).run();
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1'
            : editor.isActive('heading', { level: 2 }) ? '2'
              : editor.isActive('heading', { level: 3 }) ? '3'
                : 'p'
        }
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Table controls */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        <Table size={15} />
      </ToolbarButton>

      {editor.isActive('table') && (
        <>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column before">
            <Columns size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below">
            <Rows size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
            <Minus size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
            <Plus size={15} className="rotate-45" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
            <Trash2 size={15} className="text-red-500" />
          </ToolbarButton>
        </>
      )}

      <div className="ml-auto flex gap-0.5">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={15} />
        </ToolbarButton>
      </div>
    </div>
  );
}
