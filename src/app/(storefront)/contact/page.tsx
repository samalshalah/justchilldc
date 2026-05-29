import type { Metadata } from "next";
import { Mail, Phone, Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { ContactForm } from "@/components/ContactForm";
import { DEFAULTS } from "@/lib/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const title = `Contact ${storeName}`;
  return {
    title: { absolute: title },
    description: `Get in touch with ${storeName}. Questions, orders, partnerships.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const c = settings.contact ?? {};
  const phone = c.phone || settings.location?.phone || settings.store?.phone;
  const email = c.email;
  const ig = c.instagram || settings.store?.instagram;

  return (
    <>
      <section className="bg-card border-b border-border/50 pt-12 pb-10">
        <div className="container mx-auto px-4 text-center">
          <span className="text-accent font-bold tracking-widest uppercase text-xs">
            Get In Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2">
            {settings.contact_page?.h1 || c.title || "Contact Us"}
          </h1>
          {(settings.contact_page?.subtitle || c.subtitle) && (
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              {settings.contact_page?.subtitle || c.subtitle}
            </p>
          )}
          {settings.contact_page?.intro && (
            <p className="text-foreground/80 mt-5 max-w-2xl mx-auto leading-relaxed">
              {settings.contact_page.intro}
            </p>
          )}
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              Reach Out Directly
            </h2>
            <ul className="space-y-4">
              {phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Phone
                    </p>
                    <a
                      href={`tel:${phone.replace(/\D/g, "")}`}
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Email
                    </p>
                    <a
                      href={`mailto:${email}`}
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </li>
              )}
              {ig && (
                <li className="flex items-start gap-3">
                  <Instagram className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Instagram
                    </p>
                    <a
                      href={ig}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {ig.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {(settings.contact_page?.show_form ?? true) && (
            <ContactForm
              successMessage={
                settings.contact_page?.success_message ||
                "We'll get back to you within 24 hours."
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
