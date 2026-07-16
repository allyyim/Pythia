export type MedusaSubgenre = {
  title: string;
  focus: string;
  recommendations: string[];
};

export type ReflectionCollection = {
  label: string;
  sourceSubgenres: string[];
};

export type ReflectionPrompt = {
  id: string;
  icon: string;
  line: string;
  keywords: string[];
  collections: ReflectionCollection[];
};

export const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: "identity",
    icon: "🪞",
    line: "I don't recognize myself anymore.",
    keywords: ["identity", "myself", "recognize", "becoming", "double", "doppelganger"],
    collections: [
      {
        label: "Identity Crisis",
        sourceSubgenres: ["Unreliable Women", "Outsider Women", "The Spiral"],
      },
      {
        label: "Doppelgangers",
        sourceSubgenres: ["Mirror Girls"],
      },
      {
        label: "Becoming",
        sourceSubgenres: ["Villain Origins", "Mythic Women", "Medusa Mode"],
      },
    ],
  },
  {
    id: "beauty",
    icon: "💄",
    line: "Beauty feels like a performance.",
    keywords: ["beauty", "body", "femininity", "performance", "pretty", "appearance"],
    collections: [
      {
        label: "Beauty Horror",
        sourceSubgenres: ["Medusa Mode", "Glamour & Rot"],
      },
      {
        label: "Body Horror",
        sourceSubgenres: ["Body Betrayal"],
      },
      {
        label: "Femininity",
        sourceSubgenres: ["Forbidden Fruit", "Gothic Girls", "Obsessive Desire"],
      },
    ],
  },
  {
    id: "rage",
    icon: "🩸",
    line: "I'm angry in ways I can't explain.",
    keywords: ["angry", "rage", "furious", "femgore", "revenge", "violence"],
    collections: [
      {
        label: "Female Rage",
        sourceSubgenres: ["Female Rage"],
      },
      {
        label: "Femgore",
        sourceSubgenres: ["Female Rage", "Body Betrayal"],
      },
    ],
  },
  {
    id: "gaze",
    icon: "👁",
    line: "I feel like everyone is watching me.",
    keywords: ["watching", "gaze", "society", "seen", "judge", "performance", "satire"],
    collections: [
      {
        label: "Society's Gaze",
        sourceSubgenres: ["Disoriented Daughters", "Glamour & Rot", "Outsider Women"],
      },
      {
        label: "Performance",
        sourceSubgenres: ["Obsessed Artists", "Unreliable Women", "Girl Failure"],
      },
      {
        label: "Social Satire",
        sourceSubgenres: ["Disoriented Daughters", "Girl Failure", "Glamour & Rot"],
      },
    ],
  },
  {
    id: "weird",
    icon: "🐇",
    line: "Reality feels slightly... off.",
    keywords: ["surreal", "off", "dream", "weird", "unreal", "strange", "logic"],
    collections: [
      {
        label: "Surreal",
        sourceSubgenres: ["Surreal Feminine", "The Spiral"],
      },
      {
        label: "Dream Logic",
        sourceSubgenres: ["The Spiral", "Surreal Feminine", "Existential Horror"],
      },
      {
        label: "Weird Girl",
        sourceSubgenres: ["Girl Failure", "The Spiral", "Surreal Feminine"],
      },
    ],
  },
];

