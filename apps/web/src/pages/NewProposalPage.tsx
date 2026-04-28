import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Copy, Sparkles, Layout, PenLine, Upload, Loader2, X, Building2 } from 'lucide-react';
import { useCreateProposal } from '../hooks/useProposals';
import { useAuthStore } from '../stores/authStore';
import { ProposalMethod, UserRole } from '@biopropose/shared-types';
import { useQuery } from '@tanstack/react-query';
import { templatesApi, proposalsApi, sfdcApi } from '../services/api';
import type { SfdcOpportunity } from '../services/api';
import { GrammarCheckTextarea } from '../components/editor/GrammarCheckTextarea';
import clsx from 'clsx';

const BUSINESS_UNITS = [
  'Biologics US',
  'Biologics India',
  'Discovery-Chemistry',
  'Discovery-Biology',
  'Discovery-Analytical',
  'CDS',
  'CMS',
  'CCM',
];

const TEMPLATE_BU_MAP: Record<string, string[]> = {
  'Biologics US': [
    'Transient Expression',
    'Hybridoma',
    'Cell Line Development (CLD)',
    'Analytics',
    'Biosimilar mAbs',
  ],
  'Biologics India': [
    'NBE Monoclonal Antibody',
    'NBE Non-Antibody',
    'NBE BiSpecific Antibody',
    'Bio Similar Entity - Mono Clonal Antibody',
    'Bio Similar Entity - Non Antibody',
    'Technology Transfer',
  ],
};

const STEPS = ['Proposal Info', 'Creation Method', 'Description & Stakeholders', 'Review'];

interface FormState {
  name: string;
  client: string;
  bdManager: string;
  proposalManager: string;
  proposalCode: string;
  businessUnit: string;
  templateType: string;
  sfdcOpportunityCode: string;
  method: string;
  templateBu: string;
  templateId: string;
  cloneFrom: string;
  description: string;
  assignedStakeholders: string[];
}

