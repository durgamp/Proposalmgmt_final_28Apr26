import { AppDataSource } from './data-source';
import { TemplateEntity } from './entities/Template.entity';
import { ProposalEntity } from './entities/Proposal.entity';
import { ProposalSectionEntity } from './entities/ProposalSection.entity';
import { CostItemEntity } from './entities/CostItem.entity';
import { ProjectStageEntity } from './entities/ProjectStage.entity';
import { ProjectActivityEntity } from './entities/ProjectActivity.entity';
import { CommentEntity } from './entities/Comment.entity';
import { AuditLogEntity } from './entities/AuditLog.entity';
import { v4 as uuid } from 'uuid';

// ─── Templates ───────────────────────────────────────────────────────────────

// Shared default sections for every template
const DEFAULT_SECTIONS = [
  { sectionKey: 'ceo-letter',        title: 'CEO Letter',          sortOrder: 0, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dear [Client Name],' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'We are pleased to present this proposal...' }] }] } },
  { sectionKey: 'executive-summary', title: 'Executive Summary',   sortOrder: 1, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
  { sectionKey: 'scope-of-work',     title: 'Scope of Work',       sortOrder: 2, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
  { sectionKey: 'project-details',   title: 'Project Details',     sortOrder: 3, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
  { sectionKey: 'terms-conditions',  title: 'Terms & Conditions',  sortOrder: 4, defaultContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } },
];

const DEFAULT_TEMPLATES = [
  // ── Biologics US (5 templates) ──────────────────────────────────────────
  {
    name: 'Transient Expression',
    description: 'Transient transfection for rapid protein production — HEK293 or CHO-based. Ideal for early-stage characterisation and feasibility studies.',
    businessUnit: 'Biologics US',
    category: 'Transient Expression',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'Hybridoma',
    description: 'Traditional hybridoma technology for monoclonal antibody generation. Covers immunisation, fusion, screening, and cloning workflows.',
    businessUnit: 'Biologics US',
    category: 'Hybridoma',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'Cell Line Development (CLD)',
    description: 'Stable CHO cell line development from transfection through single-cell cloning, expansion, stability studies, and MCB preparation.',
    businessUnit: 'Biologics US',
    category: 'Cell Line Development (CLD)',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'Analytics',
    description: 'Analytical characterisation services including SEC-HPLC, cIEF, glycan profiling, bioassays, and ICH Q2(R2)-aligned method development.',
    businessUnit: 'Biologics US',
    category: 'Analytics',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'Biosimilar mAbs',
    description: 'End-to-end biosimilar monoclonal antibody program — cell line development, comparability studies, and regulatory submission support.',
    businessUnit: 'Biologics US',
    category: 'Biosimilar mAbs',
    sections: DEFAULT_SECTIONS,
  },

  // ── Biologics India (6 templates) ────────────────────────────────────────
  {
    name: 'NBE Monoclonal Antibody',
    description: 'New Biological Entity mAb program covering IND-enabling studies, upstream/downstream development, and GMP manufacturing.',
    businessUnit: 'Biologics India',
    category: 'NBE Monoclonal Antibody',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'NBE Non-Antibody',
    description: 'NBE non-antibody biologics (cytokines, enzymes, fusion proteins) — expression, purification, and analytical characterisation.',
    businessUnit: 'Biologics India',
    category: 'NBE Non-Antibody',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'NBE BiSpecific Antibody',
    description: 'Bispecific antibody development proposal covering molecule engineering, cell line development, and process development.',
    businessUnit: 'Biologics India',
    category: 'NBE BiSpecific Antibody',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'Bio Similar Entity - Mono Clonal Antibody',
    description: 'Biosimilar mAb entity development with full analytical comparability package aligned to EMA/FDA biosimilar guidelines.',
    businessUnit: 'Biologics India',
    category: 'Bio Similar Entity - Mono Clonal Antibody',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'Bio Similar Entity - Non Antibody',
    description: 'Biosimilar non-antibody entity (peptides, cytokines, hormones) development with regulatory comparability studies.',
    businessUnit: 'Biologics India',
    category: 'Bio Similar Entity - Non Antibody',
    sections: DEFAULT_SECTIONS,
  },
  {
    name: 'Technology Transfer',
    description: 'Comprehensive technology transfer package including process characterisation, analytical transfer, validation, and regulatory support.',
    businessUnit: 'Biologics India',
    category: 'Technology Transfer',
    sections: DEFAULT_SECTIONS,
  },
];

// ─── Rich section content helpers ─────────────────────────────────────────────

function makeCeoLetter(clientName: string, projectName: string, pmName: string): object {
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: `Dear ${clientName},` }] },
      { type: 'paragraph', content: [{ type: 'text', text: `I am delighted to present Aragon Research's comprehensive proposal for the ${projectName} program. At Aragon, we understand that successful biologics development requires not only scientific excellence but also a trusted partnership built on transparency and commitment to your timelines.` }] },
      { type: 'paragraph', content: [{ type: 'text', text: `Our team of experienced scientists and project managers is uniquely positioned to support your program with end-to-end capabilities spanning cell line development, upstream/downstream process development, analytical characterization, and GMP manufacturing. We have successfully delivered over 200 biologics programs to date, with an industry-leading on-time delivery rate.` }] },
      { type: 'paragraph', content: [{ type: 'text', text: `This proposal has been carefully tailored to meet your specific requirements and reflects our commitment to quality, regulatory compliance, and scientific rigor. ${pmName} and the project team will serve as your dedicated point of contact throughout the engagement.` }] },
      { type: 'paragraph', content: [{ type: 'text', text: `We look forward to the opportunity to support your program and build a long-term partnership.` }] },
      { type: 'paragraph', content: [{ type: 'text', text: `Sincerely,` }] },
      { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: `CEO, Aragon Research` }] },
    ],
  };
}

