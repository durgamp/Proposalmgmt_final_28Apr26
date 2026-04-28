import { dal } from '../clients/dal.client';
import type { AuditPayload } from '../clients/dal.client';
import type { AuditLogEntity } from '@biopropose/database';
import { AuditAction } from '@biopropose/shared-types';

export interface CreateAuditParams {
  proposalId?: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  details: string;
  changes?: object;
  snapshot?: object;
}

export class AuditService {
  async log(params: CreateAuditParams): Promise<AuditLogEntity> {
    const payload: AuditPayload = {
      proposalId: params.proposalId,
      userEmail:  params.userEmail,
      userName:   params.userName,
      action:     params.action,
      details:    params.details,
    };
    if (params.changes)  payload.changes  = params.changes;
    if (params.snapshot) payload.snapshot = params.snapshot;
    return dal.logAudit(payload) as Promise<AuditLogEntity>;
  }

  async getByProposal(proposalId: string, page = 1, limit = 50) {
    return dal.getAuditLogs(proposalId, page, limit);
  }

  async getAll(page = 1, limit = 50) {
    return dal.getAllAuditLogs(page, limit);
  }
}

export const auditService = new AuditService();
