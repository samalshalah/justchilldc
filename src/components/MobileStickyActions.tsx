import { MapPinned, Phone } from "lucide-react";

interface MobileStickyActionsProps {
  storeName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  placeId?: string;
}

function formatPhoneHref(phone?: string) {
  const cleaned = phone?.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}

function buildAddress({
  address,
  city,
  state,
  zip,
}: Pick<MobileStickyActionsProps, "address" | "city" | "state" | "zip">) {
  const locality = [city, state].filter(Boolean).join(", ");
  return [address, locality, zip].filter(Boolean).join(", ");
}

function directionsHref({
  storeName,
  address,
  city,
  state,
  zip,
  placeId,
}: MobileStickyActionsProps) {
  const destination = buildAddress({ address, city, state, zip }) || storeName;
  if (!address && !placeId) return null;

  const params = new URLSearchParams({
    api: "1",
    destination,
  });

  if (placeId) params.set("destination_place_id", placeId);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function MobileStickyActions(props: MobileStickyActionsProps) {
  const phoneHref = formatPhoneHref(props.phone);
  const mapsHref = directionsHref(props);

  if (!phoneHref && !mapsHref) return null;

  const itemCount = phoneHref && mapsHref ? 2 : 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_48px_rgba(0,0,0,0.36)] backdrop-blur-xl md:hidden">
      <div
        className={`mx-auto grid max-w-md gap-3 ${
          itemCount === 2 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {phoneHref ? (
          <a
            href={phoneHref}
            aria-label={`Call ${props.storeName}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors active:scale-[0.99] active:border-accent"
          >
            <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
            Call
          </a>
        ) : null}
        {mapsHref ? (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get directions to ${props.storeName}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-colors active:scale-[0.99]"
          >
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            Directions
          </a>
        ) : null}
      </div>
    </div>
  );
}