export const MEDUSA_AUTHOR_BY_TITLE: Record<string, string> = {
  "acts of desperation": "Megan Nolan",
  "alias grace": "Margaret Atwood",
  animal: "Lisa Taddeo",
  "big swiss": "Jen Beagin",
  "bunny": "Mona Awad",
  "boy parts": "Eliza Clark",
  "carmilla": "Sheridan Le Fanu",
  "chlorine": "Jade Song",
  circe: "Madeline Miller",
  "cult classic": "Sloane Crosley",
  "convenience store woman": "Sayaka Murata",
  disorientation: "Elaine Hsieh Chou",
  "earthlings": "Sayaka Murata",
  eileen: "Ottessa Moshfegh",
  "girl, serpent, thorn": "Melissa Bashardoust",
  "gone girl": "Gillian Flynn",
  "her body and other parties": "Carmen Maria Machado",
  "luster": "Raven Leilani",
  "life ceremony": "Sayaka Murata",
  "milk fed": "Melissa Broder",
  "my year of rest and relaxation": "Ottessa Moshfegh",
  "nightbitch": "Rachel Yoder",
  "our wives under the sea": "Julia Armfield",
  "paradais": "Fernanda Melchor",
  rebecca: "Daphne du Maurier",
  rouge: "Mona Awad",
  "stone blind": "Natalie Haynes",
  "sirens muses": "Antonia Angress",
  "the bell jar": "Sylvia Plath",
  "the bloody chamber": "Angela Carter",
  "the guest": "Emma Cline",
  "the pisces": "Melissa Broder",
  "the vegetarian": "Han Kang",
  "woman, eating": "Claire Kohda",
  yellowface: "R. F. Kuang",
};

const MEDUSA_BOOK_BLURBS: Record<string, string> = {
  yellowface: "Literary ambition curdles into theft, performance, and public unraveling.",
  bunny: "A cult-like campus clique turns belonging into a surreal, predatory ritual.",
  "julie chan is dead": "Identity becomes a costume that starts consuming the wearer.",
  doppelganger: "Political and personal doubles collide until certainty becomes impossible.",
  rebecca: "A shadow self haunts every room, rewriting desire as dread.",
  "gone girl": "Narrative control itself becomes a weapon sharper than any confession.",
  "boy parts": "Artistic obsession mutates into voyeurism, cruelty, and self-erasure.",
  "the guest": "Social trespass spirals as reinvention edges into delusion.",
  "the vegetarian": "Refusal of social expectations becomes a visceral act of transformation.",
  "the bloody chamber": "Desire, danger, and gothic glamour braid into beautiful menace.",
  circe: "Exile and power forge a self that no longer asks permission.",
  nightbitch: "Domestic pressure cracks into feral metamorphosis and hard-won agency.",
  animal: "Grief and appetite drive a volatile search for control and release.",
  "the bell jar": "Psychic pressure closes in until language itself feels airless.",
  "our wives under the sea": "Love endures while the uncanny slowly rewrites the body.",
  earthlings: "Normalcy collapses into a brutal challenge to social conditioning.",
  "convenience store woman": "A meticulously performed life reveals the violence of fitting in.",
};

function normalizeBookKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getMedusaBookBlurb(collectionLabel: string, title: string) {
  const key = normalizeBookKey(title);
  const fromBook = MEDUSA_BOOK_BLURBS[key];

  if (fromBook) {
    return fromBook;
  }

  const collectionTone: Record<string, string> = {
    "Identity Crisis": "Identity splinters and the self starts feeling unfamiliar.",
    Doppelgangers: "A mirrored double turns resemblance into threat.",
    Becoming: "Transformation hardens into a new, unruly power.",
    "Beauty Horror": "Beauty rituals expose control, decay, and obsession.",
    "Body Horror": "The body becomes the site where fear turns physical.",
    Femininity: "Femininity is staged, judged, and pushed past its limits.",
    "Female Rage": "Anger refuses containment and becomes propulsion.",
    Femgore: "Rage and violence fuse into raw, transgressive change.",
    "Society's Gaze": "Public scrutiny reshapes identity into performance.",
    Performance: "Persona overtakes personhood under social pressure.",
    "Social Satire": "Satire strips normality to reveal underlying cruelty.",
    Surreal: "Reality bends toward dream logic and emotional distortion.",
    "Dream Logic": "Cause and effect unravel like a waking nightmare.",
    "Weird Girl": "Outsider strangeness becomes a source of force.",
  };

  return collectionTone[collectionLabel] ?? "Desire and danger move together through this uncanny pick.";
}

