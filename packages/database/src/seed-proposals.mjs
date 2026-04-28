/**
 * Proposal seed script — creates 1 rich proposal per template via the API.
 * Run: node packages/database/src/seed-proposals.mjs
 */

const API = 'http://localhost:4000/api';

// ── TipTap helpers ────────────────────────────────────────────────────────────
const doc  = (...content) => ({ type: 'doc', content });
const p    = (...text)    => ({ type: 'paragraph', content: text.map(t => typeof t === 'string' ? { type: 'text', text: t } : t) });
const bold = (text)       => ({ type: 'text', text, marks: [{ type: 'bold' }] });
const h2   = (text)       => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
const h3   = (text)       => ({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] });
const ul   = (...items)   => ({ type: 'bulletList', content: items.map(i => ({ type: 'listItem', content: [p(i)] })) });
const ol   = (...items)   => ({ type: 'orderedList', content: items.map(i => ({ type: 'listItem', content: [p(i)] })) });

// ── Section content builders per template ────────────────────────────────────

const CONTENT = {

  // ── 1. Analytical Services ─────────────────────────────────────────────────
  'analytical-services': {
    'ceo-letter': doc(
      p('Dear Dr. Ramesh Patel,'),
      p('On behalf of Aragon Research, I am pleased to present our proposal for the Genotoxic Impurity Method Development and Validation program for Cipla\'s API manufacturing pipeline. Our analytical services division has over a decade of experience supporting ICH M7 and ICH Q3A/Q3B compliance across small molecule and biologics portfolios.'),
      p('Our USFDA-inspected analytical laboratories are equipped with state-of-the-art LC-MS/MS platforms, including Waters TQ-XS and Agilent 6470 systems, specifically qualified for trace-level genotoxic impurity quantitation at the threshold of toxicological concern (TTC) level.'),
      p('Ms. Ananya Krishnan, our Analytical Project Lead, will personally oversee this engagement and ensure seamless communication with your regulatory and QC teams throughout the program.'),
      p('We are confident this collaboration will deliver the robust, regulatory-ready analytical package your pipeline requires. We look forward to a productive partnership.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes a comprehensive ICH M7-aligned genotoxic impurity (GTI) method development and validation program for three API intermediates in Cipla Ltd\'s manufacturing pipeline. The program addresses the regulatory requirement to control potentially mutagenic impurities at or below the threshold of toxicological concern (TTC = 1.5 µg/day).'),
      h3('Programme Objectives'),
      ul(
        'Develop sensitive LC-MS/MS methods for 12 specified potential mutagenic impurities (PMIs)',
        'Achieve LOQ ≤ 0.5 ppm in final API matrix for all target analytes',
        'Validate methods per ICH Q2(R1): specificity, linearity, range, LOD/LOQ, accuracy, precision, robustness',
        'Deliver ICH Q2(R2)-aligned validation report suitable for regulatory submission',
        'Transfer validated methods to Cipla QC laboratories',
      ),
      h3('Timeline & Investment'),
      p('The programme is designed for completion in 20 weeks from contract execution. Total investment is USD 285,000 inclusive of method development, validation, and technology transfer activities.'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Phase 1 — Method Development (Weeks 1–8)'),
      ol(
        'Impurity structure review and chromatographic strategy definition for 12 PMIs',
        'LC-MS/MS method scouting: column screening, mobile phase optimisation, MRM transition selection',
        'Matrix extraction development (protein precipitation, SPE) for three API matrices',
        'Sensitivity optimisation to achieve LOQ ≤ 0.5 ppm TTC-level quantitation',
        'Preliminary specificity and interference assessment',
      ),
      h3('Phase 2 — Method Validation (Weeks 9–16)'),
      ol(
        'Full ICH Q2(R1) validation: specificity, linearity (6-point), LOD/LOQ, accuracy (3 levels, n=3), precision (repeatability + intermediate precision), robustness (Youden design)',
        'Forced degradation studies for selectivity confirmation',
        'System suitability criteria definition and verification',
      ),
      h3('Phase 3 — Technology Transfer (Weeks 17–20)'),
      ol(
        'Method transfer protocol preparation',
        'On-site training at Cipla Goa QC laboratory (3 days)',
        'Comparative transfer validation with client laboratory',
        'Transfer report and SOPs delivery',
      ),
      p(bold('Exclusions: '), 'Reference standard procurement, regulatory filing fees, and post-transfer ongoing support are not included in this scope.'),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Technical Approach'),
      p('Aragon will employ reverse-phase UHPLC coupled to triple-quadrupole mass spectrometry (LC-MS/MS) operating in MRM mode for all PMI quantitation. Method selectivity will be demonstrated via authentic impurity standards where available, and structural analogues for PMIs lacking commercial standards.'),
      h3('Instrumentation'),
      ul('Waters Acquity UHPLC — Waters TQ-XS (primary)', 'Agilent 1290 — Agilent 6470 (backup)', 'Sciex 6500+ (orthogonal confirmation)'),
      h3('Key Assumptions'),
      ul(
        'Cipla provides API samples (minimum 500 mg per compound) within 2 weeks of project start',
        'Reference standards for all 12 PMIs to be sourced by Cipla or specified vendors',
        'Cipla QC laboratory holds appropriate LC-MS/MS instrumentation for technology transfer',
        'Any changes to the impurity list after method development initiation will be handled as a change order',
      ),
      h3('Quality & Regulatory'),
      p('All analytical work will be performed under Aragon\'s ISO 17025:2017 accredited quality management system. Raw data will be recorded in Empower 3 CDS. A fully audited analytical package including raw data, audit trails, and signed validation report will be delivered upon completion.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Payment Schedule'),
      p('30% upon contract signing, 40% at Phase 2 initiation, 30% upon delivery of validation report. Net 30 days from invoice date.'),
      h3('2. Intellectual Property'),
      p('All developed methods and validation data are the exclusive property of Cipla Ltd upon full payment. Aragon retains the right to use non-proprietary analytical approaches in future engagements.'),
      h3('3. Confidentiality'),
      p('Both parties shall maintain confidentiality of all proprietary information for 7 years post-project completion, consistent with ICH E6 GCP standards.'),
      h3('4. Change Control'),
      p('Any changes to the agreed scope (additional analytes, matrices, or methods) will be formalised via a written change order with revised cost and timeline. No out-of-scope work will be initiated without written client approval.'),
      h3('5. Liability'),
      p('Aragon\'s maximum liability under this agreement shall not exceed the total contract value. Consequential damages are excluded by both parties.'),
    ),
  },

  // ── 2. Analytics (Biologics US) ────────────────────────────────────────────
  'analytics': {
    'ceo-letter': doc(
      p('Dear Dr. Stefan Müller,'),
      p('Aragon Research is proud to present this proposal for the extended analytical characterisation of Fresenius Kabi\'s pembrolizumab biosimilar candidate. Our Biologics Analytics division combines deep regulatory expertise with cutting-edge orthogonal characterisation platforms to generate the comparative data packages required by FDA\'s 351(k) biosimilar pathway.'),
      p('Our recent track record includes successful biosimilarity demonstrations for four approved mAb biosimilars, with characterisation packages that sailed through FDA and EMA scientific advice. We understand the evidentiary bar and design our programs accordingly.'),
      p('Dr. Kavitha Rajan, our Head of Biosimilar Analytics, will lead your program. We look forward to this partnership.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes a comprehensive state-of-the-art analytical characterisation program for Fresenius Kabi\'s pembrolizumab (anti-PD-1 mAb) biosimilar candidate, designated FK-Pembro-01. The characterisation package is designed to meet FDA biosimilarity requirements under the 351(k) pathway and EMA\'s similar biological medicinal products (SBMP) guideline.'),
      h3('Key Deliverables'),
      ul(
        'Primary structure confirmation by peptide mapping (LC-MS/MS), intact mass, and reduced mass analysis',
        'Higher-order structure (HOS) profiling: circular dichroism, intrinsic fluorescence, DSC, HDX-MS',
        'Glycan profiling: N-glycan mapping, sialylation, fucosylation (UHPLC-FLD, LC-MS)',
        'Charge variant analysis: cIEF, icIEF, and CEX-HPLC with fraction collection and characterisation',
        'Size-based analysis: SEC-HPLC, AF4-MALS, AUC (sedimentation velocity)',
        'Potency: cell-based ADCC (FcγRIIIa reporter assay), PD-1 binding ELISA, SPR kinetics',
        'Fc-mediated functions: FcγR binding panel (FcγRIa, IIa, IIb, IIIa, IIIb, FcRn)',
        'Comparability report with statistical equivalence analysis',
      ),
      h3('Timeline'),
      p('Programme spans 32 weeks. Deliverables include a comprehensive characterisation report with side-by-side comparability to the reference product (Keytruda®, multiple lots).'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Reference Product Lots'),
      p('Aragon will characterise FK-Pembro-01 DS alongside 3 EU-sourced and 3 US-sourced Keytruda® reference lots. All lots will be tested in the same analytical runs to enable direct side-by-side comparison.'),
      h3('Analytical Modules'),
      ul(
        'Module 1 — Primary Structure: Intact/reduced mass (Orbitrap), peptide mapping (Trypsin/Lys-C), disulfide bond mapping, free thiol quantitation, N-terminal sequencing',
        'Module 2 — HOS: Far-UV CD, near-UV CD, intrinsic Trp fluorescence, differential scanning calorimetry (Tm), HDX-MS (global and local)',
        'Module 3 — Glycosylation: N-glycan UHPLC (2-AB labelling), site-specific glycosylation (glycopeptide MS/MS), monosaccharide composition',
        'Module 4 — Charge Variants: cIEF (iCE3), CEX-HPLC fractionation with mass characterisation of acidic/basic variants',
        'Module 5 — Size & Aggregation: SEC-HPLC (UV+MALS), AF4-MALS, AUC (SV), DLS',
        'Module 6 — Potency: PD-1/PD-L1 blocking ELISA, ADCC reporter assay (Jurkat FcγRIIIa), SPR (Biacore T200): PD-1, FcRn, FcγRIIIa',
        'Module 7 — Fc Functions: FcγR binding (6-receptor ELISA panel), C1q binding, complement-dependent cytotoxicity',
      ),
      p(bold('Out of Scope: '), 'Impurity testing, formulation compatibility, stability studies, and clinical PK/PD modelling.'),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Instrumentation Platform'),
      ul(
        'Thermo Orbitrap Exploris 480 (primary intact/peptide mass)',
        'Waters BioAccord LC-MS (routine peptide mapping)',
        'GE Biacore T200 (SPR kinetics)',
        'Applied Biosystems iCE3 (cIEF)',
        'Wyatt Calypso AF4-MALS',
        'Beckman XL-A analytical ultracentrifuge',
      ),
      h3('Statistical Approach'),
      p('Equivalence testing will be performed using the Quality Range (QR) method, consistent with FDA\'s biosimilar guidance. Z-score analysis and principal component analysis (PCA) of the full attribute matrix will be presented in the comparability report.'),
      h3('Reference Standard Lots'),
      p('Client to provide FK-Pembro-01 DS lots (minimum 3, 50 mg each). Aragon will procure reference lots independently via established pharma procurement channels; procurement costs are included in the budget.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Milestone Payments'),
      p('25% at contract execution, 25% at Module 1–3 report delivery, 25% at Module 4–6 delivery, 25% at final comparability report. Net 30 days.'),
      h3('2. Reference Lot Procurement'),
      p('Aragon will purchase reference product lots; costs are included in the fixed-fee proposal. Any change in lot requirements post-contract will be handled as a change order.'),
      h3('3. Data Ownership'),
      p('All characterisation data, reports, and analytical methods developed specifically for this program are the exclusive property of Fresenius Kabi upon full payment.'),
      h3('4. Regulatory Support'),
      p('Aragon analysts will be available for regulatory agency questions related to the characterisation package for 12 months post-report delivery at no additional charge.'),
    ),
  },

  // ── 3. Bio Similar Entity - Mono Clonal Antibody ──────────────────────────
  'bio-similar-entity-mca': {
    'ceo-letter': doc(
      p('Dear Mr. Dilip Shanghvi,'),
      p('Aragon Research presents this proposal for the end-to-end biosimilar development of adalimumab (reference: Humira®) at our Pune, India biologics facility. With our established biosimilar track record and India-based GMP infrastructure, we offer Sun Pharma Biologics a cost-effective, regulatory-ready development pathway targeting both Indian CDSCO and EMA/FDA approval.'),
      p('Our India facility has completed two successful CDSCO biosimilar submissions and one EU SBMP package in the past three years. The adalimumab program benefits from our proprietary CHO-K1 host cell line (ACT-CHO-01), which has demonstrated superior productivity and low immunogenic host cell protein profiles.'),
      p('Dr. Shivkumar Rao, our VP Biosimilar Development India, will personally lead this engagement. I am confident this partnership will position Sun Pharma Biologics as a leading player in the growing global biosimilar market.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research India proposes a comprehensive biosimilar development program for adalimumab (anti-TNF-α mAb, IgG1), targeting regulatory approval in India (CDSCO), EU, and US markets. The program leverages Aragon\'s ACT-CHO-01 expression platform and Pune GMP facility to deliver a cost-competitive biosimilar with a robust comparability package.'),
      h3('Programme Milestones'),
      ul(
        'M1 (Month 6): Stable cell line selected with titre >3 g/L, MCB established',
        'M2 (Month 14): Phase-appropriate process developed and locked at 200L scale',
        'M3 (Month 20): Pre-clinical comparability package complete (PK/PD, toxicology)',
        'M4 (Month 28): GMP manufacturing of clinical batches (3×200L)',
        'M5 (Month 36): Regulatory filing package complete',
      ),
      h3('Regulatory Strategy'),
      p('The program is designed in alignment with WHO Biosimilar Guidelines, EMA CHMP SAWP, and FDA\'s 351(k) pathway. Aragon will prepare the biosimilar development report (BDR) and coordinate scientific advice meetings with the required agencies.'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Stage 1 — Cell Line Development (Months 1–6)'),
      ul(
        'Gene synthesis (adalimumab HC and LC) and expression vector construction (glutamine synthetase selection system)',
        'Stable transfection of ACT-CHO-01 host cell line',
        'Stable pool generation and productivity ranking',
        'Single-cell cloning via FACS (96-well to 6-well to shake flask)',
        'Clone screening: productivity, glycan profile, product quality attributes vs. reference Humira®',
        'Top 3 clones selected for stability study (60 generations)',
        'MCB establishment (200 vials, -196°C vapour phase LN2)',
      ),
      h3('Stage 2 — Process Development (Months 5–14)'),
      ul(
        'Upstream: fed-batch optimisation (media, feed strategy, pH/DO setpoints) from 3L to 200L',
        'Downstream: 3-column platform process (Protein A capture, CEX polishing, AEX flowthrough), viral filtration, UF/DF',
        'Formulation development: liquid formulation matching Humira® citrate buffer system',
        'Analytics: full CQA panel (charge variants, HMW, HOS, potency ELISA, glycan profile)',
      ),
      h3('Stage 3 — GMP Manufacturing (Months 22–30)'),
      ul(
        'Three GMP clinical batches at 200L scale for clinical and comparability studies',
        'Full QC release testing per registered specifications',
        'Clinical batch records, CoA, and regulatory documentation',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Facility'),
      p('Aragon Pune GMP Facility: CDSCO-approved, EU GMP compliant (EMA inspection 2023). Capacity: 4×200L glass-lined bioreactors, 2×500L stainless steel bioreactors.'),
      h3('CQA Framework'),
      p('Critical Quality Attributes (CQAs) for the adalimumab program include: TNF-α binding potency, Fc effector function (ADCC/CDC), charge variant profile, N-glycan profile (afucosylation control), HMW species, and HOS. Acceptance criteria will be set based on a 3-lot characterisation of Humira® reference product.'),
      h3('Regulatory Submissions Included'),
      ul('CDSCO Type III Application', 'EMA Marketing Authorisation Application (MAA) Module 3 preparation', 'FDA aBLA Module 2 and 3 preparation (Phase I–Phase III packages)'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Milestone-Based Payments'),
      p('Payments tied to 5 defined programme milestones. Each milestone payment to be made within 15 days of written milestone sign-off. Total programme investment: USD 4.2 million.'),
      h3('2. Regulatory Risk'),
      p('Aragon will use best-efforts to obtain regulatory approval. Outcome is not guaranteed and additional work required by regulatory agencies will be quoted separately.'),
      h3('3. IP Ownership'),
      p('All product-specific IP (cell line, process, formulation) developed under this agreement belongs to Sun Pharma Biologics. Aragon retains rights to ACT-CHO-01 host cell line and platform technology.'),
    ),
  },

  // ── 4. Bio Similar Entity - Non Antibody ──────────────────────────────────
  'bio-similar-entity-non-ab': {
    'ceo-letter': doc(
      p('Dear Dr. Subhanu Saxena,'),
      p('Aragon Research India is delighted to present this proposal for the biosimilar development of pegfilgrastim (PEGylated G-CSF, reference: Neulasta®) for Cipla Biologics. Pegfilgrastim represents one of the fastest-growing biosimilar markets globally, and our established E. coli fermentation and conjugation platform positions us uniquely to deliver this program efficiently.'),
      p('Our experience with three successful G-CSF biosimilar programs — including one that received CDSCO approval in 2022 — provides us with the institutional knowledge and process understanding to de-risk this program significantly. We offer a proven 20-month pathway from gene to clinical batches.'),
      p('Warmly,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes an end-to-end biosimilar development program for pegfilgrastim, a PEGylated recombinant human G-CSF (rhG-CSF), targeting the reference product Neulasta® (Amgen). The program encompasses E. coli expression, refolding, purification, PEGylation chemistry, and formulation development.'),
      h3('Programme Scope'),
      ul(
        'E. coli BL21(DE3) expression and inclusion body (IB) fermentation optimisation',
        'IB solubilisation, refolding, and primary capture chromatography',
        'Site-specific PEGylation (N-terminal, 20 kDa mPEG-aldehyde) and purification',
        'Analytical comparability to Neulasta® (SDS-PAGE, SE-HPLC, RP-HPLC, potency, PEG mapping)',
        'Formulation development (acetate buffer, polysorbate 20, sodium acetate)',
        '3 GMP batches (clinical supply) at 100L fermentation scale',
      ),
      h3('Timeline: 22 months from contract to GMP batch release'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Expression & Fermentation'),
      ul(
        'Codon-optimised G-CSF gene synthesis and pET expression vector construction',
        'E. coli BL21(DE3) transformation and clone selection (>500 mg/L IB target)',
        'Fed-batch fermentation optimisation in 10L, 50L, 100L bioreactors (DO-stat strategy)',
        'IB harvest, washing, and characterisation',
      ),
      h3('Refolding & Purification'),
      ul(
        'Dilution refolding optimisation (redox buffer, detergent, temperature)',
        'Primary capture: SP Sepharose FF CEX',
        'Polishing: Q Sepharose HP AEX + RP-HPLC',
        'Refolded protein characterisation (secondary structure by CD, biological activity)',
      ),
      h3('PEGylation Chemistry'),
      ul(
        'N-terminal PEGylation with 20 kDa mPEG-aldehyde (reductive amination)',
        'PEG:protein ratio optimisation, reaction yield >60%',
        'PEG-G-CSF purification (CEX + SEC) and characterisation',
        'PEG mapping by mass spectrometry',
      ),
      h3('Formulation & Comparability'),
      ul(
        'Formulation screening (buffer, excipients, pH)',
        'Analytical comparability to Neulasta® (5-lot reference panel)',
        '3-month real-time and accelerated stability study',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Proven Platform'),
      p('Aragon\'s E. coli platform for refolded biosimilars has been validated through three prior programs. The platform consistently delivers >500 mg/L IB with >85% purity after downstream processing and >60% PEGylation yield.'),
      h3('CQA Panel'),
      ul('G-CSF potency (NFS-60 cell proliferation assay)', 'PEGylation extent (% mono-PEG)', 'Molecular weight (MALS-SEC)', 'Purity (%): RP-HPLC and SE-HPLC', 'Aggregates: DLS, AUC'),
      h3('Risk Mitigation'),
      p('Refolding yield variability is the primary risk. Aragon will run parallel refolding condition screens (3 DoE campaigns) early in development to lock the refolding process before scale-up.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Fixed-Fee Programme'),
      p('Total programme investment: USD 2.8 million across 5 milestones. PEG reagent costs are included. All costs are fixed regardless of reagent price fluctuations during the program.'),
      h3('2. E. coli Host IP'),
      p('Aragon\'s proprietary BL21(DE3) production strain modifications remain Aragon IP. Product G-CSF sequence, refolding process, and formulation IP are owned by Cipla Biologics upon full payment.'),
      h3('3. Governing Law'),
      p('Governed by laws of Maharashtra, India. Disputes subject to ICC arbitration, Mumbai.'),
    ),
  },

  // ── 5. Biologics Drug Product (DP) ─────────────────────────────────────────
  'biologics-dp': {
    'ceo-letter': doc(
      p('Dear Dr. Tobias Wiesner,'),
      p('Aragon Research is pleased to present our proposal for the drug product formulation development, lyophilisation cycle development, and fill-finish operations for Roche Biosimilars\' trastuzumab emtansine (T-DM1) analogue. Our sterile manufacturing facility in New Jersey is FDA-registered and operates under 21 CFR Part 211, with a dedicated Potent Compound Handling Suite (OEB4) for ADC processing.'),
      p('We have extensive experience with ADC drug product development, having successfully delivered three commercial-scale ADC lyophilisation programs in the past two years. Our formulation scientists understand the unique stability challenges of thioether-linked ADC payloads and the criticality of maintaining the drug-to-antibody ratio (DAR) distribution throughout processing.'),
      p('Dr. Yvonne Hartmann, our VP Drug Product, will lead this engagement. We look forward to supporting Roche\'s pipeline.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes a full drug product (DP) development and GMP manufacturing program for Roche Biosimilars\' trastuzumab-DM1 analogue (ARG-T-DM1). The program covers formulation development (liquid and lyophilised), lyophilisation cycle development and scale-up, and three GMP Phase I supply batches.'),
      h3('Key Deliverables'),
      ul(
        'Formulation screening (pH, buffer, tonicity agent, cryoprotectant, surfactant)',
        'Lyophilisation cycle development: primary drying, secondary drying, stopper insertion',
        'Lyophilised cake characterisation: Tg\', moisture content, reconstitution time, cake appearance',
        'Accelerated (40°C/75% RH, 3 months) and real-time (5°C, 24 months) stability studies',
        'Three GMP Phase I batches (25 mg/vial, 2,000 vials/batch)',
        'QC release testing per registered specification (DAR by HIC, potency by cell-based assay, aggregates by SEC)',
        'Regulatory-ready DP development report and CTD Module 3.2.P',
      ),
      h3('Timeline: 26 weeks to first GMP batch release'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Formulation Development'),
      ul(
        'pH screening (4.5–6.5, citrate/succinate/histidine buffers)',
        'Cryoprotectant optimisation (sucrose/trehalose/mannitol)',
        'Surfactant selection (PS20 vs PS80 at 0.01–0.1%)',
        'Reconstitution vehicle and volume optimisation',
        'Freeze-thaw stress studies (3 cycles, -80°C)',
        'Mechanical stress studies (agitation, shaking)',
      ),
      h3('Lyophilisation Cycle Development'),
      ul(
        'DSC characterisation (Tg\', Tc, collapse temperature)',
        'Cycle development: controlled nucleation, primary drying ramp optimisation (Pirani gauge, TDLAS monitoring)',
        'Secondary drying optimisation (residual moisture target ≤ 1%)',
        'Scalability assessment (lab-scale to GMP-scale lyophiliser)',
        'Design space definition per QbD principles',
      ),
      h3('GMP Manufacturing'),
      ul(
        'Three GMP batches: bulk formulation, fill (2 mL vials), lyophilisation, capping',
        'Process validation protocol (PV) preparation',
        'In-process controls: bioburden, fill volume, closure integrity',
        'Full QC release testing per ICH Q6B',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Facility Specifications'),
      p('Aragon NJ GMP Sterile Suite: Class C filling line (ISO 7) with Class A RABS filling zone. Potent Compound Suite (OEB4, <1 ng/m³). Lyophiliser: Millrock BT85 (8.5 m² shelf area). FDA-registered, FDA inspection passed 2024.'),
      h3('Analytical Control Strategy'),
      ul('DAR by HIC-HPLC (UV 280/254)', 'Aggregation by SEC-HPLC', 'Potency: HER2 cell-based antiproliferation assay (SK-BR-3)', 'Moisture: Karl Fischer coulometry', 'Reconstitution time and cake appearance'),
      h3('Potent Compound Safety'),
      p('T-DM1 and analogues are classified OEB4/OEB5 compounds. Aragon\'s PCHS is validated for processing up to 2 mg/m³ operator exposure. All containment is verified prior to campaign initiation.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. GMP Batch Accountability'),
      p('Aragon guarantees ≥85% yield from bulk drug substance input to filled vials. Any batch failure due to Aragon process error will be repeated at Aragon\'s cost.'),
      h3('2. Client-Supplied DS'),
      p('Roche Biosimilars to supply bulk DS (ARG-T-DM1, minimum 200 mg per batch run plus 20% overage). DS must meet agreed CoA specifications. DS destruction costs are included in the proposal.'),
      h3('3. Regulatory'), p('FDA inspection support for this program is included for 12 months post-batch release.'),
    ),
  },

  // ── 6. Biologics Drug Substance (DS) ──────────────────────────────────────
  'biologics-ds': {
    'ceo-letter': doc(
      p('Dear Dr. Aris Baras,'),
      p('Aragon Research is honoured to present this proposal for the GMP drug substance manufacturing of nivolumab (anti-PD-1, IgG4) for Bristol Myers Squibb\'s commercial supply program. Our 2,000L single-use bioreactor facility in New Jersey offers the capacity and quality system to support BMS\'s growing nivolumab demand across emerging markets.'),
      p('With our validated nivolumab cell line and locked upstream process (licensed from BMS Technology Transfer program), Aragon is uniquely positioned to deliver commercial-quality DS batches with rapid time-to-market. Our facility completed its last FDA inspection with zero 483 observations.'),
      p('Ms. Patricia Walsh, our VP Commercial Manufacturing, will personally manage this contract. We look forward to supporting BMS\'s mission to deliver cancer medicines globally.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes GMP drug substance manufacturing services for nivolumab at commercial scale (2,000L bioreactor, 3 batches per campaign). The program supports BMS\'s commercial supply expansion into Asia-Pacific and Latin American markets where Opdivo® demand is growing at >20% annually.'),
      h3('Manufacturing Scope'),
      ul(
        'Three commercial GMP batches at 2,000L scale (CHO expression, fed-batch)',
        'Downstream processing: Protein A capture (MabSelect PrismA), polishing (CEX + AEX), viral filtration (Viresolve Pro), UF/DF',
        'Bulk DS fill at 20 mg/mL in histidine buffer with mannitol',
        'Full QC release testing per BMS registered specifications',
        'Regulatory documentation: batch records, CoA, deviation reports',
      ),
      h3('Expected Yield'),
      p('Based on validated process data: ≥4 g/L titre with >90% downstream yield, expected bulk DS output ≥5.5 kg per 2,000L batch.'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Upstream Manufacturing'),
      ul(
        'WCB thaw and cell expansion (T-flask → roller bottle → 50L N-1 bioreactor → 2,000L production bioreactor)',
        'Fed-batch production: 14-day culture, daily glucose and feed additions',
        'In-process controls: viability, VCD, titre (Octet), pH, DO, osmolality',
        'Harvest by continuous centrifugation + depth filtration',
      ),
      h3('Downstream Processing'),
      ul(
        'Protein A affinity chromatography (MabSelect PrismA, 80 cm column)',
        'Low pH viral inactivation (pH 3.6, 60 min)',
        'Cation exchange polishing (SP Sepharose HP)',
        'Anion exchange flowthrough (Q Sepharose HP)',
        'Virus filtration (Viresolve Pro, 20 nm)',
        'Ultrafiltration/Diafiltration (30 kDa MWCO, histidine buffer exchange)',
        'Final bulk formulation and sterile filtration (0.22 µm)',
      ),
      h3('Quality & Compliance'),
      ul('Full batch record execution per BMS master batch record (MBR)', 'All in-process and release testing per BMS specifications', 'GDP-compliant cold chain (2–8°C) bulk storage and shipment', 'Regulatory-ready batch documentation for all ICH regions'),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Facility'),
      p('Aragon New Jersey Commercial Manufacturing: 2×2,000L single-use bioreactors (Thermo HyPerforma), AKTA Ready XL DSP train, ISO 7 cleanroom manufacturing areas. FDA-registered, ICH Q7 compliant.'),
      h3('Supply Security'),
      ul('Validated 2,000L process (PPQ executed 2024)', 'Dedicated WCB stored in two geographically separate locations', 'Consumable and raw material qualification completed per ICH Q10', 'Business continuity plan: backup 500L process validated for bridging supply'),
      h3('Campaign Planning'),
      p('Three batches per 6-week campaign. Aragon can execute 4 campaigns/year, providing 12 commercial batches annually (~66 kg DS/year at current yields).'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Batch Pricing'), p('Fixed price per batch. Rejected batches due to process failures are at Aragon\'s risk; rejected batches due to client-supplied materials or specification changes are billable.'),
      h3('2. Change Control'), p('Any changes to BMS-controlled process parameters or specifications require BMS written approval via the agreed change control procedure before implementation.'),
      h3('3. Audit Rights'), p('BMS has the right to audit Aragon\'s NJ facility with 15 business days\' notice, maximum once per calendar year during commercial manufacturing.'),
    ),
  },

  // ── 7. Biosimilar mAbs (Biologics US) ─────────────────────────────────────
  'biosimilar-mabs': {
    'ceo-letter': doc(
      p('Dear Ms. Tanya Rosenblatt,'),
      p('Aragon Research is pleased to submit this proposal for the cell line development and process development of Mylan Biologics\' bevacizumab biosimilar candidate (MYL-Bev). Bevacizumab is one of the largest biologic markets globally, with reference product revenues exceeding $6B annually — the biosimilar opportunity is substantial.'),
      p('Our experience with two approved anti-VEGF biosimilars in our portfolio gives us unparalleled insight into the critical quality attributes (CQAs) that define bevacizumab biosimilarity. We know exactly what the FDA and EMA look for and design our programs accordingly.'),
      p('Dr. Ryan O\'Brien, our Head of Biosimilar Development US, will lead this program. We are excited about this opportunity and look forward to your partnership.'),
      p('Best regards,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes a cell line development (CLD) and integrated process development (IPD) program for MYL-Bev, Mylan Biologics\' bevacizumab biosimilar candidate. The program is designed to deliver a robust CHO cell line with titre >4 g/L and a locked process at 500L scale, ready for GMP engineering runs.'),
      h3('Programme Deliverables'),
      ul(
        'Stable CHO-K1 cell line (titre ≥4 g/L, stability ≥60 generations)',
        'MCB (200 vials) and WCB (500 vials)',
        'Upstream process: media, feed, parameters locked at 500L scale',
        'Downstream process: Protein A + 2-column polishing + viral clearance + UF/DF at 500L scale',
        'Comparability of MYL-Bev to Avastin® (3 US + 3 EU reference lots): charge profile, glycan, potency, HOS',
        'Process development report and tech transfer package to Mylan GMP facility',
      ),
      h3('Timeline: 20 months to tech transfer readiness'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Cell Line Development (Months 1–8)'),
      ul(
        'Bevacizumab HC/LC gene synthesis with codon optimisation',
        'Bicistronic expression vector construction (IRES-based, GS selection)',
        'Stable transfection of CHO-K1-GS cells, selection in MSX',
        'Stable pool productivity ranking (96-well, MSD Protein A)',
        'Single-cell cloning via FACS sorting (3 rounds)',
        '200+ clones screened: titre, HMW, N-glycan, charge variant vs. Avastin® targets',
        'Top 5 clones selected for 40-day seed train stability study',
        'Best clone selected; MCB establishment (200 vials, -196°C LN2)',
      ),
      h3('Process Development (Months 7–16)'),
      ul(
        'Upstream optimisation at 3L scale (media, feed, temperature, pH shift)',
        'DoE (D-optimal) for critical process parameters',
        'Scale-up to 50L then 500L bioreactor (geometric scale-up)',
        'Downstream: Protein A MabSelect PrismA, SP Sepharose CEX, Q Sepharose AEX flowthrough, Viresolve Pro, 30 kDa UF/DF',
        'Viral clearance validation plan preparation',
        'CQA comparability at 500L scale (SEC, cIEF, glycan, VEGF-A binding ELISA)',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Bevacizumab CQA Target Ranges'),
      p('Based on analysis of 5 reference lots, Aragon has defined target ranges for key CQAs: VEGF-A binding potency (80–125% of reference), G0F+G1F glycan fraction (≥65%), main charge peak (≥75%), HMW <2%, monomer ≥98%.'),
      h3('Key Risk Mitigation'),
      ul('Low fucosylation risk: Aragon will screen 10× more clones than industry standard to identify clones with native-like glycan profile', 'Scale-up risk: full characterisation at 50L before committing to 500L scale-up'),
      h3('Tech Transfer'),
      p('Months 18–20: tech transfer to Mylan GMP facility. Aragon will provide detailed tech transfer dossier, process parameter ranges, in-process control limits, and on-site support (2 Aragon scientists, 5 days).'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Cell Line Exclusivity'), p('The CHO cell line developed under this program is exclusive to Mylan Biologics for bevacizumab biosimilar. Aragon agrees not to use this cell line for third-party bevacizumab programs for 5 years.'),
      h3('2. Failure Criteria'), p('If CLD fails to produce a clone meeting titre ≥2 g/L after 3 cloning rounds, Aragon will restart at no charge using an alternative expression strategy (e.g., plasmid amplification, alternative vector backbone).'),
      h3('3. Payment Terms'), p('Monthly progress payments based on hours incurred (T&M for development phases), plus fixed fees for CLD completion milestones. Material costs invoiced at cost + 10%.'),
    ),
  },

  // ── 8. Cell Line Development (CLD) ────────────────────────────────────────
  'cld': {
    'ceo-letter': doc(
      p('Dear Dr. Jochen Maas,'),
      p('Aragon Research presents this proposal for the CHO-K1 stable cell line development program for Merck KGaA\'s anti-PD-L1 investigational mAb, MK-ATZ-02. Our state-of-the-art CLD platform — incorporating high-throughput FACS single-cell cloning, automated ambr15 micro-bioreactor screening, and AI-assisted clone selection — delivers best-in-class productivity with compressed timelines.'),
      p('We have completed over 150 cell line development programs in the past 5 years, achieving an average titre of 4.8 g/L from our CHO-DG44 and CHO-K1 GS platforms. Our hit rate for first-time success (meeting titre and quality targets in a single CLD round) is 87%.'),
      p('Dr. Mei-Ling Wu, our CLD Programme Director, will lead the MK-ATZ-02 program. We are confident in delivering a production clone that will serve as a robust foundation for Merck KGaA\'s IND programme.'),
      p('Best regards,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes a comprehensive stable CHO-K1 cell line development program for MK-ATZ-02, Merck KGaA\'s anti-PD-L1 IgG1 monoclonal antibody. The program will deliver a well-characterised research cell bank (RCB) and master cell bank (MCB) with titre ≥3 g/L and stability ≥60 generations, within a 7-month timeline.'),
      h3('Platform Highlights'),
      ul(
        'CHO-K1 GS-KO host: Glutamine synthetase knockout (no MSX required at low concentrations), proprietary feed system',
        'FACS single-cell cloning: 2,000 cells sorted per round, full monoclonality documentation per ICH Q5D',
        'ambr15 screening: 24 clones × 7-day fed-batch runs in parallel, ranked by IPC titre, glycan, charge variant profile',
        'AI clone selection: Aragon\'s proprietary ML model integrates 50+ parameters to predict long-term productivity stability',
      ),
      h3('Deliverables'),
      ul(
        'Top production clone selection report (with ranked data for top 10 candidates)',
        'RCB establishment (50 vials)',
        'MCB establishment (200 vials, -196°C LN2)',
        'Stability data (60-generation growth kinetics, titre, viability, glycan)',
        'CLD report per ICH Q5B, Q5D',
      ),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Phase 1 — Transient Expression & Construct Verification (Weeks 1–4)'),
      ul(
        'Gene synthesis (MK-ATZ-02 VH/VL with CH1-CH2-CH3 IgG1 framework) — client to confirm sequence',
        'Transient expression in HEK293-6E (5 mL scale)',
        'Protein A purification and QC (SDS-PAGE, SEC, binding ELISA)',
        'Titre confirmation ≥50 mg/L from transient as go/no-go gate',
      ),
      h3('Phase 2 — Stable Pool & Clone Generation (Weeks 5–16)'),
      ul(
        'Stable transfection of CHO-K1-GS-KO by electroporation',
        'Selection in CD FortiCHO + 10 µM MSX (3 weeks)',
        'Stable pool analysis: titre by Octet, purity by Protein A HPLC',
        'FACS single-cell cloning (round 1): 2,000 cells sorted into 96-well plates',
        'Round 1 screening: 192 clones in batch culture, titre ranking by MSD',
        'Top 24 clones expanded to ambr15 fed-batch screen (7-day, coded sampling)',
        'FACS recloning (round 2): top 5 clones recloned for monoclonality assurance',
        'Round 2 ambr15 screen: productivity, charge variant, HMW vs. reference targets',
      ),
      h3('Phase 3 — Stability Study & MCB (Weeks 16–28)'),
      ul(
        'Top 3 clones: 60-generation stability study (passage-controlled), titre, glycan, charge variant at generations 0, 20, 40, 60',
        'Final clone selection based on stability and quality profile',
        'RCB establishment: 50 vials, liquid nitrogen vapour phase',
        'MCB establishment: 200 vials, two independent LN2 storage locations',
        'MCB sterility, mycoplasma, and adventitious agent testing',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Monoclonality Documentation'),
      p('Aragon\'s monoclonality documentation package fully complies with ICH Q5D and FDA Guidance for Industry "Characterization and Qualification of Cell Substrates". Each RCB/MCB vial is accompanied by: FACS sort report showing single-cell deposition, post-sort imaging (day 1, day 3), growth history, and identity testing.'),
      h3('AI Clone Selection Model'),
      p('Aragon\'s proprietary ML model (trained on 450 historical CLD programs) predicts production stability from early ambr15 data with 91% accuracy. Input features include early growth kinetics, specific productivity trajectory, glycan profile at day 7, and charge variant ratio. This allows early de-selection of unstable clones and reduces risk of selecting a clone that "fails" at the stability study stage.'),
      h3('Key Assumptions'),
      ul('Client provides antibody sequence (HC and LC) in writing before contract execution', 'Gene synthesis vendor lead time: 3–4 weeks (not on Aragon\'s critical path)', 'Client review and approval of clone selection within 5 business days of report delivery'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Clone Guarantee'), p('Aragon guarantees delivery of at least one clone meeting titre ≥2 g/L in ambr15. If this threshold is not met after two full cloning rounds, Aragon will provide a third cloning attempt at no additional charge.'),
      h3('2. Confidentiality'), p('Antibody sequence is treated as highest-priority confidential information under the MSA. Only personnel directly assigned to this project have access to sequence data.'),
      h3('3. Timeline'), p('7-month timeline is contingent on client providing sequence and approvals within agreed timeframes. Each week of client delay extends the timeline accordingly.'),
    ),
  },

  // ── 9. Hybridoma ──────────────────────────────────────────────────────────
  'hybridoma': {
    'ceo-letter': doc(
      p('Dear Dr. Chuck Keller,'),
      p('Aragon Research is pleased to present our proposal for hybridoma-based monoclonal antibody generation targeting the HER2 extracellular domain (ECD) for Bio-Techne Corp\'s research antibody portfolio. Our immunology and hybridoma division has generated over 500 validated mAbs in the past decade, with an unmatched panel characterisation service that delivers fully sequenced, high-specificity binders for research and diagnostic applications.'),
      p('For the HER2 ECD program, we propose a BALB/c immunisation campaign using our proprietary IMMUNO-BOOST adjuvant system, which consistently delivers 5× more antibody-secreting cells per spleen compared to standard Freund\'s adjuvant protocols. This translates directly into higher hit rates from the primary screen.'),
      p('Dr. Jessica Tanaka, our Head of Immunology, will lead this engagement. We look forward to delivering a high-quality mAb panel to Bio-Techne.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes a complete hybridoma mAb generation program targeting the human HER2 ECD (domains I–IV) for Bio-Techne Corp. The program will deliver a panel of minimum 10 validated, fully sequenced monoclonal antibodies with confirmed ELISA reactivity, Western blot performance, and IP/flow cytometry compatibility.'),
      h3('Programme Deliverables'),
      ul(
        '10+ validated mAbs: epitope binning, ELISA EC50, WB compatibility, IP/flow cytometry performance',
        'Full variable region sequencing (VH/VL) by Sanger and NGS',
        'Hybridoma cell lines for top 5 candidates (cryopreserved, 20 vials each)',
        'Purified mAb (minimum 5 mg per clone at >95% purity by SDS-PAGE)',
        'Fully documented immunisation records, fusion sheets, and clone characterisation data',
      ),
      h3('Timeline: 22 weeks from protein antigen receipt to final validated panel delivery'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Immunisation Phase (Weeks 1–10)'),
      ul(
        '4 BALB/c mice immunised with recombinant HER2 ECD (client-supplied, minimum 500 µg) using IMMUNO-BOOST adjuvant (primary + 3 boost injections)',
        'Serum titre monitoring by ELISA at weeks 4, 7, 10 (anti-HER2 IgG titre ≥1:50,000 target)',
        'Final boost 3 days prior to spleen harvest',
      ),
      h3('Cell Fusion & Primary Screen (Weeks 10–16)'),
      ul(
        'Spleen harvest and fusion with P3X63Ag8.653 myeloma cells (PEG-mediated)',
        'Plating into HAT selection medium (1,000–1,500 wells per fusion)',
        'Primary ELISA screen at day 10–14: anti-HER2 ECD binding (positive wells ≥500 expected)',
        'Sub-cloning of all positive wells by limiting dilution (96-well)',
        'Secondary ELISA screen: confirmed monoclonality and specificity',
      ),
      h3('Characterisation (Weeks 16–22)'),
      ul(
        'Isotyping (IgG1, IgG2a, IgG2b, IgG3, IgM) for all confirmed positives',
        'Western blot (reducing and non-reducing): anti-HER2 ECD reactivity',
        'Flow cytometry: binding to SK-BR-3 (HER2+) vs. MCF7 (HER2-) cell lines',
        'Epitope binning by sandwich ELISA (cross-blocking matrix, 10 clones × 10 clones)',
        'VH/VL sequencing by Sanger (gene-specific primers) + NGS (MiXCR)',
        'Protein A purification of top 10 clones (HPLC-grade purity)',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('IMMUNO-BOOST Adjuvant System'),
      p('Aragon\'s IMMUNO-BOOST combines TLR7/8 agonist with squalene-water emulsion, delivering a balanced Th1/Th2 response optimised for IgG class switching. Average titre at week 10 is 1:200,000 ELISA (vs. 1:50,000 for Freund\'s). Higher titres translate into more positive wells in the primary screen.'),
      h3('Antigen Requirements'),
      p('Client to supply HER2 ECD (domains I–IV, residues 1–631, His-tagged, ≥90% purity by SDS-PAGE, endotoxin <1 EU/µg). Minimum 500 µg for immunisation + 200 µg for ELISA coating. Aragon can arrange recombinant expression of HER2 ECD at additional cost if client cannot supply.'),
      h3('Deliverable Format'),
      p('All 10 validated mAbs will be supplied as purified IgG (≥5 mg each, PBS, 0.2 µm filtered) at -80°C. Hybridoma cell lines for top 5 clones will be provided as cryopreserved vials (20 vials per clone, 90% viability post-thaw guarantee).'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Hit Rate Guarantee'), p('Aragon guarantees delivery of at least 5 mAbs meeting Bio-Techne\'s validated performance criteria. If fewer than 5 are delivered, an additional immunisation and fusion campaign will be conducted at 50% of original program cost.'),
      h3('2. Antigen Suitability'), p('If the supplied antigen fails quality assessment (purity <90%, endotoxin >1 EU/µg), the program will be paused and rescheduled. Aragon is not responsible for delays due to inadequate antigen quality.'),
      h3('3. Sequence Exclusivity'), p('mAb sequences generated under this program are exclusive to Bio-Techne Corp.'),
    ),
  },

  // ── 10. NBE BiSpecific Antibody ───────────────────────────────────────────
  'nbe-bispecific': {
    'ceo-letter': doc(
      p('Dear Dr. Sanjay Gupta,'),
      p('Aragon Research India is thrilled to present this proposal for the CD3×CD19 bispecific antibody (bsAb) development program for Intas Pharmaceuticals. Bispecific antibodies represent the fastest-growing segment of the biologics pipeline globally, with 8 approvals since 2022. Aragon is positioned at the forefront of this space with our proprietary DUET-IgG platform, which combines knob-into-hole Fc engineering with our patented asymmetric CH1/CL swapping technology.'),
      p('Our DUET platform eliminates the mis-pairing problem inherent to bispecific formats, consistently producing >98% correct bispecific heterodimer without light chain mispairing. This directly reduces downstream purification complexity and improves yield.'),
      p('Dr. Arjun Nair, our VP Bispecific Technology, will lead this program. We look forward to advancing Intas\'s immuno-oncology pipeline.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research India proposes the development of a CD3×CD19 T-cell engager bispecific antibody (INN-BiTE-01) using the DUET-IgG platform for Intas Pharmaceuticals. The bsAb targets CD3ε on T cells and CD19 on B cells/B-cell malignancies, designed for ALL, DLBCL, and CLL indications.'),
      h3('Programme Deliverables'),
      ul(
        'INN-BiTE-01 molecule engineering: VH/VL domain optimisation, CH1/CL swap, KiH Fc',
        'CHO stable cell line producing INN-BiTE-01 titre ≥1 g/L (knob+hole correct pairing >98%)',
        'MCB establishment',
        'Upstream process development (3L → 50L)',
        'Downstream process development (Protein A + KiH-specific polishing)',
        'In vitro potency: T-cell activation (CD3+CD19+ cell co-culture), ADCC reporter',
        'Pre-IND analytical package (SEC, cIEF, intact mass, binding SPR)',
        'Tech transfer readiness package',
      ),
      h3('Timeline: 24 months to IND-enabling GMP batch readiness'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Molecule Engineering (Months 1–4)'),
      ul(
        'Anti-CD3 arm: blinatumomab-based scFv or existing Intas patent-free anti-CD3 clone — client decision',
        'Anti-CD19 arm: humanised anti-CD19 IgG1 VH/VL (Aragon proprietary or client-provided)',
        'DUET-IgG format: knob-into-hole Fc (T366W/S354C/Y349C/T366S/L368A/Y407V), CH1/CL swap in one arm',
        '3 format variants tested: symmetric bsIgG, asymmetric Fab×scFv, 2:1 (monovalent CD3, bivalent CD19)',
        'Transient expression in HEK293 (5 mL scale), bispecific characterisation (IEX, SEC, SPR)',
        'Format selection based on T-cell killing potency (in vitro Ramos cell killing assay)',
      ),
      h3('Cell Line Development (Months 4–12)'),
      ul('Stable CHO-K1 cell line development using DUET vector (two separate selection markers per arm)', 'CLD: transient → stable pool → single-cell cloning', 'Clone screening: titre, correct heterodimer % (Fab-arm exchange assay), SEC purity', 'Stability study: 60 generations, retained heterodimer purity ≥98%'),
      h3('Process Development (Months 12–22)'),
      ul('Upstream: fed-batch at 3L, optimised for INN-BiTE-01 (pH, DO, temperature)', 'Downstream: Protein A (Mabselect) + Protein L (captures half-antibody impurities) + CEX polishing', 'In-process control for heterodimer purity by IEX at each step'),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('DUET-IgG Platform Advantages'),
      p('Aragon\'s DUET platform addresses the 3 main bispecific production challenges: (1) Light chain mispairing: eliminated by CH1/CL swap in one arm — creates a neo-pair that cannot pair with the opposing arm\'s CL. (2) Homodimer formation: prevented by KiH Fc mutations — >99% heterodimer by gel after co-expression. (3) Expression imbalance: resolved by empirical HC:LC ratio optimisation per arm during transient phase.'),
      h3('In Vitro Potency Testing'),
      p('INN-BiTE-01 potency will be measured in a co-culture T-cell killing assay using Ramos (CD19+) target cells and Jurkat (CD3+) effector cells. EC50 target: <1 nM cytotoxicity. Specificity will be confirmed using CD19-negative control target cells.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Platform IP'), p('Aragon\'s DUET-IgG platform (KiH + CH1/CL swap combination) is Aragon proprietary IP. A license to use the platform for INN-BiTE-01 is included in this proposal. The license is sublicensable to Intas\'s GMP CMO partner.'),
      h3('2. Molecule IP'), p('INN-BiTE-01 VH/VL sequences and bispecific format IP developed under this program are assigned to Intas Pharmaceuticals upon full payment.'),
      h3('3. Go/No-Go Gates'), p('Two formal go/no-go decision points: (1) Format selection (Month 4) — client approves molecule to advance, (2) CLD completion (Month 12) — client approves clone to advance to PD. No obligation to proceed past either gate.'),
    ),
  },

  // ── 11. NBE Monoclonal Antibody ───────────────────────────────────────────
  'nbe-mab': {
    'ceo-letter': doc(
      p('Dear Dr. G V Prasad,'),
      p('Aragon Research India is honoured to present this proposal for the IND-enabling development program for Dr. Reddy\'s Biologics\' anti-VEGF monoclonal antibody candidate, DRL-VEGF-01. As the first fully-integrated CDMO for NBE biologics in India with dual US FDA and EMA inspection records, Aragon is uniquely equipped to deliver IND-enabling GMP batches with the quality necessary for global first-in-human trials.'),
      p('DRL-VEGF-01 addresses a large and growing market in ophthalmology and oncology. Our experience with three prior anti-VEGF programs — including one currently in Phase III — gives us deep insights into the formulation, potency assay, and manufacturing challenges specific to this molecule class.'),
      p('Dr. Veena Mishra, our VP IND Programs, will lead this engagement. We are proud to support Dr. Reddy\'s vision of making innovation accessible.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research India proposes a comprehensive IND-enabling development program for DRL-VEGF-01, Dr. Reddy\'s Biologics\' humanised anti-VEGF-A IgG1 monoclonal antibody. The program covers stable cell line development, process development, analytical development, safety pharmacology support, and GMP manufacturing of Phase I clinical batches.'),
      h3('IND-Enabling Package'),
      ul(
        'Stable CHO cell line with titre ≥3 g/L, MCB established',
        'Upstream process development, locked at 200L scale',
        'Downstream process development (3-step purification)',
        'Analytical development: potency (VEGF-A binding/cell-based), structural characterisation',
        'GMP Manufacturing: 3 Phase I batches (200L), QC release testing',
        'Drug product formulation (liquid, pre-filled syringe)',
        'Regulatory: IND-enabling document support (CMC sections)',
        'Forced degradation, comparability, and 6-month real-time stability data',
      ),
      h3('Timeline: 30 months from gene sequence to IND filing support'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Cell Line Development (Months 1–8)'),
      ul(
        'DRL-VEGF-01 HC/LC gene synthesis and CHO-K1 GS expression vector construction',
        'Stable CHO-K1 transfection and selection',
        'Single-cell cloning (2 rounds), ambr15 screening',
        'Clone selection based on titre ≥3 g/L, VEGF-A binding, aggregation, glycan profile',
        'MCB establishment (200 vials)',
      ),
      h3('Process Development (Months 6–18)'),
      ul(
        'Upstream: fed-batch at 3L, 50L, 200L scale',
        'Downstream: Protein A capture + CEX + AEX flowthrough + viral filtration + UF/DF',
        'Viral clearance validation (scaled-down model, A-MuLV spiking study)',
        'Hold time studies for bulk DS',
      ),
      h3('Analytical Development (Months 8–20)'),
      ul(
        'Potency assay: VEGF-A binding ELISA (primary) + HUVEC proliferation inhibition (cell-based, secondary)',
        'Characterisation: SEC-HPLC, cIEF, glycan profiling, intact mass, peptide mapping',
        'Method qualification per ICH Q2(R1)',
        '6-month real-time (5°C) + 6-month accelerated (25°C) stability study',
      ),
      h3('GMP Manufacturing (Months 22–28)'),
      ul(
        'Three Phase I GMP batches at 200L scale',
        'DP formulation (histidine buffer, pH 6.0, polysorbate 20) in pre-filled syringes',
        'QC release testing, batch records, CoA',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('VEGF-A Potency Strategy'),
      p('The cell-based HUVEC proliferation inhibition assay is the gold standard for anti-VEGF potency. Aragon will develop and qualify a plate-based HUVEC assay with <20% inter-assay variability (CV). Interim potency can be measured by SPR (Biacore, VEGF-A binding kinetics) for early development stages before cell assay qualification.'),
      h3('IND CMC Support'),
      p('Aragon\'s regulatory writing team will prepare CMC sections 3.2.S.1–3.2.S.7 (Drug Substance) and 3.2.P.1–3.2.P.8 (Drug Product) for the IND application, including the Pharmaceutical Development Report (PDR) and Process Validation Strategy.'),
      h3('Regulatory Track'),
      p('Program is designed to support simultaneous CDSCO IND (India) and USFDA IND filings. All work is conducted under ICH Q8(R2), Q9, Q10 principles.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Programme Investment'), p('Total fixed-fee investment: USD 5.6 million across 7 milestones. Milestone payments tied to key deliverables (MCB, process lock, analytical qualification, GMP batch release, IND package delivery).'),
      h3('2. IND Support'), p('Aragon will provide regulatory CMC writing support for 2 rounds of IND filing revision at no additional charge.'),
      h3('3. Cell Line Ownership'), p('DRL-VEGF-01 production cell line is the sole property of Dr. Reddy\'s Biologics. Aragon will transfer a cell bank copy to DRL upon MCB establishment.'),
    ),
  },

  // ── 12. NBE Non-Antibody ──────────────────────────────────────────────────
  'nbe-non-ab': {
    'ceo-letter': doc(
      p('Dear Ms. Kiran Mazumdar-Shaw,'),
      p('Aragon Research India is delighted to present this proposal for the recombinant G-CSF (filgrastim) process development and GMP manufacturing for Biocon Biologics. G-CSF is one of the largest biologic markets in India and globally, and Biocon\'s expansive distribution network positions a new, optimised G-CSF product for significant commercial success.'),
      p('Aragon\'s E. coli expression platform for recombinant proteins has been optimised over two decades. Our current G-CSF process — using a codon-optimised gene in E. coli BL21(DE3) with a proprietary refolding buffer system — achieves 98% biological activity recovery from inclusion bodies, a performance metric that directly impacts your cost of goods.'),
      p('Dr. Pradeep Venugopal, our VP Recombinant Protein Technology, will lead this engagement. We look forward to this partnership with Biocon.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research India proposes a recombinant G-CSF (filgrastim) process development and GMP manufacturing program for Biocon Biologics. The program delivers a fully optimised E. coli expression, refolding, and purification process at 100L fermentation scale, with three GMP batches for clinical/commercial supply.'),
      h3('Key Deliverables'),
      ul(
        'E. coli BL21(DE3) production strain with validated expression cassette (titre ≥1.5 g/L IB)',
        'Optimised fed-batch fermentation process (glycerol/glucose carbon source strategy)',
        'Refolding process with ≥85% yield and ≥95% biological activity recovery',
        'Downstream purification: CEX + AEX + SEC polishing (>99.5% purity by RP-HPLC)',
        'Formulation: acetate buffer pH 4.0, polysorbate 80, sodium acetate (matching Neupogen® formulation)',
        'Analytical development: potency (NFS-60 proliferation assay), SEC purity, RP-HPLC, endotoxin',
        'Three GMP batches at 100L scale; QC release, CoA, regulatory documentation',
      ),
      h3('Timeline: 18 months to GMP batch release'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Expression & Fermentation (Months 1–6)'),
      ul(
        'Codon-optimised G-CSF gene synthesis (174 AA, native leader sequence removed, Met-1 added)',
        'pET-21b(+) expression vector construction',
        'E. coli BL21(DE3) transformation and colony selection',
        'Fed-batch fermentation optimisation: C-source strategy, temperature shift (37°C → 30°C post-induction), IPTG concentration (0.1–1 mM)',
        'Scale-up: 2L (shake flask) → 10L → 50L → 100L bioreactor (DO-stat fed-batch)',
        'IB quality assessment at each scale (purity, size, biological activity pre-refolding)',
      ),
      h3('Refolding & Purification (Months 5–12)'),
      ul(
        'IB solubilisation in guanidinium HCl (6M) + DTT',
        'Dilution refolding: buffer composition optimisation (Tris, NaCl, GSSG/GSH, sucrose, Arg)',
        'DoE optimisation: 24-run central composite design for refolding yield vs. aggregate minimisation',
        'Capture: SP Sepharose FF (CEX, bind-elute with NaCl gradient)',
        'Intermediate polishing: Q Sepharose HP (AEX, flowthrough, removes HCP and DNA)',
        'Final polishing: Superdex 75 prep-grade SEC (removes aggregates, dimers)',
        'Ultrafiltration/Diafiltration: 10 kDa MWCO into final formulation buffer',
      ),
      h3('GMP Manufacturing (Months 14–18)'),
      ul('3 GMP batches at 100L fermentation scale', 'In-process controls: bioburden, endotoxin, purity by RP-HPLC at each step', 'Full QC release package per Indian Pharmacopoeia and WHO standards'),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Proprietary Refolding Technology'),
      p('Aragon\'s ArgPlus refolding buffer system (patent pending: IN 2024/01234) incorporates arginine HCl with a proprietary polyol mixture that specifically suppresses G-CSF aggregation during the dilution step. Compared to standard Arg-based refolding, ArgPlus delivers 15% higher biological activity recovery and 40% reduction in aggregate formation, directly improving yield from inclusion body to final DS.'),
      h3('Potency Assay'),
      p('G-CSF potency will be measured by NFS-60 cell proliferation assay (ATCC CCL-52), calibrated against WHO International Standard G-CSF (01/030). Aragon\'s NFS-60 assay CV is <15% intra-assay and <20% inter-assay, consistent with pharmacopoeial requirements.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Technology Transfer'), p('Complete process documentation, SOPs, and in-person training for Biocon\'s manufacturing team are included in the program fee.'),
      h3('2. ArgPlus License'), p('Aragon grants Biocon a non-exclusive, perpetual license to use the ArgPlus refolding technology for G-CSF production at Biocon\'s facilities.'),
      h3('3. COGS Target'), p('Aragon\'s process is designed to achieve a COGS target of USD 0.08/mg G-CSF at 100L scale. COGS modelling data will be provided as part of the process development report.'),
    ),
  },

  // ── 13. Technology Transfer ───────────────────────────────────────────────
  'tech-transfer': {
    'ceo-letter': doc(
      p('Dear Dr. Srinivas Sadu,'),
      p('Aragon Research India is pleased to present this proposal for the technology transfer of the rituximab (anti-CD20 IgG1) manufacturing process from Hetero Biopharma\'s US CMO to Aragon\'s GMP facility in Hyderabad, India. Successful technology transfer is the foundation of a robust, compliant manufacturing supply chain — and Aragon has one of the strongest tech transfer track records in the Indian biologics CMO sector, with 12 successful transfers completed in the last 4 years.'),
      p('The rituximab transfer program will leverage our proven Transfer Excellence Framework (TEF), which includes a rigorous Phase 0 process understanding exercise, a defined set of manufacturing process verification (MPV) runs, and a formal comparability protocol aligned to ICH Q5E.'),
      p('Dr. Rahul Singh, our VP Technology Transfer, will personally lead this engagement. I am confident that Aragon will deliver a smooth, successful transfer that positions Hetero for global market supply.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research India proposes a comprehensive technology transfer of the rituximab (Hetero Biopharma\'s biosimilar, HTRO-RTX-01) manufacturing process from the US CMO to Aragon\'s Hyderabad GMP facility. The program encompasses process understanding, analytical transfer, manufacturing scale qualification, and a formal comparability study to demonstrate equivalence of transferred batches to US-manufactured reference batches.'),
      h3('Transfer Scope'),
      ul(
        'Upstream process: fed-batch CHO culture at 1,000L scale',
        'Downstream process: Protein A + CEX + AEX + viral filtration + UF/DF',
        'Drug product: liquid formulation in glass vials (fill-finish)',
        'Analytical methods: 12 release methods + 8 characterisation methods',
        '3 engineering/verification runs + 3 PPQ batches',
        'Comparability study: HTRO-RTX-01 India batches vs. 3 US reference batches (ICH Q5E)',
      ),
      h3('Timeline: 18 months from tech transfer initiation to PPQ batch release and comparability report'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Phase 0 — Process Understanding (Months 1–3)'),
      ul(
        'Review and gap analysis of US CMO batch records (minimum 10 batches)',
        'Process characterisation report: critical process parameters (CPPs), critical quality attributes (CQAs), process analytical technology (PAT) strategy',
        'Equipment and facility comparison: US CMO vs. Aragon Hyderabad (surface materials, bioreactor geometry, heat transfer coefficients)',
        'Comparability protocol preparation (ICH Q5E)',
        'Analytical method transfer plan preparation',
      ),
      h3('Phase 1 — Engineering Runs (Months 3–9)'),
      ul(
        '3 engineering runs at 1,000L (non-GMP) to verify transferred process performance',
        'In-process and end-of-run characterisation: titre, VCD, viability, aggregates, charge variant, glycan',
        'Side-by-side comparison with US reference batch data',
        'Process refinement based on engineering run data',
      ),
      h3('Phase 2 — Analytical Method Transfer (Months 2–8)'),
      ul(
        'Transfer of 12 release methods and 8 characterisation methods',
        'Method equivalence testing: each method tested in parallel at US CMO and Aragon for 3 batches',
        'Transfer report for all methods per USP <1224>',
      ),
      h3('Phase 3 — PPQ Batches & Comparability (Months 10–18)'),
      ul(
        '3 Process Performance Qualification (PPQ) GMP batches at 1,000L',
        'Full QC release testing, batch records, deviation investigation',
        'Formal comparability study vs. 3 US reference batches (ICH Q5E attributes: potency, binding, charge variant, glycan, HOS, aggregation)',
        'Comparability report and regulatory submission support',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('Aragon Hyderabad Facility'),
      p('Aragon Hyderabad GMP Facility: WHO GMP certified, ISO 13485:2016 certified. 2×1,000L single-use bioreactors (Sartorius BIOSTAT STR), AKTA Ready XL downstream train, Class A fill-finish line. Last WHO/CDSCO joint inspection: December 2024, zero critical observations.'),
      h3('Comparability Framework'),
      p('The ICH Q5E comparability study will evaluate the following attribute categories: physicochemical properties (primary structure, HOS), biological activity (CD20 binding, ADCC, CDC), impurities (aggregates, host cell proteins, residual DNA), and container closure integrity. Statistical equivalence criteria will be pre-defined in the comparability protocol.'),
      h3('Risk Register'),
      ul('Bioreactor geometry differences (US CMO stainless vs. Aragon SUB): mitigated by detailed kLa/mixing time characterisation and scale-down model qualification', 'Raw material qualification: all key raw materials to be qualified at Aragon 3 months before first engineering run'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Transfer Excellence Guarantee'), p('Aragon guarantees successful analytical method transfer (all 12 release methods and 8 characterisation methods) within the agreed 8-month window. If any method fails transfer, Aragon will repeat at no additional charge.'),
      h3('2. Regulatory Support'), p('Aragon will provide regulatory agency question/answer support for the transferred process for 24 months post-PPQ batch release.'),
      h3('3. Confidentiality'), p('All process and formulation information received from Hetero Biopharma and the US CMO is treated as highest-priority confidential. Access is limited to the assigned Aragon transfer team (5 individuals) under individual NDAs.'),
    ),
  },

  // ── 14. Transient Expression ──────────────────────────────────────────────
  'transient-expression': {
    'ceo-letter': doc(
      p('Dear Dr. Mark Litton,'),
      p('Aragon Research is excited to present this proposal for rapid transient expression of Genentech\'s anti-CTLA4 lead antibody candidates for the Lead Candidate Rapid Expression Screen (LCRES) program. Speed-to-protein is critical in early-stage antibody lead selection — our HEK293-F transient platform delivers milligram quantities of purified mAb within 14 days of gene sequence receipt, enabling your team to run potency and selectivity screens without waiting for stable cell line development.'),
      p('Our transient platform has produced over 2,000 unique proteins for pharmaceutical discovery programs globally. Our average success rate (titre ≥50 mg/L) for IgG1 antibodies in HEK293-F is 94%, with 24-hour turnaround for gene synthesis from approved sequence.'),
      p('Dr. Xiaomei Zhang, our Head of Protein Sciences, will lead this engagement. We look forward to accelerating Genentech\'s CTLA4 program.'),
      p('Sincerely,'),
      p(bold('CEO, Aragon Research')),
    ),
    'executive-summary': doc(
      h2('Executive Summary'),
      p('Aragon Research proposes rapid transient expression of 12 anti-CTLA4 mAb candidates for Genentech\'s Lead Candidate Rapid Expression Screen (LCRES) program. Expression will be performed in HEK293-F suspension cells using PEI-mediated transfection in 125 mL shake flasks, with Protein A purification and QC delivered within 14 days of gene synthesis completion.'),
      h3('Programme Deliverables'),
      ul(
        '12 anti-CTLA4 mAbs expressed in HEK293-F (IgG1 format)',
        'Purified protein: ≥1 mg per candidate at ≥90% purity (SEC-HPLC, SDS-PAGE)',
        'QC panel: yield, purity (SEC, SDS-PAGE reducing and non-reducing), endotoxin (<1 EU/mg)',
        'Preliminary CTLA4 binding ELISA (EC50) for all 12 candidates',
        'Optional: SPR characterisation (on/off rates) for top 5 candidates',
      ),
      h3('Timeline: 14 days from gene synthesis to purified protein delivery for all 12 candidates (parallel processing)'),
    ),
    'scope-of-work': doc(
      h2('Scope of Work'),
      h3('Gene Synthesis & Vector Preparation (Days 1–4)'),
      ul(
        '12 mAb candidates — HC and LC variable domains supplied by Genentech (sequence format: FASTA)',
        'Codon-optimised HC and LC genes synthesised and cloned into Aragon\'s high-expression pARG-CMV vector',
        'Sequence verification by Sanger before transfection',
        'Plasmid preparation: Endo-free maxiprep (≥1 mg, >95% supercoiled)',
      ),
      h3('Transient Transfection & Harvest (Days 4–12)'),
      ul(
        'HEK293-F suspension cells in Expi293 Expression Medium (12 flasks, 125 mL each)',
        'PEI-mediated co-transfection (HC:LC = 2:1 plasmid ratio, optimised)',
        'Harvest by centrifugation at day 7–8 (peak titre)',
        'Day 4 and day 7 titre check by Octet (Protein A biosensors)',
        'Culture supernatant clarification by centrifugation + 0.22 µm filtration',
      ),
      h3('Purification & QC (Days 10–14)'),
      ul(
        'Protein A purification (MabSelect SuRe PCC, 1 mL HiTrap column per candidate)',
        'Buffer exchange to PBS pH 7.4 by 10 kDa Amicon spin filtration',
        'QC: A280 protein quantitation, SEC-HPLC (Superdex 200 Increase), SDS-PAGE (reducing, non-reducing), endotoxin (LAL)',
        'CTLA4 extracellular domain binding ELISA (client to supply CTLA4-ECD or Aragon sourcing)',
        'Final protein shipped on dry ice in 0.5 mL aliquots (≥1 mg per candidate)',
      ),
    ),
    'project-details': doc(
      h2('Project Details'),
      h3('HEK293-F Platform Performance'),
      ul('Average titre: 180–350 mg/L for IgG1 formats in Expi293 medium', '94% success rate (≥50 mg/L, ≥90% monomer by SEC)', '14-day turnaround from gene to shipped protein (guaranteed)', 'QC-ready data package with each delivery'),
      h3('Optional Services'),
      p('After initial expression screen, Genentech may select top candidates for expanded production (500 mL scale, ≥50 mg), CHO stable cell line development (parallel fast-track available within 4 months), or deeper biophysical characterisation (SPR, DSF, SEC-MALS).'),
      h3('Scale-Up Path'),
      p('Candidates advancing to IND will transition to Aragon\'s CHO stable CLD platform (covered under separate proposal). Aragon maintains plasmid stocks for all 12 candidates for 12 months post-project for potential scale-up.'),
    ),
    'terms-conditions': doc(
      h2('Terms & Conditions'),
      h3('1. Turnaround Guarantee'), p('Aragon guarantees 14-day turnaround (gene synthesis start to shipped protein) for all 12 candidates in parallel. Each day of delay by Aragon (excluding client-caused delays) entitles Genentech to a 2% reduction in the program fee.'),
      h3('2. Sequence Confidentiality'), p('Antibody sequences are treated as top-priority trade secrets. Sequence data is stored encrypted, accessible only to named Aragon Protein Sciences team members.'),
      h3('3. Minimum Quantity Guarantee'), p('If any candidate yields <0.5 mg from the 125 mL scale expression, Aragon will repeat the expression at no charge at 500 mL scale to meet the ≥1 mg delivery requirement.'),
    ),
  },
};

// ── Proposal metadata per template ───────────────────────────────────────────
const PROPOSALS = [
  {
    templateName: 'Analytical Services',
    templateBU:   'Analytical',
    contentKey:   'analytical-services',
    name:         'Genotoxic Impurity Method Development & Validation',
    client:       'Cipla Ltd',
    bdManager:    'anil.kapoor@aragon.com',
    proposalManager: 'ananya.krishnan@aragon.com',
    proposalCode: 'ANA-2025-001',
    businessUnit: 'Analytical',
    templateType: 'Analytical Services',
    description:  'ICH M7-aligned GTI method development and validation for 12 potential mutagenic impurities in three Cipla API intermediates. LC-MS/MS platform with LOQ ≤ 0.5 ppm TTC-level detection.',
    status: 'Sent',
    currentStage: 5,
    stakeholders: ['regulatory@cipla.com', 'qa@cipla.com'],
  },
  {
    templateName: 'Analytics',
    templateBU:   'Biologics US',
    contentKey:   'analytics',
    name:         'Pembrolizumab Biosimilar Extended Analytical Characterisation',
    client:       'Fresenius Kabi',
    bdManager:    'ryan.obrien@aragon.com',
    proposalManager: 'kavitha.rajan@aragon.com',
    proposalCode: 'BIO-2025-002',
    businessUnit: 'Biologics US',
    templateType: 'Analytics',
    description:  'State-of-the-art orthogonal characterisation of FK-Pembro-01 (pembrolizumab biosimilar) vs. Keytruda® reference. Full HOS, glycan, charge variant, potency, and Fc function panel for 351(k) biosimilar dossier.',
    status: 'Review',
    currentStage: 4,
    stakeholders: ['regulatory@fresenius-kabi.com', 'bd@fresenius-kabi.com'],
  },
  {
    templateName: 'Bio Similar Entity - Mono Clonal Antibody',
    templateBU:   'Biologics India',
    contentKey:   'bio-similar-entity-mca',
    name:         'Adalimumab Biosimilar End-to-End Development — Sun Pharma',
    client:       'Sun Pharma Biologics',
    bdManager:    'rajan.mehta@aragon.com',
    proposalManager: 'shivkumar.rao@aragon.com',
    proposalCode: 'BSIMCA-2025-001',
    businessUnit: 'Biologics India',
    templateType: 'Bio Similar Entity - Mono Clonal Antibody',
    description:  'Full biosimilar development program for adalimumab targeting CDSCO, EMA, and FDA approval. CHO-K1 GS platform, Pune GMP facility. Total program: 36 months.',
    status: 'Draft',
    currentStage: 2,
    stakeholders: ['biosimilars.head@sunpharma.in', 'regulatory@sunpharma.in'],
  },
  {
    templateName: 'Bio Similar Entity - Non Antibody',
    templateBU:   'Biologics India',
    contentKey:   'bio-similar-entity-non-ab',
    name:         'Pegfilgrastim (PEGylated G-CSF) Biosimilar Development',
    client:       'Cipla Biologics',
    bdManager:    'priya.nair@aragon.com',
    proposalManager: 'arjun.desai@aragon.com',
    proposalCode: 'BSINAB-2025-001',
    businessUnit: 'Biologics India',
    templateType: 'Bio Similar Entity - Non Antibody',
    description:  'Biosimilar development of pegfilgrastim (Neulasta® reference) via E. coli IB expression, refolding, and N-terminal PEGylation. 22-month timeline to GMP batch release.',
    status: 'Review',
    currentStage: 3,
    stakeholders: ['biologics@cipla.com', 'cmo@cipla.com'],
  },
  {
    templateName: 'Biologics Drug Product (DP)',
    templateBU:   'Biologics',
    contentKey:   'biologics-dp',
    name:         'Trastuzumab Emtansine ADC Drug Product Formulation & Fill-Finish',
    client:       'Roche Biosimilars AG',
    bdManager:    'peter.hoffman@aragon.com',
    proposalManager: 'yvonne.hartmann@aragon.com',
    proposalCode: 'DP-2025-001',
    businessUnit: 'Biologics',
    templateType: 'Biologics Drug Product (DP)',
    description:  'Complete ADC drug product development including lyophilisation cycle development, OEB4 fill-finish operations, and 3 GMP Phase I batches for trastuzumab emtansine analogue.',
    status: 'Sent',
    currentStage: 5,
    stakeholders: ['adp.lead@roche.com', 'qa@roche.com', 'supply@roche.com'],
  },
  {
    templateName: 'Biologics Drug Substance (DS)',
    templateBU:   'Biologics',
    contentKey:   'biologics-ds',
    name:         'Nivolumab Drug Substance GMP Commercial Manufacturing',
    client:       'Bristol Myers Squibb',
    bdManager:    'patricia.walsh@aragon.com',
    proposalManager: 'david.kim@aragon.com',
    proposalCode: 'DS-2025-001',
    businessUnit: 'Biologics',
    templateType: 'Biologics Drug Substance (DS)',
    description:  'Commercial-scale GMP DS manufacturing of nivolumab at 2,000L single-use bioreactor. 3 batches per campaign, supporting BMS Asia-Pacific and LatAm commercial supply expansion.',
    status: 'Approved',
    currentStage: 5,
    stakeholders: ['supply.chain@bms.com', 'quality@bms.com', 'regulatory@bms.com'],
  },
  {
    templateName: 'Biosimilar mAbs',
    templateBU:   'Biologics US',
    contentKey:   'biosimilar-mabs',
    name:         'Bevacizumab Biosimilar Cell Line & Process Development',
    client:       'Mylan Biologics Inc',
    bdManager:    'ryan.obrien@aragon.com',
    proposalManager: 'sarah.johnson@aragon.com',
    proposalCode: 'BSIM-2025-001',
    businessUnit: 'Biologics US',
    templateType: 'Biosimilar mAbs',
    description:  'End-to-end CHO-K1 GS CLD and integrated process development for MYL-Bev bevacizumab biosimilar. Target titre ≥4 g/L, 500L scale process locked for tech transfer to Mylan GMP.',
    status: 'Review',
    currentStage: 3,
    stakeholders: ['development@mylanbiologics.com', 'regulatory@mylan.com'],
  },
  {
    templateName: 'Cell Line Development (CLD)',
    templateBU:   'Biologics US',
    contentKey:   'cld',
    name:         'Anti-PD-L1 Stable CHO-K1 Cell Line Development — Merck KGaA',
    client:       'Merck KGaA',
    bdManager:    'james.wilson@aragon.com',
    proposalManager: 'mei-ling.wu@aragon.com',
    proposalCode: 'CLD-2025-001',
    businessUnit: 'Biologics US',
    templateType: 'Cell Line Development (CLD)',
    description:  'IND-enabling CHO-K1 GS stable cell line development for MK-ATZ-02 anti-PD-L1 IgG1. AI-assisted clone selection, FACS monoclonality, ambr15 screening, MCB establishment. Target titre ≥3 g/L.',
    status: 'Review',
    currentStage: 3,
    stakeholders: ['biologics.pd@merckgroup.com', 'ip@merckgroup.com'],
  },
  {
    templateName: 'Hybridoma',
    templateBU:   'Biologics US',
    contentKey:   'hybridoma',
    name:         'HER2 ECD Diagnostic Monoclonal Antibody Generation',
    client:       'Bio-Techne Corp',
    bdManager:    'emma.davis@aragon.com',
    proposalManager: 'jessica.tanaka@aragon.com',
    proposalCode: 'HYB-2025-001',
    businessUnit: 'Biologics US',
    templateType: 'Hybridoma',
    description:  'Hybridoma-based generation of a validated panel of 10+ anti-HER2 ECD mAbs using IMMUNO-BOOST adjuvant. Full characterisation: epitope binning, WB, flow cytometry, VH/VL sequencing.',
    status: 'Sent',
    currentStage: 5,
    stakeholders: ['antibody.dev@bio-techne.com', 'research@bio-techne.com'],
  },
  {
    templateName: 'NBE BiSpecific Antibody',
    templateBU:   'Biologics India',
    contentKey:   'nbe-bispecific',
    name:         'CD3×CD19 Bispecific T-Cell Engager Development — Intas',
    client:       'Intas Pharmaceuticals',
    bdManager:    'vikram.sood@aragon.com',
    proposalManager: 'arjun.nair@aragon.com',
    proposalCode: 'BSAB-2025-001',
    businessUnit: 'Biologics India',
    templateType: 'NBE BiSpecific Antibody',
    description:  'Full DUET-IgG platform-based CD3×CD19 bispecific antibody development for immuno-oncology. Molecule engineering, CHO CLD, process development, and IND-enabling GMP batches. 24-month program.',
    status: 'Draft',
    currentStage: 2,
    stakeholders: ['innovation@intaspharma.com', 'regulatory@intaspharma.com'],
  },
  {
    templateName: 'NBE Monoclonal Antibody',
    templateBU:   'Biologics India',
    contentKey:   'nbe-mab',
    name:         'Anti-VEGF mAb IND-Enabling Development — Dr. Reddy\'s',
    client:       'Dr. Reddy\'s Biologics',
    bdManager:    'priya.nair@aragon.com',
    proposalManager: 'veena.mishra@aragon.com',
    proposalCode: 'NBEMAB-2025-001',
    businessUnit: 'Biologics India',
    templateType: 'NBE Monoclonal Antibody',
    description:  'Complete IND-enabling program for DRL-VEGF-01 anti-VEGF-A humanised mAb: CLD, process development, analytical development, GMP Phase I batches, DP formulation, and CMC filing support.',
    status: 'Review',
    currentStage: 3,
    stakeholders: ['biologics@drreddys.com', 'regulatory@drreddys.com', 'cfo@drreddys.com'],
  },
  {
    templateName: 'NBE Non-Antibody',
    templateBU:   'Biologics India',
    contentKey:   'nbe-non-ab',
    name:         'Recombinant G-CSF (Filgrastim) Process Development & GMP Manufacturing',
    client:       'Biocon Biologics',
    bdManager:    'rajan.mehta@aragon.com',
    proposalManager: 'pradeep.venugopal@aragon.com',
    proposalCode: 'NBENAB-2025-001',
    businessUnit: 'Biologics India',
    templateType: 'NBE Non-Antibody',
    description:  'E. coli expression, refolding, and purification process development for recombinant filgrastim (G-CSF). ArgPlus refolding platform. 3 GMP batches at 100L fermentation scale. 18-month program.',
    status: 'Draft',
    currentStage: 1,
    stakeholders: ['biomanufacturing@biocon.com', 'quality@biocon.com'],
  },
  {
    templateName: 'Technology Transfer',
    templateBU:   'Biologics India',
    contentKey:   'tech-transfer',
    name:         'Rituximab Process Technology Transfer US→India — Hetero Biopharma',
    client:       'Hetero Biopharma Ltd',
    bdManager:    'vikram.sood@aragon.com',
    proposalManager: 'rahul.singh@aragon.com',
    proposalCode: 'TT-2025-001',
    businessUnit: 'Biologics India',
    templateType: 'Technology Transfer',
    description:  'Full technology transfer of rituximab (HTRO-RTX-01) manufacturing process from US CMO to Aragon Hyderabad. Includes process understanding, analytical transfer, engineering runs, PPQ batches, and ICH Q5E comparability.',
    status: 'Review',
    currentStage: 4,
    stakeholders: ['manufacturing@heteropharma.com', 'regulatory@heteropharma.com', 'qa@heteropharma.com'],
  },
  {
    templateName: 'Transient Expression',
    templateBU:   'Biologics US',
    contentKey:   'transient-expression',
    name:         'Anti-CTLA4 Lead Candidate Rapid Expression Screen — Genentech',
    client:       'Genentech Inc',
    bdManager:    'emma.davis@aragon.com',
    proposalManager: 'xiaomei.zhang@aragon.com',
    proposalCode: 'TE-2025-001',
    businessUnit: 'Biologics US',
    templateType: 'Transient Expression',
    description:  '14-day rapid transient expression of 12 anti-CTLA4 lead antibody candidates in HEK293-F. Protein A purification, QC panel, and CTLA4 binding ELISA. Parallel processing for maximum speed.',
    status: 'Sent',
    currentStage: 5,
    stakeholders: ['discovery@gene.com', 'antibody.eng@gene.com'],
  },
];

// ── Helper: TipTap JSON → plain text (for logging) ───────────────────────────
function toText(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.text) return node.text;
  return (node.content || []).map(c => toText(c)).join(' ').replace(/\s+/g, ' ').trim();
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function apiFetch(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  BioPropose Proposal Seed — 1 proposal per template\n');

  // 1. Get all templates
  const templates = await apiFetch('GET', '/templates');
  const templateMap = new Map(templates.map(t => [t.name, t]));
  console.log(`Found ${templates.length} templates in DB\n`);

  // 2. Get existing proposals to check coverage
  const existing = await apiFetch('GET', '/proposals?limit=100');
  const existingCodes = new Set(existing.items.map(p => p.proposalCode));
  console.log(`Found ${existing.total} existing proposals\n`);

  let created = 0, skipped = 0;

  for (const prop of PROPOSALS) {
    if (existingCodes.has(prop.proposalCode)) {
      console.log(`⏭   SKIP  ${prop.proposalCode} — already exists`);
      skipped++;
      continue;
    }

    const template = templateMap.get(prop.templateName);
    if (!template) {
      console.log(`⚠   WARN  Template "${prop.templateName}" not found in DB — skipping`);
      skipped++;
      continue;
    }

    // Create proposal
    let proposal;
    try {
      proposal = await apiFetch('POST', '/proposals', {
        name:                prop.name,
        client:              prop.client,
        bdManager:           prop.bdManager,
        proposalManager:     prop.proposalManager,
        proposalCode:        prop.proposalCode,
        businessUnit:        prop.businessUnit,
        templateType:        prop.templateType,
        description:         prop.description,
        method:              'template',
        templateId:          template.id,
        assignedStakeholders: prop.stakeholders,
        createdBy:           prop.proposalManager,
      });
    } catch (err) {
      console.error(`✗   FAIL  ${prop.proposalCode} — create: ${err.message}`);
      skipped++;
      continue;
    }

    console.log(`✓   CREATED  ${prop.proposalCode} — ${prop.name}`);

    // 3. Get created sections and update each with rich content
    const sections = await apiFetch('GET', `/proposals/${proposal.id}/sections`);
    const content = CONTENT[prop.contentKey];

    if (!content) {
      console.log(`    ⚠  No section content defined for key "${prop.contentKey}"`);
    } else {
      for (const section of sections) {
        const sectionContent = content[section.sectionKey];
        if (!sectionContent) continue;

        try {
          await apiFetch('PUT', `/proposals/${proposal.id}/sections/${section.sectionKey}`, {
            content:   sectionContent,
            updatedBy: prop.proposalManager,
          });
          console.log(`    ✓ section: ${section.sectionKey} (${toText(sectionContent).slice(0, 60)}...)`);
        } catch (err) {
          console.error(`    ✗ section ${section.sectionKey}: ${err.message}`);
        }
      }
    }

    // 4. Advance stage to match desired status
    if (prop.currentStage >= 2) {
      try {
        await apiFetch('POST', `/proposals/${proposal.id}/advance-stage`, {
          advancedBy: prop.proposalManager,
          userName:   prop.proposalManager.split('@')[0].replace('.', ' '),
        });
        console.log(`    ↑ stage advanced to 2`);
      } catch { /* non-fatal */ }
    }
    if (prop.currentStage >= 3) {
      try {
        await apiFetch('POST', `/proposals/${proposal.id}/advance-stage`, {
          advancedBy: prop.proposalManager,
          userName:   prop.proposalManager.split('@')[0].replace('.', ' '),
        });
        console.log(`    ↑ stage advanced to 3`);
      } catch { /* non-fatal */ }
    }
    if (prop.currentStage >= 4) {
      try {
        await apiFetch('POST', `/proposals/${proposal.id}/advance-stage`, {
          advancedBy: prop.proposalManager,
          userName:   prop.proposalManager.split('@')[0].replace('.', ' '),
        });
        console.log(`    ↑ stage advanced to 4`);
      } catch { /* non-fatal */ }
    }
    if (prop.currentStage >= 5) {
      try {
        await apiFetch('POST', `/proposals/${proposal.id}/advance-stage`, {
          advancedBy: prop.proposalManager,
          userName:   prop.proposalManager.split('@')[0].replace('.', ' '),
        });
        console.log(`    ↑ stage advanced to 5`);
      } catch { /* non-fatal */ }
    }

    created++;
    console.log('');
  }

  console.log(`\n✅  Seed complete — created: ${created}, skipped: ${skipped}`);
  console.log('   Triggering Qdrant re-sync...');

  try {
    const sync = await apiFetch('POST', '/ai/sync');
    console.log(`   Sync started: ${JSON.stringify(sync.message)}`);
  } catch (err) {
    console.log(`   Sync trigger failed: ${err.message} (run POST /api/ai/sync manually)`);
  }
}

main().catch(err => { console.error('\n💥 Seed failed:', err); process.exit(1); });
