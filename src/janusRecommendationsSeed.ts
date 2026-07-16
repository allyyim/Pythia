export type WorldType =
  | "controlled"
  | "engineered"
  | "artificial"
  | "vanishing"
  | "altered"
  | "beyondEarth"
  | "timelines";

export type HumanQuestion =
  | "truth"
  | "human"
  | "choice"
  | "optimize"
  | "survive"
  | "reality";

export type AxisOption<T extends string> = {
  id: T;
  label: string;
  subtitle: string;
};

export type JanusBook = {
  title: string;
  author: string;
  worldTypes: WorldType[];
  humanQuestions: HumanQuestion[];
  reason: string;
};

export const WORLD_OPTIONS: AxisOption<WorldType>[] = [
  {
    id: "controlled",
    label: "Controlled Societies",
    subtitle: "Dystopian governments, surveillance, authoritarian worlds",
  },
  {
    id: "engineered",
    label: "Engineered Humanity",
    subtitle: "Cloning, genetics, reproduction, human experimentation",
  },
  {
    id: "artificial",
    label: "Artificial Futures",
    subtitle: "AI, technology, automation, machine consciousness",
  },
  {
    id: "vanishing",
    label: "Vanishing Worlds",
    subtitle: "Environmental collapse, isolation, disappearing societies",
  },
  {
    id: "altered",
    label: "Altered Reality",
    subtitle: "Memory, perception, truth manipulation",
  },
  {
    id: "beyondEarth",
    label: "Beyond Earth",
    subtitle: "Space, alien civilizations, cosmic futures",
  },
  {
    id: "timelines",
    label: "Possible Timelines",
    subtitle: "Alternate histories, parallel worlds, future branches",
  },
];

export const HUMAN_OPTIONS: AxisOption<HumanQuestion>[] = [
  {
    id: "truth",
    label: "Who controls the truth?",
    subtitle: "Propaganda, censorship, memory",
  },
  {
    id: "human",
    label: "What makes us human?",
    subtitle: "Consciousness, cloning, identity",
  },
  {
    id: "choice",
    label: "Who controls our choices?",
    subtitle: "Relationships, reproduction, social rules",
  },
  {
    id: "optimize",
    label: "What happens when society optimizes people?",
    subtitle: "Conformity, efficiency, hierarchy",
  },
  {
    id: "survive",
    label: "Can humanity survive itself?",
    subtitle: "Extinction, climate, adaptation",
  },
  {
    id: "reality",
    label: "What happens when reality changes?",
    subtitle: "Perception, identity, uncertainty",
  },
];

export const JANUS_LIBRARY: JanusBook[] = [
  {
    title: "1984",
    author: "George Orwell",
    worldTypes: ["controlled"],
    humanQuestions: ["truth", "optimize"],
    reason: "Surveillance and propaganda weaponize language to control society.",
  },
  {
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    worldTypes: ["controlled", "engineered"],
    humanQuestions: ["choice", "truth"],
    reason: "A regime governs bodies, story, and future through strict social design.",
  },
  {
    title: "We",
    author: "Yevgeny Zamyatin",
    worldTypes: ["controlled", "timelines"],
    humanQuestions: ["optimize", "choice"],
    reason: "A mathematically perfected state reveals the violence of total conformity.",
  },
  {
    title: "Brave New World",
    author: "Aldous Huxley",
    worldTypes: ["controlled", "engineered"],
    humanQuestions: ["human", "choice", "optimize"],
    reason: "Engineered happiness asks what humanity sacrifices for stability.",
  },
  {
    title: "The Wall",
    author: "Marlen Haushofer",
    worldTypes: ["vanishing"],
    humanQuestions: ["survive", "reality"],
    reason: "Isolation and collapse narrow the world to survival and inner truth.",
  },
  {
    title: "The Metropolis",
    author: "Thea von Harbou",
    worldTypes: ["controlled", "artificial"],
    humanQuestions: ["optimize", "human"],
    reason: "A mechanized city exposes class hierarchy and machine-like social order.",
  },
  {
    title: "Player Piano",
    author: "Kurt Vonnegut",
    worldTypes: ["artificial", "controlled"],
    humanQuestions: ["human", "optimize"],
    reason: "Automation displaces purpose and tests what gives people meaning.",
  },
  {
    title: "Never Let Me Go",
    author: "Kazuo Ishiguro",
    worldTypes: ["engineered"],
    humanQuestions: ["human", "choice"],
    reason: "A quiet dystopia asks who is allowed personhood and agency.",
  },
  {
    title: "The Vanishing World",
    author: "Sayaka Murata",
    worldTypes: ["engineered", "timelines"],
    humanQuestions: ["choice", "optimize"],
    reason: "Alternative social norms challenge intimacy, family, and personal autonomy.",
  },
  {
    title: "The One",
    author: "John Marrs",
    worldTypes: ["artificial", "engineered"],
    humanQuestions: ["choice", "human"],
    reason: "Genetic certainty in romance exposes the ethics of algorithmic intimacy.",
  },
  {
    title: "The Marriage Act",
    author: "John Marrs",
    worldTypes: ["controlled", "artificial"],
    humanQuestions: ["choice", "truth"],
    reason: "A monitored marriage system turns private life into state-enforced behavior.",
  },
  {
    title: "Tell Me an Ending",
    author: "Jo Harkin",
    worldTypes: ["altered", "artificial"],
    humanQuestions: ["truth", "reality", "human"],
    reason: "Memory editing reframes identity, consent, and ownership of the self.",
  },
  {
    title: "The Memory Police",
    author: "Yoko Ogawa",
    worldTypes: ["altered", "controlled"],
    humanQuestions: ["truth", "reality"],
    reason: "A disappearing world criminalizes memory and erodes shared reality.",
  },
  {
    title: "I Who Have Never Known Men",
    author: "Jacqueline Harpman",
    worldTypes: ["vanishing", "altered"],
    humanQuestions: ["human", "survive", "reality"],
    reason: "An emptied world asks what identity becomes when memory, history, and society disappear.",
  },
  {
    title: "Sike",
    author: "Fred Lunzer",
    worldTypes: ["altered", "timelines"],
    humanQuestions: ["reality", "truth"],
    reason: "A fractured speculative puzzle about perception, narrative, and unstable truth.",
  },
];
