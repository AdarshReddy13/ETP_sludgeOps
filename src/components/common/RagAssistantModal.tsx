/**
 * ETP SludgeOps — Regulatory RAG Assistant Modal
 *
 * Implements Retrieval-Augmented Generation (RAG) over official Indian environmental statutes:
 * - MoEFCC HOWM Rules 2016
 * - KSPCB Consent to Operate No. 782
 * - CPCB Cement AFR Co-Processing Guidelines 2021
 * - Approved NABL Laboratory Standards
 *
 * Crafted using 'unslop' principles:
 * - Quiet industrial chrome, neutral slate ramp, 1px hairlines.
 * - Monospace citations and gazette references.
 * - Zero speculative hallucination: every clause grounded in indexed passages.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  Scale,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Loader2,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { queryRag, getRagIndexStatus, reindexRag, RagAnswerResponse, RagCitation } from '../../services/groqService';
import clsx from 'clsx';

interface RagAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const PRESET_QUERIES = [
  'What is the maximum on-site storage duration for hazardous sludge under HOWM Rule 8 and what is the penalty?',
  'What are the statutory concentration limits for Lead, Cadmium, and Chromium under Schedule II?',
  'Can ETP chemical sludge with 74% moisture be sent for direct cement kiln co-processing under CPCB guidelines?',
  'What manifest requirements apply under HOWM Rule 18 for highway transportation of hazardous sludge?',
  'What are the retention capacity limits for the dedicated RCC storage shed under KSPCB Consent No. 782?',
];

export const RagAssistantModal: React.FC<RagAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagAnswerResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [indexStatus, setIndexStatus] = useState<{
    indexedChunksCount: number;
    documentCount: number;
    model: string;
    mode: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getRagIndexStatus()
        .then(res => setIndexStatus(res))
        .catch(() => {});
      if (initialQuery && !result) {
        handleExecuteQuery(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleExecuteQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await queryRag(queryText.trim());
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'RAG query failed. Ensure backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteQuery(query);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header — quiet industrial slate */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white uppercase">
                  Regulatory RAG Knowledge Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                  AUDIT-GROUNDED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Retrieval-Augmented Generation across verified MoEFCC, KSPCB & CPCB statutory provisions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {indexStatus && (
              <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-800 border border-slate-700">
                {indexStatus.indexedChunksCount} Statutory Chunks Active
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Query Input Section */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask any environmental legal question (e.g. storage limits, manifest rules, TCLP thresholds)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 text-slate-300" />
              )}
              <span>{loading ? 'Retrieving…' : 'Query Statutes'}</span>
            </button>
          </form>

          {/* Quick Preset Queries */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-500 font-semibold shrink-0">Preset Inquiries:</span>
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(preset);
                  handleExecuteQuery(preset);
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded-lg text-slate-700 whitespace-nowrap transition-colors cursor-pointer"
              >
                {preset.slice(0, 48)}…
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-3">
              <AlertOctagon className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">RAG Query Error:</span>
                <span className="block mt-0.5">{error}</span>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Ground-Truth Environmental Legal Search</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Enter an operational question or select one of the presets above. The RAG engine indexes official gazettes and consent orders to synthesize citations and legal penalty implications.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-slate-800 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Retrieving Statutory Passages & Synthesizing Answer…
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Matching query terms against BM25 corpus & invoking Groq LLM
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Direct Grounded Answer */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Statutory Compliance Determination
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                      Model: {result.model}
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Confidence: {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {result.answer}
                </div>

                {result.legalImplication && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2.5 mt-3">
                    <AlertOctagon className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Statutory Legal Penalty: </span>
                      {result.legalImplication}
                    </div>
                  </div>
                )}
              </div>

              {/* Retrieved Statutory Passages / Citations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Retrieved Ground-Truth Sources ({result.citations.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Zero Hallucination Proof
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.citations.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {c.authority} • {c.sectionOrRule}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Source #{i + 1}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 leading-snug">
                        {c.documentTitle}
                      </div>

                      <div className="text-[11px] text-slate-600 font-mono leading-relaxed bg-white p-2 rounded border border-slate-200">
                        "{c.snippet}"
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium">
                        Citation: {c.citation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50 text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            Statutory Authority: MoEFCC (HOWM 2016), CPCB, KSPCB
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
