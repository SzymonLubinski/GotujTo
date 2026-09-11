export const productTypes = [
    "nabiał",
    "tłuszcze",
    "przyprawy",
    "warzywa",
    "warzywa korzeniowe",
    "owoce",
    "słodziki",
    "mięso",
    "mięso mielone",
    "drób",
    "wędliny",
    "ryby",
    "owoce morza",
    "jaja",
    "sery",
    "ser żółty",
    "ser żółty dojrzewający",
    "syropy",
    "proszki",
    "drożdże",
    "buliony",
    "makarony",
    "ryż",
    "zboża",
    "płatki",
    "mąka",
    "chleby",
    "pieczywo",
    "ciasta i wypieki",
    "zioła",
    "przeciery",
    "pasty",
    "sosy",
    "dressingi",
    "placki",
    "napoje",
    "sok",
    "alkohole",
    "nasiona",
    "orzechy",
    "rośliny strączkowe",
    "przetwory",
    "wyroby cukiernicze",
    "ocet",
    "korzeń",
    "grzyby",
    "aromaty i ekstrakty"
] as const;
export type ProductT = (typeof productTypes)[number]

export const dietTypes = [
    "vege",
    "vegan",
    "keto",
    "gluten_free"
] as const;
export type DietT = (typeof dietTypes)[number]

export const mealTypes = [
    "śniadanie",
    "obiad",
    "lunch",
    "kolacja",
    "podwieczorek",
    "przekąski",
] as const;
export type MealT = (typeof mealTypes)[number]

export const occasions = [
    "walentynki",
    "święta",
    "grill",
    "rocznica",
    "nieoficjalne spotkanie",
    "oficjalne spotkanie",
    "urodziny",
    "boże narodzenie",
    "sylwester",
    "wielkanoc",
    "rodzinny posiłek"

] as const;
export type OccasionT = (typeof occasions)[number]

export const stores = [
    "Lidl",
    "Biedronka",
    "Kaufland",
    "Lewiatan",
    "Delikatesy Centrum",
] as const;
export type StoresT = (typeof stores)[number]

export const metricUnits = [
    "g",
    "kg",
    "ml",
    "l",
] as const;

export const customaryUnits = [
    "szt",
    "szklanka",
    "łyżka",
    "łyżeczka",
    "szczypta",
    "ząbek",
    "plaster",
    "pęczek",
    "garść",
] as const;

export const shortsSource = [
    "deals",
    "fridge",
    "standard",
] as const;
export type ShortsSourceT = (typeof shortsSource)[number]