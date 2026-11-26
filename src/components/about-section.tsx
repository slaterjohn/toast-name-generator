import { FAQS } from "@/lib/faq";
import { Ornament } from "./ornament";

const h2 = "mt-10 font-display text-[1.625rem] leading-tight font-bold text-ink";
const strong = "font-semibold text-ink";

/**
 * Plain, crawlable copy about the generator: what it is, how to use it, what
 * makes a good name and an FAQ. Rendered on the server so search engines and
 * AI assistants can read it without running JavaScript.
 */
export function AboutSection() {
  return (
    <article
      aria-labelledby="about-heading"
      className="mt-14 w-full text-left text-base leading-[1.65] text-ink-soft"
    >
      <Ornament className="mx-auto mb-8 w-[120px] text-gold" />
      <h2 id="about-heading" className="font-display text-[1.625rem] leading-tight font-bold text-ink">
        About the Toast of London Name Generator
      </h2>
      <p className="mt-3">
        The Toast of London Name Generator makes up convincingly ridiculous British names in the
        spirit of the sitcom&apos;s famously absurd characters. Every name is original: pompous
        first names for men and women, unlikely surnames and the odd double-barrel, put together
        so they sound like someone you&apos;d find in a West End programme or a voiceover booth in
        Soho. Think of them as funny Toast of London names that never appeared on screen.
      </p>
      <p className="mt-3">
        Use it to name a character in your novel, a stage alter ego, a pub quiz team, a gaming
        handle or simply to make a friend laugh. Press Regenerate as often as you like and save the
        best ones to your favourites.
      </p>

      <h2 id="how-to" className={h2}>
        How to find your Toast of London name
      </h2>
      <ol className="mt-3 list-decimal space-y-1.5 pl-[22px]">
        <li>
          <strong className={strong}>Get a random name.</strong> A fresh name appears when the page
          loads. Press Regenerate for another, and the generator won&apos;t repeat a name during
          your visit.
        </li>
        <li>
          <strong className={strong}>Find your own Toast name.</strong> Type your name into the box
          above and press Reveal. The same name always gives the same result, on any device, so you
          can compare with friends.
        </li>
        <li>
          <strong className={strong}>Share it.</strong> Copy the name, send a link to it, or
          download it as an image card ready for social media.
        </li>
      </ol>

      <h2 className={h2}>What makes a good Toast name?</h2>
      <p className="mt-3">
        The comedy is in the collision. A grand, old-fashioned first name meets a surname that is a
        little too ordinary, a little too specific or simply a word that has no business being a
        surname. Some names lean pompous, some lean surreal, and some are double-barrelled for that
        extra touch of faded grandeur.
      </p>

      <h2 id="faq" className={h2}>
        Frequently asked questions
      </h2>
      {FAQS.map((faq) => (
        <section key={faq.question}>
          <h3 className="mt-5 font-display text-[1.1875rem] leading-snug font-bold text-ink">
            {faq.question}
          </h3>
          <p className="mt-1.5">{faq.answer}</p>
        </section>
      ))}
    </article>
  );
}
