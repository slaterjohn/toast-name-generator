import { NameGenerator } from "@/components/name-generator";
import { Ornament } from "@/components/ornament";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-4 pt-10 pb-6 text-center sm:pt-14">
        <Ornament className="mx-auto mb-4 w-40 text-gold sm:w-48" />
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Toast Name Generator
        </h1>
        <p className="mt-2 font-display text-lg text-ink-soft italic">
          A name of considerable distinction.
        </p>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-10">
        <NameGenerator />
      </main>

      <footer className="mx-auto max-w-xl px-4 pb-8 text-center text-sm leading-relaxed text-ink-soft">
        <p>
          An unofficial fan-inspired name generator. Not affiliated with the creators or
          broadcasters of Toast of London or Toast of Tinseltown.
        </p>
        <p className="mt-1">Names are made up in your browser. Nothing is sent anywhere.</p>
      </footer>
    </div>
  );
}
