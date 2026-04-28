// ============================================================
// BioPropose Shared Type Definitions
// GxP-aligned: all entities include audit fields
// ============================================================

// ---- Enums ----

export enum ProposalStatus {
  DRAFT = 'Draft',
  REVIEW = 'Review',
  APPROVED = 'Approved',
  SENT = 'Sent',
  CLOSED = 'Closed',
}

export enum ProposalStage {
  DRAFT_CREATION = 1,
  TECHNICAL_REVIEW = 2,
  PM_REVIEW = 3,
  MANAGEMENT_REVIEW = 4,
  CLIENT_SUBMISSION = 5,
}

export enum ProposalMethod {
  TEMPLATE = 'template',
  CLONE = 'clone',
  SCRATCH = 'scratch',
  AMENDMENT = 'amendment',
}

export enum SectionKey {
  CEO_LETTER = 'ceo-letter',
  EXECUTIVE_SUMMARY = 'executive-summary',
  SCOPE_OF_WORK = 'scope-of-work',
  FLOWCHART = 'flowchart',
  PROJECT_DETAILS = 'project-details',
  TERMS_CONDITIONS = 'terms-conditions',
  AMENDMENT_DETAILS = 'amendment-details',
}

export enum CostCategory {
  SERVICE = 'Service',
  MATERIAL = 'Material',
  OUTSOURCING = 'Outsourcing',
}

export enum ExportFormat {
  PDF = 'pdf',
  WORD = 'word',
}

export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  STAGE_ADVANCED = 'stage_advanced',
  SECTION_COMPLETED = 'section_completed',
  SECTION_LOCKED = 'section_locked',
  SECTION_UNLOCKED = 'section_unlocked',
  COMMENTED = 'commented',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',
  EXPORTED = 'exported',
  DELETED = 'deleted',
  AMENDED = 'amended',
  REOPENED = 'reopened',
  CLONED = 'cloned',
  REVISED = 'revised',
  PM_REVIEW_COMPLETE = 'pm_review_complete',
  MANAGEMENT_REVIEW_COMPLETE = 'management_review_complete',
  COST_UPDATED = 'cost_updated',
  TIMELINE_UPDATED = 'timeline_updated',
  AI_DRAFT_GENERATED = 'ai_draft_generated',
}

export enum UserRole {
  PROPOSAL_MANAGER = 'proposal-manager',
  QA_QC = 'qa-qc',
  MANUFACTURING = 'manufacturing',
  REGULATORY = 'regulatory',
  BD = 'bd',
  MANAGEMENT = 'management',
  STAKEHOLDER = 'stakeholder',
}

// ---- Base ----

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// ---- User ----

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUser {
  name: string;
  email: string;
  role: UserRole;
}

// ---- Template ----

export interface TemplateSection {
  sectionKey: SectionKey;
  title: string;
  defaultContent: object;
  sortOrder: number;
}

