import "server-only";

export type Place = {
  placeId: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  operational: boolean;
  types: string[];
};

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.types",
].join(",");

type RawPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
};

/** Söker svenska företag via Google Places API (Text Search). */
export async function searchPlaces(businessType: string, city: string): Promise<Place[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask": FIELDS,
    },
    body: JSON.stringify({
      textQuery: `${businessType} i ${city}`,
      languageCode: "sv",
      regionCode: "SE",
      pageSize: 20,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google Places svarade ${res.status}`);
  }
  const json = (await res.json()) as { places?: RawPlace[] };
  return (json.places ?? []).map((p) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "Okänt företag",
    address: p.formattedAddress ?? null,
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    rating: p.rating ?? null,
    reviewCount: p.userRatingCount ?? null,
    operational: !p.businessStatus || p.businessStatus === "OPERATIONAL",
    types: p.types ?? [],
  }));
}

const PUBLIC_TYPES = [
  "local_government_office",
  "government_office",
  "city_hall",
  "courthouse",
  "police",
  "fire_station",
  "post_office",
  "school",
  "university",
  "embassy",
];

/** Returnerar en anledning att hoppa över företaget, eller null om det är värt att bygga för. */
export function skipReason(place: Place, agent: "nils" | "saga"): string | null {
  if (!place.operational) return "Verkar ha stängt";
  if (place.types.some((t) => PUBLIC_TYPES.includes(t))) return "Inte ett företag";
  if (!place.phone) return "Saknar telefonnummer";
  if (agent === "nils" && place.website) return "Har redan hemsida";
  if (agent === "saga" && !place.website) return "Saknar hemsida – fråga Nils";
  return null;
}