function makeExecutiveSummary(projectName: string, molecule: string, scope: string): object {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Executive Summary' }] },
      { type: 'paragraph', content: [{ type: 'text', text: `Aragon Research proposes a comprehensive ${scope} program for the ${molecule} (${projectName}) biologics asset. This proposal outlines our technical approach, resource allocation, timeline, and commercial terms for delivering this program within the agreed specifications.` }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Key Deliverables' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cell line development and master cell bank (MCB) establishment' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Upstream process development and scale-up to 200L' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Downstream purification process development' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Analytical method development and qualification' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'GMP manufacturing campaign with full batch records' }] }] },
      ] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Programme Timeline' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'The programme is expected to span 18–24 months from contract execution to final batch release, subject to regulatory timelines and client decision points.' }] },
    ],
  };
}

function makeScopeOfWork(molecule: string, stages: string[]): object {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scope of Work' }] },
      { type: 'paragraph', content: [{ type: 'text', text: `The following scope of work has been defined for the ${molecule} program:` }] },
      ...stages.map((stage, i) => ({
        type: 'bulletList' as const,
        content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: `${i + 1}. ${stage}` }] }] }],
      })),
      { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Out of Scope:' }, { type: 'text', text: ' Clinical trials, regulatory submissions, and commercial supply are not included in this proposal.' }] },
    ],
  };
}

function makeProjectDetails(molecule: string, projectCode: string): object {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Project Details' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Project Overview' }] },
      { type: 'paragraph', content: [{ type: 'text', text: `Project Code: ${projectCode}` }] },
      { type: 'paragraph', content: [{ type: 'text', text: `Molecule Type: ${molecule}` }] },
      { type: 'paragraph', content: [{ type: 'text', text: `Development Stage: Pre-clinical / Phase I enabling` }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Key Assumptions' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Client provides gene construct and relevant analytical data prior to project initiation' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Regulatory strategy to be aligned at project kick-off meeting' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Change control process to be agreed upon contract execution' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Material transfer agreements to be in place before sample receipt' }] }] },
      ] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Risk Register' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Key risks have been identified and mitigation strategies are outlined in the attached Risk Assessment document. Primary risks include cell line instability (mitigated by parallel clone screening) and scale-up failure (mitigated by staged scale-up approach with defined success criteria).' }] },
    ],
  };
}

function makeTermsConditions(): object {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Terms & Conditions' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '1. Payment Terms' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Payment is due within 30 days of invoice. Aragon Research reserves the right to charge interest at 1.5% per month on overdue balances. A payment schedule tied to project milestones will be agreed upon contract execution.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '2. Intellectual Property' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'All pre-existing intellectual property of either party shall remain the property of that party. Project-specific IP generated under this agreement shall be owned by the Client, subject to payment in full. Background IP used in the performance of services remains the property of Aragon Research.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '3. Confidentiality' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Both parties agree to maintain the confidentiality of all proprietary information exchanged under this agreement for a period of five (5) years from the date of disclosure.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '4. Liability Limitation' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Aragon Research\'s liability under this agreement shall not exceed the total fees paid in the preceding 12 months. Neither party shall be liable for indirect, consequential, or punitive damages.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '5. Governing Law' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'This agreement shall be governed by the laws of the State of New Jersey, USA. Any disputes shall be resolved by binding arbitration in accordance with the AAA Commercial Arbitration Rules.' }] },
    ],
  };
}

// ─── Proposal seed data ───────────────────────────────────────────────────────

interface SeedProposal {
  id: string;
  name: string;
  client: string;
  bdManager: string;
  proposalManager: string;
  proposalCode: string;
  businessUnit: string;
  templateType: string;
  description: string;
  method: string;
  status: string;
  currentStage: number;
  completionPercentage: number;
  pmReviewComplete: boolean;
  managementReviewComplete: boolean;
  isAmendment: boolean;
  assignedStakeholders: string[];
  sfdcOpportunityCode: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
}

