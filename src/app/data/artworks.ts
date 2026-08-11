export type Category = "portrait" | "wildlife" | "landscape";

export interface Artwork {
  slug: string;
  title: string;
  year: number;
  medium: string;
  category: Category;
  description: string;
  image: string;
}

export const categoryLabels: Record<Category, string> = {
  portrait: "Portraits",
  wildlife: "Wildlife",
  landscape: "Landscapes",
};

export const artworks: Artwork[] = [
  {
    slug: "robert",
    title: "Robert",
    year: 2017,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "A reflection on quiet strength and the dignity found in ordinary individuals. Rather than portraying heroism through dramatic action, the work celebrates resilience expressed through composure, presence, and self-assurance.",
    image: "/art/page04_art.png",
  },
  {
    slug: "portrait-of-lloyd-robertson",
    title: "Portrait of Lloyd Robertson",
    year: 2026,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "Reflects the enduring values of integrity, wisdom, and public trust. Created using a painterly digital workflow inspired by classical portraiture, with controlled lighting and refined brushwork to emphasize character over spectacle.",
    image: "/art/page05_art.png",
  },
  {
    slug: "communion",
    title: "Communion",
    year: 2026,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "A commissioned work preserving a moment of faith, devotion, and cultural tradition — reflecting the quiet reverence and shared sense of belonging that define such occasions.",
    image: "/art/page06_art.png",
  },
  {
    slug: "aarti",
    title: "Aarti",
    year: 2026,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "Inspired by the sacred ritual of offering light, exploring the relationship between physical illumination and inner awakening — fire as a symbol of devotion and transformation.",
    image: "/art/page07_art.png",
  },
  {
    slug: "pilgrim-of-peace",
    title: "Pilgrim of Peace",
    year: 2024,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "Reflects a life shaped by faith, compassion, and selfless service — honoring the quiet strength found in humility and the wisdom gained through a lifetime devoted to others.",
    image: "/art/page08_art.png",
  },
  {
    slug: "stillness",
    title: "Stillness",
    year: 2024,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "Explores the quiet strength that emerges from a life shaped by faith, compassion, and service — the enduring power of humility and inner peace.",
    image: "/art/page09_art.png",
  },
  {
    slug: "silent-resolve",
    title: "Silent Resolve",
    year: 2017,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "Explores the strength that exists without display or recognition — resilience revealed through composure, conviction, and quiet confidence.",
    image: "/art/page10_art.png",
  },
  {
    slug: "resolve",
    title: "Resolve",
    year: 2020,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "Explores the quiet determination that defines character beyond outward appearance — confidence expressed through composure rather than dramatic action.",
    image: "/art/page11_art.png",
  },
  {
    slug: "quiet-moment",
    title: "Quiet Moment",
    year: 2017,
    medium: "Digital Painting",
    category: "portrait",
    description:
      "Reflects the value of stillness in a world often defined by constant movement, inviting viewers to appreciate the quiet dignity found in ordinary moments.",
    image: "/art/page12_art.png",
  },
  {
    slug: "shadow-walker",
    title: "Shadow Walker",
    year: 2022,
    medium: "Digital Painting",
    category: "wildlife",
    description:
      "Explores the quiet authority of the black panther — a symbol of patience, instinct, and purposeful restraint, emerging from darkness into light.",
    image: "/art/page13_art.png",
  },
  {
    slug: "silent-watcher",
    title: "Silent Watcher",
    year: 2022,
    medium: "Digital Painting",
    category: "wildlife",
    description:
      "Explores the quiet wisdom and unwavering awareness embodied by the wolf — strength found in patience, observation, and purposeful restraint.",
    image: "/art/page14_art.png",
  },
  {
    slug: "songbird",
    title: "Songbird",
    year: 2023,
    medium: "Digital Painting",
    category: "wildlife",
    description:
      "Celebrates the quiet beauty that often goes unnoticed in the natural world — grace, resilience, and wonder found in the simplest moments.",
    image: "/art/page15_art.png",
  },
  {
    slug: "lilac-roller",
    title: "Lilac Roller",
    year: 2022,
    medium: "Digital Painting",
    category: "wildlife",
    description:
      "Celebrates the remarkable harmony of color and form found in the natural world, reflecting both the diversity and artistry of nature itself.",
    image: "/art/page16_art.png",
  },
  {
    slug: "french-village",
    title: "French Village",
    year: 2023,
    medium: "Digital Painting",
    category: "landscape",
    description:
      "Inspired by the timeless charm of historic European streets — the enduring character of streets shaped by history, craftsmanship, and tradition.",
    image: "/art/page17_art.png",
  },
  {
    slug: "ancient-columns",
    title: "Ancient Columns",
    year: 2023,
    medium: "Digital Painting",
    category: "landscape",
    description:
      "Reflects on the enduring dialogue between history, architecture, and time — weathered stone as testament to civilizations long after their voices have faded.",
    image: "/art/page18_art.png",
  },
  {
    slug: "autumn-creek",
    title: "Autumn Creek",
    year: 2023,
    medium: "Digital Painting",
    category: "landscape",
    description:
      "Reflects on the quiet harmony that emerges when light, water, and woodland exist in balance — nature's continual cycle of transformation and renewal.",
    image: "/art/page19_art.png",
  },
  {
    slug: "mount-egmont",
    title: "Mount Egmont",
    year: 2023,
    medium: "Digital Painting",
    category: "landscape",
    description:
      "Explores the quiet grandeur of one of New Zealand's most iconic volcanic landscapes — harmony between mountain, water, and sky.",
    image: "/art/page20_art.png",
  },
  {
    slug: "desert-solitude",
    title: "Desert Solitude",
    year: 2023,
    medium: "Digital Painting",
    category: "landscape",
    description:
      "Reflects on the enduring resilience found within seemingly unforgiving landscapes — strength, simplicity, and stillness beneath a vast expanse of sky.",
    image: "/art/page21_art.png",
  },
];
