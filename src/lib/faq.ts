/**
 * Questions shown on the page and published as FAQPage structured data.
 * Keep the visible text and the structured data identical: both read from here.
 */
export const FAQS = [
  {
    question: "Are these real characters from the show?",
    answer:
      "No. Every name is generated fresh and original. The generator is inspired by the show's naming style but never reuses its characters' names.",
  },
  {
    question: "Is the Toast of London Name Generator free?",
    answer:
      "Yes. There's no sign-up, no account and nothing to install. It works in any modern browser on your phone or computer.",
  },
  {
    question: "Do you store the name I type in?",
    answer:
      "No. Names are made up in your browser, and the name you type never leaves your device. Favourites are saved only in your own browser.",
  },
  {
    question: "Why do I always get the same Toast name?",
    answer:
      "That's deliberate. Your own Toast name is worked out from the name you type, so it stays yours. For something different, try a nickname or your full name, or press Regenerate for a random one.",
  },
  {
    question: "Is this an official Toast of London site?",
    answer:
      "No. It's an unofficial, fan-made tribute and isn't affiliated with the creators or broadcasters of Toast of London or Toast of Tinseltown.",
  },
] as const;