const PROPOSALS: SeedProposal[] = [
  {
    id: uuid(),
    name: 'Anti-CD20 mAb Drug Substance Manufacturing',
    client: 'NovaBioTech Therapeutics',
    bdManager: 'james.wilson@aragon.com',
    proposalManager: 'sarah.johnson@aragon.com',
    proposalCode: 'PROP-2025-001',
    businessUnit: 'Biologics US',
    templateType: 'NBE Monoclonal Antibody',
    description: 'Full drug substance manufacturing program for anti-CD20 monoclonal antibody targeting B-cell malignancies. Includes cell line development, upstream process development (200L scale), downstream purification, and initial analytical characterization.',
    method: 'template',
    status: 'Sent',
    currentStage: 5,
    completionPercentage: 100,
    pmReviewComplete: true,
    managementReviewComplete: true,
    isAmendment: false,
    assignedStakeholders: ['client.pm@novabiotech.com', 'cso@novabiotech.com', 'qa@novabiotech.com'],
    sfdcOpportunityCode: 'OPP-2025-0432',
    createdBy: 'sarah.johnson@aragon.com',
    updatedBy: 'sarah.johnson@aragon.com',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: uuid(),
    name: 'VEGF-A Biosimilar Comparability Study',
    client: 'GeneriX Pharma GmbH',
    bdManager: 'mike.chen@aragon.com',
    proposalManager: 'john.smith@aragon.com',
    proposalCode: 'PROP-2025-002',
    businessUnit: 'Biologics US',
    templateType: 'Biosimilar mAbs',
    description: 'Analytical comparability program for VEGF-A biosimilar development including physicochemical characterization, potency assays, and PK/PD modeling to support biosimilarity demonstration.',
    method: 'template',
    status: 'Review',
    currentStage: 4,
    completionPercentage: 72,
    pmReviewComplete: true,
    managementReviewComplete: false,
    isAmendment: false,
    assignedStakeholders: ['regulatory@generix.de', 'project.lead@generix.de'],
    sfdcOpportunityCode: 'OPP-2025-0388',
    createdBy: 'john.smith@aragon.com',
    updatedBy: 'john.smith@aragon.com',
    createdAt: new Date('2025-02-03'),
  },
  {
    id: uuid(),
    name: 'IL-17A Antibody Cell Line Development',
    client: 'PrimaBio Sciences',
    bdManager: 'emma.davis@aragon.com',
    proposalManager: 'sarah.johnson@aragon.com',
    proposalCode: 'PROP-2025-003',
    businessUnit: 'Biologics India',
    templateType: 'Gene to GMP Complete',
    description: 'CHO cell line development program for IL-17A monoclonal antibody including transient expression, stable pool generation, single-cell cloning, and MCB establishment.',
    method: 'template',
    status: 'Review',
    currentStage: 3,
    completionPercentage: 55,
    pmReviewComplete: false,
    managementReviewComplete: false,
    isAmendment: false,
    assignedStakeholders: ['vp.biologics@primabio.com', 'cmo@primabio.com'],
    sfdcOpportunityCode: 'OPP-2025-0311',
    createdBy: 'sarah.johnson@aragon.com',
    updatedBy: 'sarah.johnson@aragon.com',
    createdAt: new Date('2025-02-20'),
  },
  {
    id: uuid(),
    name: 'PD-1 Checkpoint Inhibitor Phase I GMP Batch',
    client: 'Oncologia Pharma S.A.',
    bdManager: 'james.wilson@aragon.com',
    proposalManager: 'mike.chen@aragon.com',
    proposalCode: 'PROP-2025-004',
    businessUnit: 'Biologics US',
    templateType: 'NBE Monoclonal Antibody',
    description: 'GMP manufacturing of Phase I clinical supply batches for PD-1 checkpoint inhibitor. Includes process transfer, equipment qualification, batch production, QC release testing, and regulatory documentation.',
    method: 'clone',
    status: 'Review',
    currentStage: 2,
    completionPercentage: 38,
    pmReviewComplete: false,
    managementReviewComplete: false,
    isAmendment: false,
    assignedStakeholders: ['cto@oncologia.com', 'regulatory@oncologia.com', 'supply.chain@oncologia.com'],
    sfdcOpportunityCode: 'OPP-2025-0445',
    createdBy: 'mike.chen@aragon.com',
    updatedBy: 'mike.chen@aragon.com',
    createdAt: new Date('2025-03-01'),
  },
  {
    id: uuid(),
    name: 'HER2 Bispecific Antibody Process Development',
    client: 'Kinesis BioTherapeutics',
    bdManager: 'emma.davis@aragon.com',
    proposalManager: 'john.smith@aragon.com',
    proposalCode: 'PROP-2025-005',
    businessUnit: 'Biologics US',
    templateType: 'NBE Non-Antibody',
    description: 'End-to-end process development for HER2×CD3 bispecific antibody using knob-into-hole technology. Includes cell culture optimization, downstream processing, and formulation development.',
    method: 'template',
    status: 'Draft',
    currentStage: 1,
    completionPercentage: 20,
    pmReviewComplete: false,
    managementReviewComplete: false,
    isAmendment: false,
    assignedStakeholders: ['bd@kinesis.com'],
    sfdcOpportunityCode: 'OPP-2025-0512',
    createdBy: 'john.smith@aragon.com',
    updatedBy: 'john.smith@aragon.com',
    createdAt: new Date('2025-03-10'),
  },
  {
    id: uuid(),
    name: 'Recombinant Erythropoietin Analytical Package',
    client: 'AsiaMed Biologics Pte Ltd',
    bdManager: 'mike.chen@aragon.com',
    proposalManager: 'emma.davis@aragon.com',
    proposalCode: 'PROP-2025-006',
    businessUnit: 'Discovery-Analytical',
    templateType: 'Analytics',
    description: 'Comprehensive analytical characterization package for biosimilar recombinant EPO including glycan profiling, potency assays, aggregation analysis, and stability studies per ICH Q5E guidelines.',
    method: 'template',
    status: 'Approved',
    currentStage: 5,
    completionPercentage: 100,
    pmReviewComplete: true,
    managementReviewComplete: true,
    isAmendment: false,
    assignedStakeholders: ['analytics.head@asiamed.sg', 'qa@asiamed.sg'],
    sfdcOpportunityCode: 'OPP-2025-0298',
    createdBy: 'emma.davis@aragon.com',
    updatedBy: 'emma.davis@aragon.com',
    createdAt: new Date('2025-01-28'),
  },
  {
    id: uuid(),
    name: 'Technology Transfer — HuMAb-CTLA4 to India Site',
    client: 'ImmunoTech Global',
    bdManager: 'james.wilson@aragon.com',
    proposalManager: 'sarah.johnson@aragon.com',
    proposalCode: 'PROP-2025-007',
    businessUnit: 'Biologics India',
    templateType: 'Technology Transfer',
    description: 'Technology transfer of HuMAb-CTLA4 manufacturing process from US site to Aragon India GMP facility. Includes process characterization, comparability protocol development, and validation batch execution.',
    method: 'template',
    status: 'Draft',
    currentStage: 1,
    completionPercentage: 40,
    pmReviewComplete: false,
    managementReviewComplete: false,
    isAmendment: false,
    assignedStakeholders: ['tech.transfer@immunotech.com', 'manufacturing@immunotech.com'],
    sfdcOpportunityCode: 'OPP-2025-0601',
    createdBy: 'sarah.johnson@aragon.com',
    updatedBy: 'sarah.johnson@aragon.com',
    createdAt: new Date('2025-03-05'),
  },
  {
    id: uuid(),
    name: 'Antibody-Drug Conjugate Formulation Development',
    client: 'Cytotarge Oncology',
    bdManager: 'emma.davis@aragon.com',
    proposalManager: 'john.smith@aragon.com',
    proposalCode: 'PROP-2025-008',
    businessUnit: 'Biologics US',
    templateType: 'NBE Monoclonal Antibody',
    description: 'Formulation development and stability study for trastuzumab-DM1 ADC. Includes pH optimization, excipient screening, lyophilization cycle development, and 12-month accelerated stability under ICH Q1A conditions.',
    method: 'clone',
    status: 'Sent',
    currentStage: 5,
    completionPercentage: 100,
    pmReviewComplete: true,
    managementReviewComplete: true,
    isAmendment: false,
    assignedStakeholders: ['formulation@cytotarge.com', 'cmo@cytotarge.com'],
    sfdcOpportunityCode: 'OPP-2024-0889',
    createdBy: 'john.smith@aragon.com',
    updatedBy: 'john.smith@aragon.com',
    createdAt: new Date('2024-11-10'),
  },
  {
    id: uuid(),
    name: 'TNF-alpha mAb Upstream Scale-Up 2000L',
    client: 'EuroBio Contract Manufacturing',
    bdManager: 'mike.chen@aragon.com',
    proposalManager: 'sarah.johnson@aragon.com',
    proposalCode: 'PROP-2025-009',
    businessUnit: 'Biologics US',
    templateType: 'NBE Monoclonal Antibody',
    description: 'Scale-up of existing 200L TNF-alpha mAb upstream process to 2000L commercial-scale bioreactor. Includes media optimization, DOE studies, process characterization, and scale-down model qualification.',
    method: 'template',
    status: 'Review',
    currentStage: 3,
    completionPercentage: 58,
    pmReviewComplete: false,
    managementReviewComplete: false,
    isAmendment: false,
    assignedStakeholders: ['technical.ops@eurobio.eu', 'quality@eurobio.eu'],
    sfdcOpportunityCode: 'OPP-2025-0543',
    createdBy: 'sarah.johnson@aragon.com',
    updatedBy: 'sarah.johnson@aragon.com',
    createdAt: new Date('2025-02-14'),
  },
  {
    id: uuid(),
    name: 'Insulin Glargine Biosimilar CLD',
    client: 'SunPharma Biologics Division',
    bdManager: 'james.wilson@aragon.com',
    proposalManager: 'mike.chen@aragon.com',
    proposalCode: 'PROP-2025-010',
    businessUnit: 'Biologics India',
    templateType: 'Biosimilar mAbs',
    description: 'Cell line development for insulin glargine biosimilar using CHO-K1 expression system. Includes transfection strategy, clone screening (96-well to shake flask), productivity optimization, and WCB establishment.',
    method: 'template',
    status: 'Draft',
    currentStage: 1,
    completionPercentage: 12,
    pmReviewComplete: false,
    managementReviewComplete: false,
    isAmendment: false,
    assignedStakeholders: ['biologics.head@sunpharma.in'],
    sfdcOpportunityCode: 'OPP-2025-0677',
    createdBy: 'mike.chen@aragon.com',
    updatedBy: 'mike.chen@aragon.com',
    createdAt: new Date('2025-03-12'),
  },
];

