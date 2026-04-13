/**
 * DACH Fake-Kundendaten Pool.
 * Generiert realistische deutsche/österreichische/schweizer Kundendaten.
 */

const FIRST_NAMES = [
  "Anna", "Ben", "Clara", "David", "Emma", "Felix", "Greta", "Hans",
  "Ida", "Jan", "Katharina", "Lukas", "Marie", "Nico", "Olivia", "Paul",
  "Rosa", "Stefan", "Tina", "Uwe", "Vera", "Wolfgang", "Xenia", "Yannick",
  "Zoe", "Alexander", "Bianca", "Christian", "Diana", "Erik",
  "Franziska", "Georg", "Helena", "Igor", "Julia", "Karl", "Laura",
  "Markus", "Nina", "Otto", "Petra", "Richard", "Sandra", "Thomas",
];

const LAST_NAMES = [
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
  "Becker", "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf",
  "Schröder", "Neumann", "Schwarz", "Braun", "Hofmann", "Zimmermann",
  "Huber", "Gruber", "Steiner", "Moser", "Bauer", "Berger", "Hofer",
  "Maier", "Brunner", "Eder", "Keller", "Frei", "Wyss", "Graf",
];

interface CityEntry {
  city: string;
  zip: string;
  country_code: string;
}

const CITIES: CityEntry[] = [
  // Deutschland
  { city: "Berlin", zip: "10115", country_code: "DE" },
  { city: "München", zip: "80331", country_code: "DE" },
  { city: "Hamburg", zip: "20095", country_code: "DE" },
  { city: "Köln", zip: "50667", country_code: "DE" },
  { city: "Frankfurt", zip: "60311", country_code: "DE" },
  { city: "Stuttgart", zip: "70173", country_code: "DE" },
  { city: "Düsseldorf", zip: "40213", country_code: "DE" },
  { city: "Leipzig", zip: "04109", country_code: "DE" },
  { city: "Nürnberg", zip: "90402", country_code: "DE" },
  { city: "Dresden", zip: "01067", country_code: "DE" },
  // Österreich
  { city: "Wien", zip: "1010", country_code: "AT" },
  { city: "Graz", zip: "8010", country_code: "AT" },
  { city: "Salzburg", zip: "5020", country_code: "AT" },
  { city: "Innsbruck", zip: "6020", country_code: "AT" },
  // Schweiz
  { city: "Zürich", zip: "8001", country_code: "CH" },
  { city: "Bern", zip: "3011", country_code: "CH" },
  { city: "Basel", zip: "4001", country_code: "CH" },
  { city: "Luzern", zip: "6003", country_code: "CH" },
];

const STREETS = [
  "Hauptstraße", "Bahnhofstraße", "Gartenweg", "Schulstraße",
  "Kirchplatz", "Lindenallee", "Bergstraße", "Waldweg",
  "Mozartstraße", "Ringstraße", "Friedrichstraße", "Schillerweg",
  "Am Markt", "Rosenweg", "Parkstraße", "Sonnenallee",
];

export function generateCustomer(rng: () => number) {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  const city = CITIES[Math.floor(rng() * CITIES.length)];
  const street = STREETS[Math.floor(rng() * STREETS.length)];
  const houseNr = Math.floor(rng() * 120) + 1;

  const emailDomains = ["gmail.com", "gmx.de", "web.de", "outlook.de", "mail.ch", "posteo.de"];
  const domain = emailDomains[Math.floor(rng() * emailDomains.length)];
  const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae")}${Math.floor(rng() * 99)}@${domain}`;

  return {
    customer: {
      first_name: first,
      last_name: last,
      email,
    },
    shipping_address: {
      first_name: first,
      last_name: last,
      address1: `${street} ${houseNr}`,
      city: city.city,
      zip: city.zip,
      country_code: city.country_code,
    },
  };
}
