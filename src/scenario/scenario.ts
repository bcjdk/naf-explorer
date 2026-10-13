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
  Event,
  Marker,
} from './types.ts';

const T = (simple: string, technical: string = simple): Text => ({ simple, technical });

export const TITLE = 'How Network Automation Works';
/** The About window (brief 06). Links open in a new tab. */
export const ABOUT = {
  title: 'How Network Automation Works',
  intro:
    'An interactive explainer of network automation as separate responsibilities connected by typed handoffs, based on the Network Automation Forum (NAF) framework. It follows one ACME L3VPN service through Provision → Detect → Remediate.',
  sections: [
    {
      heading: 'Who it is for',
      text: 'Network engineers, architects and senior technical leadership who know networking and want a clear mental model of how automation systems divide the work.',
    },
    {
      heading: 'Why',
      text: 'Automation is easier to reason about as roles and handoffs than as a list of tools. And “the interface is UP” is not the same as “the service is healthy”.',
    },
  ],
  framing:
    'This is an example of how good network automation can look when the NAF framework is used as the reference. It is not a prescription for how network automation should look.',
  /** Where the canvas takes liberties with NAF's Presentation layer, said once here and per surface in the inspector. */
  liberties:
    'For one story on one canvas, Presentation also holds ITSM, usually its own platform, and Fault and Performance Management, which may or may not count. Each surface’s inspector says which.',
  howTo: [
    { keys: ['→', '←'], text: 'step through the story' },
    { keys: ['Simple', 'Technical'], text: 'choose the depth' },
    {
      keys: ['click', 'Enter'],
      text: 'any card, surface, line label or responsibility name to inspect it',
    },
  ],
  naf: {
    label: 'Network Automation Forum Automation Framework',
    href: 'https://reference.networkautomation.forum/Framework/Framework/',
    after: 'The Network Automation Forum reference architecture this story is built on.',
  },
  credit: {
    before: 'With warm thanks to my good friend Thomas Kjær Aabo, whose ',
    label: 'How the Internet Works',
    href: 'https://tkjaer.github.io/how-the-internet-works/',
    source: 'https://github.com/tkjaer/how-the-internet-works',
    after:
      ' directly inspired this project. Its explorable, step-by-step picture of a complex system and its switch between simple and technical explanations shaped the approach here.',
  },
};

export const SCOPE_NOTE = 'Values illustrative · NAF does not require SR-MPLS, gNMI or TWAMP.';