export const MEDUSA_SUBGENRES: MedusaSubgenre[] = [
  {
    title: "🐍 Medusa Mode — Beauty horror & monstrous women",
    focus: "Body, gaze, and power reshaped through monstrous femininity.",
    recommendations: [
      "Medusa",
      "Stone Blind",
      "Nightbitch",
      "The Vegetarian",
      "Rouge",
      "Girl, Serpent, Thorn",
      "Woman, Eating",
      "The Pisces",
      "The Bloody Chamber",
      "Circe",
    ],
  },
  {
    title: "🌀 The Spiral — Psychological unraveling",
    focus: "Stories where perception frays and reality spirals inward.",
    recommendations: [
      "Bunny by Mona Awad",
      "Earthlings by Sayaka Murata",
      "Big Swiss by Jen Beagin",
      "Boy Parts by Eliza Clark",
      "Eileen by Ottessa Moshfegh",
      "Milk Fed by Melissa Broder",
      "Cursed Bread by Sophie Mackintosh",
      "Convenience Store Woman by Sayaka Murata",
      "Paradais by Fernanda Melchor",
      "Blob: A Love Story by Maggie Su",
    ],
  },
  {
    title: "🎭 Unreliable Women — Untrustworthy narrators",
    focus: "Narratives led by women whose versions of truth keep shifting.",
    recommendations: [
      "Girl on the Train by Paula Hawkins",
      "Eileen by Ottessa Moshfegh",
      "Alias Grace by Margaret Atwood",
      "Gone Girl by Gillian Flynn",
      "The Last Mrs. Parrish by Liv Constantine",
      "Boy Parts by Eliza Clark",
      "Acts of Desperation by Megan Nolan",
      "The Guest by Emma Cline",
      "Luster by Raven Leilani",
      "Animal by Lisa Taddeo",
    ],
  },
  {
    title: "💀 Antiheroines — Morally gray protagonists",
    focus: "Compelling women making difficult and ethically murky choices.",
    recommendations: [
      "Gone Girl by Gillian Flynn",
      "Boy Parts by Eliza Clark",
      "Animal by Lisa Taddeo",
      "The Last Mrs. Parrish by Liv Constantine",
      "The Guest by Emma Cline",
      "Eileen by Ottessa Moshfegh",
      "Tampa by Alissa Nutting",
      "My Dark Vanessa by Kate Elizabeth Russell",
      "Acts of Desperation by Megan Nolan",
      "Luster by Raven Leilani",
    ],
  },
  {
    title: "🩸 Female Rage — Revenge & anger",
    focus: "Rage-forward fiction where anger becomes transformation.",
    recommendations: [
      "The Power by Naomi Alderman",
      "The Change by Kirsten Miller",
      "Nightbitch by Rachel Yoder",
      "The Vegetarian by Han Kang",
      "The Female of the Species by Mindy McGinnis",
      "Animal by Lisa Taddeo",
      "Maeve Fly by C. J. Leede",
      "The Lamb",
      "Best Offer Wins",
      "Her Body and Other Parties by Carmen Maria Machado",
    ],
  },
  {
    title: "🌙 Girl Failure — Adulting disasters",
    focus: "Messy adulthood, breakdown humor, and existential drift.",
    recommendations: [
      "Everyone in This Room Will Someday Be Dead",
      "Luster",
      "Interesting Facts About Space",
      "Pizza Girl",
      "Big Swiss",
      "The Idiot",
      "Milk Fed",
      "My Year of Rest and Relaxation",
      "The Guest",
      "Convenience Store Woman",
    ],
  },
  {
    title: "🪞 Mirror Girls — Identity swaps & doubles",
    focus: "Doubling, mimicry, and blurred selfhood.",
    recommendations: [
      "Yellowface by R. F. Kuang",
      "Bunny by Mona Awad",
      "Julie Chan Is Dead by Liann Zhang",
      "Such a Bad Influence by Olivia Muenter",
      "Doppelganger by Naomi Klein",
      "The Need by Helen Phillips",
      "The Blind Assassin by Margaret Atwood",
      "The Talented Mr. Ripley by Patricia Highsmith",
      "Alias Grace by Margaret Atwood",
      "Rebecca by Daphne du Maurier",
    ],
  },
  {
    title: "🏛 Dark Academia — Obsession & intellect",
    focus: "Scholarship, elitism, and dangerous fixation.",
    recommendations: [
      "The Secret History",
      "If We Were Villains",
      "Catherine House",
      "Bunny",
      "Ninth House",
      "Vita Nostra",
      "The Maidens",
      "Special Topics in Calamity Physics",
      "The Atlas Six",
      "A Lesson in Vengeance",
    ],
  },
  {
    title: "🍎 Forbidden Fruit — Desire & temptation",
    focus: "Desire-led stories that cross social and moral boundaries.",
    recommendations: [
      "The Pisces",
      "Tampa",
      "The Bloody Chamber",
      "Acts of Desperation",
      "Milk Fed",
      "Animal",
      "The Guest",
      "Boy Parts",
      "The Last Mrs. Parrish",
      "Rebecca",
    ],
  },
  {
    title: "🌏 Disoriented Daughters — Diaspora & identity",
    focus: "Belonging, inheritance, and cultural fragmentation.",
    recommendations: [
      "Disorientation by Elaine Hsieh Chou",
      "Yolk by Mary H. K. Choi",
      "Pachinko by Min Jin Lee",
      "Crying in H Mart by Michelle Zauner",
      "Boring Asian Female by Canwen Xu",
      "Minor Feelings by Cathy Park Hong",
      "On Earth We're Briefly Gorgeous by Ocean Vuong",
      "The School for Good Mothers by Jessamine Chan",
      "Honey by Imani Thompson",
      "You Will Never Be Me by Jesse Q. Sutanto",
    ],
  },
  {
    title: "🖋 Obsessed Artists — Writers & ambition",
    focus: "Artistic hunger, ego, and creation as compulsion.",
    recommendations: [
      "Yellowface by R. F. Kuang",
      "Big Swiss by Jen Beagin",
      "The White Book by Han Kang",
      "My Year of Rest and Relaxation by Ottessa Moshfegh",
      "The Guest by Emma Cline",
      "Sirens & Muses by Antonia Angress",
      "Eileen by Ottessa Moshfegh",
      "Life Ceremony by Sayaka Murata",
      "Cult Classic by Sloane Crosley",
    ],
  },
  {
    title: "🧬 Body Betrayal — Body horror & transformation",
    focus: "Metamorphosis, illness dread, and flesh as narrative pressure.",
    recommendations: [
      "Natural Beauty by Ling Ling Huang",
      "Open Wide",
      "Perfume and Pain by Anna Dorn",
      "Sour Fruit",
      "The Vegetarian by Han Kang",
      "Chlorine by Jade Song",
      "Meat by Brittany K. Allen",
      "Brainwyrms by Alison Rumfitt",
      "The Eyes Are the Best Part by Monika Kim",
      "Itch! by Gemma Amor"
    ],
  },
  {
    title: "🏠 Domestic Nightmares — Home/motherhood horror",
    focus: "Homes and families as sites of mounting dread.",
    recommendations: [
      "The School for Good Mothers",
      "We Need to Talk About Kevin",
      "Motherthing",
      "Nightbitch",
      "Rebecca",
      "The Push",
      "Sharp Objects",
      "The Turn of the Key",
      "Baby Teeth",
      "Mexican Gothic",
    ],
  },
  {
    title: "🐇 Surreal Feminine — Weird reality",
    focus: "Dream logic and uncanny feminine-centered worlds.",
    recommendations: [
      "Convenience Store Woman",
      "Pizza Girl",
      "Drive Your Plow Over the Bones of the Dead",
      "Bunny",
      "Earthlings",
      "The Need",
      "Jawbone",
      "Our Wives Under the Sea",
      "The Guest",
      "The Vegetarian",
    ],
  },
  {
    title: "🕯 Gothic Girls — Haunted women",
    focus: "Atmospheric gothic with women in haunted psychological spaces.",
    recommendations: [
      "Rebecca by Daphne du Maurier",
      "Mexican Gothic by Silvia Moreno-Garcia",
      "The Bloody Chamber by Angela Carter",
      "The Death of Jane Lawrence by Caitlin Starling",
      "The Little Stranger by Sarah Waters",
      "The Woman in Black by Susan Hill",
      "Jane Eyre by Charlotte Bronte",
      "Wuthering Heights by Emily Bronte",
      "The Haunting of Hill House by Shirley Jackson",
      "Carmilla by Sheridan Le Fanu",
    ],
  },
  {
    title: "👁 Outsider Women — Alienation",
    focus: "Women observing from the margins, estranged from the norm.",
    recommendations: [
      "Eleanor Oliphant Is Completely Fine",
      "Eileen",
      "Milk Fed",
      "The Invisible Life of Addie LaRue by V. E. Schwab",
      "Convenience Store Woman",
      "Luster",
      "The Bell Jar",
      "Acts of Desperation",
      "Interesting Facts About Space",
      "Animal",
    ],
  },
  {
    title: "🔥 Villain Origins — Becoming the monster",
    focus: "Transformation arcs where protagonists claim villainy.",
    recommendations: [
      "Circe",
      "Malice",
      "Vicious",
      "Stone Blind",
      "Gone Girl",
      "Boy Parts",
      "The Last Mrs. Parrish",
      "Animal",
      "Maeve Fly",
      "The Secret History",
    ],
  },
  {
    title: "🏺 Mythic Women — Feminist retellings",
    focus: "Classic myths re-centered through women and power.",
    recommendations: [
      "Circe",
      "A Thousand Ships",
      "Stone Blind",
      "Ariadne",
      "Kaikeyi",
      "The Penelopiad",
      "The Silence of the Girls",
      "Piranesi",
      "Lore",
      "The Goddess Chronicle",
    ],
  },
  {
    title: "🕯 Obsessive Desire — Female obsession",
    focus: "Fixation that consumes identity, relationships, or work.",
    recommendations: [
      "The Pisces by Melissa Broder",
      "Acts of Desperation by Megan Nolan",
      "Boy Parts by Eliza Clark",
      "A Certain Hunger by Chelsea G. Summers",
      "My Year of Rest and Relaxation by Ottessa Moshfegh",
      "Eileen by Ottessa Moshfegh",
      "The Guest by Emma Cline",
      "Animal by Lisa Taddeo",
      "Rouge by Mona Awad",
      "Immaculate Conception by Ling Ling Huang",
    ],
  },
  {
    title: "🧸 Girlhood Gone Wrong — Dark coming-of-age",
    focus: "Coming-of-age stories where innocence curdles into dread.",
    recommendations: [
      "Jawbone by Monica Ojeda",
      "A Head Full of Ghosts by Paul Tremblay",
      "Pizza Girl by Jean Kyoung Frazier",
      "House of Hollow by Krystal Sutherland",
      "Burn Our Bodies Down by Rory Power",
      "The Grace Year by Kim Liggett",
      "White Is for Witching by Helen Oyeyemi",
    ],
  },
  {
    title: "🕸 Cults & Cliques — Dangerous belonging",
    focus: "Belonging as manipulation, hierarchy, and risk.",
    recommendations: [
      "Bunny",
      "The Girls",
      "The Secret Place",
      "Foxfire",
      "The Chosen and the Beautiful",
      "The Maidens",
      "A Lesson in Vengeance",
      "The Secret History",
      "The Group",
      "The Truants",
    ],
  },
  {
    title: "🥀 Glamour & Rot — Wealth/status horror",
    focus: "Luxury aesthetics masking social decay and cruelty.",
    recommendations: [
      "The Guest",
      "The Last Mrs. Parrish",
      "The Talented Mr. Ripley",
      "Gone Girl",
      "The Secret History",
      "Rebecca",
      "The Great Gatsby",
      "The Bell Jar",
      "Luckiest Girl Alive",
      "The White Lotus (inspired reads)",
    ],
  },
  {
    title: "🪦 Existential Horror — Meaninglessness & modern dread",
    focus: "Dread rooted in emptiness, repetition, and existential collapse.",
    recommendations: [
      "No Longer Human",
      "The Memory Police",
      "Severance",
      "The Bell Jar",
      "Convenience Store Woman",
      "The Vegetarian",
      "Paradais",
      "The Stranger",
      "Nausea"
    ],
  },
];
