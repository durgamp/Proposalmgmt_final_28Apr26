import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('templates')
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  name!: string;

  @Column({ name: 'business_unit', type: 'varchar', length: 255 })
  businessUnit!: string;

  @Column({ type: 'varchar', length: 255 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Template sections stored as JSON string
  @Column({ name: 'sections_json', type: 'text', nullable: true })
  sectionsJson!: string;

  get sections(): object[] {
    try { return JSON.parse(this.sectionsJson); } catch { return []; }
  }
  set sections(val: object[]) {
    this.sectionsJson = JSON.stringify(val);
  }

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  toJSON() {
    return {
      id:           this.id,
      name:         this.name,
      businessUnit: this.businessUnit,
      category:     this.category,
      description:  this.description,
      sections:     this.sections,
      isSystem:     this.isSystem,
      createdBy:    this.createdBy,
      createdAt:    this.createdAt,
      updatedAt:    this.updatedAt,
    };
  }
}
