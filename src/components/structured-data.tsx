import { FAQS } from "@/lib/faq";
import { SITE } from "@/lib/site";

/** schema.org data for search engines and AI assistants: the app, its author and the FAQ. */
export function StructuredData() {
  const author = { "@type": "Person", "@id": `${SITE.author.url}/#person`, ...SITE.author };
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: `${SITE.url}/`,
        name: SITE.name,
        alternateName: ["Toast Names", "Toast Name Generator"],
        inLanguage: "en-GB",
        publisher: { "@id": author["@id"] },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE.url}/#app`,
        name: SITE.name,
        url: `${SITE.url}/`,
        description: SITE.description,
        applicationCategory: "EntertainmentApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript. Works in any modern browser.",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
        inLanguage: "en-GB",
        image: `${SITE.url}/og-image.png`,
        author: { "@id": author["@id"] },
        creator: { "@id": author["@id"] },
      },
      author,
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output contains no user input; escape "<" so it can't close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
