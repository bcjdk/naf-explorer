import type {
  ArtifactKind,
  ArtifactVersion,
  Chapter,
  KindId,
  Party,
  ResponsibilityInfo,
  SignalId,
  SignalInfo,
  Step,
  Surface,
  WorkVerb,
  Text,
} from './types.ts';

const T = (simple: string, technical: string = simple): Text => ({ simple, technical });

export const TITLE = 'How Network Automation Works';
export const SCOPE_NOTE = 'Values illustrative · NAF does not require SR-MPLS, gNMI or TWAMP.';

/** Ground-truth text for The Network region; which entry applies comes from stateAt. */
export const NETWORK = {
  link: 'Link CPH01–ODE01',
  linkOk: T('OK', 'OK · Rx −2.4 dBm at CPH01 Hu0/0/0/1'),
  linkDegraded: T(
    'ODE01→CPH01 losing light',
    'ODE01→CPH01 attenuation · Rx −10.9 dBm at CPH01 Hu0/0/0/1 (warn −9.0)',
  ),
  device: T('Interface and routing: UP', 'CPH01 Hu0/0/0/1 · oper UP · IS-IS UP'),
  acme: {
    none: T('ACME: not provisioned yet'),
    A: T('ACME traffic: path A via ODE01', 'ACME (colour 100) · path A CPH01–ODE01–AAR01'),
    B: T('ACME traffic: path B via KOL01', 'ACME (colour 100) · path B CPH01–KOL01–AAR01'),
  },
};

export const CHAPTERS: Record<Chapter, string> = {
  provision: 'Provision',
  detect: 'Detect',
  remediate: 'Remediate',
};

export const RESPONSIBILITIES: Record<Party, ResponsibilityInfo> = {
  presentation: {
    id: 'presentation',
    name: 'Presentation',
    role: 'where people and systems interact with automation',
    does: [
      'Lets people and other systems request services and see their state: portal, fault management, ITSM, performance dashboards, APIs.',
      'Displays what it receives.',
    ],
    doesNot: ['Decide or act on its own.'],
  },
  intent: {
    id: 'intent',
    name: 'Intent',
    role: 'source of truth for intended state',
    does: [
      'Records service intent.',
      'Derives network intent and desired state.',
      'Checks drift between observed and desired state.',
    ],
    doesNot: ['Apply changes to devices.'],
  },
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'sequences workflows with signals',
    does: [
      'Coordinates workflows across responsibilities using signals, and waits for each job it starts to be answered.',
      'Relays requests to Intent.',
      'Its remediation workflow evaluates a pre-approved policy and produces the remediation decision.',
    ],
    doesNot: [
      'Configure the network.',
      'Own or read service intent, derived network intent or desired state.',
      'Carry other responsibilities’ content.',
    ],
  },
  executor: {
    id: 'executor',
    name: 'Executor',
    role: 'renders and applies configuration',
    does: [
      'Renders and applies configuration changes.',
      'Takes desired state directly from Intent (one common pattern, not a NAF requirement).',
    ],
    doesNot: [
      'Decide what the network should be.',
      'Verify the outcome: a commit is not verification.',
    ],
  },
  collector: {
    id: 'collector',
    name: 'Collector',
    role: 'gathers, normalizes and tags live state',
    does: [
      'Gathers and normalizes live network state.',
      'Tags it with link, path and service IDs from a locally cached copy of intent.',
      'Reads back applied state for drift checks.',
    ],
    doesNot: ['Interpret service impact.'],
  },
  observability: {
    id: 'observability',
    name: 'Observability',
    role: 'turns observations into service meaning',
    does: [
      'Turns SLO definitions into SLO rules.',
      'Computes SLIs, correlates observations and evaluates SLIs against SLOs.',
      'Raises and clears service-impact events.',
    ],
    doesNot: ['Change the network.'],
  },
  network: {
    id: 'network',
    name: 'The Network',
    role: 'infrastructure, not an automation responsibility',
    does: ['Carries traffic.', 'Only Executor writes to it; only Collector reads from it.'],
    doesNot: ['Take part in automation decisions.'],
  },
};

export const SURFACES: Record<Surface, string> = {
  faultMgmt: 'Fault Management',
  itsm: 'ITSM',
  portal: 'Portal',
  perfMgmt: 'Performance Management',
  api: 'API',
};