// ─── Section content map ───────────────────────────────────────────────────────

function getSectionContent(proposal: SeedProposal, sectionKey: string): object {
  const client = proposal.client;
  const name = proposal.name;
  const pm = proposal.proposalManager;

  switch (sectionKey) {
    case 'ceo-letter':
      return makeCeoLetter(client, name, pm);
    case 'executive-summary':
      return makeExecutiveSummary(name, proposal.templateType ?? 'mAb', proposal.description.slice(0, 50));
    case 'scope-of-work':
      return makeScopeOfWork(proposal.templateType ?? 'mAb', [
        'Cell line development and stability testing',
        'Upstream process development (benchtop to 200L)',
        'Downstream process development (capture + polishing)',
        'In-process and product analytics',
        'Technology transfer and scale-up support',
        'GMP manufacturing and QC release',
      ]);
    case 'project-details':
      return makeProjectDetails(proposal.templateType ?? 'mAb', proposal.proposalCode);
    case 'terms-conditions':
      return makeTermsConditions();
    case 'amendment-details':
      return {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Amendment Details' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'This amendment supersedes the original proposal with the following changes:' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated scope to include additional scale-up runs' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Revised timeline extended by 4 weeks' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cost adjustment per revised quote' }] }] },
          ] },
        ],
      };
    default:
      return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] };
  }
}