export interface Template {
  id: string;
  name: string;
  businessUnit: string;
  category: string;
  description?: string;
  sections: TemplateSection[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Proposal ----

export interface Proposal extends AuditFields {
  id: string;
  name: string;
  client: string;
  bdManager: string;
  proposalManager?: string;
  proposalCode: string;
  status: ProposalStatus;
  method: ProposalMethod;
  businessUnit?: string;
  templateType?: string;
  description?: string;
  currentStage: ProposalStage;
  completionPercentage: number;
  sfdcOpportunityCode?: string;
  pmReviewComplete: boolean;
  managementReviewComplete: boolean;
  isAmendment: boolean;
  parentProposalId?: string;
  parentProposalCode?: string;
  revisionNumber?: number;
  amendmentDate?: string;
  assignedStakeholders: string[];
}

export interface ProposalListItem {
  id: string;
  name: string;
  client: string;
  proposalCode: string;
  status: ProposalStatus;
  currentStage: ProposalStage;
  completionPercentage: number;
  bdManager: string;
  proposalManager?: string;
  createdAt: string;
  updatedAt: string;
  isAmendment: boolean;
  parentProposalCode?: string;
  revisionNumber?: number;
  assignedStakeholders: string[];
  businessUnit?: string;
  templateType?: string;
}

// ---- Section ----

export interface ProposalSection extends AuditFields {
  id: string;
  proposalId: string;
  sectionKey: SectionKey;
  title: string;
  content: object;
  isComplete: boolean;
  isLocked: boolean;
  completedBy?: string;
  completedAt?: string;
  lockedBy?: string;
  sortOrder: number;
}

// ---- Cost ----

export interface CostItem extends AuditFields {
  id: string;
  proposalId: string;
  category: CostCategory;
  description: string;
  quantity: number;
  serviceRate: number;
  materialRate: number;
  outsourcingRate: number;
  totalCost: number;
  stage: string;
  isBinding: boolean;
  isFixedRate: boolean;
  sortOrder: number;
}

export interface CostSummary {
  stage: string;
  serviceCost: number;
  materialCost: number;
  outsourcingCost: number;
  totalCost: number;
}

export interface CostTotals {
  byStage: CostSummary[];
  grandTotal: number;
  serviceTotal: number;
  materialTotal: number;
  outsourcingTotal: number;
}

// ---- Timeline ----

export interface ProjectStage extends AuditFields {
  id: string;
  proposalId: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  sortOrder: number;
  activities: ProjectActivity[];
}

export interface ProjectActivity extends AuditFields {
  id: string;
  proposalId: string;
  stageId?: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  progress: number;
  assignee: string;
  phase: string;
  color: string;
  sortOrder: number;
  dependencies: string[];
}

// ---- Comments ----

export interface Comment extends AuditFields {
  id: string;
  proposalId: string;
  sectionKey?: SectionKey;
  userName: string;
  userEmail: string;
  userRole: string;
  content: string;
}

// ---- Audit ----

export interface AuditLog {
  id: string;
  proposalId?: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  details: string;
  changes?: object;
  snapshot?: object;
  timestamp: string;
}

// ---- Export ----

export interface ExportedFile {
  id: string;
  proposalId: string;
  filename: string;
  format: ExportFormat;
  fileUrl?: string;
  fileSize?: string;
  exportedBy: string;
  exportedAt: string;
}

// ---- Analytics ----

export interface AnalyticsMetrics {
  totalProposals: number;
  activeProposals: number;
  completedProposals: number;
  avgTurnaroundDays: number;
  avgDraftEfficiencyDays: number;
  templatePercentage: number;
  clonePercentage: number;
  scratchPercentage: number;
  amendmentCount: number;
  byStage: Record<ProposalStage, number>;
  byStatus: Record<ProposalStatus, number>;
}

// ---- API Shapes ----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ---- Wizard / Form ----

export interface CreateProposalDto {
  name: string;
  client: string;
  bdManager: string;
  proposalManager?: string;
  proposalCode: string;
  method: ProposalMethod;
  templateId?: string;
  sourceProposalId?: string;
  businessUnit?: string;
  templateType?: string;
  description?: string;
  sfdcOpportunityCode?: string;
  assignedStakeholders: string[];
  createdBy: string;
}

export interface UpdateProposalDto {
  name?: string;
  client?: string;
  bdManager?: string;
  proposalCode?: string;
  description?: string;
  sfdcOpportunityCode?: string;
  assignedStakeholders?: string[];
  updatedBy: string;
}

export interface AdvanceStageDto {
  targetStage: ProposalStage;
  reviewType?: 'pm' | 'management';
  updatedBy: string;
}

export interface UpdateSectionDto {
  content?: object;
  isComplete?: boolean;
  isLocked?: boolean;
  updatedBy: string;
}

export interface CreateCommentDto {
  sectionKey?: SectionKey;
  content: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

export interface AmendmentDto {
  name: string;
  proposalCode: string;
  client: string;
  bdManager: string;
  proposalManager?: string;
  description?: string;
  sfdcOpportunityCode?: string;
  assignedStakeholders: string[];
  createdBy: string;
}

export interface ReopenDto {
  mode: 'clone' | 'revise' | 'new';
  name: string;
  proposalCode: string;
  client: string;
  bdManager: string;
  description?: string;
  sfdcOpportunityCode?: string;
  assignedStakeholders: string[];
  updatedBy: string;
}

export interface ExportDto {
  format: ExportFormat;
  exportedBy: string;
}

export interface AiDraftDto {
  sectionKey: SectionKey;
  proposalContext: {
    name: string;
    client: string;
    description?: string;
    templateType?: string;
    businessUnit?: string;
  };
  existingContent?: string;
  userInstruction?: string;
  userName: string;
}

// ---- Stage Validation ----

export interface StageValidationResult {
  allowed: boolean;
  reason?: string;
  missingSections?: string[];
}
