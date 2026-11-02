import { normaliseName, normaliseToken } from "./normalise";

/**
 * Names the generator must never emit.
 *
 * 1. Characters from Toast of London / Toast of Tinseltown, and the people
 *    behind the shows. These are studied for style only.
 * 2. Well-known real people and fictional characters whose names could
 *    plausibly be assembled from the corpus, mostly British comedy and
 *    television figures.
 *
 * Full names are compared after normalisation. The list is a backstop: the
 * corpus avoids most of these components in the first place.
 */
export const EXCLUDED_FULL_NAMES: readonly string[] = [
  // Toast of London / Tinseltown and its creators
  "Steven Toast",
  "Clem Fandango",
  "Ray Purchase",
  "Jane Plough",
  "Ed Howzer-Black",
  "Danny Bear",
  "Mrs Purchase",
  "Matt Berry",
  "Arthur Mathews",
  // British comedy and television, real and fictional
  "Basil Fawlty",
  "Sybil Fawlty",
  "Hyacinth Bucket",
  "Victor Meldrew",
  "Rodney Trotter",
  "Hercule Poirot",
  "Arthur Dent",
  "Bertie Wooster",
  "Reginald Perrin",
  "Edmund Blackadder",
  "Alan Partridge",
  "Basil Brush",
  "Roland Rat",
  "Ken Barlow",
  "Gary Barlow",
  "Mike Baldwin",
  "Norman Wisdom",
  "Rupert Bear",
  "Paddington Bear",
  "Peter Rabbit",
  "Jemima Puddle-Duck",
  "Ernie Wise",
  "Eric Morecambe",
  "Kenneth Williams",
  "Sid James",
  "Hattie Jacques",
  "Barbara Windsor",
  "Ronnie Barker",
  "Ronnie Corbett",
  "Bob Monkhouse",
  "Les Dennis",
  "Bernard Manning",
  "Rowan Atkinson",
  "Stephen Fry",
  "Hugh Laurie",
  "Keith Chegwin",
  "Noel Edmonds",
  "Bruce Forsyth",
  "Terry Wogan",
  "Tony Blackburn",
  "Bill Oddie",
  "Tim Brooke-Taylor",
  "Graeme Garden",
  "Mary Berry",
  "Paul Hollywood",
  "Nigel Slater",
  "Delia Smith",
  "Gordon Ramsay",
  "Gordon Brown",
  "John Major",
  "Jeremy Clarkson",
  "Richard Hammond",
  "James May",
  "Michael Palin",
  "John Cleese",
  "Eric Idle",
  "Terry Jones",
  "Peter Cook",
  "Dudley Moore",
  "Spike Milligan",
  "Peter Sellers",
  "Alan Bennett",
  "Victoria Wood",
  "Julie Walters",
  "Dawn French",
  "Joanna Lumley",
  "Edina Monsoon",
  "Patsy Stone",
  "David Brent",
  "Gareth Keenan",
  "Mark Corrigan",
  "Arnold Rimmer",
  "Dave Lister",
  "Rick Mayall",
  "Neil Pye",
  "Maurice Moss",
  "Roy Trenneman",
  "Douglas Reynholm",
  "Howard Moon",
  "Vince Noir",
  "Garth Marenghi",
  "Dean Learner",
  "Harry Potter",
  "Ivor Biggun",
  "Nigel Farage",
  "Ken Dodd",
  "Les Dawson",
  "Bernard Cribbins",
  "Wallace Gromit",
  "Albert Steptoe",
  "Harold Steptoe",
  "Frank Spencer",
  "Captain Mainwaring",
  "Gilbert Sullivan",
  "Percy Thrower",
  "Fred Dibnah",
  "Roger Moore",
  "Hugh Grant",
  "Barry Chuckle",
  "Paul Chuckle",
];

/** Given names that are too closely tied to a specific character. */
export const EXCLUDED_GIVEN: readonly string[] = ["Clem", "Steven"];

/**
 * Surname words that must not appear on their own or as part of a
 * double-barrelled surname.
 */
export const EXCLUDED_SURNAME_TOKENS: readonly string[] = [
  "Toast",
  "Fandango",
  "Purchase",
  "Plough",
  "Howzer",
  "Bear",
  "Berry",
  "Mathews",
  "Black",
];

const fullNameSet = new Set(EXCLUDED_FULL_NAMES.map(normaliseName));
const givenSet = new Set(EXCLUDED_GIVEN.map(normaliseToken));
const surnameTokenSet = new Set(EXCLUDED_SURNAME_TOKENS.map(normaliseToken));

export function isExcludedFullName(normalisedFullName: string): boolean {
  return fullNameSet.has(normalisedFullName);
}

export function isExcludedGiven(normalisedToken: string): boolean {
  return givenSet.has(normalisedToken);
}

export function isExcludedSurnameToken(normalisedToken: string): boolean {
  return surnameTokenSet.has(normalisedToken);
}