export const KINDS: ArtifactKind[] = [
  {
    id: 'serviceRequest',
    name: 'Service request',
    producer: 'presentation',
    producerSurface: 'portal',
    consumers: ['orchestrator'],
    whatItIs: 'A customer’s request for a service, made through the Portal.',
  },
  {
    id: 'intentRequest',
    name: 'Intent request',
    producer: 'orchestrator',
    consumers: ['intent'],
    answeredBy: 'desiredStateReady',
    whatItIs: 'Orchestrator’s own request asking Intent to create a service.',
  },
  {
    id: 'serviceIntent',
    name: 'Service intent',
    producer: 'intent',
    consumers: [],
    whatItIs: 'What the customer wants, in the customer’s terms, including the SLO.',
  },
  {
    id: 'networkIntent',
    name: 'Derived network intent',
    producer: 'intent',
    consumers: [],
    whatItIs: 'How the network should deliver the service: policies and paths.',
  },
  {
    id: 'desiredState',
    name: 'Desired network state',
    producer: 'intent',
    consumers: ['executor'],
    whatItIs: 'The per-device configuration intent derived from network intent.',
  },
  {
    id: 'sloDefinition',
    name: 'SLO definition',
    producer: 'intent',
    consumers: ['observability'],
    whatItIs: 'How the service is judged: the SLI definition and its objective.',
  },
  {
    id: 'sloRule',
    name: 'SLO rule',
    producer: 'observability',
    consumers: [],
    whatItIs: 'Observability’s own evaluation rule, created from the SLO definition.',
  },
  {
    id: 'workflow',
    name: 'Workflow record',
    producer: 'orchestrator',
    consumers: [],
    whatItIs: 'Orchestrator’s record of a running or completed workflow.',
  },
  {
    id: 'remediationDecision',
    name: 'Remediation decision',
    producer: 'orchestrator',
    consumers: ['intent'],
    answeredBy: 'desiredStateReady',
    whatItIs: 'An intent change request produced by the remediation workflow’s policy evaluation.',
  },
  {
    id: 'configChange',
    name: 'Configuration change',
    producer: 'executor',
    consumers: ['network'],
    whatItIs: 'Rendered configuration applied to devices.',
  },
  {
    id: 'rawSignals',
    name: 'Raw signals',
    producer: 'network',
    consumers: ['collector'],
    whatItIs:
      'Measurements and configuration exactly as devices report them, each in its own format.',
  },
  {
    id: 'observedState',
    name: 'Observed device state',
    producer: 'collector',
    consumers: ['intent'],
    whatItIs: 'Applied configuration as read back from devices, for Intent’s drift check.',
  },
  {
    id: 'normalized',
    name: 'Normalized observations',
    producer: 'collector',
    consumers: [],
    whatItIs: 'Raw signals put into one common shape.',
  },
  {
    id: 'enriched',
    name: 'Enriched observations',
    producer: 'collector',
    consumers: ['observability'],
    whatItIs: 'Normalized observations tagged with link, path and service IDs.',
  },
  {
    id: 'sli',
    name: 'SLI',
    producer: 'observability',
    consumers: [],
    whatItIs: 'The service level indicator, computed from enriched observations.',
  },
  {
    id: 'evidence',
    name: 'Correlated evidence',
    producer: 'observability',
    consumers: [],
    whatItIs: 'Signals that line up in time and place: a strong clue, not proof.',
  },
  {
    id: 'serviceState',
    name: 'Service state',
    producer: 'observability',
    consumers: ['presentation', 'orchestrator'],
    whatItIs: 'Whether the service meets its objective, from the SLI and the SLO rule.',
  },
  {
    id: 'serviceEvent',
    name: 'Service-impact event',
    producer: 'observability',
    consumers: ['presentation', 'orchestrator'],
    whatItIs: 'A raised, cleared or follow-up event about impact on a service.',
  },
  {
    id: 'pathHealth',
    name: 'Path health',
    producer: 'observability',
    consumers: ['orchestrator'],
    whatItIs: 'Health of a path, assessed from link telemetry.',
  },
];

export const SIGNALS: Record<SignalId, SignalInfo> = {
  desiredStateReady: {
    id: 'desiredStateReady',
    label: 'desired state ready',
    asks: 'Tells Orchestrator that a desired-state version is ready, answering its request to Intent.',
  },
  onboard: {
    id: 'onboard',
    label: 'onboard service assurance',
    asks: 'Asks Observability to start assuring the service.',
    answeredBy: 'onboarded',
  },
  onboarded: {
    id: 'onboarded',
    label: 'assurance onboarded',
    asks: 'Tells Orchestrator that assurance is ready.',
  },
  apply: {
    id: 'apply',
    label: 'apply desired state',
    asks: 'Asks Executor to apply a named desired-state version, taken directly from Intent.',
    answeredBy: 'applied',
  },
  applied: {
    id: 'applied',
    label: 'applied',
    asks: 'Tells Orchestrator the commit succeeded. That is not verification.',
  },
  readBack: {
    id: 'readBack',
    label: 'read back applied state',
    asks: 'Asks Collector to read back applied configuration and hand it to Intent.',
    answeredBy: 'readBackDone',
  },
  readBackDone: {
    id: 'readBackDone',
    label: 'read back done',
    asks: 'Tells Orchestrator the observed state has been handed to Intent.',
  },
  checkDrift: {
    id: 'checkDrift',
    label: 'check drift',
    asks: 'Asks Intent to compare observed state with desired state.',
    answeredBy: 'inSync',
  },
  inSync: {
    id: 'inSync',
    label: 'in sync',
    asks: 'Tells Orchestrator the observed state matches the desired state.',
  },
  queryAltPath: {
    id: 'queryAltPath',
    label: 'query alternate-path health',
    asks: 'Asks Observability how healthy the service’s alternate path is.',
    answeredBy: 'pathHealth',
  },
};

export const ALLOWED_WORK: Record<Party, WorkVerb[]> = {
  presentation: [],
  intent: ['record', 'derive', 'checkDrift'],
  orchestrator: ['startWorkflow', 'completeWorkflow', 'evaluatePolicy'],
  executor: ['render', 'apply'],
  collector: ['collect', 'normalize', 'enrich', 'readBack'],
  observability: [
    'configureSlo',
    'computeSli',
    'correlate',
    'evaluate',
    'raiseEvent',
    'clearEvent',
    'assessPath',
  ],
  network: [],
};

// Filled in Task 4.
export const VERSIONS: ArtifactVersion[] = [];
export const STEPS: Step[] = [];

const kindById = new Map(KINDS.map((k) => [k.id, k]));
const versionById = new Map(VERSIONS.map((v) => [v.id, v]));

export function kind(id: KindId): ArtifactKind {
  const k = kindById.get(id);
  if (!k) throw new Error(`Unknown artifact kind: ${id}`);
  return k;
}

export function version(id: string): ArtifactVersion {
  const v = versionById.get(id);
  if (!v) throw new Error(`Unknown artifact version: ${id}`);
  return v;
}

export function producerOf(versionId: string): Party {
  return kind(version(versionId).kind).producer;
}
