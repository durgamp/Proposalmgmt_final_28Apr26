import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuid } from 'uuid';

/**
 * Adds the 'Flow Chart' section (sortOrder=3) to every existing proposal
 * that does not already have it, and shifts Project Details / Terms & Conditions
 * up by one sort position.
 */
export class AddFlowchartSection1745000000000 implements MigrationInterface {
  name = 'AddFlowchartSection1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Shift existing sections that will be displaced
    await queryRunner.query(
      `UPDATE proposal_sections SET sort_order = sort_order + 1
       WHERE sort_order >= 3 AND section_key != 'flowchart'`,
    );

    // Insert the flowchart section for every proposal that doesn't have one yet
    const proposals = await queryRunner.query(
      `SELECT p.id FROM proposals p
       WHERE p.id NOT IN (
         SELECT ps.proposal_id FROM proposal_sections ps WHERE ps.section_key = 'flowchart'
       )`,
    ) as { id: string }[];

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    for (const { id } of proposals) {
      await queryRunner.query(
        `INSERT INTO proposal_sections
           (id, proposal_id, section_key, title, contentJson, sort_order, is_complete, is_locked, created_at, updated_at)
         VALUES (?, ?, 'flowchart', 'Flow Chart', '{}', 3, false, false, ?, ?)`,
        [uuid(), id, now, now],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM proposal_sections WHERE section_key = 'flowchart'`);
    await queryRunner.query(
      `UPDATE proposal_sections SET sort_order = sort_order - 1
       WHERE sort_order >= 4`,
    );
  }
}
