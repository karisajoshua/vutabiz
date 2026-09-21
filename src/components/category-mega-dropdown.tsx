import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { CATEGORY_TREE } from "@/lib/category-tree";
import { SERVICE_CATEGORIES } from "@/lib/skills-data";

type MegaDropdownGroup = {
  slug: string;
  name: string;
  isServiceGroup?: boolean;
  children: {
    slug: string;
    name: string;
    isGroup?: boolean;
    subCategories?: {
      slug: string;
      name: string;
      shortName: string;
      specialties: string[];
    }[];
    items: string[];
  }[];
};

const MEGA_GROUPS: MegaDropdownGroup[] = [
  ...CATEGORY_TREE.map((g) => ({
    slug: g.slug,
    name: g.slug === "animal-farm" ? "Animal & Produce" : g.name,
    isServiceGroup: false,
    children: g.children.map((c) => ({
      slug: c.slug,
      name: c.name,
      items: c.items,
    })),
  })),
  {
    slug: "services-skills",
    name: "Services",
    isServiceGroup: true,
    children: SERVICE_CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      isGroup: c.isGroup,
      subCategories: c.subCategories,
      items: c.specialties ?? [],
    })),
  },
];

/**
 * Five-column accordion / dropdown navigation matching the 5 category cards below.
 * - Home & Living
 * - Furniture & Clothing
 * - Machinery & Tools
 * - Animal & Produce
 * - Services
 */
export function CategoryMegaDropdown() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [openConstructionSub, setOpenConstructionSub] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {MEGA_GROUPS.map((group) => {
        const isOpen = openGroup === group.slug;
        return (
          <div
            key={group.slug}
            className="rounded-xl bg-card ring-1 ring-black/5 shadow-sm overflow-hidden"
          >
            {/* Category Tag button */}
            <button
              type="button"
              onClick={() => {
                setOpenGroup(isOpen ? null : group.slug);
                setOpenSub(null);
                setOpenConstructionSub(null);
              }}
              className={`w-full flex items-center justify-between gap-1 px-2.5 py-2.5 sm:px-3 sm:py-3 text-left font-extrabold text-[11px] sm:text-xs xl:text-xs uppercase tracking-tight transition ${
                isOpen
                  ? "bg-primary text-white shadow-sm"
                  : "bg-primary-dark/95 text-white hover:bg-primary"
              }`}
              title={group.name}
            >
              <span className="truncate">{group.name}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="bg-white">
                <ul className="divide-y divide-border/40">
                  {group.children.map((sub) => {
                    const subKey = `${group.slug}:${sub.slug}`;
                    const subOpen = openSub === subKey;

                    // Special multi-level rendering for Construction inside Services
                    if (sub.isGroup && sub.subCategories && sub.subCategories.length > 0) {
                      return (
                        <li key={sub.slug}>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenSub(subOpen ? null : subKey);
                              setOpenConstructionSub(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-[11px] font-bold transition ${
                              subOpen
                                ? "bg-accent/40 text-primary-dark"
                                : "hover:bg-muted/40 text-foreground"
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            <ChevronRight
                              className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                                subOpen ? "rotate-90 text-primary" : ""
                              }`}
                            />
                          </button>

                          {subOpen && (
                            <div className="bg-muted/15 p-2 space-y-1 border-t border-border/30">
                              {sub.subCategories.map((cSub) => {
                                const isCSubOpen = openConstructionSub === cSub.slug;
                                return (
                                  <div
                                    key={cSub.slug}
                                    className="rounded-lg bg-white/90 border border-border/50 overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenConstructionSub(isCSubOpen ? null : cSub.slug)
                                      }
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[10.5px] font-semibold transition ${
                                        isCSubOpen
                                          ? "text-primary font-bold bg-primary/5"
                                          : "text-foreground/85 hover:text-primary hover:bg-muted/30"
                                      }`}
                                    >
                                      <span className="truncate">{cSub.shortName}</span>
                                      <ChevronRight
                                        className={`h-3 w-3 shrink-0 transition-transform ${
                                          isCSubOpen ? "rotate-90 text-primary" : "text-muted-foreground"
                                        }`}
                                      />
                                    </button>

                                    {isCSubOpen && (
                                      <ul className="bg-muted/20 px-2 py-1.5 grid grid-cols-2 gap-1 border-t border-border/30">
                                        {cSub.specialties.map((item) => (
                                          <li key={item}>
                                            <Link
                                              to="/browse"
                                              search={{
                                                listing_type: "service",
                                                category: cSub.slug,
                                                q: item,
                                              }}
                                              className="block truncate rounded px-1.5 py-0.5 text-[10px] text-foreground/80 hover:bg-primary hover:text-white transition"
                                              title={item}
                                            >
                                              {item}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </li>
                      );
                    }

                    // Standard sub-category (all other categories)
                    return (
                      <li key={sub.slug}>
                        <button
                          type="button"
                          onClick={() => setOpenSub(subOpen ? null : subKey)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left text-[11px] font-bold transition ${
                            subOpen
                              ? "bg-accent/40 text-primary-dark"
                              : "hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          <ChevronRight
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                              subOpen ? "rotate-90 text-primary" : ""
                            }`}
                          />
                        </button>

                        {subOpen && (
                          <ul className="bg-muted/20 px-2.5 py-1.5 grid grid-cols-2 gap-1 border-t border-border/30">
                            {sub.items.map((item) => (
                              <li key={item}>
                                <Link
                                  to="/browse"
                                  search={
                                    group.isServiceGroup
                                      ? {
                                          listing_type: "service",
                                          category: sub.slug,
                                          q: item,
                                        }
                                      : { category: group.slug, q: item }
                                  }
                                  className="block truncate rounded px-1.5 py-1 text-[10.5px] text-foreground/80 hover:bg-primary hover:text-white transition"
                                  title={item}
                                >
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Direct category view link at bottom */}
                <div className="p-2 border-t border-border/40 bg-muted/10">
                  <Link
                    to="/browse"
                    search={
                      group.isServiceGroup
                        ? { listing_type: "service" }
                        : { category: group.slug }
                    }
                    className="flex items-center justify-center gap-1 text-[10.5px] font-bold text-primary hover:text-primary-dark transition py-1"
                  >
                    View all in {group.name} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
