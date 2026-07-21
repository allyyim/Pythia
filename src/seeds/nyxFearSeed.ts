export type NyxFearPath = {
  id: string;
  fear: string;
  leadsTo: string;
  seedAuthors?: string[];
  seedBooks?: Array<{
    title: string;
    author?: string;
    link?: string;
  }>;
};

export const NYX_FEAR_PATHS: NyxFearPath[] = [
  {
    id: "ghosts",
    fear: "Ghosts",
    leadsTo: "Haunted houses, spirits, paranormal horror",
    seedAuthors: ["Edgar Allan Poe", "Shirley Jackson"],
  },
  {
    id: "monsters",
    fear: "Monsters",
    leadsTo: "Vampires, werewolves, creatures, cryptids",
  },
  {
    id: "woods",
    fear: "The Woods",
    leadsTo: "Folk horror, forests, pagan rituals",
  },
  {
    id: "unknown",
    fear: "The Unknown",
    leadsTo: "Cosmic horror, eldritch beings, existential dread",
    seedAuthors: ["H. P. Lovecraft", "Edgar Allan Poe"],
  },
  {
    id: "curses",
    fear: "Curses",
    leadsTo: "Occult, witches, forbidden magic, haunted objects",
  },
  {
    id: "abandoned",
    fear: "Abandoned Places",
    leadsTo: "Gothic horror, ruins, empty towns, liminal spaces",
  },
  {
    id: "dead",
    fear: "The Dead",
    leadsTo: "Graveyards, revenants, necromancy, death",
  },
  {
    id: "deep",
    fear: "The Deep",
    leadsTo: "Oceans, underwater horror, leviathans",
    seedBooks: [
      {
        title: "Our Wives Under the Sea",
        author: "Julia Armfield",
        link: "https://www.goodreads.com/search?q=Our+Wives+Under+the+Sea+Julia+Armfield",
      },
      {
        title: "Tidepool",
        author: "Nicole Willson",
        link: "https://www.goodreads.com/search?q=Tidepool+Nicole+Willson",
      },
      {
        title: "The Fisherman",
        author: "John Langan",
        link: "https://www.goodreads.com/search?q=The+Fisherman+John+Langan",
      },
      {
        title: "Below",
        author: "Ryan Lockwood",
        link: "https://www.goodreads.com/search?q=Below+Ryan+Lockwood",
      },
      {
        title: "Dead Sea",
        author: "Tim Curran",
        link: "https://www.goodreads.com/search?q=Dead+Sea+Tim+Curran",
      },
      {
        title: "From Below",
        author: "Darcy Coates",
        link: "https://www.goodreads.com/search?q=From+Below+Darcy+Coates",
      },
      {
        title: "Into the Drowning Deep",
        author: "Mira Grant",
        link: "https://www.goodreads.com/search?q=Into+the+Drowning+Deep+Mira+Grant",
      },
      {
        title: "The Narrative of Arthur Gordon Pym",
        author: "Edgar Allan Poe",
        link: "https://www.goodreads.com/search?q=The+Narrative+of+Arthur+Gordon+Pym+Edgar+Allan+Poe",
      },
      {
        title: "Starfish",
        author: "Peter Watts",
        link: "https://www.goodreads.com/search?q=Starfish+Peter+Watts",
      },
    ],
  },
  {
    id: "watched",
    fear: "Being Watched",
    leadsTo: "Stalkers, unseen entities, paranoia from an external presence",
  },
  {
    id: "dark",
    fear: "The Dark",
    leadsTo: "Night, shadows, things that emerge after sunset",
    seedAuthors: ["Edgar Allan Poe", "Thomas Ligotti"],
  },
];
