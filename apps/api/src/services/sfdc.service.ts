/**
 * Salesforce (SFDC) integration service.
 *
 * Auth:  OAuth2 Username-Password flow — no user redirect needed.
 * Cache: access token kept in memory with a 4-hour TTL; refreshed on 401.
 * Query: SOQL SELECT on Opportunity, field targeted by SFDC_OPP_SEARCH_FIELD
 *        (default: Name).  Single-quote injection is sanitised before embedding
 *        in the SOQL string.
 */

import { env } from '../config/env';
import { logger } from '../config/logger';

// ── Public shape returned to callers ─────────────────────────────────────────

export interface SfdcOpportunity {
  id:          string;
  name:        string;
  description: string | null;
  accountName: string | null;
  amount:      number | null;
  closeDate:   string | null;
  stageName:   string | null;
}

// ── Token cache ───────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 4 * 60 * 60 * 1_000; // 4 h — refresh before typical session timeout

interface TokenCache {
  accessToken: string;
  instanceUrl: string;
  expiresAt:   number;
}

let tokenCache: TokenCache | null = null;

async function fetchAccessToken(): Promise<TokenCache> {
  const params = new URLSearchParams({
    grant_type:    'password',
    client_id:     env.SFDC_CLIENT_ID!,
    client_secret: env.SFDC_CLIENT_SECRET!,
    username:      env.SFDC_USERNAME!,
    password:      env.SFDC_PASSWORD!,
  });

  const res = await fetch(`${env.SFDC_LOGIN_URL}/services/oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error({ status: res.status, body }, '[SFDC] OAuth token request failed');
    throw new Error('Salesforce authentication failed');
  }

  const data = await res.json() as { access_token: string; instance_url: string };
  logger.info('[SFDC] Access token obtained');
  return {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
    expiresAt:   Date.now() + TOKEN_TTL_MS,
  };
}

async function getAccessToken(): Promise<TokenCache> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache;
  tokenCache = await fetchAccessToken();
  return tokenCache;
}

// ── SOQL injection guard ──────────────────────────────────────────────────────

function escapeSoql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ── Public API ────────────────────────────────────────────────────────────────

export function isSfdcConfigured(): boolean {
  return !!(env.SFDC_CLIENT_ID && env.SFDC_CLIENT_SECRET && env.SFDC_USERNAME && env.SFDC_PASSWORD);
}

export async function getOpportunityByCode(code: string): Promise<SfdcOpportunity | null> {
  const doQuery = async (tok: TokenCache): Promise<Response> => {
    const field = escapeSoql(env.SFDC_OPP_SEARCH_FIELD);
    const val   = escapeSoql(code.trim());
    const soql  = `SELECT Id,Name,Description,Account.Name,Amount,CloseDate,StageName FROM Opportunity WHERE ${field} = '${val}' LIMIT 1`;
    const url   = `${tok.instanceUrl}/services/data/${env.SFDC_API_VERSION}/query?q=${encodeURIComponent(soql)}`;
    return fetch(url, {
      headers: { Authorization: `Bearer ${tok.accessToken}`, Accept: 'application/json' },
    });
  };

  let tok = await getAccessToken();
  let res = await doQuery(tok);

  // Refresh token once on 401 (token may have been revoked externally)
  if (res.status === 401) {
    logger.warn('[SFDC] 401 on query — refreshing token');
    tokenCache = null;
    tok = await getAccessToken();
    res = await doQuery(tok);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error({ status: res.status, body }, '[SFDC] Opportunity query failed');
    throw new Error('Salesforce query failed');
  }

  const data = await res.json() as {
    totalSize: number;
    records: Array<{
      Id:          string;
      Name:        string;
      Description: string | null;
      Account:     { Name: string } | null;
      Amount:      number | null;
      CloseDate:   string | null;
      StageName:   string | null;
    }>;
  };

  if (!data.totalSize || !data.records.length) return null;

  const r = data.records[0];
  return {
    id:          r.Id,
    name:        r.Name,
    description: r.Description,
    accountName: r.Account?.Name ?? null,
    amount:      r.Amount,
    closeDate:   r.CloseDate,
    stageName:   r.StageName,
  };
}

/** Invalidate the cached token (e.g. during test teardown). */
export function invalidateSfdcToken(): void {
  tokenCache = null;
}
