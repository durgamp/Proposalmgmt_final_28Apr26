import { env } from '../config/env';
import { logger } from '../config/logger';
import { SectionKey } from '@biopropose/shared-types';
import type { AiDraftDto } from '../validators/cost.validators';
import type { IAiProvider, AiDraftResult, AiHealthResult } from './providers/ai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { ClaudeProvider } from './providers/claude.provider';
import {
  getHistoricalExamples,
  type HistoricalExample,
  type HistoricalContextResult,
} from './historicalContext.service';
import { dal } from '../clients/dal.client';
import { tipTapToText } from './vectorSync.service';

// ── Template domain knowledge ──────────────────────────────────────────────────
// Maps templateType string → scientific domain context for system prompt

interface TemplateDomain {
  shortLabel:  string;  // used in headings
  domain:      string;  // scientific expertise paragraph
  regulations: string;  // key regulatory references
}

const TEMPLATE_DOMAINS: Record<string, TemplateDomain> = {
  'Analytical Services': {
    shortLabel:  'Analytical Services',
    domain:      'analytical chemistry, bioanalytical method development and validation, LC-MS/MS, HPLC, NMR, spectroscopy, genotoxic impurity analysis, forced degradation, reference standard characterisation, and ICH Q2(R1)/Q2(R2) guidelines',
    regulations: 'ICH Q2(R1), ICH Q2(R2), ICH M7, ICH Q3A/Q3B/Q3C, ICH Q6A, USP <621>, USP <1225>, FDA Bioanalytical Method Validation Guidance',
  },
  'Analytics': {
    shortLabel:  'Analytical Services',
    domain:      'analytical chemistry, bioanalytical method development and validation, LC-MS/MS, structural characterisation, in-process analytics, and regulatory-ready analytical packages',
    regulations: 'ICH Q2(R1), ICH Q6A/Q6B, USP <1225>, FDA Bioanalytical Guidance',
  },
  'Biologics Drug Substance (DS)': {
    shortLabel:  'Drug Substance (DS) Manufacturing',
    domain:      'upstream bioprocessing (cell culture, fed-batch fermentation, perfusion), downstream purification (chromatography, UF/DF, virus clearance), GMP manufacturing, process characterisation, scale-up, and regulatory filing (BLA/MAA CMC sections)',
    regulations: 'ICH Q5A, ICH Q5B, ICH Q5C, ICH Q5D, ICH Q6B, ICH Q7, ICH Q8–Q11, FDA 21 CFR Part 600–610, EMA guidelines on biological medicinal products',
  },
  'Biologics Drug Product (DP)': {
    shortLabel:  'Drug Product (DP) Formulation & Fill-Finish',
    domain:      'parenteral formulation development (buffers, stabilisers, surfactants, tonicity agents), lyophilisation cycle development, fill-finish GMP manufacturing, container closure integrity, extractables/leachables, and ICH Q8/Q9/Q10 quality by design',
    regulations: 'ICH Q8(R2), ICH Q9, ICH Q10, ICH Q1A–Q1F stability, ICH Q6B, USP <1> Injections, USP <661>, USP <1207> CCIT, FDA CGMP 21 CFR Part 211/600',
  },
  'Bio Similar Entity - Mono Clonal Antibody': {
    shortLabel:  'Biosimilar mAb Development',
    domain:      'biosimilar development strategy, reference product characterisation, analytical similarity assessment (CQA bridging), cell line development, process development, clinical comparability, and regulatory biosimilar pathway (351(k), EMA Article 10(4))',
    regulations: 'ICH Q5E, FDA 351(k) Guidance, EMA Biosimilar Guidelines, ICH Q6B, WHO Biosimilar Guidelines',
  },
  'Bio Similar Entity - Non Antibody': {
    shortLabel:  'Biosimilar Non-Antibody Development',
    domain:      'biosimilar development for non-antibody proteins (enzymes, cytokines, hormones, growth factors), E. coli or CHO expression, refolding technology, comparability studies, and abbreviated regulatory pathways',
    regulations: 'ICH Q5E, FDA 351(k) Guidance, EMA Biosimilar Guidelines, ICH Q6B',
  },
  'Biosimilar mAbs': {
    shortLabel:  'Biosimilar mAb Development',
    domain:      'biosimilar mAb development including reference product procurement, physicochemical and functional comparability (glycosylation, charge variants, Fc effector functions, antigen binding), process development, and 351(k) regulatory strategy',
    regulations: 'ICH Q5E, FDA 351(k) Guidance, EMA Biosimilar Guidelines, ICH Q6B, USP <1048>',
  },
  'Cell Line Development (CLD)': {
    shortLabel:  'Cell Line Development',
    domain:      'recombinant CHO cell line development, gene expression vector design, transfection, single-cell cloning (FACS, limited dilution), clone screening (HTPD, fed-batch), selection for titre and product quality, ICH Q5B monoclonality documentation, and cell banking (MCB/WCB)',
    regulations: 'ICH Q5B, ICH Q5D, ICH Q6B, FDA Points to Consider in the Characterisation of Cell Lines, EMA Guideline on cell-based medicinal products',
  },
  'Hybridoma': {
    shortLabel:  'Hybridoma & Monoclonal Antibody Generation',
    domain:      'mouse/rat immunisation strategies (adjuvants, antigen dosing), hybridoma fusion (PEG, electrofusion), HAT selection, ELISA/FACS screening, limiting dilution subcloning, antibody isotyping, small-scale production, and specificity/affinity characterisation',
    regulations: 'OECD Test Guideline 424, ARRIVE Guidelines, IATA institutional animal care standards, ICH Q6B',
  },
  'NBE BiSpecific Antibody': {
    shortLabel:  'Bispecific Antibody Development',
    domain:      'bispecific antibody engineering (IgG-like formats: KiH, DUET, CrossMAb; fragment-based: BiTE, DART, tandem scFv), dual-target binding characterisation, forced heterodimer purification, CMC challenges, and clinical translation for oncology/immunology',
    regulations: 'ICH Q6B, FDA Guidance for Industry: Development of Therapeutic Protein Biosimilars, EMA Guidelines, ICH S6/S9 for oncology',
  },
  'NBE Monoclonal Antibody': {
    shortLabel:  'New Biologics Entity — Monoclonal Antibody',
    domain:      'IND-enabling development for novel mAbs: cell line development, process development, analytical development (CQAs, potency assays, ELISA, SPR, cell-based bioassays), preclinical GMP batch manufacturing, drug product formulation, and CMC IND filing',
    regulations: 'ICH Q6B, ICH M3(R2), ICH S6, ICH Q1A–Q1F, FDA IND Guidance, EMA IND equivalents, 21 CFR Part 312',
  },
  'NBE Non-Antibody': {
    shortLabel:  'New Biologics Entity — Non-Antibody Protein',
    domain:      'development of novel recombinant proteins, peptides, and enzymes: expression system selection (E. coli, yeast, CHO, HEK293), inclusion body refolding, fermentation optimisation, downstream purification, analytical characterisation, and IND CMC package',
    regulations: 'ICH Q6B, ICH M3(R2), ICH S6, FDA IND Guidance, 21 CFR Part 312',
  },
  'Technology Transfer': {
    shortLabel:  'Technology Transfer',
    domain:      'process technology transfer (site-to-site, scale-up, scale-down), comparability protocols (ICH Q5E), analytical method transfer (ICH Q2), manufacturing process description documentation, training plans, engineering/PPQ batch strategies, and regulatory variation filings',
    regulations: 'ICH Q5E, ICH Q10, ICH Q2(R1), FDA Tech Transfer Guidance, EMA Process Validation Guideline',
  },
  'Transient Expression': {
    shortLabel:  'Transient Expression',
    domain:      'large-scale transient transfection in HEK293-F or ExpiCHO suspension cells, PEI-mediated or Lipofectamine transfection optimisation, fed-batch expression, Protein A capture, rapid multi-construct screening, and protein QC panel (SDS-PAGE, SEC, endotoxin, activity)',
    regulations: 'ICH Q6B, USP <85> (LAL endotoxin), ICH Q5D for cell line qualification',
  },
};