// ─── Cost items per proposal ───────────────────────────────────────────────────

function getCostItems(proposalId: string, proposalCode: string, userEmail: string): Partial<CostItemEntity>[] {
  const seed = proposalCode.slice(-3);
  const multiplier = (parseInt(seed, 10) || 1) * 0.7 + 0.5;

  return [
    {
      id: uuid(), proposalId,
      category: 'Service', description: 'Cell Line Development & Screening', quantity: 1,
      serviceRate: Math.round(85000 * multiplier), materialRate: 0, outsourcingRate: 0,
      totalCost: Math.round(85000 * multiplier), stage: 'Stage 1',
      isBinding: true, isFixedRate: true, sortOrder: 0,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Service', description: 'Upstream Process Development (200L)', quantity: 1,
      serviceRate: Math.round(120000 * multiplier), materialRate: 0, outsourcingRate: 0,
      totalCost: Math.round(120000 * multiplier), stage: 'Stage 2',
      isBinding: true, isFixedRate: false, sortOrder: 1,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Service', description: 'Downstream Purification Development', quantity: 1,
      serviceRate: Math.round(95000 * multiplier), materialRate: 0, outsourcingRate: 0,
      totalCost: Math.round(95000 * multiplier), stage: 'Stage 2',
      isBinding: true, isFixedRate: false, sortOrder: 2,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Material', description: 'Chromatography Resins & Consumables', quantity: 3,
      serviceRate: 0, materialRate: Math.round(18000 * multiplier), outsourcingRate: 0,
      totalCost: Math.round(54000 * multiplier), stage: 'Stage 2',
      isBinding: false, isFixedRate: false, sortOrder: 3,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Material', description: 'Cell Culture Media & Supplements', quantity: 6,
      serviceRate: 0, materialRate: Math.round(8500 * multiplier), outsourcingRate: 0,
      totalCost: Math.round(51000 * multiplier), stage: 'Stage 1',
      isBinding: false, isFixedRate: false, sortOrder: 4,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Service', description: 'Analytical Method Development & Qualification', quantity: 1,
      serviceRate: Math.round(65000 * multiplier), materialRate: 0, outsourcingRate: 0,
      totalCost: Math.round(65000 * multiplier), stage: 'Stage 3',
      isBinding: true, isFixedRate: true, sortOrder: 5,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Outsourcing', description: 'Glycan Profiling (N-glycan mapping)', quantity: 2,
      serviceRate: 0, materialRate: 0, outsourcingRate: Math.round(12000 * multiplier),
      totalCost: Math.round(24000 * multiplier), stage: 'Stage 3',
      isBinding: false, isFixedRate: true, sortOrder: 6,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Service', description: 'GMP Manufacturing Campaign (200L)', quantity: 1,
      serviceRate: Math.round(210000 * multiplier), materialRate: 0, outsourcingRate: 0,
      totalCost: Math.round(210000 * multiplier), stage: 'Stage 4',
      isBinding: true, isFixedRate: true, sortOrder: 7,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Material', description: 'GMP Raw Materials & Single-Use Components', quantity: 1,
      serviceRate: 0, materialRate: Math.round(45000 * multiplier), outsourcingRate: 0,
      totalCost: Math.round(45000 * multiplier), stage: 'Stage 4',
      isBinding: true, isFixedRate: false, sortOrder: 8,
      createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: uuid(), proposalId,
      category: 'Service', description: 'QC Release Testing & Batch Disposition', quantity: 1,
      serviceRate: Math.round(35000 * multiplier), materialRate: 0, outsourcingRate: 0,
      totalCost: Math.round(35000 * multiplier), stage: 'Stage 4',
      isBinding: true, isFixedRate: true, sortOrder: 9,
      createdBy: userEmail, updatedBy: userEmail,
    },
  ];
}

