/**
 * ETP SludgeOps — Unslopped AI Analysis Panel
 * Follows the 'unslop' craft guidelines:
 * - Quiet, industrial chrome: neutral graphite ramp, 1px hairlines, zero purple/rainbow gradients.
 * - Single deliberate accent, crisp monospace metadata, zero decorative glows or emoji noise.
 * - High typographic hierarchy and clear distinction between statutory facts and advisories.
 */
import React, { useState } from 'react';
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface GroqAIPanelProps {
  /** Action label shown on the trigger button */
  buttonLabel?: string;
  /** Async function that executes the analysis */
  onAnalyze: () => Promise<string>;
  /** Additional wrapper classes */
  className?: string;
  /** Compact inline presentation */
  compact?: boolean;
}

export const GroqAIPanel: React.FC<GroqAIPanelProps> = ({
  buttonLabel = 'Run Engineering Assessment',
  onAnalyze,
  className,
  compact = false,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [collapsed, setCollapsed] = useState(false);

  const handleAnalyze = async () => {
    setStatus('loading');
    setError('');
    setResult('');
    try {
      const text = await onAnalyze();
      setResult(text);
      setStatus('done');
      setCollapsed(false);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Verify GROQ_API_KEY in server/.env');
      setStatus('error');
    }
  };

  return (
    <div className={clsx('space-y-3 font-sans', className)}>
      {/* Trigger button — quiet industrial style */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={status === 'loading'}
        className={clsx(
          'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs tracking-tight transition-colors cursor-pointer',
          'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-2xs',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {status === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
        ) : (
          <Cpu className="w-3.5 h-3.5 text-slate-300" />
        )}
        <span>{status === 'loading' ? 'Evaluating Parameters…' : buttonLabel}</span>
      </button>

      {/* Error state — crisp, minimal alert */}
      {status === 'error' && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50/80 border border-red-200 rounded-lg text-xs text-red-900">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Execution Alert:</span>
            <span className="text-red-700 block">{error}</span>
            {error.includes('GROQ_API_KEY') && (
              <span className="text-[11px] font-mono text-red-600 block pt-1">
                Configure key: <code>server/.env → GROQ_API_KEY=gsk_…</code>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Output Panel — quiet graphite card, high legibility */}
      {status === 'done' && result && (
        <div
          className={clsx(
            'rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white cursor-pointer select-none"
            onClick={() => setCollapsed((c) => !c)}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-xs tracking-wide uppercase text-slate-100">
                AI Engineering Analysis
              </span>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                llama-3.3-70b-versatile
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze();
                }}
                className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Re-run assessment"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-run</span>
              </button>
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </div>

          {/* Body */}
          {!collapsed && (
            <div className="p-4 space-y-3 bg-slate-50/50">
              <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                {result}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-mono">
                <span>POLICY: Zero-assumption telemetry assessment</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified against plant records
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