// ── Per-section structural guidance ───────────────────────────────────────────

const SECTION_GUIDANCE: Record<string, string> = {
  [SectionKey.CEO_LETTER]: `
Structure this as a formal executive letter with:
- Salutation addressing the client's named contact/decision-maker
- Opening paragraph: express enthusiasm, name the specific project/programme
- Second paragraph: cite the organisation's specific relevant credentials, platform technologies, or past success with similar programmes
- Third paragraph: commitment to quality, timeline, and the project team lead
- Closing: professional sign-off from CEO/Managing Director
Tone: authoritative yet collaborative. Length: 3–4 short paragraphs. No bullet lists.`,

  [SectionKey.EXECUTIVE_SUMMARY]: `
Structure this as a concise, high-impact summary with:
- Brief programme description (1 paragraph): what is being proposed, for whom, and why
- Programme Objectives: 4–6 bullet points with specific, measurable outcomes
- Key Highlights / Differentiators: 3–4 bullets on why this organisation is best suited
- Timeline & Investment: one paragraph with total duration, key milestones, and headline cost
Tone: confident and results-oriented. This is the first section a client reads — every sentence must earn its place.`,

  [SectionKey.SCOPE_OF_WORK]: `
Structure this as a phased, numbered scope with:
- Phase headings (Phase 1 — Title (Weeks/Months X–Y)) for each major block of work
- Numbered deliverables within each phase — specific, measurable, and unambiguous
- A clear Exclusions paragraph listing what is NOT included
- A Key Assumptions paragraph (client-supplied materials, timelines, access)
Use ordered lists for deliverables. Be precise about quantities, analytical methods, and acceptance criteria.`,

  [SectionKey.PROJECT_DETAILS]: `
Structure this as a detailed technical narrative with:
- Technical Approach / Methodology: the scientific rationale and platform description
- Key sub-sections relevant to the template type (e.g., Instrumentation, Facility, Platform Performance, CQA Strategy, Process Parameters)
- Quantitative performance data where applicable (titres, purity, recovery %, timelines)
- Team / Facility credentials: relevant certifications, regulatory inspection history
- Quality Controls: in-process controls, release testing, documentation
Use a mix of narrative paragraphs and bullet lists. Include specific scientific terminology.`,

  [SectionKey.TERMS_CONDITIONS]: `
Structure as numbered terms sections:
1. Payment Schedule (milestones or % at stages)
2. Deliverables & Acceptance Criteria
3. Change Order Process
4. IP Ownership & Licensing
5. Confidentiality
6. Liability Cap & Indemnification
7. Force Majeure
8. Governing Law
9. Termination
Use clear, unambiguous commercial language. Include specific percentages, day counts, and cap amounts.`,

  [SectionKey.AMENDMENT_DETAILS]: `
Structure as:
- Reason for Amendment: factual description of the change trigger
- Changes from Original Proposal: side-by-side or bullet description (original vs revised) for scope, timeline, and cost
- Revised Programme Summary: updated milestones and deliverables
- Financial Impact: original total, change amount (+ or –), revised total
- Approval Requirements: sign-off process and effective date`,
};

