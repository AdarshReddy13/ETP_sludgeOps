import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DailyGenerationRecord,
  SludgeBatch,
  DewateringRecord,
  DispatchRecord,
  CostParameters,
  AlertItem,
  HandlingIssueItem,
} from '../types';
import {
  INITIAL_PLANT_BASELINE_RECORD,
  INITIAL_PLANT_BATCH,
  DEMO_DAILY_RECORDS,
  DEMO_BATCHES,
  DEMO_DEWATERING_RECORDS,
  DEMO_DISPATCH_RECORDS,
  DEMO_HANDLING_ISSUES,
  DEFAULT_COST_PARAMETERS,
} from '../utils/mockData';
import { evaluateSystemAlerts } from '../utils/calculations';

export type AppMode = 'initial' | 'demo';
export type PageId = 'dashboard' | 'generation' | 'characterisation' | 'dewatering' | 'storage' | 'compliance' | 'plant3d';

export interface DateRange {
  label: string;
  startDate: string;
  endDate: string;
}

interface ETPContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  // Data entities
  dailyRecords: DailyGenerationRecord[];
  batches: SludgeBatch[];
  dewateringRecords: DewateringRecord[];
  handlingIssues: HandlingIssueItem[];
  dispatches: DispatchRecord[];
  costParams: CostParameters;
  storageCapacityTonnes: number;
  alerts: AlertItem[];

  // Mutations
  addDailyRecord: (record: Omit<DailyGenerationRecord, 'id'>) => void;
  updateDailyRecord: (id: string, record: Partial<DailyGenerationRecord>) => void;
  deleteDailyRecord: (id: string) => void;

  addBatch: (batch: SludgeBatch) => void;
  updateBatch: (batchId: string, updates: Partial<SludgeBatch>) => void;
  characteriseBatch: (batchId: string, charData: Partial<SludgeBatch>) => void;

  addDewateringRecord: (record: Omit<DewateringRecord, 'id'>) => void;
  addHandlingIssue: (issue: Omit<HandlingIssueItem, 'id'>) => void;
  updateHandlingIssue: (id: string, updates: Partial<HandlingIssueItem>) => void;

  addDispatchRecord: (record: Omit<DispatchRecord, 'id'>) => void;
  updateCostParams: (params: Partial<CostParameters>) => void;

  acknowledgeAlert: (alertId: string) => void;

  // Modal states
  isAddEntryModalOpen: boolean;
  setIsAddEntryModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;

  // Presets
  resetToInitialConfirmedState: () => void;
  loadSampleProductionData: () => void;
}

const ETPContext = createContext<ETPContextType | undefined>(undefined);

const SYNC_QUEUE_KEY = 'etp_sync_queue';

async function sendOrQueueMutation(type: string, payload: unknown): Promise<void> {
  const queueItem = { type, payload, queuedAt: Date.now() };
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Offline');
    }
    const res = await fetch('/api/etp/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
    if (!res.ok) {
      throw new Error(`Sync HTTP ${res.status}`);
    }
  } catch {
    try {
      const existing = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      existing.push(queueItem);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(existing.slice(-50)));
    } catch {
      // Ignore storage quota errors
    }
  }
}

