import { randomBytes } from "crypto";

/** "Salong Björkgatan" -> "salong-bjorkgatan-x7k2" */
export function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = randomBytes(3).toString("hex").slice(0, 4);
  return `${base || "foretag"}-${suffix}`;
}