// ── Stateful proposal context: sibling sections ───────────────────────────────
// Fetches already-drafted sections of the same proposal so the LLM can maintain
// consistent voice, client references, and technical assumptions.

const MIN_SIBLING_TEXT = 30;
const SIBLING_PREVIEW  = 500;

async function fetchSiblingContextBlock(
  proposalId: string,
  currentSectionKey: string,
): Promise<string> {
  try {
    const sections = await dal.getSections(proposalId);
    const withContent = sections
      .filter((s) => {
        if (s.sectionKey === currentSectionKey) return false;
        const text = tipTapToText(s.content as unknown).trim();
        return text.length >= MIN_SIBLING_TEXT;
      })
      .sort((a, b) => ((a.sortOrder ?? 0) - (b.sortOrder ?? 0)));

    if (withContent.length === 0) return '';

    const body = withContent
      .map((s) => {
        const text = tipTapToText(s.content as unknown).trim();
        const preview = text.slice(0, SIBLING_PREVIEW);
        return `[${s.title}]\n${preview}${text.length > SIBLING_PREVIEW ? ' …' : ''}`;
      })
      .join('\n\n');

    return `
══════════════════════════════════════════════════════════════
CURRENT PROPOSAL — ALREADY DRAFTED SECTIONS (for consistency)
Maintain consistent voice, tone, client references, and technical assumptions across the whole proposal.
══════════════════════════════════════════════════════════════

${body}

══════════════════════════════════════════════════════════════
END OF SIBLING SECTIONS
══════════════════════════════════════════════════════════════
`;
  } catch (err) {
    logger.warn({ err }, '[AI] fetchSiblingContextBlock failed — continuing without sibling context');
    return '';
  }
}

// ── Stateful template context: structural definition ─────────────────────────
// Fetches the template used by this proposal so the LLM knows the expected
// section structure and overall template intent.

async function fetchTemplateContextBlock(templateType: string): Promise<string> {
  try {
    const templates = await dal.listTemplates();
    const match = templates.find(
      (t) => t.category === templateType || t.name === templateType,
    );
    if (!match) return '';

    const sections = (match.sections as Array<{ sectionKey: string; title: string; sortOrder?: number }>) ?? [];

    const sectionList = sections
      .slice()
      .sort((a, b) => ((a.sortOrder ?? 0) - (b.sortOrder ?? 0)))
      .map((s, i) => `  ${i + 1}. ${s.title}`)
      .join('\n');

    const descLine = match.description ? `\nTemplate Description: ${match.description}` : '';

    return `\n── TEMPLATE: ${match.name} (${match.businessUnit})${descLine}\nSections in this template:\n${sectionList}\n`;
  } catch (err) {
    logger.warn({ err }, '[AI] fetchTemplateContextBlock failed — continuing without template context');
    return '';
  }
}