/** The caption bar's completion line on the last beat, summing up the three chapters. */
export const ENDING =
  'Story complete: provisioned and verified, degradation detected, service restored on path B. The link still needs repair.';

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
      'Supplies desired state to Executor and Observability.',
    ],
    doesNot: ['Apply changes to devices.', 'Evaluate what the network actually has.'],
  },
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'sequences workflows',
    does: [
      'Coordinates workflows across responsibilities using signals, and waits for each job it starts to be answered.',
      'Turns service requests into intent requests to Intent, and hands Executor apply requests.',
      'Its remediation workflow evaluates a pre-approved policy and produces the remediation decision.',
      'Asks ITSM for repairs that automation cannot do.',
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
      'Takes the desired state named in Orchestrator’s apply request directly from Intent (one common pattern, not a NAF requirement).',
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
      'Reads back applied configuration for Observability’s conformance check.',
    ],
    doesNot: ['Interpret service impact.', 'Judge whether configuration conforms.'],
  },
  observability: {
    id: 'observability',
    name: 'Observability',
    role: 'turns observations into service meaning',
    does: [
      'Turns SLO definitions into SLO rules.',
      'Computes SLIs, correlates observations and evaluates SLIs against SLOs.',
      'Raises and clears events: link problems and impact on services.',
      'Checks configuration conformance: does the observed state match the desired state?',
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

/**
 * Each workflow's steps, and the beat where each one begins. The workflow card shows them with the current
 * step highlighted.
 */
export const WORKFLOW_STEPS: Record<string, { label: string; from: string }[]> = {
  'wf-prov': [
    { label: 'record', from: 'P3' },
    { label: 'derive', from: 'P4' },
    { label: 'onboard', from: 'P6' },
    { label: 'apply', from: 'P7' },
    { label: 'verify config', from: 'P9' },
    { label: 'verify service', from: 'P11' },
  ],
  'wf-rem': [
    { label: 'check alternate', from: 'R2' },
    { label: 'decide', from: 'R3' },
    { label: 'derive', from: 'R4' },
    { label: 'apply', from: 'R6' },
    { label: 'verify config', from: 'R8' },
    { label: 'verify service', from: 'R10' },
  ],
};

/** Whether NAF would usually count each surface as Presentation: the canvas takes liberties (see ABOUT.liberties). */
export const SURFACE_NAF: Record<Surface, string> = {
  faultMgmt:
    'May or may not be considered part of the Presentation layer, depending on the implementation. It is often its own NOC platform.',
  itsm: 'Generally not considered part of the Presentation layer. An ITSM system is usually its own platform that automation integrates with. It sits here so the whole story fits on one canvas.',
  portal: 'Generally considered part of the Presentation layer.',
  perfMgmt:
    'May or may not be considered part of the Presentation layer, depending on the implementation.',
  api: 'Generally considered part of the Presentation layer.',
};

/** What each surface is, shown in its inspector. */
export const SURFACE_ROLES: Record<Surface, string> = {
  faultMgmt:
    'The NOC’s single pane of glass for faults. Here it shows Observability’s events, a link problem and then service impact, as they are raised and cleared, so operators see which services are affected. It displays them; it does not decide what to do.',
  itsm: 'The IT service management system, where incidents and changes are tracked as tickets. Here it receives Orchestrator’s repair request as soon as the link problem is detected, so the faulty link’s repair can be ticketed and followed up by people.',
  portal:
    'Where customers and operators request services and follow their state. Here ACME’s service request starts from it, it shows the service state Observability sends, and Orchestrator tells it when the order is complete.',
  perfMgmt:
    'Performance dashboards that chart SLIs and other measurements over time. Nothing is sent to it in this story.',
  api: 'How other systems, such as a customer’s own tools or an OSS/BSS, request services and read their state programmatically. Nothing is sent to it in this story, but it could carry the same service request as the Portal.',
};

export const KINDS: ArtifactKind[] = [
  {
    id: 'serviceRequest',
    name: 'Service request',
    producer: 'presentation',
    producerSurface: 'portal',
    consumers: ['orchestrator'],
    uses: {
      orchestrator:
        'It chooses and starts the provisioning workflow. The service details travel on to Intent in Orchestrator’s intent request, because Intent, not Orchestrator, keeps what ACME should get.',
    },
    whatItIs:
      'ACME’s request for a service, made through the Portal. Its job is to start the right workflow: an L3VPN request starts Orchestrator’s provisioning workflow.',
  },
  {
    id: 'intentRequest',
    name: 'Intent request',
    producer: 'orchestrator',
    consumers: ['intent'],
    uses: {
      intent:
        'It records the requested service as service intent, the source of truth for what ACME should get.',
    },
    answeredBy: 'desiredStateReady',
    whatItIs: 'Orchestrator’s request asking Intent to create a service.',
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
    consumers: ['executor', 'observability'],
    uses: {
      executor:
        'It renders and applies the desired-state version that Orchestrator’s apply request names. Executor takes it directly from Intent.',
      observability:
        'It is what Observability checks the read-back configuration against: does the network have what Intent intends?',
    },
    whatItIs: 'The per-device configuration intent derived from network intent.',
  },
  {
    id: 'sloDefinition',
    name: 'SLO definition',
    producer: 'intent',
    consumers: ['observability'],
    uses: {
      observability:
        'It turns the definition into its own SLO rule, so it can evaluate the SLI without asking Intent again.',
    },
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
    consumers: ['presentation'],
    uses: {
      presentation:
        'The Portal shows the customer’s order as completed once the provisioning workflow has finished.',
    },
    whatItIs: 'Orchestrator’s record of a running or completed workflow.',
  },
  {
    id: 'applyRequest',
    name: 'Apply request',
    producer: 'orchestrator',
    consumers: ['executor'],
    uses: {
      executor:
        'It tells Executor which desired-state version to apply. The order names the version; the content stays with Intent.',
    },
    answeredBy: 'applied',
    whatItIs:
      'Orchestrator’s work order asking Executor to apply a named desired-state version. It carries the version name, not the configuration.',
  },
  {
    id: 'repairRequest',
    name: 'Repair request',
    producer: 'orchestrator',
    consumers: ['presentation'],
    uses: {
      presentation:
        'It shows the request in ITSM as a ticket, so people can check and repair the suspect link. Automation can route around a link, but not repair it.',
    },
    whatItIs:
      'Orchestrator’s request, prompted by Observability’s link event, to repair a suspect link. No service needs to be affected for it.',
  },
  {
    id: 'remediationDecision',
    name: 'Remediation decision',
    producer: 'orchestrator',
    consumers: ['intent'],
    uses: {
      intent:
        'It says what to change (exclude the faulty link). Intent updates network intent, selects the path and derives the new desired state.',
    },
    answeredBy: 'desiredStateReady',
    whatItIs: 'An intent change request produced by the remediation workflow’s policy evaluation.',
  },
  {
    id: 'configChange',
    name: 'Configuration change',
    producer: 'executor',
    consumers: ['network'],
    uses: {
      network: 'The devices run the new configuration.',
    },
    whatItIs: 'Rendered configuration applied to devices.',
  },
  {
    id: 'rawSignals',
    name: 'Raw signals',
    producer: 'network',
    consumers: ['collector'],
    uses: {
      collector: 'It gathers them and normalizes them into one shape that can be compared.',
    },
    whatItIs:
      'Measurements and configuration exactly as devices report them, each in its own format.',
  },
  {
    id: 'observedState',
    name: 'Observed device state',
    producer: 'collector',
    consumers: ['observability'],
    uses: {
      observability:
        'It checks conformance: does what the devices actually have match the desired state?',
    },
    whatItIs:
      'Applied configuration as read back from devices, for Observability’s conformance check.',
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
    uses: {
      observability:
        'It computes the SLI and correlates observations, to understand the service’s state.',
    },
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
    uses: {
      presentation:
        'It displays the service’s state to the people who use it, for example in the Portal.',
      orchestrator: 'A running workflow waits for the service to be HEALTHY before it completes.',
    },
    whatItIs: 'Whether the service meets its objective, from the SLI and the SLO rule.',
  },
  {
    id: 'event',
    name: 'Event',
    producer: 'observability',
    consumers: ['presentation', 'orchestrator'],
    uses: {
      presentation:
        'It displays the event in Fault Management, where the NOC sees link problems and service impact.',
      orchestrator:
        'Events, not raw state, are what it acts on: a link event makes it ask for a repair, a service-impact event starts its remediation workflow.',
    },
    whatItIs:
      'Something Observability raises or clears: a suspected link problem, or impact on a service.',
  },
  {
    id: 'pathHealth',
    name: 'Path health',
    producer: 'observability',
    consumers: ['orchestrator'],
    uses: {
      orchestrator:
        'Its remediation policy moves the service only if the alternate path is healthy.',
    },
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
  applied: {
    id: 'applied',
    label: 'applied',
    asks: 'Tells Orchestrator the commit succeeded, answering its apply request. That is not verification.',
  },
  readBack: {
    id: 'readBack',
    label: 'read back applied state',
    asks: 'Asks Collector to read back applied configuration and hand it to Observability.',
    answeredBy: 'readBackDone',
  },
  readBackDone: {
    id: 'readBackDone',
    label: 'read back done',
    asks: 'Tells Orchestrator the read-back is done and the observed state is with Observability.',
  },
  checkConformance: {
    id: 'checkConformance',
    label: 'check config',
    asks: 'Asks Observability whether the observed configuration conforms to a desired-state version.',
    answeredBy: 'inSync',
  },
  inSync: {
    id: 'inSync',
    label: 'in sync',
    asks: 'Observability’s verdict: the observed configuration conforms to the desired state.',
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
  intent: ['record', 'derive'],
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
    'checkConformance',
  ],
  network: [],
};

export const VERSIONS: ArtifactVersion[] = [
  // Provision
  {
    id: 'sr',
    kind: 'serviceRequest',
    label: 'submitted',
    lineage: [],
    meaning: 'ACME asks for connectivity between CPH01 and AAR01 with packet loss below 0.1%.',
    technical: ['service: ACME-L3VPN-001 (L3VPN)', 'sites: CPH01, AAR01', 'slo: loss < 0.1%'],
  },
  {
    id: 'wf-prov',
    kind: 'workflow',
    label: 'provision',
    lineage: ['sr'],
    meaning: 'Orchestrator’s record of the provisioning workflow for ACME.',
    technical: ['provision ACME-L3VPN-001', 'trigger: Portal service request'],
  },
  {
    id: 'ir',
    kind: 'intentRequest',
    label: 'create service',
    lineage: ['sr'],
    meaning: 'Orchestrator asks Intent to create ACME’s service.',
    technical: ['op: create-service', 'service: ACME-L3VPN-001'],
  },
  {
    id: 'si',
    kind: 'serviceIntent',
    label: 'v1',
    lineage: ['ir'],
    meaning: 'What ACME wants, in ACME’s terms: connect CPH01 and AAR01 with loss below 0.1%.',
    technical: [
      'service: ACME-L3VPN-001',
      'type: L3VPN, VRF ACME',
      'endpoints: CPH01, AAR01',
      'slo: loss < 0.1%',
    ],
  },
  {
    id: 'ni1',
    kind: 'networkIntent',
    label: 'v1',
    lineage: ['si'],
    meaning: 'Configure ACME over path A via ODE01, with path B via KOL01 as the alternate.',
    technical: [
      'sr-policy colour 100, one per direction',
      'preferred: CPH01–ODE01–AAR01 (A)',
      'alternate: CPH01–KOL01–AAR01 (B)',
    ],
  },
  {
    id: 'ds1',
    kind: 'desiredState',
    label: 'v1',
    lineage: ['ni1'],
    meaning: 'The configuration CPH01 and AAR01 should have for ACME, including its probe.',
    technical: [
      'CPH01, AAR01: vrf ACME, rd/rt 65000:101',
      'sr-policy colour 100 → path A',
      'twamp-light CPH01 ↔ AAR01 (CPH01 sender, AAR01 stateful reflector)',
    ],
  },
  {
    id: 'slodef',
    kind: 'sloDefinition',
    label: 'v1',
    lineage: ['si'],
    meaning: 'How ACME’s service is judged: probe loss, worst direction, per minute, below 0.1%.',
    technical: ['sli: twamp-light loss, worst direction', 'window: 1 min', 'objective: < 0.1%'],
  },
  {
    id: 'slorule',
    kind: 'sloRule',
    label: 'acme-loss',
    lineage: ['slodef'],
    meaning: 'Observability’s own rule for evaluating ACME’s SLI.',
    technical: ['rule: acme-loss', 'expr: max(loss by direction) over 1m < 0.1%'],
  },
  {
    id: 'ar1',
    kind: 'applyRequest',
    label: 'desired state v1',
    names: 'ds1',
    lineage: ['ir'],
    meaning: 'Apply desired state v1. Executor takes it directly from Intent.',
    technical: ['op: apply', 'desired-state: v1', 'workflow: provision'],
  },
  {
    id: 'cc1',
    kind: 'configChange',
    label: 'v1',
    lineage: ['ds1'],
    meaning: 'The configuration rendered and applied to CPH01 and AAR01.',
    technical: [
      'gNMI Set → CPH01, AAR01',
      'vrf ACME, sr-policy colour 100, twamp-light',
      'commit: ok',
    ],
  },
  {
    id: 'rb-a',
    kind: 'rawSignals',
    label: 'read-back A',
    lineage: ['cc1'],
    meaning: 'The configuration exactly as CPH01 and AAR01 report it.',
    technical: ['gNMI Get CPH01, AAR01', 'subtrees: vrf ACME, sr-policy colour 100'],
  },
  {
    id: 'obs1',
    kind: 'observedState',
    label: 'v1',
    lineage: ['rb-a'],
    meaning: 'What CPH01 and AAR01 actually have applied, as read back.',
    technical: ['vrf ACME 65000:101', 'sr-policy colour 100 → path A', 'source: gNMI Get'],
  },
  {
    id: 'raw-base',
    kind: 'rawSignals',
    label: 'baseline',
    lineage: [],
    meaning: 'Telemetry and probe results from the network, each in its own format.',
    technical: [
      'CPH01 Hu0/0/0/1: Rx −2.4 dBm, CRC 0',
      'other links: Rx −2.1 to −2.6 dBm, CRC 0',
      'oper UP, IS-IS UP · twamp loss 0.00%',
    ],
  },
  {
    id: 'norm-base',
    kind: 'normalized',
    label: 'baseline',
    lineage: ['raw-base'],
    meaning: 'The same measurements in one common shape.',
    technical: ['{metric, device, interface, value, time}', 'window 09:12–09:13'],
  },
  {
    id: 'enr-base',
    kind: 'enriched',
    label: 'baseline',
    lineage: ['norm-base'],
    meaning: 'Measurements tagged with the link, path and service they belong to.',
    technical: [
      'Hu0/0/0/1 → CPH01–ODE01 → path A → ACME',
      'probe → path A → ACME',
      'cached intent (network intent v1)',
    ],
  },
  {
    id: 'sli1',
    kind: 'sli',
    label: '0.00%',
    lineage: ['enr-base'],
    meaning: 'ACME lost no probe packets in the last minute.',
    technical: [
      'loss CPH01→AAR01: 0.00%',
      'loss AAR01→CPH01: 0.00%',
      'sli (worst) = 0.00%, 09:12–09:13',
    ],
  },
  {
    id: 'ss1',
    kind: 'serviceState',
    label: '09:13',
    status: 'HEALTHY',
    lineage: ['sli1', 'slorule'],
    meaning: 'ACME’s service meets its objective.',
    technical: ['sli 0.00% < 0.1%', 'rule: acme-loss'],
  },
  // Detect
  {
    id: 'raw-deg',
    kind: 'rawSignals',
    label: 'degraded',
    lineage: [],
    meaning:
      'Light falling and errors rising at CPH01; ACME’s probe losing packets; links still UP.',
    technical: [
      'CPH01 Hu0/0/0/1: Rx −10.9, CRC 1,240/min',
      'other links: Rx −2.1 to −2.6 dBm, CRC 0',
      'oper UP, IS-IS UP · probe loss 0.4%',
    ],
  },
  {
    id: 'norm-deg',
    kind: 'normalized',
    label: 'degraded',
    lineage: ['raw-deg'],
    meaning:
      'The same signals in one shape: light down, errors up, probe losing packets, everything UP.',
    technical: [
      'rx_power −10.9 dBm',
      'crc_errors 1,240/min',
      'oper, isis: UP',
      'probe_loss AAR01→CPH01 0.4%',
    ],
  },
  {
    id: 'enr-deg',
    kind: 'enriched',
    label: 'degraded',
    lineage: ['norm-deg'],
    meaning:
      'CPH01’s interface to ODE01 is tagged link CPH01–ODE01, path A, carrying ACME; path B as its alternate.',
    technical: [
      'Hu0/0/0/1 → CPH01–ODE01',
      '→ path A → ACME',
      'KOL01 links → path B',
      'cached intent (network intent v1)',
    ],
  },
  {
    id: 'sli2',
    kind: 'sli',
    label: '0.4%',
    lineage: ['enr-deg'],
    meaning: 'ACME lost 0.4% of probe packets in the last minute, AAR01→CPH01.',
    technical: [
      'loss CPH01→AAR01: 0.00%',
      'loss AAR01→CPH01: 0.4%',
      'sli (worst) = 0.4%, 10:45–10:46',
    ],
  },
  {
    id: 'evid',
    kind: 'evidence',
    label: 'path A, 10:46',
    lineage: ['sli2', 'enr-deg'],
    meaning:
      'Loss lines up with low light and errors on CPH01–ODE01: likely optical degradation, a strong clue, not proof.',
    technical: [
      'path A · sli 0.4%',
      'Rx −10.9 dBm, CRC ≈1,240/min',
      'suspect ODE01→CPH01, not proof',
    ],
  },
  {
    id: 'ev-link',
    kind: 'event',
    label: 'link problem',
    lineage: ['evid'],
    meaning: 'Link CPH01–ODE01 is suspected of optical degradation. No service is named.',
    technical: ['link-degradation CPH01–ODE01', 'suspect optics, not proof'],
  },
  {
    id: 'ss2',
    kind: 'serviceState',
    label: '10:46',
    status: 'DEGRADED',
    lineage: ['sli2', 'slorule'],
    meaning: 'ACME’s service misses its objective, even though the interface is UP.',
    technical: ['sli 0.4% ≥ 0.1%', 'interface UP, IS-IS UP: device state ≠ service state'],
  },
  {
    id: 'ev-viol',
    kind: 'event',
    label: 'loss violation',
    status: 'VIOLATED',
    lineage: ['ss2', 'evid'],
    meaning: 'Loss objective violated; suspect CPH01–ODE01 on path A.',
    technical: ['acme-loss-violation', 'suspect CPH01–ODE01 · path A'],
  },
  // Remediate
  {
    id: 'wf-rem',
    kind: 'workflow',
    label: 'remediation',
    lineage: ['ev-viol'],
    meaning: 'The remediation workflow for the loss violation.',
    technical: ['policy pol-loss-reroute, pre-approved'],
  },
  {
    id: 'pathB',
    kind: 'pathHealth',
    label: 'path B',
    status: 'HEALTHY',
    lineage: ['enr-deg'],
    meaning: 'Path B’s links look healthy; ACME itself is not yet measured there.',
    technical: ['Rx −2.1 to −2.6 dBm', 'CRC 0, UP, 10:45–10:46', 'link telemetry only'],
  },
  {
    id: 'dec',
    kind: 'remediationDecision',
    label: 'exclude CPH01–ODE01',
    lineage: ['ev-viol', 'pathB'],
    meaning:
      'Exclude the implicated link from ACME’s network intent. Intent chooses what replaces it.',
    technical: [
      'intent-change ACME-L3VPN-001',
      'exclude-link CPH01–ODE01',
      'policy pol-loss-reroute',
    ],
  },
  {
    id: 'ni2',
    kind: 'networkIntent',
    label: 'v2',
    lineage: ['dec', 'si'],
    meaning: 'Configure ACME to avoid CPH01–ODE01, which leaves path B via KOL01.',
    technical: ['exclude: CPH01–ODE01', 'selected: CPH01–KOL01–AAR01 (B)', 'sr-policy colour 100'],
  },
  {
    id: 'ds2',
    kind: 'desiredState',
    label: 'v2',
    lineage: ['ni2'],
    meaning: 'The configuration CPH01 and AAR01 should have to carry ACME over path B.',
    technical: [
      'CPH01, AAR01: sr-policy colour 100 → path B',
      'exclude CPH01–ODE01',
      'vrf ACME and probe unchanged',
    ],
  },
  {
    id: 'ar2',
    kind: 'applyRequest',
    label: 'desired state v2',
    names: 'ds2',
    lineage: ['dec'],
    meaning: 'Apply desired state v2. Executor takes it directly from Intent.',
    technical: ['op: apply', 'desired-state: v2', 'workflow: remediation'],
  },
  {
    id: 'cc2',
    kind: 'configChange',
    label: 'v2',
    lineage: ['ds2'],
    meaning: 'The change applied to CPH01 and AAR01 that moves ACME to path B.',
    technical: ['gNMI Set → CPH01, AAR01', 'sr-policy colour 100 → path B', 'commit: ok'],
  },
  {
    id: 'rb-b',
    kind: 'rawSignals',
    label: 'read-back B',
    lineage: ['cc2'],
    meaning: 'The new configuration exactly as CPH01 and AAR01 report it.',
    technical: ['gNMI Get CPH01, AAR01', 'subtree: sr-policy colour 100'],
  },
  {
    id: 'obs2',
    kind: 'observedState',
    label: 'v2',
    lineage: ['rb-b'],
    meaning: 'What CPH01 and AAR01 actually have applied after the change.',
    technical: ['CPH01, AAR01: sr-policy colour 100 → path B', 'source: gNMI Get'],
  },
  {
    id: 'raw-after',
    kind: 'rawSignals',
    label: 'after reroute',
    lineage: [],
    meaning: 'Fresh telemetry: errors continue on the faulty fibre, and ACME’s probe is clean.',
    technical: [
      'CPH01 Hu0/0/0/1: Rx −10.9 dBm, CRC 1,240/min',
      'oper UP, IS-IS UP · twamp loss 0.00%',
    ],
  },
  {
    id: 'norm-after',
    kind: 'normalized',
    label: 'after reroute',
    lineage: ['raw-after'],
    meaning: 'The fresh measurements in one common shape.',
    technical: ['{metric, device, interface, value, time}', 'window 10:48–10:49'],
  },
  {
    id: 'enr-after',
    kind: 'enriched',
    label: 'after reroute',
    lineage: ['norm-after'],
    meaning: 'ACME’s probe is tagged to path B; link CPH01–ODE01 no longer carries ACME.',
    technical: [
      'probe → path B → ACME',
      'CPH01–ODE01 → no ACME service',
      'cached intent (network intent v2)',
    ],
  },
  {
    id: 'sli3',
    kind: 'sli',
    label: '0.00%',
    lineage: ['enr-after'],
    meaning: 'ACME lost no probe packets in the last minute.',
    technical: [
      'loss CPH01→AAR01: 0.00%',
      'loss AAR01→CPH01: 0.00%',
      'sli (worst) = 0.00%, 10:48–10:49',
    ],
  },
  {
    id: 'ss3',
    kind: 'serviceState',
    label: '10:49',
    status: 'HEALTHY',
    lineage: ['sli3', 'slorule'],
    meaning: 'ACME’s service meets its objective again.',
    technical: ['sli 0.00% < 0.1%', 'rule: acme-loss (unchanged)'],
  },
  {
    id: 'ev-clear',
    kind: 'event',
    label: 'cleared',
    status: 'CLEARED',
    lineage: ['ev-viol', 'ss3'],
    meaning: 'ACME’s loss violation is resolved.',
    technical: ['event: acme-loss-violation', 'state: cleared 10:49'],
  },
  {
    id: 'rr',
    kind: 'repairRequest',
    label: 'CPH01–ODE01',
    lineage: ['ev-link'],
    meaning: 'Fix suspect link CPH01–ODE01.',
    technical: ['link CPH01–ODE01 · suspect optics'],
  },
];

const appear = (version: string): Event => ({ t: 'appear', version });
const sig = (signal: SignalId, from: Party, to: Party, v?: string): Event =>
  v ? { t: 'signal', signal, from, to, version: v } : { t: 'signal', signal, from, to };
const hand = (version: string, from: Party, to: Party, surface?: Surface): Event =>
  surface ? { t: 'handoff', version, from, to, surface } : { t: 'handoff', version, from, to };
const work = (owner: Party, verb: WorkVerb, simple: string, technical?: string): Event => ({
  t: 'work',
  owner,
  verb,
  label: T(simple, technical),
});
const mark = (version: string, marker: Marker): Event => ({ t: 'mark', version, marker });

export const STEPS: Step[] = [
  // ── Provision ──
  {
    id: 'P1',
    chapter: 'provision',
    title: 'Orientation',
    caption: T(
      'One automation system: six responsibilities, with The Network beneath them. Thick coloured lines carry content from the responsibility that produces it to the one that uses it, thin ones are work inside a responsibility, and dashed lines are Orchestrator’s coordination signals. These are roles, not products. Click anything to see what it is and who uses it.',
      'Six NAF responsibilities: Presentation, Intent, Orchestrator, Executor, Collector, Observability; The Network is infrastructure, not a responsibility. Thick solid = artifact handoff (producer → consumer); thin solid = work inside a responsibility; dashed = coordination signal (always involves Orchestrator). Roles, not products: one product can play several roles. Click anything to see what it is and who uses it.',
    ),
    events: [],
  },
  {
    id: 'P2',
    chapter: 'provision',
    title: 'Request',
    caption: T(
      'Through the Portal, ACME requests connectivity between its CPH01 and AAR01 sites with packet loss below 0.1%. The request goes to Orchestrator, which starts the provisioning workflow.',
      'Portal → Orchestrator: service request ACME-L3VPN-001 (L3VPN, CPH01 ↔ AAR01, SLO loss < 0.1%). Orchestrator starts workflow provision/ACME-L3VPN-001.',
    ),
    events: [
      appear('sr'),
      hand('sr', 'presentation', 'orchestrator', 'portal'),
      work('orchestrator', 'startWorkflow', 'start workflow', 'start provision'),
      appear('wf-prov'),
    ],
  },
  {
    id: 'P3',
    chapter: 'provision',
    title: 'Record',
    caption: T(
      'Orchestrator relays the request to Intent as an intent request. Intent records the service intent in ACME’s terms: what ACME wants, not how the network delivers it.',
      'Orchestrator → Intent: intent request create-service ACME-L3VPN-001. Intent records service intent v1: L3VPN, VRF ACME, endpoints CPH01 and AAR01, SLO loss < 0.1%.',
    ),
    events: [
      appear('ir'),
      hand('ir', 'orchestrator', 'intent'),
      work('intent', 'record', 'record service intent'),
      appear('si'),
    ],
  },
  {
    id: 'P4',
    chapter: 'provision',
    title: 'Derive network intent',
    caption: T(
      'Intent derives network intent: configure ACME’s traffic over path A via ODE01, and keep path B via KOL01 as the alternate.',
      'Intent derives network intent v1: SR-MPLS policy colour 100 per direction; preferred path A CPH01–ODE01–AAR01; alternate path B CPH01–KOL01–AAR01.',
    ),
    events: [work('intent', 'derive', 'derive network intent'), appear('ni1')],
  },
  {
    id: 'P5',
    chapter: 'provision',
    title: 'Derive desired state',
    caption: T(
      'Intent derives the desired state for each device, CPH01 and AAR01, and tells Orchestrator it is ready. That signal answers Orchestrator’s intent request.',
      'Intent derives desired state v1 for CPH01 and AAR01: VRF ACME (RD/RT 65000:101), colour-100 policy towards path A, TWAMP-Light probe (CPH01 sender, AAR01 stateful reflector). Intent ⇢ Orchestrator: desired state v1 ready.',
    ),
    events: [
      work('intent', 'derive', 'derive desired state'),
      appear('ds1'),
      sig('desiredStateReady', 'intent', 'orchestrator', 'ds1'),
    ],
  },
  {
    id: 'P6',
    chapter: 'provision',
    title: 'Onboard assurance',
    caption: T(
      'Before anything is applied, Orchestrator asks Observability to onboard assurance for ACME. Observability takes the SLO definition directly from Intent, turns it into its own SLO rule, and confirms to Orchestrator that assurance is ready.',
      'Orchestrator ⇢ Observability: onboard service assurance. Intent → Observability: SLO definition (probe loss, worst direction, 1-minute window, < 0.1%), directly, not via Orchestrator. Observability creates rule acme-loss. Observability ⇢ Orchestrator: assurance onboarded.',
    ),
    events: [
      sig('onboard', 'orchestrator', 'observability'),
      appear('slodef'),
      hand('slodef', 'intent', 'observability'),
      work('observability', 'configureSlo', 'configure SLO rule', 'configure rule acme-loss'),
      appear('slorule'),
      sig('onboarded', 'observability', 'orchestrator'),
    ],
  },
  {
    id: 'P7',
    chapter: 'provision',
    title: 'Order apply',
    caption: T(
      'With desired state v1 ready and assurance onboarded, Orchestrator hands Executor a work order: apply desired state v1. The order names the version; the configuration itself stays with Intent.',
      'Orchestrator → Executor: apply request (desired state v1, workflow provision/ACME-L3VPN-001). It names the version only: Executor takes desired state v1 directly from Intent, never via Orchestrator.',
    ),
    events: [appear('ar1'), hand('ar1', 'orchestrator', 'executor')],
  },
  {
    id: 'P8',
    chapter: 'provision',
    title: 'Apply',
    caption: T(
      'Executor takes desired state v1 directly from Intent, renders the configuration and applies it to CPH01 and AAR01. ACME’s traffic now uses path A. Executor reports the change applied to Orchestrator; a successful commit is not yet verification.',
      'Intent → Executor: desired state v1, direct. Executor renders and pushes configuration change v1 with gNMI Set (VRF, colour-100 policy, probe). ACME on path A. Executor ⇢ Orchestrator: applied v1 (commit ok, not verified).',
    ),
    events: [
      hand('ds1', 'intent', 'executor'),
      work('executor', 'render', 'render'),
      work('executor', 'apply', 'apply', 'gNMI Set'),
      appear('cc1'),
      hand('cc1', 'executor', 'network'),
      { t: 'network', acmePath: 'A' },
      sig('applied', 'executor', 'orchestrator', 'ds1'),
    ],
  },
  {
    id: 'P9',
    chapter: 'provision',
    title: 'Read back',
    caption: T(
      'Configuration verification begins. Orchestrator asks Collector to read back what the devices actually have. Collector hands the observed device state to Observability and tells Orchestrator the read-back is done.',
      'Orchestrator ⇢ Collector: read back applied state. Network → Collector: gNMI Get of CPH01 and AAR01. Collector → Observability: observed device state v1. Collector ⇢ Orchestrator: read back done.',
    ),
    events: [
      sig('readBack', 'orchestrator', 'collector'),
      appear('rb-a'),
      hand('rb-a', 'network', 'collector'),
      work('collector', 'readBack', 'read back', 'gNMI Get CPH01, AAR01'),
      appear('obs1'),
      hand('obs1', 'collector', 'observability'),
      sig('readBackDone', 'collector', 'orchestrator'),
    ],
  },
  {
    id: 'P10',
    chapter: 'provision',
    title: 'Check conformance',
    caption: T(
      'Orchestrator asks Observability whether the network now has what was intended. Intent supplies desired state v1, Observability compares it with what the devices have, finds they match, and tells Orchestrator. A mismatch would have led the workflow to roll back.',
      'Orchestrator ⇢ Observability: check config v1. Intent → Observability: desired state v1, direct. Observability compares observed device state v1 with desired state v1 (semantically, not as a text diff): conforms. Observability ⇢ Orchestrator: in sync. On a mismatch, the workflow would roll back.',
    ),
    events: [
      sig('checkConformance', 'orchestrator', 'observability', 'ds1'),
      hand('ds1', 'intent', 'observability'),
      work(
        'observability',
        'checkConformance',
        'check conformance',
        'compare observed v1 with desired v1',
      ),
      sig('inSync', 'observability', 'orchestrator', 'ds1'),
    ],
  },
  {
    id: 'P11',
    chapter: 'provision',
    title: 'Collect',
    caption: T(
      'Configured as intended is not yet a working service. The network streams raw measurements to Collector, each in its own format, and Collector normalizes them into one shape.',
      'Network → Collector: gNMI streaming telemetry (Rx power, CRC/FCS, oper-status, IS-IS adjacency) from all four links, and TWAMP-Light results for CPH01 ↔ AAR01 in VRF ACME. Collector normalizes them to {metric, device, interface, value, time}.',
    ),
    events: [
      appear('raw-base'),
      hand('raw-base', 'network', 'collector'),
      work('collector', 'collect', 'collect', 'gNMI subscribe, TWAMP-Light results'),
      work('collector', 'normalize', 'normalize'),
      appear('norm-base'),
    ],
  },
  {
    id: 'P12',
    chapter: 'provision',
    title: 'Enrich',
    caption: T(
      'Collector tags each measurement with the link, path and service it belongs to, using its locally cached copy of intent, and hands the enriched observations to Observability. Tagging is not interpretation.',
      'Collector enriches from cached intent: Hu0/0/0/1 → link CPH01–ODE01 → path A → ACME-L3VPN-001; probe → ACME. Collector → Observability: enriched observations (baseline, 09:12–09:13).',
    ),
    events: [
      work('collector', 'enrich', 'enrich', 'tag (cached intent)'),
      appear('enr-base'),
      hand('enr-base', 'collector', 'observability'),
    ],
  },
  {
    id: 'P13',
    chapter: 'provision',
    title: 'Compute SLI',
    caption: T(
      'Observability computes ACME’s SLI from the probe: no packets lost in the last minute.',
      'Observability computes SLI = max(loss CPH01→AAR01, loss AAR01→CPH01) over 09:12–09:13 = 0.00%.',
    ),
    events: [work('observability', 'computeSli', 'compute SLI'), appear('sli1')],
  },
  {
    id: 'P14',
    chapter: 'provision',
    title: 'Evaluate',
    caption: T(
      'Observability evaluates the SLI against its SLO rule. It is within the objective, so ACME’s service is healthy. This is service verification, separate from the configuration check.',
      'Rule acme-loss: 0.00% < 0.1% → service state HEALTHY for ACME-L3VPN-001. Service verification (SLO) is separate from configuration verification (conformance check).',
    ),
    events: [work('observability', 'evaluate', 'evaluate SLI against SLO'), appear('ss1')],
  },
  {
    id: 'P15',
    chapter: 'provision',
    title: 'Report',
    caption: T(
      'Observability sends the healthy service state to the Portal and to Orchestrator, whose workflow has been waiting for it. Orchestrator completes the provisioning workflow and tells the Portal that ACME’s order is complete.',
      'Observability → Portal, Orchestrator: service state HEALTHY. The workflow’s wait-for-HEALTHY subscription is satisfied and closes; provision/ACME-L3VPN-001 = COMPLETED. Orchestrator → Portal: workflow record (order completed).',
    ),
    events: [
      hand('ss1', 'observability', 'presentation', 'portal'),
      hand('ss1', 'observability', 'orchestrator'),
      work('orchestrator', 'completeWorkflow', 'complete workflow'),
      mark('wf-prov', 'COMPLETED'),
      hand('wf-prov', 'orchestrator', 'presentation', 'portal'),
    ],
  },
  // ── Detect ──
  {
    id: 'D1',
    chapter: 'detect',
    title: 'Fault',
    caption: T(
      'The ODE01→CPH01 fibre strand starts to lose light. CPH01 still sees a signal, so the interface and routing stay up, but frames arrive with bit errors. The automation system does not know yet.',
      'Ground truth: optical attenuation on ODE01→CPH01. Rx at CPH01 Hu0/0/0/1 falls from −2.4 dBm towards −10.9 dBm (low warning −9.0 dBm). oper-status UP, IS-IS adjacency UP. Nothing has been observed yet.',
    ),
    events: [{ t: 'network', link: { id: 'CPH01-ODE01', status: 'DEGRADED' } }],
  },
  {
    id: 'D2',
    chapter: 'detect',
    title: 'Collect',
    caption: T(
      'The network streams raw signals to Collector, each in its own format: falling light and rising errors from CPH01, loss from ACME’s probe, and interface and routing state from every link.',
      'Network → Collector: gNMI telemetry (Rx −10.9 dBm and CRC/FCS ≈1,240/min on CPH01 Hu0/0/0/1; oper-status and IS-IS UP on all links) and TWAMP-Light results, 10:41–10:46.',
    ),
    events: [
      appear('raw-deg'),
      hand('raw-deg', 'network', 'collector'),
      work('collector', 'collect', 'collect', 'gNMI subscribe, TWAMP-Light results'),
    ],
  },
  {
    id: 'D3',
    chapter: 'detect',
    title: 'Normalize',
    caption: T(
      'Collector puts the signals into one common shape, so they can be compared: the light has dropped, errors are rising and ACME’s probe is losing packets, while the interface and routing still say UP.',
      'Collector normalizes to {metric, device, interface, value, time}: rx_power −10.9 dBm, crc_errors 1,240/min, oper_status UP, isis_adjacency UP, probe_loss AAR01→CPH01 0.4% (10:45–10:46).',
    ),
    events: [work('collector', 'normalize', 'normalize'), appear('norm-deg')],
  },
  {
    id: 'D4',
    chapter: 'detect',
    title: 'Enrich',
    caption: T(
      'Collector tags each measurement from its cached intent: the CPH01 interface facing ODE01 belongs to link CPH01–ODE01, on path A, carrying ACME. Path B’s links are tagged as ACME’s alternate. Collector hands the enriched observations to Observability.',
      'Hu0/0/0/1 → CPH01–ODE01 → path A → ACME-L3VPN-001; CPH01–KOL01 and KOL01–AAR01 → path B (ACME alternate). Collector → Observability: enriched observations (degraded).',
    ),
    events: [
      work('collector', 'enrich', 'enrich', 'tag (cached intent)'),
      appear('enr-deg'),
      hand('enr-deg', 'collector', 'observability'),
    ],
  },
  {
    id: 'D5',
    chapter: 'detect',
    title: 'Compute SLI',
    caption: T(
      'Observability computes ACME’s SLI: 0.4% of probe packets lost in the last minute, all in the AAR01→CPH01 direction. The probe measures each direction separately, so it sees loss on the damaged strand.',
      'SLI = max(loss CPH01→AAR01 0.00%, loss AAR01→CPH01 0.4%) over 10:45–10:46 = 0.4%. TWAMP-Light is sent from CPH01 and reflected by AAR01; the stateful reflector’s sequence numbers separate forward from reverse loss. A one-way CPH01→AAR01 probe would miss this loss.',
    ),
    events: [work('observability', 'computeSli', 'compute SLI'), appear('sli2')],
  },
  {
    id: 'D6',
    chapter: 'detect',
    title: 'Correlate',
    caption: T(
      'Observability correlates the loss with the low light and errors on path A in the same minute. The result is consistent with optical degradation on CPH01–ODE01: a strong clue, not proof.',
      'Correlation window 10:45–10:46 on path A: SLI 0.4% with Rx −10.9 dBm and CRC/FCS ≈1,240/min on CPH01 Hu0/0/0/1. Suspected: optical degradation ODE01→CPH01. A strong clue, not proof of root cause.',
    ),
    events: [work('observability', 'correlate', 'correlate'), appear('evid')],
  },
  {
    id: 'D7',
    chapter: 'detect',
    title: 'Link event',
    caption: T(
      'The evidence points at a backbone link, whatever it carries. Observability raises a link event: CPH01–ODE01 is suspected of optical degradation. It goes to Fault Management and to Orchestrator.',
      'Event link-degradation CPH01–ODE01 (suspect: ODE01→CPH01 Rx −10.9 dBm, CRC/FCS ≈1,240/min; not proof). No service is named. Observability → Fault Management, Orchestrator.',
    ),
    events: [
      work('observability', 'raiseEvent', 'raise link event'),
      appear('ev-link'),
      hand('ev-link', 'observability', 'presentation', 'faultMgmt'),
      hand('ev-link', 'observability', 'orchestrator'),
    ],
  },
  {
    id: 'D8',
    chapter: 'detect',
    title: 'Ticket',
    caption: T(
      'Orchestrator asks ITSM for the suspect link to be checked and repaired. Automation can route around a link, but only people can repair the fibre.',
      'Orchestrator → ITSM: repair request CPH01–ODE01 (from link-degradation). It needs no answer: the repair happens outside automation.',
    ),
    events: [appear('rr'), hand('rr', 'orchestrator', 'presentation', 'itsm')],
  },
  {
    id: 'D9',
    chapter: 'detect',
    title: 'Evaluate',
    caption: T(
      'Observability evaluates the SLI against the SLO rule. 0.4% breaches the objective, so ACME’s service is degraded, even though the interface is UP and routing is established. The Portal now shows it.',
      'Rule acme-loss: 0.4% ≥ 0.1% → service state DEGRADED. Observability → Portal. No workflow is running, so Orchestrator holds no subscription to service state.',
    ),
    events: [
      work('observability', 'evaluate', 'evaluate SLI against SLO'),
      appear('ss2'),
      hand('ss2', 'observability', 'presentation', 'portal'),
    ],
  },
  {
    id: 'D10',
    chapter: 'detect',
    title: 'Raise event',
    caption: T(
      'Observability raises a service-impact event: ACME’s loss objective is violated, with the suspected link and ACME’s current path attached. It goes to Fault Management and to Orchestrator. UP does not mean healthy: device state is not service state.',
      'Event acme-loss-violation (VIOLATED): service ACME-L3VPN-001, SLO loss < 0.1%, implicated link CPH01–ODE01, current path A. Observability → Fault Management, Orchestrator.',
    ),
    events: [
      work('observability', 'raiseEvent', 'raise event'),
      appear('ev-viol'),
      hand('ev-viol', 'observability', 'presentation', 'faultMgmt'),
      hand('ev-viol', 'observability', 'orchestrator'),
    ],
  },
  // ── Remediate ──
  {
    id: 'R1',
    chapter: 'remediate',
    title: 'Start workflow',
    caption: T(
      'The event starts Orchestrator’s remediation workflow, under a pre-approved policy.',
      'Workflow remediation/acme-loss-violation starts under pol-loss-reroute (pre-approved): if an SLO is violated, the evidence implicates a link on the current path, and a healthy alternate exists, request that the link be excluded.',
    ),
    events: [
      work('orchestrator', 'startWorkflow', 'start workflow', 'start pol-loss-reroute'),
      appear('wf-rem'),
    ],
  },
  {
    id: 'R2',
    chapter: 'remediate',
    title: 'Query alternate path',
    caption: T(
      'The policy needs a healthy alternate. Orchestrator asks Observability about ACME’s alternate path. Observability finds from Collector’s tags that it is path B, and its latest link telemetry looks healthy: normal light, no errors, UP. That shows the links are fine, not yet that ACME will be; ACME’s probe shows that after the move.',
      'Orchestrator ⇢ Observability: query alternate-path health for ACME-L3VPN-001. Observability resolves the alternate from enrichment tags (path B, CPH01–KOL01–AAR01) and assesses it from the 10:45–10:46 telemetry: Rx −2.1 to −2.6 dBm, CRC 0, oper UP. No probe runs on path B, so this is link health, not service health. Observability → Orchestrator: path B health HEALTHY.',
    ),
    events: [
      sig('queryAltPath', 'orchestrator', 'observability'),
      work(
        'observability',
        'assessPath',
        'assess alternate path',
        'assess path B from link telemetry',
      ),
      appear('pathB'),
      hand('pathB', 'observability', 'orchestrator'),
    ],
  },
  {
    id: 'R3',
    chapter: 'remediate',
    title: 'Evaluate policy',
    caption: T(
      'The workflow evaluates the policy: the SLO is violated, the evidence implicates CPH01–ODE01 on ACME’s current path, and a healthy alternate exists. It sends Intent a remediation decision to exclude that link; Intent, not Orchestrator, chooses the new path. Other designs might evaluate policy elsewhere.',
      'pol-loss-reroute conditions met. Orchestrator → Intent: remediation decision intent-change ACME-L3VPN-001, exclude-link CPH01–ODE01. The decision names no path. Where policy is evaluated is a design choice.',
    ),
    events: [
      work('orchestrator', 'evaluatePolicy', 'evaluate policy'),
      appear('dec'),
      hand('dec', 'orchestrator', 'intent'),
    ],
  },
  {
    id: 'R4',
    chapter: 'remediate',
    title: 'Record',
    caption: T(
      'Intent records derived network intent v2: exclude CPH01–ODE01, which leaves path B. ACME’s service intent is unchanged; only how the network delivers it changes.',
      'Network intent v2: exclude CPH01–ODE01; selected path B CPH01–KOL01–AAR01; colour 100. Service intent v1 = UNCHANGED (still L3VPN CPH01 ↔ AAR01, loss < 0.1%).',
    ),
    events: [
      work('intent', 'record', 'record network intent v2'),
      appear('ni2'),
      mark('si', 'UNCHANGED'),
    ],
  },
  {
    id: 'R5',
    chapter: 'remediate',
    title: 'Derive',
    caption: T(
      'Intent derives desired state v2 and tells Orchestrator it is ready, answering the remediation decision.',
      'Desired state v2 for CPH01 and AAR01: colour-100 policy towards path B, excluding CPH01–ODE01. Intent ⇢ Orchestrator: desired state v2 ready.',
    ),
    events: [
      work('intent', 'derive', 'derive desired state'),
      appear('ds2'),
      sig('desiredStateReady', 'intent', 'orchestrator', 'ds2'),
    ],
  },
  {
    id: 'R6',
    chapter: 'remediate',
    title: 'Order apply',
    caption: T(
      'With desired state v2 ready, Orchestrator hands Executor a new work order: apply desired state v2.',
      'Orchestrator → Executor: apply request (desired state v2, workflow remediation/acme-loss-violation). Executor takes desired state v2 directly from Intent.',
    ),
    events: [appear('ar2'), hand('ar2', 'orchestrator', 'executor')],
  },
  {
    id: 'R7',
    chapter: 'remediate',
    title: 'Apply',
    caption: T(
      'Executor takes desired state v2 directly from Intent and applies the change. ACME’s traffic, and its probe, move to path B via KOL01. Executor reports the change applied.',
      'Intent → Executor: desired state v2, direct. gNMI Set: configuration change v2 on CPH01 and AAR01. ACME (colour 100) and the probe now on path B. Executor ⇢ Orchestrator: applied v2.',
    ),
    events: [
      hand('ds2', 'intent', 'executor'),
      work('executor', 'render', 'render'),
      work('executor', 'apply', 'apply', 'gNMI Set'),
      appear('cc2'),
      hand('cc2', 'executor', 'network'),
      { t: 'network', acmePath: 'B' },
      sig('applied', 'executor', 'orchestrator', 'ds2'),
    ],
  },
  {
    id: 'R8',
    chapter: 'remediate',
    title: 'Read back',
    caption: T(
      'Configuration verification again. Orchestrator asks Collector to read back; Collector hands the observed state to Observability and reports the read-back done.',
      'Orchestrator ⇢ Collector: read back applied state. Network → Collector: gNMI Get. Collector → Observability: observed device state v2. Collector ⇢ Orchestrator: read back done.',
    ),
    events: [
      sig('readBack', 'orchestrator', 'collector'),
      appear('rb-b'),
      hand('rb-b', 'network', 'collector'),
      work('collector', 'readBack', 'read back', 'gNMI Get CPH01, AAR01'),
      appear('obs2'),
      hand('obs2', 'collector', 'observability'),
      sig('readBackDone', 'collector', 'orchestrator'),
    ],
  },
  {
    id: 'R9',
    chapter: 'remediate',
    title: 'Check conformance',
    caption: T(
      'Orchestrator asks Observability to check the change. Intent supplies desired state v2, the devices match it, and Observability tells Orchestrator.',
      'Orchestrator ⇢ Observability: check config v2. Intent → Observability: desired state v2, direct. Observed v2 conforms to desired v2. Observability ⇢ Orchestrator: in sync.',
    ),
    events: [
      sig('checkConformance', 'orchestrator', 'observability', 'ds2'),
      hand('ds2', 'intent', 'observability'),
      work(
        'observability',
        'checkConformance',
        'check conformance',
        'compare observed v2 with desired v2',
      ),
      sig('inSync', 'observability', 'orchestrator', 'ds2'),
    ],
  },
  {
    id: 'R10',
    chapter: 'remediate',
    title: 'Collect',
    caption: T(
      'Collector collects and normalizes fresh measurements. The fibre is still faulty, so errors continue on CPH01–ODE01, but ACME’s probe now runs over path B.',
      'Network → Collector: telemetry and TWAMP-Light, 10:48–10:49. CRC/FCS ≈1,240/min continues on CPH01 Hu0/0/0/1; probe loss 0.00% in both directions. Normalized to the common shape.',
    ),
    events: [
      appear('raw-after'),
      hand('raw-after', 'network', 'collector'),
      work('collector', 'collect', 'collect', 'gNMI subscribe, TWAMP-Light results'),
      work('collector', 'normalize', 'normalize'),
      appear('norm-after'),
    ],
  },
  {
    id: 'R11',
    chapter: 'remediate',
    title: 'Enrich',
    caption: T(
      'Collector tags the measurements from its updated cached intent: ACME’s probe is on path B, and CPH01–ODE01 no longer carries ACME. Collector hands them to Observability.',
      'Probe → path B → ACME-L3VPN-001; Hu0/0/0/1 → CPH01–ODE01 → no ACME service, from cached network intent v2. Collector → Observability: enriched observations (after reroute). How the cache follows Intent is out of scope here.',
    ),
    events: [
      work('collector', 'enrich', 'enrich', 'tag (cached intent)'),
      appear('enr-after'),
      hand('enr-after', 'collector', 'observability'),
    ],
  },
  {
    id: 'R12',
    chapter: 'remediate',
    title: 'Compute SLI',
    caption: T(
      'Observability computes ACME’s SLI: no packets lost in the last minute.',
      'SLI = max(loss CPH01→AAR01 0.00%, loss AAR01→CPH01 0.00%) over 10:48–10:49 = 0.00%.',
    ),
    events: [work('observability', 'computeSli', 'compute SLI'), appear('sli3')],
  },
  {
    id: 'R13',
    chapter: 'remediate',
    title: 'Evaluate',
    caption: T(
      'Observability checks the new SLI against the same SLO rule as before. Nothing is lost, so ACME’s service is healthy again. The rule didn’t change; the network did.',
      'Rule acme-loss (unchanged): SLI 0.00% < 0.1% → service state HEALTHY.',
    ),
    events: [work('observability', 'evaluate', 'evaluate SLI against SLO'), appear('ss3')],
  },
  {
    id: 'R14',
    chapter: 'remediate',
    title: 'Report and clear',
    caption: T(
      'Observability sends the healthy state to the Portal and to Orchestrator, whose workflow has been waiting for it, and clears the service-impact event in Fault Management. Orchestrator completes the remediation workflow.',
      'Observability → Portal, Orchestrator: service state HEALTHY; the workflow’s wait-for-HEALTHY subscription is satisfied. Observability → Fault Management: acme-loss-violation CLEARED. remediation/acme-loss-violation = COMPLETED.',
    ),
    events: [
      hand('ss3', 'observability', 'presentation', 'portal'),
      hand('ss3', 'observability', 'orchestrator'),
      work('observability', 'clearEvent', 'clear event'),
      appear('ev-clear'),
      hand('ev-clear', 'observability', 'presentation', 'faultMgmt'),
      work('orchestrator', 'completeWorkflow', 'complete workflow'),
      mark('wf-rem', 'COMPLETED'),
    ],
  },
  {
    id: 'R15',
    chapter: 'remediate',
    title: 'Closing',
    caption: T(
      'The fibre is still faulty, and its repair ticket from Detect is still open in ITSM. The service is healthy while the link is degraded: device state is not service state, in both directions. Here the policy was pre-approved, so the loop closed automatically; another deployment could pause for operator approval.',
      'Link CPH01–ODE01 still degraded (ODE01→CPH01 Rx −10.9 dBm); repair request CPH01–ODE01 open in ITSM. ACME-L3VPN-001 HEALTHY on path B. Closed-loop remediation is one pattern; an approval gate is another.',
    ),
    events: [],
  },
];

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
