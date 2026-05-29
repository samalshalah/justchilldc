interface FaqItem {
  question: string;
  answer: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FaqSection({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-12 bg-background border-t border-border/50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.question} className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-2">{item.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