// ── System message builder ─────────────────────────────────────────────────────

function buildSystemMessage(dto: AiDraftDto): string {
  const templateType = dto.proposalContext.templateType ?? 'Biologics';
  const domain       = TEMPLATE_DOMAINS[templateType];
  const sectionTitle = SECTION_GUIDANCE[dto.sectionKey] ? dto.sectionKey.replace(/-/g, ' ') : dto.sectionKey;

  const domainText = domain
    ? `You have deep subject matter expertise in ${domain.domain}. You are well-versed in ${domain.regulations}.`
    : 'You have deep expertise in biologics drug development, GMP manufacturing, and regulatory affairs (ICH, FDA, EMA).';

  return `You are a senior scientific writer and subject matter expert in biologics contract research and manufacturing (CRO/CDMO), specialising in ${domain?.shortLabel ?? templateType} proposals.

${domainText}

Your role is to draft the "${sectionTitle}" section of a ${templateType} proposal. When writing:

1. STRUCTURE & FORMAT: Mirror the structure, heading hierarchy, depth, and professional tone demonstrated in the reference examples. If examples use ordered lists for deliverables, use ordered lists. If they use sub-headings, use sub-headings. The reader should not be able to distinguish your output from a human expert's work.

2. SCIENTIFIC ACCURACY: Apply your scientific knowledge to generate accurate, specific, and credible content. Use precise terminology, cite relevant regulatory guidelines, include plausible quantitative data (titres, purity ranges, timelines, acceptance criteria), and reflect current industry best practices.

3. CLIENT-SPECIFICITY: Tailor content to the specific client, project, and scientific context provided. Do not produce generic boilerplate — every paragraph should feel written for this particular proposal.

4. DO NOT copy examples verbatim. Synthesise their structure and style, then write original content for the current proposal.

5. OUTPUT FORMAT: Output only the section content — no preamble ("Here is the draft:"), no meta-commentary, no markdown code fences. Use professional proposal formatting (headings, sub-headings, bullet/numbered lists where appropriate).`;
}

// ── User message builder ───────────────────────────────────────────────────────

function buildExamplesBlock(examples: HistoricalExample[]): string {
  if (examples.length === 0) return '';

  const formatted = examples
    .map((ex, i) => {
      const header = [
        `[Reference Example ${i + 1}]`,
        `Proposal: ${ex.proposalName}`,
        `Client: ${ex.client}`,
        `Business Unit: ${ex.businessUnit}`,
      ].join(' | ');
      return `${header}\n${ex.content}`;
    })
    .join('\n\n' + '─'.repeat(60) + '\n\n');

  return `
══════════════════════════════════════════════════════════════
REFERENCE EXAMPLES — ${examples.length} actual section${examples.length !== 1 ? 's' : ''} from past ${examples[0]?.templateType ?? ''} proposals
Study their structure, language, level of technical detail, heading style, and use of lists/tables.
Do NOT copy text verbatim — use as a structural and stylistic template only.
══════════════════════════════════════════════════════════════

${formatted}

══════════════════════════════════════════════════════════════
END OF REFERENCE EXAMPLES — now write the section below
══════════════════════════════════════════════════════════════
`;
}

function buildUserMessage(
  dto: AiDraftDto,
  historical: HistoricalContextResult,
  siblingBlock: string,
  templateBlock: string,
): string {
  const templateType = dto.proposalContext.templateType ?? 'Biologics';
  const sectionGuidance = SECTION_GUIDANCE[dto.sectionKey] ?? `Write the "${dto.sectionKey}" section for this ${templateType} proposal.`;

  const contextBlock = [
    '── CURRENT PROPOSAL CONTEXT ──',
    `Proposal Name:  ${dto.proposalContext.name}`,
    `Client:         ${dto.proposalContext.client}`,
    `Business Unit:  ${dto.proposalContext.businessUnit ?? 'Not specified'}`,
    `Template Type:  ${templateType}`,
    `Description:    ${dto.proposalContext.description ?? 'Not provided'}`,
  ].join('\n');

  const examplesBlock    = buildExamplesBlock(historical.examples);
  const existingBlock    = dto.existingContent
    ? `\n── EXISTING CONTENT TO IMPROVE ──\n${dto.existingContent}\n\nImprove the above — enhance scientific accuracy, match the reference style, and expand where thin.\n`
    : '';
  const instructionBlock = dto.userInstruction
    ? `\n── SPECIFIC INSTRUCTIONS FROM THE USER ──\n${dto.userInstruction}\n`
    : '';

  return `${contextBlock}${templateBlock}${siblingBlock}
${examplesBlock}${existingBlock}${instructionBlock}
── TASK ──
Write the section following this structural guidance:
${sectionGuidance}`;
}

