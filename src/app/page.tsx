import { AboutSection } from "@/components/about-section";
import { NameGenerator } from "@/components/name-generator";
import { Ornament } from "@/components/ornament";
import { StructuredData } from "@/components/structured-data";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <StructuredData />
      <header className="px-4 pt-10 pb-6 text-center sm:pt-14">
        <Ornament className="mx-auto mb-4 w-40 text-gold sm:w-48" />
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {SITE.name}
        </h1>
        <p className="mt-2 font-display text-lg text-ink-soft italic">{SITE.tagline}</p>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-10">
        <div className="flex w-full max-w-2xl flex-col items-center">
          <NameGenerator />
          <AboutSection />
        </div>
      </main>

      <footer className="mx-auto max-w-xl px-4 pb-8 text-center text-sm leading-relaxed text-ink-soft">
        <p>
          An unofficial fan-inspired name generator. Not affiliated with the creators or
          broadcasters of Toast of London or Toast of Tinseltown.
        </p>
        <p className="mt-1">
          Names are made up in your browser. The name you type is never stored or sent anywhere.
        </p>
        <p className="mt-3">
          Created by John Slater ·{" "}
          <a
            href={SITE.author.url}
            rel="author"
            className="font-semibold text-oxblood underline underline-offset-2 hover:text-oxblood-hover"
          >
            slaterjohn.com
          </a>
        </p>
      </footer>
    </div>
  );
}
