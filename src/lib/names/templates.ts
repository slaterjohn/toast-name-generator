import type { NameTemplate } from "./types";

/**
 * Weighted name templates. Each describes a comic pattern; the generator
 * picks a template by weight, then a category uniformly from each side, then
 * an entry uniformly from that category. Uniform-by-category keeps small,
 * flavourful banks from being drowned out by large ones.
 */
export const TEMPLATES: readonly NameTemplate[] = [
  {
    id: "ordinary-incongruous",
    description: "An everyday given name with an unexpected everyday noun",
    weight: 26,
    given: ["ordinary", "oldFashioned"],
    surname: ["household", "food", "nature", "commerce"],
  },
  {
    id: "pompous",
    description: "A grand given name with a stately or double-barrelled surname",
    weight: 16,
    given: ["theatrical", "oldFashioned"],
    surname: ["grand", "compound"],
  },
  {
    id: "eccentric-grounded",
    description: "An improbable given name anchored by a plain northern surname",
    weight: 14,
    given: ["eccentric"],
    surname: ["grounded"],
  },
  {
    id: "flamboyant",
    description: "Any given name with a theatrical loanword surname",
    weight: 12,
    given: ["ordinary", "eccentric", "theatrical"],
    surname: ["flamboyant"],
  },
  {
    id: "dry-wordplay",
    description: "A sensible given name with a bureaucratic or fussy surname",
    weight: 10,
    given: ["ordinary", "theatrical", "oldFashioned"],
    surname: ["commerce", "motion"],
  },
  {
    id: "surreal",
    description: "A grand or eccentric given name with something from the garden shed",
    weight: 10,
    given: ["theatrical", "eccentric"],
    surname: ["household", "food", "nature", "motion"],
  },
  {
    id: "barrelled-everyman",
    description: "An ordinary given name burdened with a double-barrelled surname",
    weight: 6,
    given: ["ordinary", "eccentric"],
    surname: ["compound"],
  },
  {
    id: "alliterative",
    description: "Any given name and simple surname sharing an initial",
    weight: 6,
    given: ["ordinary", "oldFashioned", "theatrical", "eccentric"],
    surname: [
      "household",
      "food",
      "commerce",
      "motion",
      "nature",
      "grand",
      "grounded",
      "flamboyant",
    ],
    alliterative: true,
  },
];
