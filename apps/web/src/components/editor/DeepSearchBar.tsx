import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { aiApi } from '../../services/api';
import type { SemanticSearchResult } from '../../services/api';

interface DeepSearchBarProps {
  sectionKey:         string;
  sectionTitle:       string;
  currentProposalId?: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreColor(score: number): string {
  if (score >= 0.85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 0.65) return 'text-blue-600 bg-blue-50 border-blue-200';
  return 'text-gray-500 bg-gray-50 border-gray-200';
}

function statusColor(status: string): string {
  if (status === 'Approved') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'Draft')    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (status === 'Sent')     return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

export function DeepSearchBar({ sectionKey, sectionTitle, currentProposalId }: DeepSearchBarProps) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [query,     setQuery]     = useState('');
  const [searching, setSearching] = useState(false);
  const [results,   setResults]   = useState<SemanticSearchResult[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setError(null); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const data = await aiApi.search({
          query:              q.trim(),
          sectionKey,
          limit:              15,
          excludeProposalId:  currentProposalId,
        });
        setResults(data.results ?? []);
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? 'Search failed';
        if (msg.includes('unavailable') || msg.includes('503')) {
          setError('Semantic index not ready — try again after syncing from the AI settings.');
        } else {
          setError('Search failed. Please try again.');
        }
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [sectionKey, currentProposalId]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors border border-gray-200"
        title={`Semantic deep search in ${sectionTitle}`}
      >
        <Sparkles size={12} className="text-brand-600" />
        Deep Search
      </button>

      {isOpen && (
        <div className="absolute top-9 right-0 w-[440px] bg-white shadow-xl border-2 border-brand-600 rounded-lg z-50 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-600" />
              <span className="text-xs font-semibold text-gray-700">Semantic Deep Search</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>

          {/* Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              className="input pl-9 pr-9 text-sm"
              placeholder={`Describe what you're looking for in ${sectionTitle}...`}
              value={query}
              onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value); }}
            />
            {query && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => { setQuery(''); setResults([]); setError(null); }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching with embeddings...
              </div>
            ) : error ? (
              <div className="text-center py-6 text-sm text-amber-600 bg-amber-50 rounded-lg px-4">
                {error}
              </div>
            ) : query && results.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-500">No similar proposals found</p>
            ) : results.length > 0 ? (
              <>
                <p className="text-xs text-gray-400 mb-2">
                  {results.length} semantically similar proposal{results.length !== 1 ? 's' : ''}
                </p>
                {results.map((r) => (
                  <div
                    key={r.proposalId}
                    onClick={() => window.open(`/proposals/${r.proposalId}`, '_blank')}
                    className="p-3 border border-gray-200 rounded-lg hover:border-brand-600 hover:bg-blue-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">{r.proposalName}</span>
                        <ExternalLink size={11} className="text-gray-400 group-hover:text-brand-700 flex-shrink-0" />
                      </div>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${scoreColor(r.score)}`}>
                        {Math.round(r.score * 100)}% match
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs border border-gray-200 bg-gray-50 text-gray-600 font-mono">
                        {r.proposalCode}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                      {r.businessUnit && (
                        <span className="text-xs text-gray-400 truncate">{r.businessUnit}</span>
                      )}
                    </div>

                    {r.plainText && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{r.plainText}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{r.client}</span>
                      <span>{formatDate(r.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-brand-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Semantic search</p>
                <p className="text-xs text-gray-400 mt-1">
                  Describe what you need — finds proposals by meaning, not just keywords
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
