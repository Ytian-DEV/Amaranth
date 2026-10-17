import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
  Youtube as YoutubeIcon,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import type { Json } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { publicUrl } from '@/lib/media';

export type RichTextValue = { json: Json; html: string; text: string };

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'grid size-9 place-items-center rounded-md text-ink transition-colors hover:bg-green-soft disabled:opacity-40',
        active && 'bg-green-soft text-green-700',
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage, uploading }: { editor: Editor; onImage?: () => void; uploading: boolean }) {
  const icon = 'size-[18px]';
  // TipTap 3 doesn't re-render on every transaction; subscribe to just what the toolbar shows
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (leave empty to remove)', previous ?? 'https://');
    if (url === null) return;
    if (!url.trim() || url === 'https://') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };
  const addVideo = () => {
    const url = window.prompt('YouTube link');
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };
  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-surface px-2 py-1.5 lg:top-0">
      <ToolButton label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className={icon} aria-hidden />
      </ToolButton>
      <ToolButton label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className={icon} aria-hidden />
      </ToolButton>
      <span className="mx-1 h-6 w-px bg-line" aria-hidden />
      <ToolButton label="Heading" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className={icon} aria-hidden />
      </ToolButton>
      <ToolButton label="Subheading" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className={icon} aria-hidden />
      </ToolButton>
      <ToolButton label="Bulleted list" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className={icon} aria-hidden />
      </ToolButton>
      <ToolButton label="Numbered list" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className={icon} aria-hidden />
      </ToolButton>
      <ToolButton label="Quote" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className={icon} aria-hidden />
      </ToolButton>
      <ToolButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className={icon} aria-hidden />
      </ToolButton>
      <span className="mx-1 h-6 w-px bg-line" aria-hidden />
      <ToolButton label="Link" active={state.link} onClick={setLink}>
        <Link2 className={icon} aria-hidden />
      </ToolButton>
      {onImage && (
        <ToolButton label={uploading ? 'Uploading image…' : 'Insert image'} disabled={uploading} onClick={onImage}>
          <ImagePlus className={icon} aria-hidden />
        </ToolButton>
      )}
      <ToolButton label="Embed YouTube video" onClick={addVideo}>
        <YoutubeIcon className={icon} aria-hidden />
      </ToolButton>
      <span className="ml-auto flex">
        <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className={icon} aria-hidden />
        </ToolButton>
        <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className={icon} aria-hidden />
        </ToolButton>
      </span>
    </div>
  );
}

/** Article body editor (TipTap). Emits JSON for re-editing, HTML for display and text for search. */
export function RichText({
  initial,
  onChange,
  editable = true,
  uploadImage,
}: {
  initial: Json | string | null;
  onChange: (value: RichTextValue) => void;
  editable?: boolean;
  /** Uploads a file and resolves to { bucket, path, alt } of the stored image. */
  uploadImage?: (file: File) => Promise<{ bucket: string; path: string; alt?: string }>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    editable,
    extensions: [
      // TipTap 3's StarterKit includes Link (and Underline); configure it here instead of adding it twice
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: 'Write the story…' }),
      CharacterCount,
    ],
    content: (initial as object | string | null) ?? '',
    editorProps: {
      attributes: { class: 'prose-article min-h-[420px] px-5 py-6 focus:outline-none md:px-8', 'aria-label': 'Article body', role: 'textbox', 'aria-multiline': 'true' },
    },
    onUpdate: ({ editor: e }) => onChange({ json: e.getJSON() as Json, html: e.getHTML(), text: e.getText({ blockSeparator: '\n\n' }) }),
  });

  const words = useEditorState({ editor, selector: ({ editor: e }) => (e?.storage.characterCount.words() as number | undefined) ?? 0 });

  async function onPick(file: File | undefined) {
    if (!file || !editor || !uploadImage) return;
    setError(null);
    setUploading(true);
    try {
      const stored = await uploadImage(file);
      const alt = window.prompt('Describe the image for readers who can’t see it (alt text)', stored.alt ?? '') ?? '';
      editor.chain().focus().setImage({ src: publicUrl(stored.bucket, stored.path)!, alt }).run();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  if (!editor) return <div className="min-h-[480px] rounded-[12px] border border-line bg-surface" aria-busy />;

  return (
    <div className="overflow-hidden rounded-[12px] border border-line bg-surface focus-within:border-green-700">
      {editable && <Toolbar editor={editor} onImage={uploadImage ? () => fileInput.current?.click() : undefined} uploading={uploading} />}
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-meta font-normal text-ink-muted">
        <span>
          {words} words · about {Math.max(1, Math.ceil(words / 220))} min read
        </span>
        {error && (
          <span role="alert" className="text-alert">
            {error}
          </span>
        )}
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void onPick(e.target.files?.[0])} />
    </div>
  );
}