// ── Provider factory ──────────────────────────────────────────────────────────

function createProvider(): IAiProvider {
  if (env.AI_PROVIDER === 'claude') {
    logger.info('[AI] Using Claude (Anthropic API) provider');
    return new ClaudeProvider();
  }
  logger.info('[AI] Using Ollama (local LLM) provider');
  return new OllamaProvider();
}

// ── AiService ─────────────────────────────────────────────────────────────────

export interface AiDraftResultWithMeta extends AiDraftResult {
  historicalExamplesUsed: number;
  usingEmbeddings:        boolean;
}

export class AiService {
  private readonly provider: IAiProvider;

  constructor() {
    this.provider = createProvider();
  }

  async generateDraft(dto: AiDraftDto): Promise<AiDraftResultWithMeta> {
    logger.info(`[AI] generateDraft — section: ${dto.sectionKey}, template: ${dto.proposalContext.templateType}, provider: ${env.AI_PROVIDER}`);

    const [historical, siblingBlock, templateBlock] = await Promise.all([
      getHistoricalExamples({
        sectionKey:        dto.sectionKey,
        templateType:      dto.proposalContext.templateType,
        businessUnit:      dto.proposalContext.businessUnit,
        excludeProposalId: dto.proposalId,
        topK:              5,
      }),
      dto.proposalId
        ? fetchSiblingContextBlock(dto.proposalId, dto.sectionKey)
        : Promise.resolve(''),
      dto.proposalContext.templateType
        ? fetchTemplateContextBlock(dto.proposalContext.templateType)
        : Promise.resolve(''),
    ]);

    logger.info(
      `[AI] RAG — ${historical.examples.length} examples (templateType filtered), ` +
      `indexed: ${historical.totalIndexed}, semantic: ${historical.usingEmbeddings}, ` +
      `siblings: ${siblingBlock ? 'yes' : 'none'}, template: ${templateBlock ? 'yes' : 'none'}`,
    );

    const system = buildSystemMessage(dto);
    const prompt = buildUserMessage(dto, historical, siblingBlock, templateBlock);
    const result = await this.provider.generateDraft({ ...dto, prompt, system });

    return {
      ...result,
      historicalExamplesUsed: historical.examples.length,
      usingEmbeddings:        historical.usingEmbeddings,
    };
  }

  async streamDraft(
    dto: AiDraftDto,
    onChunk: (text: string) => void,
    onMeta?: (meta: { historicalExamplesUsed: number; usingEmbeddings: boolean }) => void,
  ): Promise<void> {
    logger.info(`[AI] streamDraft — section: ${dto.sectionKey}, template: ${dto.proposalContext.templateType}, provider: ${env.AI_PROVIDER}`);

    const [historical, siblingBlock, templateBlock] = await Promise.all([
      getHistoricalExamples({
        sectionKey:        dto.sectionKey,
        templateType:      dto.proposalContext.templateType,
        businessUnit:      dto.proposalContext.businessUnit,
        excludeProposalId: dto.proposalId,
        topK:              5,
      }),
      dto.proposalId
        ? fetchSiblingContextBlock(dto.proposalId, dto.sectionKey)
        : Promise.resolve(''),
      dto.proposalContext.templateType
        ? fetchTemplateContextBlock(dto.proposalContext.templateType)
        : Promise.resolve(''),
    ]);

    logger.info(
      `[AI] RAG — ${historical.examples.length} examples (templateType filtered), ` +
      `indexed: ${historical.totalIndexed}, semantic: ${historical.usingEmbeddings}, ` +
      `siblings: ${siblingBlock ? 'yes' : 'none'}, template: ${templateBlock ? 'yes' : 'none'}`,
    );

    onMeta?.({
      historicalExamplesUsed: historical.examples.length,
      usingEmbeddings:        historical.usingEmbeddings,
    });

    const system = buildSystemMessage(dto);
    const prompt = buildUserMessage(dto, historical, siblingBlock, templateBlock);
    return this.provider.streamDraft({ ...dto, prompt, system }, onChunk);
  }

  async checkHealth(): Promise<AiHealthResult> {
    return this.provider.checkHealth();
  }
}

export const aiService = new AiService();
