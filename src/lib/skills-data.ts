// Service / Skill taxonomy for Vutabiz (Soko Nyumbani Business Hub)
// Two-level: Category → Specialty. Advertisers offering a service pick a
// category then a specific specialty; specialty auto-fills the Job/Skill title.
//
// `slug` on each category must stay in sync with the rows seeded by
// supabase/migrations/20260731090000_unified_category_taxonomy.sql.
// Each `specialty` is matched to its own database row via the deterministic
// `specialtySlug()` helper in src/lib/slug.ts, seeded by
// supabase/migrations/20260801090000_category_leaf_taxonomy.sql.

export type SkillCategory = { slug: string; name: string; specialties: string[] };

export type SkillSubCategory = {
  slug: string;
  name: string;
  shortName: string;
  specialties: string[];
};

export const CONSTRUCTION_SUB_CATEGORIES: SkillSubCategory[] = [
  {
    slug: "construction-helpers",
    name: "Construction Helpers",
    shortName: "Helpers",
    specialties: ["Basic Site Works", "Off-loader", "Waste Removal", "Fumigation", "Other Helper"],
  },
  {
    slug: "construction-specialist-1",
    name: "Construction Specialist – Site & Structure",
    shortName: "Specialist – Site & Structure",
    specialties: [
      "Site Excavation",
      "Borehole / Pit Digging",
      "Mason",
      "Plumber",
      "Carpenter",
      "Electrician (Solar/Generator)",
    ],
  },
  {
    slug: "construction-specialist-2",
    name: "Construction Specialist – Finishing",
    shortName: "Specialist – Finishing",
    specialties: [
      "Tiles",
      "Terrazzo",
      "Cabro",
      "Mazeras",
      "Gypsum",
      "Painter",
      "Glass & Aluminium",
      "Doors / Windows (Welder)",
      "Interior (Curtains/Cabinets)",
    ],
  },
  {
    slug: "construction-specialist-3",
    name: "Construction Specialist – Security & Utilities",
    shortName: "Specialist – Security & Utilities",
    specialties: [
      "Shades / Tents",
      "Water Pumps / Tanks",
      "Fencing (Razor/Electric)",
      "Alarms",
      "CCTV / Wi-Fi",
    ],
  },
  {
    slug: "construction-specialist-4",
    name: "Construction Specialist – Advanced Systems",
    shortName: "Specialist – Advanced Systems",
    specialties: [
      "Biodigesters",
      "Biogas",
      "Irrigation",
      "Fish Pond",
      "Swimming Pools",
      "Landscaping",
    ],
  },
];

export const CONSTRUCTION_SLUGS = CONSTRUCTION_SUB_CATEGORIES.map((c) => c.slug);

export type ServiceCategoryOption = {
  slug: string;
  name: string;
  isGroup?: boolean;
  subCategories?: SkillSubCategory[];
  specialties?: string[];
};

export const SERVICE_CATEGORIES: ServiceCategoryOption[] = [
  {
    slug: "agricultural-workers",
    name: "Agricultural Workers",
    specialties: ["Farmhand", "Herdsman", "Ploughing", "Dog Training", "Other Agricultural"],
  },
  {
    slug: "domestic-workers",
    name: "Domestic Workers",
    specialties: ["Guard / Security", "House Servant", "Cook / Catering", "Nanny", "Cleaner", "Other Domestic"],
  },
  {
    slug: "construction",
    name: "Construction",
    isGroup: true,
    subCategories: CONSTRUCTION_SUB_CATEGORIES,
  },
  {
    slug: "transport-logistics",
    name: "Transport & Logistics",
    specialties: ["Taxi", "Lorry", "Boda Boda", "Tuk Tuk", "Pickup", "Other Transport"],
  },
  {
    slug: "car-repair",
    name: "Car Repair",
    specialties: ["Tyres", "Body Works", "Upholstery", "Auto Electric", "Mechanic"],
  },
  {
    slug: "home-electronics-repair",
    name: "Home Electronics Repair",
    specialties: [
      "TV",
      "Radio",
      "Cookers",
      "Fridges",
      "Microwaves",
      "Kitchen Appliances",
      "Laundry Appliances",
    ],
  },
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    slug: "agricultural-workers",
    name: "Agricultural Workers",
    specialties: ["Farmhand", "Herdsman", "Ploughing", "Dog Training", "Other Agricultural"],
  },
  {
    slug: "domestic-workers",
    name: "Domestic Workers",
    specialties: ["Guard / Security", "House Servant", "Cook / Catering", "Nanny", "Cleaner", "Other Domestic"],
  },
  {
    slug: "construction-helpers",
    name: "Construction Helpers",
    specialties: ["Basic Site Works", "Off-loader", "Waste Removal", "Fumigation", "Other Helper"],
  },
  {
    slug: "construction-specialist-1",
    name: "Construction Specialist – Site & Structure",
    specialties: [
      "Site Excavation",
      "Borehole / Pit Digging",
      "Mason",
      "Plumber",
      "Carpenter",
      "Electrician (Solar/Generator)",
    ],
  },
  {
    slug: "construction-specialist-2",
    name: "Construction Specialist – Finishing",
    specialties: [
      "Tiles",
      "Terrazzo",
      "Cabro",
      "Mazeras",
      "Gypsum",
      "Painter",
      "Glass & Aluminium",
      "Doors / Windows (Welder)",
      "Interior (Curtains/Cabinets)",
    ],
  },
  {
    slug: "construction-specialist-3",
    name: "Construction Specialist – Security & Utilities",
    specialties: [
      "Shades / Tents",
      "Water Pumps / Tanks",
      "Fencing (Razor/Electric)",
      "Alarms",
      "CCTV / Wi-Fi",
    ],
  },
  {
    slug: "construction-specialist-4",
    name: "Construction Specialist – Advanced Systems",
    specialties: [
      "Biodigesters",
      "Biogas",
      "Irrigation",
      "Fish Pond",
      "Swimming Pools",
      "Landscaping",
    ],
  },
  {
    slug: "transport-logistics",
    name: "Transport & Logistics",
    specialties: ["Taxi", "Lorry", "Boda Boda", "Tuk Tuk", "Pickup", "Other Transport"],
  },
  {
    slug: "car-repair",
    name: "Car Repair",
    specialties: ["Tyres", "Body Works", "Upholstery", "Auto Electric", "Mechanic"],
  },
  {
    slug: "home-electronics-repair",
    name: "Home Electronics Repair",
    specialties: [
      "TV",
      "Radio",
      "Cookers",
      "Fridges",
      "Microwaves",
      "Kitchen Appliances",
      "Laundry Appliances",
    ],
  },
];