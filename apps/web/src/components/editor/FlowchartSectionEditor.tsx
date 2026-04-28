import { useCallback, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateSection } from '../../hooks/useSections';
import type { ProposalSection } from '@biopropose/shared-types';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2, Circle, Save, Plus, Trash2, GitBranch } from 'lucide-react';
import clsx from 'clsx';

// ── Custom node shapes ──────────────────────────────────────────────────────

function ProcessNode({ data, selected }: NodeProps) {
  return (
    <div
      className={clsx(
        'px-4 py-2 min-w-[120px] text-center text-sm font-medium rounded border-2 bg-white shadow-sm transition-colors',
        selected ? 'border-brand-500' : 'border-gray-400',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="truncate max-w-[160px]">{String(data.label)}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

function DecisionNode({ data, selected }: NodeProps) {
  const label = String(data.label);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 80 }}>
      <Handle type="target" position={Position.Top} className="!bg-amber-500" style={{ top: 0 }} />
      <svg width="140" height="80" className="absolute inset-0">
        <polygon
          points="70,4 136,40 70,76 4,40"
          fill="white"
          stroke={selected ? '#6366f1' : '#f59e0b'}
          strokeWidth={2}
        />
      </svg>
      <span className="relative z-10 text-xs font-medium text-center px-2 leading-tight max-w-[100px] truncate">
        {label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500" style={{ bottom: 0 }} />
      <Handle type="source" id="yes" position={Position.Right} className="!bg-green-500" style={{ right: 0 }} />
      <Handle type="source" id="no" position={Position.Left} className="!bg-red-400" style={{ left: 0 }} />
    </div>
  );
}

function TerminalNode({ data, selected }: NodeProps) {
  return (
    <div
      className={clsx(
        'px-5 py-2 min-w-[100px] text-center text-sm font-semibold rounded-full border-2 bg-gray-800 text-white shadow-sm transition-colors',
        selected ? 'border-brand-400' : 'border-gray-700',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-300" />
      <div className="truncate max-w-[140px]">{String(data.label)}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-300" />
    </div>
  );
}

const NODE_TYPES = {
  process: ProcessNode,
  decision: DecisionNode,
  terminal: TerminalNode,
};

// ── Default starter diagram ──────────────────────────────────────────────────

const DEFAULT_NODES: Node[] = [
  { id: 'start', type: 'terminal', position: { x: 200, y: 40 },  data: { label: 'Start' } },
  { id: 'p1',    type: 'process',  position: { x: 180, y: 140 }, data: { label: 'Process Step' } },
  { id: 'd1',    type: 'decision', position: { x: 160, y: 250 }, data: { label: 'Decision?' } },
  { id: 'p2',    type: 'process',  position: { x: 60,  y: 380 }, data: { label: 'Yes Path' } },
  { id: 'p3',    type: 'process',  position: { x: 300, y: 380 }, data: { label: 'No Path' } },
  { id: 'end',   type: 'terminal', position: { x: 200, y: 500 }, data: { label: 'End' } },
];

const DEFAULT_EDGES: Edge[] = [
  { id: 'e-start-p1', source: 'start', target: 'p1', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-p1-d1',    source: 'p1',    target: 'd1', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-d1-p2',    source: 'd1',    sourceHandle: 'yes', target: 'p2', label: 'Yes', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-d1-p3',    source: 'd1',    sourceHandle: 'no',  target: 'p3', label: 'No',  markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-p2-end',   source: 'p2',    target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-p3-end',   source: 'p3',    target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
];

// ── Load saved content ───────────────────────────────────────────────────────

function loadFromContent(content: object | undefined): { nodes: Node[]; edges: Edge[] } {
  if (!content || Object.keys(content).length === 0) {
    return { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES };
  }
  const c = content as Record<string, unknown>;
  const nodes = Array.isArray(c.nodes) ? (c.nodes as Node[]) : DEFAULT_NODES;
  const edges = Array.isArray(c.edges) ? (c.edges as Edge[]) : DEFAULT_EDGES;
  return { nodes, edges };
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  proposalId: string;
  section: ProposalSection;
}

let nodeIdCounter = 100;

export default function FlowchartSectionEditor({ proposalId, section }: Props) {
  const user = useAuthStore((s) => s.user);
  const updateSection = useUpdateSection();

  const { nodes: initNodes, edges: initEdges } = loadFromContent(section.content as object | undefined);
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  const isLocked = section.isLocked;
  const labelInputRef = useRef<HTMLInputElement>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
      setIsDirty(true);
    },
    [setEdges],
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      setIsDirty(true);
    },
    [onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      setIsDirty(true);
    },
    [onEdgesChange],
  );

  const addNode = (type: 'process' | 'decision' | 'terminal') => {
    const labels: Record<string, string> = { process: 'New Step', decision: 'Decision?', terminal: 'End' };
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type,
      position: { x: 200 + Math.random() * 60, y: 200 + Math.random() * 60 },
      data: { label: labels[type] },
    };
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  };

  const deleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    setIsDirty(true);
  };

  const startEditLabel = () => {
    if (!selectedNodeId) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;
    setEditingLabel(String(node.data.label));
    setIsEditingLabel(true);
    setTimeout(() => labelInputRef.current?.focus(), 50);
  };

  const applyLabel = () => {
    if (!selectedNodeId || !editingLabel.trim()) { setIsEditingLabel(false); return; }
    setNodes((nds) =>
      nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: editingLabel.trim() } } : n),
    );
    setIsEditingLabel(false);
    setIsDirty(true);
  };

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

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSection.mutateAsync({
        proposalId,
        sectionKey: section.sectionKey,
        dto: {
          content: { nodes, edges } as unknown as object,
          updatedBy: user!.email,
        },
      });
      setIsDirty(false);
      toast.success('Flowchart saved');
    } catch (err) {
      toast.error((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-0 flex flex-col h-full" style={{ minHeight: 580 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">{section.title}</h3>
          {section.isLocked && <Lock size={14} className="text-amber-500" />}
          {section.isComplete && <CheckCircle2 size={14} className="text-green-500" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDirty && !isLocked && (
            <button className="btn-primary py-1 px-3 text-xs" onClick={handleSave} disabled={saving}>
              <Save size={13} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button className="btn-secondary py-1 px-3 text-xs" onClick={handleMarkComplete}>
            {section.isComplete
              ? <CheckCircle2 size={13} className="text-green-500" />
              : <Circle size={13} />}
            {section.isComplete ? 'Completed' : 'Mark Complete'}
          </button>
          <button className="btn-secondary py-1 px-3 text-xs" onClick={handleLockToggle}>
            <Lock size={13} />
            {section.isLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar toolbar */}
        {!isLocked && (
          <div className="w-40 border-r border-gray-200 bg-gray-50 flex flex-col gap-2 p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Add Node</p>
            <button
              className="btn-secondary text-xs py-1.5 gap-1.5 justify-start"
              onClick={() => addNode('process')}
            >
              <Plus size={12} />
              Process
            </button>
            <button
              className="btn-secondary text-xs py-1.5 gap-1.5 justify-start"
              onClick={() => addNode('decision')}
            >
              <Plus size={12} />
              Decision
            </button>
            <button
              className="btn-secondary text-xs py-1.5 gap-1.5 justify-start"
              onClick={() => addNode('terminal')}
            >
              <Plus size={12} />
              Terminal
            </button>

            {selectedNodeId && (
              <>
                <hr className="border-gray-200 my-1" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Edit Node</p>
                {isEditingLabel ? (
                  <div className="flex flex-col gap-1">
                    <input
                      ref={labelInputRef}
                      className="input text-xs py-1 px-2"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyLabel(); if (e.key === 'Escape') setIsEditingLabel(false); }}
                    />
                    <button className="btn-primary text-xs py-1" onClick={applyLabel}>Apply</button>
                  </div>
                ) : (
                  <button className="btn-secondary text-xs py-1.5 gap-1.5 justify-start" onClick={startEditLabel}>
                    <GitBranch size={12} />
                    Rename
                  </button>
                )}
                <button
                  className="btn-secondary text-xs py-1.5 gap-1.5 justify-start text-red-600 border-red-200 hover:bg-red-50"
                  onClick={deleteSelected}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </>
            )}

            <div className="mt-auto pt-2 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 leading-tight">
                Drag to connect nodes. Click a node to select it.
              </p>
            </div>
          </div>
        )}

        {/* React Flow canvas */}
        <div className="flex-1 relative">
          {isLocked && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Lock size={14} />
              This section is locked and cannot be edited.
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isLocked ? undefined : handleNodesChange}
            onEdgesChange={isLocked ? undefined : handleEdgesChange}
            onConnect={isLocked ? undefined : onConnect}
            nodeTypes={NODE_TYPES}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setIsEditingLabel(false);
            }}
            onPaneClick={() => { setSelectedNodeId(null); setIsEditingLabel(false); }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            elementsSelectable={!isLocked}
            deleteKeyCode={null}
            className="bg-gray-50"
          >
            <Background gap={16} color="#e5e7eb" />
            <Controls showInteractive={!isLocked} />
            <MiniMap nodeColor={(n) => {
              if (n.type === 'terminal') return '#374151';
              if (n.type === 'decision') return '#f59e0b';
              return '#6366f1';
            }} />
            {isDirty && !isLocked && (
              <Panel position="top-right">
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  Unsaved changes
                </span>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-4 rounded border-2 border-gray-400 bg-white" />
          Process
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="14"><polygon points="10,1 19,7 10,13 1,7" fill="white" stroke="#f59e0b" strokeWidth="1.5" /></svg>
          Decision
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-4 rounded-full border-2 border-gray-700 bg-gray-800" />
          Terminal
        </span>
        <span className="ml-auto text-gray-400">Drag from node handles to connect • Select a node to rename or delete</span>
      </div>
    </div>
  );
}
