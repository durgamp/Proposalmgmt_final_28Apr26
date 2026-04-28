import path from 'path';
import fs from 'fs/promises';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { dal } from '../clients/dal.client';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { ExportDto } from '../validators/cost.validators';
import type { ProposalEntity, ProposalSectionEntity, CostItemEntity } from '@biopropose/database';

export class ExportService {
  private async loadProposalData(proposalId: string) {
    const proposal = await dal.getProposalById(proposalId) as ProposalEntity;
    if (!proposal) throw new AppError(404, `Proposal ${proposalId} not found`, 'NOT_FOUND');
    const sections = await dal.getSections(proposalId) as ProposalSectionEntity[];
    const costs    = await dal.getCosts(proposalId) as CostItemEntity[];
    return { proposal, sections, costs };
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private extractTextFromContent(content: unknown): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      const node = content as { type?: string; text?: string; content?: unknown[] };
      if (node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((c) => this.extractTextFromContent(c)).join('\n');
      }
    }
    return '';
  }

  async exportPdf(proposalId: string, dto: ExportDto): Promise<{ filePath: string; fileName: string }> {
    const { proposal, sections, costs } = await this.loadProposalData(proposalId);
    await fs.mkdir(env.EXPORT_DIR, { recursive: true });

    const fileName = `${proposal.proposalCode}-${Date.now()}.pdf`;
    const filePath = path.join(env.EXPORT_DIR, fileName);
    const html     = this.buildHtml(proposal, sections, costs, dto);

    try {
      const puppeteer = await import('puppeteer');
      const browser   = await puppeteer.default.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({ path: filePath, format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }, printBackground: true });
      await browser.close();
    } catch (err) {
      logger.error({ err }, '[Export] Puppeteer PDF generation failed');
      throw new AppError(500, 'PDF generation failed. Ensure Puppeteer is installed.', 'EXPORT_ERROR');
    }

    await this.recordExport(proposalId, fileName, filePath, 'pdf', dto.exportedBy);
    logger.info(`[Export] PDF exported: ${fileName}`);
    return { filePath, fileName };
  }

  async exportWord(proposalId: string, dto: ExportDto): Promise<{ filePath: string; fileName: string }> {
    const { proposal, sections, costs } = await this.loadProposalData(proposalId);
    await fs.mkdir(env.EXPORT_DIR, { recursive: true });

    const fileName = `${proposal.proposalCode}-${Date.now()}.docx`;
    const filePath = path.join(env.EXPORT_DIR, fileName);
    const doc      = this.buildDocx(proposal, sections, costs, dto);
    const buffer   = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);

    await this.recordExport(proposalId, fileName, filePath, 'docx', dto.exportedBy);
    logger.info(`[Export] DOCX exported: ${fileName}`);
    return { filePath, fileName };
  }

  private buildHtml(proposal: ProposalEntity, sections: ProposalSectionEntity[], costs: CostItemEntity[], dto: ExportDto): string {
    const e = this.escapeHtml.bind(this);
    const sectionHtml = sections
      .filter((s) => !dto.includeSections || dto.includeSections.includes(s.sectionKey))
      .map((s) => {
        const text = e(this.extractTextFromContent(s.content));
        return `<div class="section"><h2>${e(s.title)}</h2><div class="section-content">${text.replace(/\n/g, '<br/>')}</div></div>`;
      }).join('');
    const costHtml = dto.includeCosts && costs.length > 0
      ? `<div class="section"><h2>Cost Breakdown</h2><table><thead><tr><th>Category</th><th>Description</th><th>Stage</th><th>Qty</th><th>Total</th></tr></thead><tbody>${
          costs.map((c) => `<tr><td>${e(c.category)}</td><td>${e(c.description)}</td><td>${e(c.stage ?? '-')}</td><td>${c.quantity}</td><td>$${c.totalCost.toLocaleString()}</td></tr>`).join('')
        }</tbody><tfoot><tr><td colspan="4"><strong>Grand Total</strong></td><td><strong>$${costs.reduce((s, i) => s + i.totalCost, 0).toLocaleString()}</strong></td></tr></tfoot></table></div>`
      : '';
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><style>body{font-family:Arial,sans-serif;font-size:11pt;color:#1a1a1a;line-height:1.6;}.cover{text-align:center;padding:80px 40px;page-break-after:always;}.cover h1{font-size:28pt;color:#1e3a5f;margin-bottom:12px;}.cover p{font-size:13pt;color:#555;}.section{margin-bottom:32px;page-break-inside:avoid;}h2{font-size:16pt;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:12px;}th{background:#1e3a5f;color:white;padding:8px;text-align:left;}td{padding:6px 8px;border:1px solid #ddd;}tr:nth-child(even) td{background:#f5f7fa;}tfoot td{background:#eef2f7;font-weight:bold;}</style></head><body><div class="cover"><h1>${e(proposal.name)}</h1><p><strong>Client:</strong> ${e(proposal.client)}</p><p><strong>Proposal Code:</strong> ${e(proposal.proposalCode)}</p><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>${proposal.bdManager ? `<p><strong>BD Manager:</strong> ${e(proposal.bdManager)}</p>` : ''}</div>${sectionHtml}${costHtml}</body></html>`;
  }

  private buildDocx(proposal: ProposalEntity, sections: ProposalSectionEntity[], costs: CostItemEntity[], dto: ExportDto): Document {
    const children: (Paragraph | Table)[] = [
      new Paragraph({ text: proposal.name, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `Client: ${proposal.client}`, size: 24 })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `Proposal Code: ${proposal.proposalCode}`, size: 24 })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString()}`, size: 24 })], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: '', pageBreakBefore: true }),
    ];

    for (const section of sections.filter((s) => !dto.includeSections || dto.includeSections.includes(s.sectionKey))) {
      const text = this.extractTextFromContent(section.content);
      children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
      for (const line of text.split('\n')) children.push(new Paragraph({ text: line || '' }));
      children.push(new Paragraph({ text: '' }));
    }

    if (dto.includeCosts && costs.length > 0) {
      children.push(new Paragraph({ text: 'Cost Breakdown', heading: HeadingLevel.HEADING_1 }));
      const grandTotal = costs.reduce((s, i) => s + i.totalCost, 0);
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1 }, insideVertical: { style: BorderStyle.SINGLE, size: 1 } },
        rows: [
          new TableRow({ children: ['Category', 'Description', 'Stage', 'Qty', 'Total'].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })], shading: { fill: '1e3a5f', color: 'ffffff' } })) }),
          ...costs.map((c) => new TableRow({ children: [new TableCell({ children: [new Paragraph(c.category)] }), new TableCell({ children: [new Paragraph(c.description)] }), new TableCell({ children: [new Paragraph(c.stage ?? '-')] }), new TableCell({ children: [new Paragraph(String(c.quantity))] }), new TableCell({ children: [new Paragraph(`$${c.totalCost.toLocaleString()}`)] })] })),
          new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Grand Total', bold: true })] })], columnSpan: 4 }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${grandTotal.toLocaleString()}`, bold: true })] })] })] }),
        ],
      }));
    }

    return new Document({ sections: [{ properties: {}, children }] });
  }

  async getExports(proposalId: string) {
    return dal.getExports(proposalId);
  }

  private async recordExport(proposalId: string, fileName: string, filePath: string, format: 'pdf' | 'docx', exportedBy: string): Promise<void> {
    await dal.recordExport({ proposalId, filename: fileName, fileUrl: filePath, format, exportedBy });
  }
}

export const exportService = new ExportService();
