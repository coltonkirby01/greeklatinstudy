export type CourseId = "greek" | "latin" | "reading";

type CourseSourceLink = {
  label: string;
  href: string;
};

type CourseTitleLink = {
  label: string;
  href: string;
};

export const primaryNavLinks = [
  { label: "Home", href: "/" },
  { label: "Greek", href: "/greek" },
  { label: "Latin", href: "/latin" },
  { label: "Stats", href: "/stats" },
  { label: "Reading", href: "/reading" },
] as const;

export const homeCourses = [
  {
    id: "greek",
    visual: "greek",
    count: "",
    eyebrow: "Greek",
    title: "Groton's From Alpha to Omega",
    titleLinks: [
      { label: "Groton's From Alpha to Omega", href: "https://www.scribd.com/doc/302497008/From-Alpha-to-Omega-A-Beginning-Course-in-Classical-Greek" },
    ],
    description: "",
    sourceLinks: [
      { label: "Buy the 5th edition on Amazon", href: "https://www.amazon.com/dp/1647930189" },
    ],
    href: "/greek",
    linkLabel: "Study Greek",
  },
  {
    id: "latin",
    visual: "latin",
    count: "",
    eyebrow: "Latin",
    title: "Dickinson Vocabulary · Henle Grammer",
    titleLinks: [
      { label: "Dickinson Vocabulary", href: "https://dcc.dickinson.edu/latin-core-list1" },
      { label: "Henle Grammer", href: "https://www.scribd.com/document/550308631/Henle-Latin-Grammar" },
    ],
    description: "",
    sourceLinks: [
      { label: "Buy Henle Latin Grammar on Amazon", href: "https://www.amazon.com/dp/0829401121" },
    ],
    href: "/latin",
    linkLabel: "Study Latin",
  },
  {
    id: "reading",
    visual: "reading",
    count: "Greek & Latin",
    eyebrow: "Reading & Audio",
    title: "Follow a passage word by word",
    titleLinks: [] as CourseTitleLink[],
    description: "Save readings, attach audio, navigate sentences, and use timing-based highlighting.",
    sourceLinks: [] as CourseSourceLink[],
    href: "/reading",
    linkLabel: "Open readings",
  },
] as const satisfies ReadonlyArray<{
  id: CourseId;
  visual: CourseId;
  count: string;
  eyebrow: string;
  title: string;
  titleLinks: readonly CourseTitleLink[];
  description: string;
  sourceLinks: readonly CourseSourceLink[];
  href: string;
  linkLabel: string;
}>;
