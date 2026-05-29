import { DEFAULTS } from "./defaults";
import { complianceModelName } from "./compliance";
import type { SiteSettings } from "./types";

interface FaqItem {
  question: string;
  answer: string;
}

export function buildCategoryFaqs(
  settings: SiteSettings,
  category: string
): FaqItem[] {
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const pickupEnabled = settings.ordering?.pickup_enabled ?? true;
  const deliveryEnabled = settings.ordering?.delivery_enabled ?? false;
  const minOrder = settings.checkout_config?.min_order_amount;
  const legalModelName = complianceModelName(settings);

  const orderMethod = deliveryEnabled
    ? "pickup or delivery"
    : pickupEnabled
    ? "pickup"
    : "local ordering";

  return [
    {
      question: `Where can I find ${category.toLowerCase()} in ${city}?`,
      answer: `${storeName} keeps a live ${category.toLowerCase()} menu for customers in ${city}. Product availability, pricing, and stock status update from the store inventory.`,
    },
    {
      question: `Can I order ${category.toLowerCase()} online from ${storeName}?`,
      answer: `Yes. Browse the ${category.toLowerCase()} menu, add products to your bag, and complete a ${orderMethod} order under the ${legalModelName}.`,
    },
    {
      question: "Do I need to be 21 or older?",
      answer: `${storeName} requires customers to be 21+ with valid ID. The website includes age-gate and checkout language that can be adjusted from store settings.`,
    },
    ...(minOrder && minOrder > 0
      ? [
          {
            question: "Is there a minimum order amount?",
            answer: `${storeName} currently has a minimum order amount of $${minOrder}. This can be changed anytime in checkout settings.`,
          },
        ]
      : []),
  ];
}
