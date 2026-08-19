import { create } from "zustand";

export interface TelemetryData {
  timestamp: string;
  heart_rate: number;
  blood_oxygen: number;
  core_temperature: number;
  glucose_level: number;
  stress_index: number;
  organ_strain?: {
    brain: number;
    heart: number;
    lungs: number;
    liver: number;
    kidneys?: number;
    stomach?: number;
  };
  circadian_offset?: number;
  toxic_load?: number;
  is_anomalous?: boolean;
}

export interface MetabolicLog {
  calories: number;
  hydration: number;
  protein: number;
  carbs: number;
  fat: number;
  glucose_curve: number[];
}

export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
}

export interface GeneticSwitches {
  apoe4: boolean;
  foxo3: boolean;
  sirt1: boolean;
  brca1: boolean;
}

export interface SupplementLog {
  id: number;
  user_id: string;
  compound_name: string;
  intake_time: string;
  dosage_mg: number;
  half_life_hours: number;
  decay_curve: string;
}

interface BiometricStore {
  user: UserProfile | null;
  telemetryStream: TelemetryData[];
  latestTelemetry: TelemetryData | null;
  metabolicLog: MetabolicLog | null;
  geneticSwitches: GeneticSwitches | null;
  supplements: SupplementLog[];
  alerts: string[];
  selectedAnomalyNode: string | null;
  wsConnected: boolean;
  
  // Advanced Console States
  sidebarCollapsed: boolean;
  organZoomTarget: string | null;
  circadianScrubTime: number; // 0-23 timeline offset scrubbed by user
  
  setUser: (user: UserProfile | null) => void;
  setMetabolicLog: (log: MetabolicLog) => void;
  setGeneticSwitches: (switches: GeneticSwitches) => void;
  setSupplements: (supplements: SupplementLog[]) => void;
  addTelemetryFrame: (frame: TelemetryData) => void;
  setWsConnected: (connected: boolean) => void;
  setSelectedAnomalyNode: (nodeId: string | null) => void;
  clearAlerts: () => void;
  triggerMockUpdate: (patch: Partial<MetabolicLog>) => void;
  
  // Advanced Console Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setOrganZoomTarget: (target: string | null) => void;
  setCircadianScrubTime: (time: number) => void;
  addSupplement: (supplement: SupplementLog) => void;
}

export const useBiometricStore = create<BiometricStore>((set) => ({
  user: null,
  telemetryStream: [],
  latestTelemetry: null,
  metabolicLog: null,
  geneticSwitches: null,
  supplements: [],
  alerts: [],
  selectedAnomalyNode: null,
  wsConnected: false,
  
  sidebarCollapsed: true, // Default collapsed
  organZoomTarget: null,
  circadianScrubTime: 8, // Default 08:00 AM

  setUser: (user) => set({ user }),
  
  setMetabolicLog: (log) => set({ metabolicLog: log }),
  
  setGeneticSwitches: (switches) => set({ geneticSwitches: switches }),
  
  setSupplements: (supplements) => set({ supplements }),

  addTelemetryFrame: (frame) => set((state) => {
    const currentAlerts = [...state.alerts];
    
    if (frame.heart_rate > 120 && !currentAlerts.includes("Tachycardia detected: Heart rate > 120 BPM")) {
      currentAlerts.push("Tachycardia detected: Heart rate > 120 BPM");
    } else if (frame.heart_rate <= 120) {
      const idx = currentAlerts.indexOf("Tachycardia detected: Heart rate > 120 BPM");
      if (idx > -1) currentAlerts.splice(idx, 1);
    }
    
    if (frame.blood_oxygen < 95 && !currentAlerts.includes("Hypoxemia risk: SpO2 level < 95%")) {
      currentAlerts.push("Hypoxemia risk: SpO2 level < 95%");
    } else if (frame.blood_oxygen >= 95) {
      const idx = currentAlerts.indexOf("Hypoxemia risk: SpO2 level < 95%");
      if (idx > -1) currentAlerts.splice(idx, 1);
    }

    if (frame.stress_index > 80 && !currentAlerts.includes("High neural strain: Metabolic index > 80")) {
      currentAlerts.push("High neural strain: Metabolic index > 80");
    } else if (frame.stress_index <= 80) {
      const idx = currentAlerts.indexOf("High neural strain: Metabolic index > 80");
      if (idx > -1) currentAlerts.splice(idx, 1);
    }

    // Check organ strains for critical thresholds (>80)
    if (frame.organ_strain) {
      const { brain, heart } = frame.organ_strain;
      if (brain > 80 && !currentAlerts.includes("CRITICAL STRESS: Brain overload detected")) {
        currentAlerts.push("CRITICAL STRESS: Brain overload detected");
      }
      if (heart > 80 && !currentAlerts.includes("CARDIO LOAD: Tachycardia strain detected")) {
        currentAlerts.push("CARDIO LOAD: Tachycardia strain detected");
      }
    }

    const updatedStream = [...state.telemetryStream, {
      ...frame,
      is_anomalous: frame.heart_rate > 120 || frame.blood_oxygen < 95
    }].slice(-50);

    return {
      telemetryStream: updatedStream,
      latestTelemetry: frame,
      alerts: currentAlerts,
      // Update circadian offset automatically from stream if user is not active scrubbing
      circadianScrubTime: frame.circadian_offset !== undefined ? frame.circadian_offset : state.circadianScrubTime
    };
  }),

  setWsConnected: (connected) => set({ wsConnected: connected }),
  
  setSelectedAnomalyNode: (nodeId) => set({ selectedAnomalyNode: nodeId }),
  
  clearAlerts: () => set({ alerts: [] }),

  triggerMockUpdate: (patch) => set((state) => {
    if (!state.metabolicLog) return {};
    return {
      metabolicLog: {
        ...state.metabolicLog,
        ...patch
      }
    };
  }),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  setOrganZoomTarget: (target) => set({ organZoomTarget: target }),
  
  setCircadianScrubTime: (time) => set({ circadianScrubTime: time }),
  
  addSupplement: (supplement) => set((state) => ({
    supplements: [...state.supplements, supplement]
  }))
}));