async function flushSyncQueue(): Promise<void> {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return;
    const queue: { type: string; payload: unknown }[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    const remaining: { type: string; payload: unknown }[] = [];
    for (const item of queue) {
      try {
        const res = await fetch('/api/etp/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: item.type, payload: item.payload }),
        });
        if (!res.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    if (remaining.length > 0) {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(SYNC_QUEUE_KEY);
    }
  } catch {
    // Ignore parse errors
  }
}

export const ETPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>('initial');
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const [dateRange, setDateRange] = useState<DateRange>({
    label: 'Last 7 Days',
    startDate: '2026-11-21',
    endDate: '2026-11-27',
  });

  const [dailyRecords, setDailyRecords] = useState<DailyGenerationRecord[]>([INITIAL_PLANT_BASELINE_RECORD]);
  const [batches, setBatches] = useState<SludgeBatch[]>([INITIAL_PLANT_BATCH]);
  const [dewateringRecords, setDewateringRecords] = useState<DewateringRecord[]>([]);
  const [handlingIssues, setHandlingIssues] = useState<HandlingIssueItem[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [costParams, setCostParams] = useState<CostParameters>(DEFAULT_COST_PARAMETERS);
  const [storageCapacityTonnes] = useState<number>(150);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Hydrate records from Supabase (via Express /api/etp/records) on mount and flush offline queue
  useEffect(() => {
    let cancelled = false;

    flushSyncQueue().then(() => {
      fetch('/api/etp/records')
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (cancelled || !data) return;
          if (Array.isArray(data.dailyRecords) && data.dailyRecords.length > 0) {
            setDailyRecords(data.dailyRecords);
          }
          if (Array.isArray(data.batches) && data.batches.length > 0) {
            setBatches(data.batches);
          }
        })
        .catch(() => {
          // Offline or backend sleeping: keep confirmed baseline state
        });
    });

    const handleOnline = () => {
      void flushSyncQueue();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Evaluate alerts whenever data changes
  useEffect(() => {
    const computedAlerts = evaluateSystemAlerts(
      dailyRecords,
      batches,
      dispatches,
      dewateringRecords,
      storageCapacityTonnes
    );
    setAlerts(computedAlerts);
  }, [dailyRecords, batches, dispatches, dewateringRecords, storageCapacityTonnes]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    if (newMode === 'demo') {
      loadSampleProductionData();
    } else {
      resetToInitialConfirmedState();
    }
  };

  const resetToInitialConfirmedState = () => {
    setModeState('initial');
    setDailyRecords([INITIAL_PLANT_BASELINE_RECORD]);
    setBatches([INITIAL_PLANT_BATCH]);
    setDewateringRecords([]);
    setHandlingIssues([]);
    setDispatches([]);
  };

  const loadSampleProductionData = () => {
    setModeState('demo');
    setDailyRecords(DEMO_DAILY_RECORDS);
    setBatches(DEMO_BATCHES);
    setDewateringRecords(DEMO_DEWATERING_RECORDS);
    setHandlingIssues(DEMO_HANDLING_ISSUES);
    setDispatches(DEMO_DISPATCH_RECORDS);
  };

  const addDailyRecord = (newRec: Omit<DailyGenerationRecord, 'id'>) => {
    const record: DailyGenerationRecord = {
      ...newRec,
      id: `rec-${Date.now()}`,
    };
    setDailyRecords(prev => [record, ...prev]);
    void sendOrQueueMutation('ADD_DAILY_RECORD', record);

    if (record.wetSludgeGenerated && record.wetSludgeGenerated > 0) {
      const generatedTonnes = Number((record.wetSludgeGenerated / 1000).toFixed(2));
      const newBatch: SludgeBatch = {
        batchId: `SLG-${record.date.replace(/-/g, '')}-B01`,
        dateGenerated: record.date,
        sludgeSource: record.sludgeSource,
        quantityTonnes: generatedTonnes,
        pH: record.influentPH,
        moisturePct: record.sludgeMoisture,
        codMgKg: record.influentCOD,
        oilAndGreaseMgKg: null,
        heavyMetals: { chromium: null, nickel: null, copper: null, zinc: null, lead: null, cadmium: null },
        phenolMgKg: null,
        sulphideMgKg: null,
        tclpResult: 'Pending',
        testReportFileName: null,
        classificationStatus: 'pending',
        currentStage: 'Generated',
        daysInStorage: 0,
        storageLocation: 'Wet Sludge Holding Tank',
      };
      setBatches(prev => [newBatch, ...prev]);
      void sendOrQueueMutation('ADD_BATCH', newBatch);
    }
  };

  const updateDailyRecord = (id: string, updates: Partial<DailyGenerationRecord>) => {
    setDailyRecords(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          void sendOrQueueMutation('UPDATE_DAILY_RECORD', updated);
          return updated;
        }
        return r;
      })
    );
  };

  const deleteDailyRecord = (id: string) => {
    setDailyRecords(prev => prev.filter(r => r.id !== id));
    void sendOrQueueMutation('DELETE_DAILY_RECORD', { id });
  };

  const addBatch = (batch: SludgeBatch) => {
    setBatches(prev => [batch, ...prev]);
    void sendOrQueueMutation('ADD_BATCH', batch);
  };

  const updateBatch = (batchId: string, updates: Partial<SludgeBatch>) => {
    setBatches(prev =>
      prev.map(b => {
        if (b.batchId === batchId) {
          const updated = { ...b, ...updates };
          void sendOrQueueMutation('UPDATE_BATCH', updated);
          return updated;
        }
        return b;
      })
    );
  };

  const characteriseBatch = (batchId: string, charData: Partial<SludgeBatch>) => {
    setBatches(prev =>
      prev.map(b => {
        if (b.batchId === batchId) {
          const updated = { ...b, ...charData };
          if (updated.currentStage === 'Generated') {
            updated.currentStage = 'Characterised';
          }
          void sendOrQueueMutation('UPDATE_BATCH', updated);
          return updated;
        }
        return b;
      })
    );
  };

  const addDewateringRecord = (newDew: Omit<DewateringRecord, 'id'>) => {
    const record: DewateringRecord = {
      ...newDew,
      id: `dew-${Date.now()}`,
    };
    setDewateringRecords(prev => [record, ...prev]);

    // If handling difficulty is attention or critical, auto-log a handling issue
    if (record.handlingDifficulty !== 'normal') {
      const newIssue: HandlingIssueItem = {
        id: `iss-${Date.now()}`,
        date: record.date,
        batchId: record.batchId,
        facility: record.facility || 'Unit 4 - Chemical Coagulation',
        sludgeSource: 'Dewatering Press',
        issueType: record.handlingIssueObserved || `${record.sludgeConsistency} sludge handling resistance`,
        processStage: 'Dewatering',
        severity: record.handlingDifficulty === 'critical' ? 'critical' : 'warning',
        priority: record.handlingDifficulty === 'critical' ? 'High' : 'Medium',
        problemDescription: `Observed ${record.handlingIssueObserved || `${record.sludgeConsistency} sludge handling resistance`} during ${record.method} dewatering run.`,
        operationalImpact: 'Filtration cycle turnaround time lengthened and cake discharge release hindered.',
        environmentalImpact: 'Elevated cake moisture or filtrate TSS increases hydraulic/solids recycling footprint.',
        possibleCause: record.cakeMoisturePct > 75
          ? `High cake moisture (${record.cakeMoisturePct}%) and ${record.sludgeConsistency} consistency`
          : `Filtrate solids elevation (${record.filtrateTssMgL} mg/L)`,
        recommendedAction: record.sludgeConsistency === 'sticky' || record.sludgeConsistency === 'oily'
          ? 'Review oil removal, polymer type and dewatering method'
          : 'Check polymer dose, floc formation, filter cloth condition and feed loading',
        status: 'Open',
      };
      setHandlingIssues(prev => [newIssue, ...prev]);
    }

    setBatches(prev =>
      prev.map(b => {
        if (b.batchId === record.batchId) {
          const updated: SludgeBatch = {
            ...b,
            currentStage: 'Dewatered',
            moisturePct: record.cakeMoisturePct,
            quantityTonnes: record.dewateredCakeTonnes,
            storageLocation: 'Covered Storage Yard',
          };
          void sendOrQueueMutation('UPDATE_BATCH', updated);
          return updated;
        }
        return b;
      })
    );
  };

  const addHandlingIssue = (issue: Omit<HandlingIssueItem, 'id'>) => {
    const item: HandlingIssueItem = {
      ...issue,
      id: `iss-${Date.now()}`,
    };
    setHandlingIssues(prev => [item, ...prev]);
  };

  const updateHandlingIssue = (id: string, updates: Partial<HandlingIssueItem>) => {
    setHandlingIssues(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
  };

  const addDispatchRecord = (newDisp: Omit<DispatchRecord, 'id'>) => {
    const record: DispatchRecord = {
      ...newDisp,
      id: `disp-${Date.now()}`,
    };
    setDispatches(prev => [record, ...prev]);

    setBatches(prev =>
      prev.map(b => {
        if (b.batchId === record.batchId) {
          const updated: SludgeBatch = {
            ...b,
            currentStage: 'Disposed',
            storageLocation: `Dispatched: ${record.facility}`,
          };
          void sendOrQueueMutation('UPDATE_BATCH', updated);
          return updated;
        }
        return b;
      })
    );
  };

  const updateCostParams = (params: Partial<CostParameters>) => {
    setCostParams(prev => ({ ...prev, ...params }));
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, acknowledged: true } : a)));
  };

  return (
    <ETPContext.Provider
      value={{
        mode,
        setMode,
        activePage,
        setActivePage,
        dateRange,
        setDateRange,
        dailyRecords,
        batches,
        dewateringRecords,
        handlingIssues,
        dispatches,
        costParams,
        storageCapacityTonnes,
        alerts,
        addDailyRecord,
        updateDailyRecord,
        deleteDailyRecord,
        addBatch,
        updateBatch,
        characteriseBatch,
        addDewateringRecord,
        addHandlingIssue,
        updateHandlingIssue,
        addDispatchRecord,
        updateCostParams,
        acknowledgeAlert,
        isAddEntryModalOpen,
        setIsAddEntryModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        resetToInitialConfirmedState,
        loadSampleProductionData,
      }}
    >
      {children}
    </ETPContext.Provider>
  );
};

export const useETP = () => {
  const context = useContext(ETPContext);
  if (!context) {
    throw new Error('useETP must be used within an ETPProvider');
  }
  return context;
};
