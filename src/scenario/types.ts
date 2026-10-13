export type Responsibility =
  'presentation' | 'intent' | 'orchestrator' | 'executor' | 'collector' | 'observability';
export type Party = Responsibility | 'network';
export type Surface = 'faultMgmt' | 'itsm' | 'portal' | 'perfMgmt' | 'api';
export type Status = 'HEALTHY' | 'DEGRADED' | 'VIOLATED' | 'CLEARED';
export type Marker = 'IN_SYNC' | 'UNCHANGED' | 'COMPLETED';
export type View = 'simple' | 'technical';
export type Text = Record<View, string>;
export type Chapter = 'provision' | 'detect' | 'remediate';

export type KindId =
  | 'serviceRequest'
  | 'intentRequest'
  | 'serviceIntent'
  | 'networkIntent'
  | 'desiredState'
  | 'sloDefinition'
  | 'sloRule'
  | 'workflow'
  | 'remediationDecision'
  | 'applyRequest'
  | 'repairRequest'
  | 'configChange'
  | 'rawSignals'
  | 'observedState'
  | 'normalized'
  | 'enriched'
  | 'sli'
  | 'evidence'
  | 'serviceState'
  | 'event'
  | 'pathHealth';

/** The amended signal vocabulary of brief 02 (ADR 0001). */
export type SignalId =
  | 'desiredStateReady'
  | 'onboard'
  | 'onboarded'
  | 'applied'
  | 'readBack'
  | 'readBackDone'
  | 'checkConformance'
  | 'inSync'
  | 'queryAltPath';

export type WorkVerb =
  | 'record'
  | 'derive'
  | 'checkConformance'
  | 'render'
  | 'apply'
  | 'collect'
  | 'normalize'
  | 'enrich'
  | 'readBack'
  | 'configureSlo'
  | 'computeSli'
  | 'correlate'
  | 'evaluate'
  | 'raiseEvent'
  | 'clearEvent'
  | 'assessPath'
  | 'startWorkflow'
  | 'completeWorkflow'
  | 'evaluatePolicy';

export interface ResponsibilityInfo {
  id: Party;
  name: string;
  role: string;
  does: string[];
  doesNot: string[];
}

export interface ArtifactKind {
  id: KindId;
  name: string;
  producer: Party;
  consumers: Party[];
  /** For each consumer: why it needs this artifact (the inspector's handoff view). */
  uses?: Partial<Record<Party, string>>;
  whatItIs: string;
  /** The Presentation surface that produces it (the Portal for the service request). */
  producerSurface?: Surface;
  /** For Orchestrator's own artifacts that request work: the signal that answers them. */
  answeredBy?: SignalId;
}

export interface ArtifactVersion {
  id: string;
  kind: KindId;
  label: string;
  status?: Status;
  lineage: string[];
  /** For an apply request: the desired-state version it names (a reference, not content; ADR 0002). */
  names?: string;
  meaning: string;
  technical: string[];
}

export interface SignalInfo {
  id: SignalId;
  label: string;
  asks: string;
  /** For request signals: the signal or artifact kind that answers them. */
  answeredBy?: SignalId | KindId;
}

export type Event =
  /** `version` is the id of the desired-state version the signal is about, for example 'ds1'. */
  | { t: 'signal'; signal: SignalId; from: Party; to: Party; version?: string }
  | { t: 'handoff'; version: string; from: Party; to: Party; surface?: Surface }
  | { t: 'work'; owner: Party; verb: WorkVerb; label: Text }
  | { t: 'appear'; version: string }
  | { t: 'mark'; version: string; marker: Marker }
  | { t: 'network'; link?: { id: 'CPH01-ODE01'; status: 'DEGRADED' }; acmePath?: 'A' | 'B' };

export interface Step {
  id: string;
  chapter: Chapter;
  title: string;
  caption: Text;
  events: Event[];
}
