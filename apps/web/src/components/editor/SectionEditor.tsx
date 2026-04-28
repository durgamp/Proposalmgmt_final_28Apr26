import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateSection, useSectionRevisions } from '../../hooks/useSections';
import type { ProposalSection, Proposal } from '@biopropose/shared-types';
import EditorToolbar from './EditorToolbar';
import CommentPanel from './CommentPanel';
import AiDraftPanel from './AiDraftPanel';
import { RevisionHistory } from './RevisionHistory';
import { DeepSearchBar } from './DeepSearchBar';
import { CeoLetterContentBlocks } from './CeoLetterContentBlocks';
import { ExecutiveSummaryPanel } from './ExecutiveSummaryPanel';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2, Circle, MessageSquare, Sparkles, Save, History } from 'lucide-react';
import clsx from 'clsx';

const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:3002`;

const CURSOR_COLORS = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

interface Props {
  proposalId: string;
  section: ProposalSection;
  proposal: Proposal;
}

/**
 * Build a fresh Yjs doc pre-seeded with `initialContent`.
 * Collaboration will sync edits from this base; if the WS server already
 * has the doc in memory the server's state takes precedence (CRDT merge).
 */
function buildYdoc(initialContent: object): Y.Doc {
  const doc = new Y.Doc();
  // Store the DB snapshot so the Collaboration extension can pick it up
  // as the starting point before the first WS sync completes.
  if (initialContent && Object.keys(initialContent).length > 0) {
    // We tag the content in a separate map so SectionEditor can read it
    // back when seeding setContent after the editor mounts.
    const meta = doc.getMap<object>('__dbContent');
    meta.set('snapshot', initialContent);
  }
  return doc;
}

export default function SectionEditor({ proposalId, section, proposal }: Props) {
  const user = useAuthStore((s) => s.user);
  const updateSection = useUpdateSection();

  const [showComments, setShowComments] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: auditEntries } = useSectionRevisions(proposalId, section.sectionKey);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentContentRef = useRef<Record<string, unknown> | null>(null);

  const isLocked = section.isLocked;
  const isEditable = !isLocked;

  const dbContent = section.content as Record<string, unknown> | undefined;

  // Create the Yjs doc and WebSocket provider synchronously so the real
  // awareness object is available before useEditor() runs.
  const [{ ydoc, provider }] = useState(() => {
    const doc = buildYdoc(section.content);
    const docName = `${proposalId}-${section.sectionKey}`;
    const prov = new WebsocketProvider(WS_URL, docName, doc, { connect: true });
    return { ydoc: doc, provider: prov };
  });

  // Set the local user cursor state once on mount and destroy on unmount.
  useEffect(() => {
    if (user) {
      const colorIdx = user.email.length % CURSOR_COLORS.length;
      provider.awareness.setLocalStateField('user', {
        name: user.name,
        color: CURSOR_COLORS[colorIdx],
      });
    }
    return () => {
      provider.destroy();
    };
  // provider is stable (created once); intentionally omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Debounced auto-save -----
  const debouncedSave = useCallback((content: Record<string, unknown>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    currentContentRef.current = content;
    setSaving(false);
    setIsDirty(true);

    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await updateSection.mutateAsync({
          proposalId,
          sectionKey: section.sectionKey,
          dto: { content, updatedBy: user!.email },
        });
        setIsDirty(false);
      } catch (err) {
        toast.error((err as Error).message || 'Auto-save failed');
      } finally {
        setSaving(false);
      }
    }, 2000);
  }, [proposalId, section.sectionKey, user]);

  // ----- TipTap editor (created ONCE; Collaboration uses the pre-built ydoc) -----
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Collaboration.configure({ document: ydoc }),
      // Pass the real provider — created synchronously above so awareness is fully initialised
      CollaborationCursor.configure({
        provider,
        user: {
          name: user?.name ?? 'Anonymous',
          color: CURSOR_COLORS[(user?.email.length ?? 0) % CURSOR_COLORS.length],
        },
      }),
    ],
    editable: isEditable,
    // `content` is intentionally omitted here — Collaboration owns the doc.
    // We seed the Yjs doc from DB below once the editor is ready.
    onUpdate: ({ editor: e }) => {
      debouncedSave(e.getJSON() as Record<string, unknown>);
    },
  });

  // Seed from DB when the editor is ready and the Yjs doc is still empty.
  // The server now cleans up docs on last-client-disconnect (no-op persistence in ws/server.ts),
  // so the server always starts fresh — meaning xmlFragment is empty after WS sync and DB
  // seeding is always safe.  A 1 s timeout also covers the case where the WS connection
  // fails entirely so the editor never stays blank.
  useEffect(() => {
    if (!editor) return;

    const seed = () => {
      const xmlFragment = ydoc.get('prosemirror', Y.XmlFragment);
      if (xmlFragment.length === 0 && dbContent && Object.keys(dbContent).length > 0) {
        editor.commands.setContent(dbContent, false);
      }
    };

    // Primary: seed right after the WS initial sync confirms the server has no content.
    const onSync = (isSynced: boolean) => { if (isSynced) seed(); };
    provider.on('sync', onSync);
    if (provider.synced) seed();

    // Fallback: if the WS never syncs (connection error), seed after 1 s so the
    // editor never stays blank.
    const fallback = setTimeout(seed, 1000);

    return () => {
      provider.off('sync', onSync);
      clearTimeout(fallback);
    };
  // editor changes from null → instance once; provider/ydoc/dbContent are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // ----- Manual save -----
  const handleManualSave = useCallback(async () => {
    if (!editor || !isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const content = currentContentRef.current ?? (editor.getJSON() as Record<string, unknown>);
    try {
      setSaving(true);
      await updateSection.mutateAsync({
        proposalId,
        sectionKey: section.sectionKey,
        dto: { content, updatedBy: user!.email },
      });
      setIsDirty(false);
      toast.success('Section saved');
    } catch (err) {
      toast.error((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [editor, isDirty, proposalId, section.sectionKey, user]);

  const handleMarkComplete = async () => {
    try {
      await updateSection.mutateAsync({
        proposalId,
        sectionKey: section.sectionKey,
        dto: { isComplete: !section.isComplete, updatedBy: user!.email },
      });
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update section');
    }
  };

  const handleLockToggle = async () => {
    try {
      await updateSection.mutateAsync({
        proposalId,
        sectionKey: section.sectionKey,
        dto: { isLocked: !section.isLocked, updatedBy: user!.email },
      });
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update section');
    }
  };

  const handleAiInsert = (text: string) => {
    if (editor) editor.chain().focus().insertContent(text).run();
  };

  return (
    <div className="card p-0 flex flex-col h-full">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">{section.title}</h3>
          {section.isLocked && <Lock size={14} className="text-amber-500" />}
          {section.isComplete && <CheckCircle2 size={14} className="text-green-500" />}
          {saving && <span className="text-xs text-gray-400 animate-pulse">Saving...</span>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isDirty && !isLocked && (
            <button
              className="btn-primary py-1 px-3 text-xs"
              onClick={handleManualSave}
              disabled={saving}
            >
              <Save size={13} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <DeepSearchBar
            sectionKey={section.sectionKey}
            sectionTitle={section.title}
            currentProposalId={proposalId}
          />
          <button
            className={clsx('btn-secondary py-1 px-3 text-xs', showAi && 'bg-purple-50 border-purple-200 text-purple-700')}
            onClick={() => { setShowAi((v) => !v); setShowComments(false); setShowHistory(false); }}
          >
            <Sparkles size={13} />
            AI Draft
          </button>
          <button
            className={clsx('btn-secondary py-1 px-3 text-xs', showComments && 'bg-blue-50 border-blue-200 text-blue-700')}
            onClick={() => { setShowComments((v) => !v); setShowAi(false); setShowHistory(false); }}
          >
            <MessageSquare size={13} />
            Comments
          </button>
          <button
            className={clsx('btn-secondary py-1 px-3 text-xs', showHistory && 'bg-amber-50 border-amber-200 text-amber-700')}
            onClick={() => { setShowHistory((v) => !v); setShowAi(false); setShowComments(false); }}
          >
            <History size={13} />
            History
          </button>
          <button
            className="btn-secondary py-1 px-3 text-xs"
            onClick={handleMarkComplete}
          >
            {section.isComplete
              ? <CheckCircle2 size={13} className="text-green-500" />
              : <Circle size={13} />}
            {section.isComplete ? 'Completed' : 'Mark Complete'}
          </button>
          <button
            className="btn-secondary py-1 px-3 text-xs"
            onClick={handleLockToggle}
          >
            <Lock size={13} />
            {section.isLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isLocked && editor && <EditorToolbar editor={editor} />}

          <div className={clsx('flex-1 overflow-y-auto p-5 tiptap-editor', isLocked && 'bg-gray-50')}>
            {isLocked && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                <Lock size={14} />
                This section is locked and cannot be edited.
              </div>
            )}

            {/* Executive Summary: show auto-generated summary panel above editor */}
            {section.sectionKey === 'executive-summary' && (
              <ExecutiveSummaryPanel proposal={proposal} />
            )}

            {/* CEO Letter: show draggable company capability blocks above the editor */}
            {section.sectionKey === 'ceo-letter' && (
              <div className="mb-5">
                <CeoLetterContentBlocks canEdit={isEditable} />
              </div>
            )}

            <EditorContent editor={editor} className="min-h-[300px]" />

            {/* Revision History — shown inline below the editor */}
            {showHistory && (
              <div className="mt-6">
                <RevisionHistory
                  sectionId={section.sectionKey}
                  sectionTitle={section.title}
                  revisions={(auditEntries ?? []).map((log) => ({
                    id: log.id,
                    userName: log.userName,
                    userEmail: log.userEmail,
                    timestamp: typeof log.timestamp === 'string' ? log.timestamp : new Date(log.timestamp).toISOString(),
                    fieldEdited: log.action.replace(/_/g, ' '),
                    beforeValue: '',
                    afterValue: log.details ?? '',
                    action: log.action === 'created' ? 'created' : log.action === 'deleted' ? 'deleted' : 'updated',
                  }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Side panels */}
        {showAi && (
          <div className="w-80 border-l border-gray-200 overflow-y-auto">
            <AiDraftPanel
              proposalId={proposalId}
              sectionKey={section.sectionKey}
              proposal={proposal}
              onInsert={handleAiInsert}
            />
          </div>
        )}
        {showComments && !showAi && (
          <div className="w-72 border-l border-gray-200 overflow-y-auto">
            <CommentPanel
              proposalId={proposalId}
              sectionKey={section.sectionKey}
            />
          </div>
        )}
      </div>
    </div>
  );
}
