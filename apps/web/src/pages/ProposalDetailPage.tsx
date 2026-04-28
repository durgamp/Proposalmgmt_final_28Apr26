import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, FileDown, ChevronRight, Lock, CheckCircle,
  GitBranch, Users, Building2, User, Calendar, Tag, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useProposal } from '../hooks/useProposals';
import { useSections } from '../hooks/useSections';
import SectionEditor from '../components/editor/SectionEditor';
import FlowchartSectionEditor from '../components/editor/FlowchartSectionEditor';
import CostBreakdown from '../components/cost/CostBreakdown';
import GanttTimeline from '../components/timeline/GanttTimeline';
import AuditLogPanel from '../components/proposals/AuditLogPanel';
import StageAdvanceBar from '../components/proposals/StageAdvanceBar';
import ExportModal from '../components/proposals/ExportModal';
import { ProposalStatus } from '@biopropose/shared-types';
import { format } from 'date-fns';
import clsx from 'clsx';

type Tab = 'sections' | 'costs' | 'timeline' | 'audit';

const TABS: { id: Tab; label: string }[] = [
  { id: 'sections', label: 'Sections' },
  { id: 'costs', label: 'Cost Breakdown' },
  { id: 'timeline', label: 'Project Timeline' },
  { id: 'audit', label: 'Audit Log' },
];

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700 border-gray-200',
  Review: 'bg-blue-100 text-blue-700 border-blue-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Sent: 'bg-purple-100 text-purple-700 border-purple-200',
  Closed: 'bg-red-100 text-red-700 border-red-200',
};

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('sections');
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showMeta, setShowMeta] = useState(true);

  const { data: proposal, isLoading } = useProposal(id!);
  const { data: sections } = useSections(id!);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }
  if (!proposal) {
    return <div className="text-center text-gray-400 py-20">Proposal not found</div>;
  }

  const currentSection = sections?.find((s) => s.sectionKey === activeSectionKey);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/proposals')} className="text-gray-500 hover:text-gray-700 mt-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">{proposal.name}</h1>
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {proposal.proposalCode}
            </span>
            {proposal.isAmendment && (
              <span className="badge bg-orange-100 text-orange-600 flex items-center gap-1">
                <GitBranch size={11} />
                Amendment #{proposal.revisionNumber}
              </span>
            )}
            <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', STATUS_COLORS[proposal.status] ?? 'bg-gray-100 text-gray-700')}>
              {proposal.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{proposal.client}</p>
        </div>
        <button className="btn-secondary" onClick={() => setShowExport(true)}>
          <FileDown size={16} />
          Export
        </button>
      </div>

      {/* Stage Advance Bar */}
      <StageAdvanceBar proposal={proposal} sections={sections ?? []} />

      {/* Proposal Metadata Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
          onClick={() => setShowMeta((v) => !v)}
        >
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Tag size={15} className="text-brand-600" />
            Proposal Details
          </span>
          {showMeta ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>

        {showMeta && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Building2 size={12} /> Business Unit
                </p>
                <p className="text-gray-900 font-medium">{proposal.businessUnit ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Tag size={12} /> Template Type
                </p>
                <p className="text-gray-900 font-medium">{proposal.templateType ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <User size={12} /> BD Manager
                </p>
                <p className="text-gray-900 font-medium truncate">{proposal.bdManager ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <User size={12} /> Proposal Manager
                </p>
                <p className="text-gray-900 font-medium truncate">{proposal.proposalManager ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Tag size={12} /> SFDC Opportunity
                </p>
                <p className="text-gray-900 font-medium">{proposal.sfdcOpportunityCode ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Tag size={12} /> Method
                </p>
                <p className="text-gray-900 font-medium capitalize">{proposal.method ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Calendar size={12} /> Created
                </p>
                <p className="text-gray-900 font-medium">
                  {proposal.createdAt ? format(new Date(proposal.createdAt), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Calendar size={12} /> Last Updated
                </p>
                <p className="text-gray-900 font-medium">
                  {proposal.updatedAt ? format(new Date(proposal.updatedAt), 'MMM d, yyyy') : '—'}
                </p>
              </div>
            </div>

            {/* Stakeholders */}
            {(proposal.assignedStakeholders ?? []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2">
                  <Users size={12} /> Assigned Stakeholders
                </p>
                <div className="flex flex-wrap gap-2">
                  {(proposal.assignedStakeholders ?? []).map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
                    >
                      <Users size={10} />
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {proposal.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Project Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{proposal.description}</p>
              </div>
            )}

            {/* Amendment info */}
            {proposal.isAmendment && proposal.parentProposalId && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                <GitBranch size={14} className="text-orange-500 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-gray-500">Amendment of </span>
                  <button
                    onClick={() => navigate(`/proposals/${proposal.parentProposalId}`)}
                    className="text-brand-700 hover:underline font-medium"
                  >
                    {proposal.parentProposalCode ?? proposal.parentProposalId}
                  </button>
                </div>
                {proposal.status === ProposalStatus.CLOSED && (
                  <span className="text-xs text-gray-400 ml-auto">Closed</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(({ id: tabId, label }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={clsx(
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tabId
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-12 gap-5">
          {/* Section list */}
          <div className="col-span-3 space-y-1">
            {sections?.map((section) => (
              <button
                key={section.sectionKey}
                onClick={() => setActiveSectionKey(section.sectionKey)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors',
                  activeSectionKey === section.sectionKey
                    ? 'bg-brand-50 text-brand-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {section.isComplete && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                  {section.isLocked && <Lock size={14} className="text-gray-400 flex-shrink-0" />}
                  <span className="truncate">{section.title}</span>
                </span>
                <ChevronRight size={14} className="flex-shrink-0 text-gray-400" />
              </button>
            ))}
          </div>

          {/* Editor pane */}
          <div className="col-span-9">
            {activeSectionKey && currentSection ? (
              currentSection.sectionKey === 'flowchart' ? (
                <FlowchartSectionEditor
                  key={activeSectionKey}
                  proposalId={proposal.id}
                  section={currentSection}
                />
              ) : (
                <SectionEditor
                  key={activeSectionKey}
                  proposalId={proposal.id}
                  section={currentSection}
                  proposal={proposal}
                />
              )
            ) : (
              <div className="card flex items-center justify-center h-64 text-gray-400 text-sm">
                Select a section from the left to start editing
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'costs' && <CostBreakdown proposalId={proposal.id} />}
      {activeTab === 'timeline' && <GanttTimeline proposalId={proposal.id} />}
      {activeTab === 'audit' && <AuditLogPanel proposalId={proposal.id} />}

      {showExport && (
        <ExportModal proposalId={proposal.id} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