export default function NewProposalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isProposalManager = user?.role === UserRole.PROPOSAL_MANAGER || user?.role === UserRole.MANAGEMENT;
  const createProposal = useCreateProposal();
  const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: templatesApi.list });
  const { data: proposalsResult } = useQuery({
    queryKey: ['proposals', 'all'],
    queryFn: () => proposalsApi.list({ limit: 500 }),
  });
  const allProposals = proposalsResult?.items ?? [];

  const [step, setStep] = useState(0);
  const [stakeholderInput, setStakeholderInput] = useState('');
  const [sfdcLoading, setSfdcLoading] = useState(false);
  const [sfdcContext, setSfdcContext] = useState<SfdcOpportunity | null>(null);
  const [sfdcFetchWarning, setSfdcFetchWarning] = useState<string | null>(null);

  // Pre-fill from URL params (e.g. when coming from Template Library or Proposals list Clone button)
  const urlTemplateId = searchParams.get('templateId') ?? '';
  const urlCloneFrom = searchParams.get('cloneFrom') ?? '';
  const initialMethod = urlCloneFrom
    ? ProposalMethod.CLONE
    : urlTemplateId
      ? ProposalMethod.TEMPLATE
      : ProposalMethod.TEMPLATE;

  const [form, setForm] = useState<FormState>({
    name: '',
    client: '',
    bdManager: '',
    proposalManager: user?.email ?? '',
    proposalCode: '',
    businessUnit: 'Biologics US',
    templateType: 'Biologics DS',
    sfdcOpportunityCode: '',
    method: initialMethod,
    templateBu: '',
    templateId: urlTemplateId,
    cloneFrom: urlCloneFrom,
    description: '',
    assignedStakeholders: [],
  });

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const addStakeholder = () => {
    if (stakeholderInput.trim() && stakeholderInput.includes('@')) {
      setForm((f) => ({ ...f, assignedStakeholders: [...f.assignedStakeholders, stakeholderInput.trim()] }));
      setStakeholderInput('');
    }
  };

  const removeStakeholder = (email: string) => {
    setForm((f) => ({ ...f, assignedStakeholders: f.assignedStakeholders.filter((s) => s !== email) }));
  };

  const handleNext = async () => {
    if (step === 0 && form.sfdcOpportunityCode.trim()) {
      setSfdcLoading(true);
      setSfdcFetchWarning(null);
      setSfdcContext(null);
      try {
        const opp = await sfdcApi.getOpportunity(form.sfdcOpportunityCode.trim());
        setSfdcContext(opp);
        if (opp.description && !form.description.trim()) {
          set('description', opp.description);
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 503) {
          setSfdcFetchWarning('Salesforce integration is not configured on this server. Proceeding without opportunity context.');
        } else if (status === 404) {
          setSfdcFetchWarning(`Opportunity "${form.sfdcOpportunityCode}" was not found in Salesforce.`);
        } else {
          setSfdcFetchWarning('Could not reach Salesforce. Proceeding without opportunity context.');
        }
      } finally {
        setSfdcLoading(false);
      }
    }
    setStep((s) => s + 1);
  };

  const canAdvance = () => {
    if (step === 0) return form.name.trim() && form.client.trim() && form.proposalCode.trim();
    if (step === 1) {
      if (form.method === ProposalMethod.TEMPLATE) return !!form.templateBu && !!form.templateId;
      if (form.method === ProposalMethod.CLONE) return !!form.cloneFrom.trim();
      return true; // SCRATCH
    }
    return true;
  };

  const handleSubmit = async () => {
    const dto = {
      name: form.name,
      client: form.client,
      bdManager: form.bdManager,
      proposalManager: form.proposalManager,
      proposalCode: form.proposalCode,
      businessUnit: form.businessUnit,
      templateType: form.templateType,
      sfdcOpportunityCode: form.sfdcOpportunityCode,
      description: form.description,
      assignedStakeholders: form.assignedStakeholders,
      method: form.method as ProposalMethod,
      templateId: form.method === ProposalMethod.TEMPLATE ? form.templateId : undefined,
      cloneFrom: form.method === ProposalMethod.CLONE ? form.cloneFrom : undefined,
      createdBy: user!.email,
    };
    const proposal = await createProposal.mutateAsync(dto as Parameters<typeof createProposal.mutateAsync>[0]);
    navigate(`/proposals/${proposal.id}`);
  };

  const METHODS = [
    {
      value: ProposalMethod.TEMPLATE,
      icon: Layout,
      iconColor: 'text-brand-700',
      title: 'From Template',
      desc: 'Start from a pre-built proposal template',
    },
    {
      value: ProposalMethod.CLONE,
      icon: Copy,
      iconColor: 'text-purple-600',
      title: 'Clone Existing',
      desc: 'Copy structure from a past proposal',
    },
    {
      value: ProposalMethod.SCRATCH,
      icon: PenLine,
      iconColor: 'text-emerald-600',
      title: 'From Scratch',
      desc: 'Start with a blank proposal and build freely',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Proposal</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  i < step ? 'bg-brand-800 border-brand-800 text-white' :
                  i === step ? 'bg-white border-brand-800 text-brand-800' :
                  'bg-white border-gray-300 text-gray-400',
                )}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={clsx('text-xs mt-1 whitespace-nowrap', i <= step ? 'text-brand-800 font-medium' : 'text-gray-400')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx('flex-1 h-0.5 mx-1 mb-5', i < step ? 'bg-brand-800' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card space-y-5">
        {/* Step 0: Proposal Information */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800">Proposal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Proposal Name <span className="text-red-500">*</span></label>
                <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="mAb DS Manufacturing Proposal" />
              </div>
              <div>
                <label className="label">Proposal Code <span className="text-red-500">*</span></label>
                <input className="input" required value={form.proposalCode} onChange={(e) => set('proposalCode', e.target.value)} placeholder="PROP-2025-011" />
              </div>
              <div>
                <label className="label">Client <span className="text-red-500">*</span></label>
                <input className="input" required value={form.client} onChange={(e) => set('client', e.target.value)} placeholder="Pharma Corp" />
              </div>
              <div>
                <label className="label">Business Unit</label>
                <select className="input" value={form.businessUnit} onChange={(e) => set('businessUnit', e.target.value)}>
                  {BUSINESS_UNITS.map((bu) => <option key={bu}>{bu}</option>)}
                </select>
              </div>
              <div>
                <label className="label">BD Manager</label>
                <input className="input" value={form.bdManager} onChange={(e) => set('bdManager', e.target.value)} placeholder="BD Manager name/email" />
              </div>
              <div>
                <label className="label">Proposal Manager</label>
                <input className="input" value={form.proposalManager} onChange={(e) => set('proposalManager', e.target.value)} />
              </div>
              <div>
                <label className="label">SFDC Opportunity Code</label>
                <input className="input" value={form.sfdcOpportunityCode} onChange={(e) => set('sfdcOpportunityCode', e.target.value)} placeholder="OPP-12345" />
              </div>
            </div>
          </>
        )}

        {/* Step 1: Creation Method */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800">Creation Method</h2>
            <div className="grid grid-cols-3 gap-4">
              {METHODS.map(({ value, icon: Icon, iconColor, title, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('method', value)}
                  className={clsx(
                    'relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center',
                    form.method === value
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  {form.method === value && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand-800 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <Icon className={clsx('w-8 h-8', iconColor)} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-1">{desc}</p>
                  </div>
                </button>
              ))}

              {/* AI Prompt — Coming Soon */}
              <div className="relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-100 bg-gray-50 text-center opacity-60 cursor-not-allowed col-span-1">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
                <Sparkles className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">AI Prompt</p>
                  <p className="text-xs text-gray-400 mt-1">Generate draft from natural language</p>
                </div>
              </div>
            </div>

            {/* Template selector — BU first, then filtered template */}
            {form.method === ProposalMethod.TEMPLATE && (() => {
              const mappedNames = TEMPLATE_BU_MAP[form.templateBu] ?? [];
              const hasBuMapping = mappedNames.length > 0;

              // Build option list: for mapped BUs always show expected names, resolved to DB id when available
              const templateOptions: { id: string; name: string; uploaded: boolean }[] = hasBuMapping
                ? mappedNames.map((name) => {
                    const dbMatch = (templates ?? []).find(
                      (t) => t.name.toLowerCase() === name.toLowerCase() ||
                             (t.businessUnit === form.templateBu && t.name.toLowerCase() === name.toLowerCase()),
                    );
                    return { id: dbMatch?.id ?? '', name, uploaded: !!dbMatch };
                  })
                : (templates ?? [])
                    .filter((t) => t.businessUnit === form.templateBu)
                    .map((t) => ({ id: t.id, name: t.name, uploaded: true }));

              const anyUploaded = templateOptions.some((o) => o.uploaded);
              const noneUploaded = !anyUploaded && !hasBuMapping;

              return (
                <div className="space-y-3">
                  <div>
                    <label className="label">Business Unit <span className="text-red-500">*</span></label>
                    <select
                      className="input"
                      value={form.templateBu}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, templateBu: e.target.value, templateId: '' }));
                      }}
                    >
                      <option value="">-- Select Business Unit --</option>
                      {BUSINESS_UNITS.map((bu) => (
                        <option key={bu} value={bu}>{bu}</option>
                      ))}
                    </select>
                  </div>

                  {form.templateBu && (hasBuMapping || templateOptions.length > 0) && (
                    <div>
                      <label className="label">Select Template <span className="text-red-500">*</span></label>
                      <select
                        className="input"
                        value={form.templateId}
                        onChange={(e) => set('templateId', e.target.value)}
                      >
                        <option value="">-- Choose template --</option>
                        {templateOptions.map((opt) => (
                          <option key={opt.name} value={opt.id} disabled={!opt.uploaded}>
                            {opt.name}{!opt.uploaded ? ' (not uploaded yet)' : ''}
                          </option>
                        ))}
                      </select>
                      {hasBuMapping && !anyUploaded && isProposalManager && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          <Upload size={12} />
                          Templates not yet uploaded. Go to{' '}
                          <button type="button" className="underline" onClick={() => navigate('/templates')}>
                            Template Library
                          </button>{' '}
                          to upload them.
                        </p>
                      )}
                      {hasBuMapping && !anyUploaded && !isProposalManager && (
                        <p className="text-xs text-gray-500 mt-1.5">Templates not yet uploaded. Contact your Proposal Manager.</p>
                      )}
                    </div>
                  )}

                  {form.templateBu && noneUploaded && isProposalManager && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                      <Upload size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800">No templates uploaded for {form.templateBu} yet.</p>
                        <p className="text-amber-700 mt-0.5">
                          Go to{' '}
                          <button
                            type="button"
                            className="underline font-medium hover:text-amber-900"
                            onClick={() => navigate('/templates')}
                          >
                            Template Library
                          </button>{' '}
                          to upload and manage templates for this Business Unit.
                        </p>
                      </div>
                    </div>
                  )}

                  {form.templateBu && noneUploaded && !isProposalManager && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                      No templates are available for <strong>{form.templateBu}</strong> yet. Please contact your Proposal Manager to upload templates for this Business Unit.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Clone source dropdown */}
            {form.method === ProposalMethod.CLONE && (
              <div className="space-y-3">
                <div>
                  <label className="label">Select Proposal to Clone <span className="text-red-500">*</span></label>
                  <select
                    className="input"
                    value={form.cloneFrom}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const source = allProposals.find((p) => p.id === selectedId);
                      if (source) {
                        setForm((f) => ({
                          ...f,
                          cloneFrom: selectedId,
                          name: `Copy of ${source.name}`,
                          client: source.client ?? f.client,
                          bdManager: source.bdManager ?? f.bdManager,
                          proposalManager: source.proposalManager ?? f.proposalManager,
                          businessUnit: source.businessUnit ?? f.businessUnit,
                          templateType: source.templateType ?? f.templateType,
                          description: source.description ?? f.description,
                          sfdcOpportunityCode: source.sfdcOpportunityCode ?? f.sfdcOpportunityCode,
                          assignedStakeholders: source.assignedStakeholders ?? f.assignedStakeholders,
                        }));
                      } else {
                        set('cloneFrom', selectedId);
                      }
                    }}
                  >
                    <option value="">-- Select a proposal --</option>
                    {allProposals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.proposalCode} — {p.name} ({p.client})
                      </option>
                    ))}
                  </select>
                </div>

                {form.cloneFrom && (() => {
                  const src = allProposals.find((p) => p.id === form.cloneFrom);
                  if (!src) return null;
                  return (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm space-y-1.5">
                      <p className="font-semibold text-purple-800 text-xs uppercase tracking-wide mb-2">Importing from selected proposal</p>
                      {[
                        { label: 'Proposal Code', value: src.proposalCode },
                        { label: 'Client', value: src.client },
                        { label: 'Business Unit', value: src.businessUnit ?? '—' },
                        { label: 'BD Manager', value: src.bdManager ?? '—' },
                        { label: 'Proposal Manager', value: src.proposalManager ?? '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex gap-2">
                          <span className="text-purple-600 w-36 flex-shrink-0">{label}</span>
                          <span className="text-purple-900 font-medium">{value}</span>
                        </div>
                      ))}
                      <p className="text-xs text-purple-500 pt-1">These fields have been pre-filled in Step 1. You can edit them before creating.</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Scratch notice */}
            {form.method === ProposalMethod.SCRATCH && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                A blank proposal will be created with empty sections. You can add content freely without any template constraints.
              </div>
            )}
          </>
        )}

        {/* Step 2: Description & Stakeholders */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800">Description & Stakeholders</h2>

            {/* SFDC warning (lookup failed) */}
            {sfdcFetchWarning && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-amber-800 flex-1">{sfdcFetchWarning}</p>
                <button type="button" onClick={() => setSfdcFetchWarning(null)} className="text-amber-400 hover:text-amber-700 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* SFDC opportunity context card */}
            {sfdcContext && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-blue-600" />
                    <span className="font-semibold text-blue-800 text-xs uppercase tracking-wide">Salesforce Opportunity</span>
                  </div>
                  <button type="button" onClick={() => setSfdcContext(null)} className="text-blue-400 hover:text-blue-700">
                    <X size={14} />
                  </button>
                </div>
                {[
                  { label: 'Opportunity', value: sfdcContext.name },
                  { label: 'Account', value: sfdcContext.accountName ?? '—' },
                  { label: 'Stage', value: sfdcContext.stageName ?? '—' },
                  { label: 'Amount', value: sfdcContext.amount != null ? `$${sfdcContext.amount.toLocaleString()}` : '—' },
                  { label: 'Close Date', value: sfdcContext.closeDate ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-blue-500 w-24 flex-shrink-0">{label}</span>
                    <span className="text-blue-900 font-medium">{value}</span>
                  </div>
                ))}
                {sfdcContext.description && (
                  <p className="text-xs text-blue-600 mt-1">Description pre-filled from Salesforce opportunity.</p>
                )}
              </div>
            )}

            <div>
              <label className="label">Project Description</label>
              <GrammarCheckTextarea
                value={form.description}
                onChange={(v) => set('description', v)}
                className="min-h-[140px] resize-y text-sm border border-gray-300 rounded-lg w-full"
                placeholder="Briefly describe the scope, objectives, and key requirements of this proposal..."
              />
            </div>
            <div>
              <label className="label">Assigned Stakeholders (email)</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type="email"
                  placeholder="stakeholder@company.com"
                  value={stakeholderInput}
                  onChange={(e) => setStakeholderInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStakeholder(); } }}
                />
                <button type="button" className="btn-secondary" onClick={addStakeholder}>Add</button>
              </div>
              {form.assignedStakeholders.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.assignedStakeholders.map((s) => (
                    <span key={s} className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                      {s}
                      <button type="button" onClick={() => removeStakeholder(s)} className="ml-1 text-blue-400 hover:text-blue-700">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800">Review & Confirm</h2>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
              {[
                { label: 'Proposal Name', value: form.name },
                { label: 'Proposal Code', value: form.proposalCode },
                { label: 'Client', value: form.client },
                { label: 'Business Unit', value: form.businessUnit },
                { label: 'BD Manager', value: form.bdManager || '—' },
                { label: 'Proposal Manager', value: form.proposalManager },
                { label: 'SFDC Opportunity', value: form.sfdcOpportunityCode || '—' },
                { label: 'Creation Method', value: form.method },
                {
                  label: 'Stakeholders',
                  value: form.assignedStakeholders.length
                    ? form.assignedStakeholders.join(', ')
                    : '—',
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4 px-4 py-2.5">
                  <span className="text-gray-500 w-40 flex-shrink-0">{label}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
              {form.description && (
                <div className="px-4 py-2.5">
                  <span className="text-gray-500 block mb-1">Description</span>
                  <span className="text-gray-900 text-sm whitespace-pre-wrap">{form.description}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button type="button" className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={15} />
              Back
            </button>
          )}
          <button type="button" className="btn-secondary ml-auto" onClick={() => navigate(-1)}>Cancel</button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn-primary"
              disabled={!canAdvance() || sfdcLoading}
              onClick={handleNext}
            >
              {sfdcLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Fetching SFDC...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={createProposal.isPending}
            >
              <FileText size={15} />
              {createProposal.isPending ? 'Creating...' : 'Create Proposal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