// ─── Timeline stages & activities ─────────────────────────────────────────────

function getTimeline(proposalId: string, userEmail: string, startYear: number = 2025): {
  stages: Partial<ProjectStageEntity>[];
  activities: Partial<ProjectActivityEntity>[];
} {
  const stageIds = [uuid(), uuid(), uuid(), uuid()];
  const stages: Partial<ProjectStageEntity>[] = [
    {
      id: stageIds[0], proposalId, name: 'Project Initiation & Cell Line Development',
      startDate: `${startYear}-02-01`, endDate: `${startYear}-05-31`, durationDays: 119,
      sortOrder: 0, createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: stageIds[1], proposalId, name: 'Process Development',
      startDate: `${startYear}-06-01`, endDate: `${startYear}-09-30`, durationDays: 121,
      sortOrder: 1, createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: stageIds[2], proposalId, name: 'Analytical Development & Qualification',
      startDate: `${startYear}-07-01`, endDate: `${startYear}-10-31`, durationDays: 122,
      sortOrder: 2, createdBy: userEmail, updatedBy: userEmail,
    },
    {
      id: stageIds[3], proposalId, name: 'GMP Manufacturing & Release',
      startDate: `${startYear}-11-01`, endDate: `${startYear + 1}-02-28`, durationDays: 119,
      sortOrder: 3, createdBy: userEmail, updatedBy: userEmail,
    },
  ];

  const activities: Partial<ProjectActivityEntity>[] = [
    // Stage 1 activities
    { id: uuid(), proposalId, stageId: stageIds[0], name: 'Gene synthesis & vector construction', startDate: `${startYear}-02-01`, endDate: `${startYear}-02-28`, durationDays: 27, progress: 100, assignee: 'Dr. Priya Sharma', phase: 'CLD', color: '#1e3a5f', sortOrder: 0, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[0], name: 'Transient expression & titre assessment', startDate: `${startYear}-03-01`, endDate: `${startYear}-03-31`, durationDays: 30, progress: 80, assignee: 'Dr. James Park', phase: 'CLD', color: '#1e3a5f', sortOrder: 1, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[0], name: 'Stable pool generation & selection', startDate: `${startYear}-04-01`, endDate: `${startYear}-04-30`, durationDays: 29, progress: 60, assignee: 'Dr. Priya Sharma', phase: 'CLD', color: '#1e3a5f', sortOrder: 2, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[0], name: 'Single-cell cloning & clone screening', startDate: `${startYear}-05-01`, endDate: `${startYear}-05-31`, durationDays: 30, progress: 0, assignee: 'Dr. James Park', phase: 'CLD', color: '#1e3a5f', sortOrder: 3, createdBy: userEmail, updatedBy: userEmail },
    // Stage 2 activities
    { id: uuid(), proposalId, stageId: stageIds[1], name: 'Bioreactor media & feed optimization', startDate: `${startYear}-06-01`, endDate: `${startYear}-07-15`, durationDays: 44, progress: 40, assignee: 'Dr. Michael Torres', phase: 'USP', color: '#3b82f6', sortOrder: 0, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[1], name: 'Downstream capture step development', startDate: `${startYear}-07-01`, endDate: `${startYear}-08-15`, durationDays: 45, progress: 20, assignee: 'Dr. Anna Schmidt', phase: 'DSP', color: '#10b981', sortOrder: 1, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[1], name: 'Polishing & viral clearance development', startDate: `${startYear}-08-01`, endDate: `${startYear}-09-15`, durationDays: 44, progress: 0, assignee: 'Dr. Anna Schmidt', phase: 'DSP', color: '#10b981', sortOrder: 2, createdBy: userEmail, updatedBy: userEmail },
    // Stage 3 activities
    { id: uuid(), proposalId, stageId: stageIds[2], name: 'Identity & purity method development', startDate: `${startYear}-07-01`, endDate: `${startYear}-08-31`, durationDays: 61, progress: 30, assignee: 'Dr. Lisa Chen', phase: 'Analytics', color: '#f59e0b', sortOrder: 0, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[2], name: 'Potency assay development & qualification', startDate: `${startYear}-08-01`, endDate: `${startYear}-09-30`, durationDays: 60, progress: 0, assignee: 'Dr. Lisa Chen', phase: 'Analytics', color: '#f59e0b', sortOrder: 1, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[2], name: 'Stability study initiation', startDate: `${startYear}-09-01`, endDate: `${startYear}-10-31`, durationDays: 60, progress: 0, assignee: 'Dr. Raj Patel', phase: 'Analytics', color: '#f59e0b', sortOrder: 2, createdBy: userEmail, updatedBy: userEmail },
    // Stage 4 activities
    { id: uuid(), proposalId, stageId: stageIds[3], name: 'GMP process transfer & equipment qualification', startDate: `${startYear}-11-01`, endDate: `${startYear}-11-30`, durationDays: 29, progress: 0, assignee: 'Dr. David Kim', phase: 'GMP', color: '#8b5cf6', sortOrder: 0, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[3], name: 'Engineering batch (non-GMP)', startDate: `${startYear}-12-01`, endDate: `${startYear}-12-31`, durationDays: 30, progress: 0, assignee: 'Dr. David Kim', phase: 'GMP', color: '#8b5cf6', sortOrder: 1, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[3], name: 'GMP production batch #1', startDate: `${startYear + 1}-01-01`, endDate: `${startYear + 1}-01-31`, durationDays: 30, progress: 0, assignee: 'Dr. David Kim', phase: 'GMP', color: '#8b5cf6', sortOrder: 2, createdBy: userEmail, updatedBy: userEmail },
    { id: uuid(), proposalId, stageId: stageIds[3], name: 'QC release testing & batch disposition', startDate: `${startYear + 1}-02-01`, endDate: `${startYear + 1}-02-28`, durationDays: 27, progress: 0, assignee: 'Dr. Lisa Chen', phase: 'QC', color: '#ef4444', sortOrder: 3, createdBy: userEmail, updatedBy: userEmail },
  ];

  return { stages, activities };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function getComments(proposalId: string, proposalStage: number): Partial<CommentEntity>[] {
  if (proposalStage < 2) return [];
  return [
    {
      id: uuid(), proposalId, sectionKey: 'executive-summary',
      userName: 'Dr. Sarah Johnson', userEmail: 'sarah.johnson@aragon.com', userRole: 'proposal-manager',
      content: 'Please ensure the executive summary highlights our experience with the specific molecule class. The client has asked about prior analogous programs.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: uuid(), proposalId, sectionKey: 'scope-of-work',
      userName: 'Dr. James Park', userEmail: 'james.park@aragon.com', userRole: 'qa-qc',
      content: 'The viral clearance studies scope needs to be clarified — are we including virus spiking studies in this package or only design space?',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: uuid(), proposalId, sectionKey: 'scope-of-work',
      userName: 'Dr. Sarah Johnson', userEmail: 'sarah.johnson@aragon.com', userRole: 'proposal-manager',
      content: 'Confirmed with BD — virus spiking studies are included. Please update section 4.2 accordingly.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];
}

// ─── Audit log entries ─────────────────────────────────────────────────────────

function getAuditLogs(
  proposalId: string,
  proposal: SeedProposal,
): Partial<AuditLogEntity>[] {
  const logs: Partial<AuditLogEntity>[] = [];
  const pm = proposal.proposalManager;
  const pmName = pm.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const created = proposal.createdAt;

  logs.push({
    id: uuid(), proposalId,
    userEmail: pm, userName: pmName,
    action: 'created',
    details: `Proposal ${proposal.proposalCode} created`,
    changes: null as unknown as object,
    snapshot: { proposalCode: proposal.proposalCode, status: 'Draft', stage: 1 } as object,
    timestamp: created,
  });

  if (proposal.currentStage >= 2) {
    logs.push({
      id: uuid(), proposalId,
      userEmail: pm, userName: pmName,
      action: 'stage_advanced',
      details: 'Stage advanced from Draft Creation to Technical Review',
      changes: { from: 1, to: 2 } as object,
      snapshot: null as unknown as object,
      timestamp: new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  if (proposal.currentStage >= 3) {
    logs.push({
      id: uuid(), proposalId,
      userEmail: pm, userName: pmName,
      action: 'stage_advanced',
      details: 'Stage advanced from Technical Review to PM Review',
      changes: { from: 2, to: 3 } as object,
      snapshot: null as unknown as object,
      timestamp: new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000),
    });
  }

  if (proposal.pmReviewComplete) {
    logs.push({
      id: uuid(), proposalId,
      userEmail: pm, userName: pmName,
      action: 'pm_review_complete',
      details: 'PM Review marked as complete',
      changes: { pmReviewComplete: true } as object,
      snapshot: null as unknown as object,
      timestamp: new Date(created.getTime() + 21 * 24 * 60 * 60 * 1000),
    });
  }

  if (proposal.managementReviewComplete) {
    logs.push({
      id: uuid(), proposalId,
      userEmail: 'management@aragon.com', userName: 'Management Team',
      action: 'management_review_complete',
      details: 'Management Review marked as complete',
      changes: { managementReviewComplete: true } as object,
      snapshot: null as unknown as object,
      timestamp: new Date(created.getTime() + 23 * 24 * 60 * 60 * 1000),
    });
  }

  if (proposal.currentStage >= 5) {
    logs.push({
      id: uuid(), proposalId,
      userEmail: pm, userName: pmName,
      action: 'stage_advanced',
      details: 'Proposal advanced to Client Submission',
      changes: { from: 4, to: 5 } as object,
      snapshot: null as unknown as object,
      timestamp: new Date(created.getTime() + 25 * 24 * 60 * 60 * 1000),
    });

    if (proposal.status === 'Sent') {
      logs.push({
        id: uuid(), proposalId,
        userEmail: pm, userName: pmName,
        action: 'exported',
        details: 'Proposal exported to PDF and sent to client',
        changes: null as unknown as object,
        snapshot: { format: 'pdf', recipient: proposal.client } as object,
        timestamp: new Date(created.getTime() + 26 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return logs;
}

// ─── Main seed function ───────────────────────────────────────────────────────

export async function runSeed(): Promise<void> {
  const templateRepo = AppDataSource.getRepository(TemplateEntity);
  const proposalRepo = AppDataSource.getRepository(ProposalEntity);
  const sectionRepo = AppDataSource.getRepository(ProposalSectionEntity);
  const costRepo = AppDataSource.getRepository(CostItemEntity);
  const stageRepo = AppDataSource.getRepository(ProjectStageEntity);
  const activityRepo = AppDataSource.getRepository(ProjectActivityEntity);
  const commentRepo = AppDataSource.getRepository(CommentEntity);
  const auditRepo = AppDataSource.getRepository(AuditLogEntity);

  // ── Templates — upsert by name so new templates are always added ──
  let templatesAdded = 0;
  for (const tmpl of DEFAULT_TEMPLATES) {
    const existing = await templateRepo.findOne({ where: { name: tmpl.name } });
    if (!existing) {
      const entity = templateRepo.create({
        name: tmpl.name,
        description: tmpl.description,
        businessUnit: tmpl.businessUnit,
        category: tmpl.category,
        isSystem: true,
        createdBy: 'system',
      });
      entity.sections = tmpl.sections;
      await templateRepo.save(entity);
      templatesAdded++;
    }
  }
  if (templatesAdded > 0) console.log(`[Seed] ${templatesAdded} new templates added`);

  // ── Proposals ──
  const existingProposalCount = await proposalRepo.count();
  if (existingProposalCount > 0) {
    console.log('[Seed] Proposals already seeded — skipping');
    return;
  }

  const DEFAULT_SECTIONS = [
    { sectionKey: 'ceo-letter', title: 'CEO Letter', sortOrder: 0 },
    { sectionKey: 'executive-summary', title: 'Executive Summary', sortOrder: 1 },
    { sectionKey: 'scope-of-work', title: 'Scope of Work', sortOrder: 2 },
    { sectionKey: 'project-details', title: 'Project Details', sortOrder: 3 },
    { sectionKey: 'terms-conditions', title: 'Terms & Conditions', sortOrder: 4 },
  ];

  for (const p of PROPOSALS) {
    // Create proposal
    const proposal = proposalRepo.create({
      id: p.id,
      name: p.name,
      client: p.client,
      bdManager: p.bdManager,
      proposalManager: p.proposalManager,
      proposalCode: p.proposalCode,
      businessUnit: p.businessUnit,
      templateType: p.templateType,
      description: p.description,
      method: p.method,
      status: p.status,
      currentStage: p.currentStage,
      completionPercentage: p.completionPercentage,
      pmReviewComplete: p.pmReviewComplete,
      managementReviewComplete: p.managementReviewComplete,
      isAmendment: p.isAmendment,
      sfdcOpportunityCode: p.sfdcOpportunityCode,
      createdBy: p.createdBy,
      updatedBy: p.updatedBy,
      createdAt: p.createdAt,
    });
    proposal.assignedStakeholders = p.assignedStakeholders;
    await proposalRepo.save(proposal);

    // Create sections (mark complete for advanced proposals)
    const sectionsCompleted = p.currentStage >= 2 || p.completionPercentage >= 60;
    for (const s of DEFAULT_SECTIONS) {
      const content = getSectionContent(p, s.sectionKey);
      const section = sectionRepo.create({
        id: uuid(),
        proposalId: p.id,
        sectionKey: s.sectionKey,
        title: s.title,
        sortOrder: s.sortOrder,
        isComplete: sectionsCompleted,
        isLocked: p.currentStage >= 5,
        createdBy: p.createdBy,
        updatedBy: p.updatedBy,
      });
      section.content = content;
      await sectionRepo.save(section);
    }

    // Create cost items
    const costItems = getCostItems(p.id, p.proposalCode, p.createdBy);
    for (const cost of costItems) {
      await costRepo.save(costRepo.create(cost as CostItemEntity));
    }

    // Create timeline
    const { stages, activities } = getTimeline(p.id, p.createdBy, p.createdAt.getFullYear());
    for (const stage of stages) {
      await stageRepo.save(stageRepo.create(stage as ProjectStageEntity));
    }
    for (const activity of activities) {
      await activityRepo.save(activityRepo.create(activity as ProjectActivityEntity));
    }

    // Create comments
    const comments = getComments(p.id, p.currentStage);
    for (const comment of comments) {
      await commentRepo.save(commentRepo.create(comment as CommentEntity));
    }

    // Create audit logs
    const auditLogs = getAuditLogs(p.id, p);
    for (const log of auditLogs) {
      await auditRepo.save(auditRepo.create(log as AuditLogEntity));
    }
  }

  console.log(`[Seed] ${PROPOSALS.length} proposals seeded with sections, costs, timelines, comments, and audit logs`);
}

