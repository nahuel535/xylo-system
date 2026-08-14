import { ALL_PRODUCT_OPTIONS, MODEL_OPTIONS } from "../data/productOptions.js";

const EMPTY_LABEL_DATA = {
  imei: "",
  imei2: "",
  serial_number: "",
  ean: "",
  part_number: "",
  model: "",
  storage: "",
  color: "",
  raw_codes: [],
};

function firstMatch(text, expression) {
  return text.match(expression)?.[1]?.trim() || "";
}

function normalizedWords(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

function extractProductDetails(rawValue) {
  const normalized = normalizedWords(rawValue);
  const model = [...MODEL_OPTIONS]
    .sort((a, b) => b.length - a.length)
    .find((option) => normalized.includes(normalizedWords(option))) || "";

  const storageMatch = normalized.match(/\b(64|128|256|512)\s*GB\b|\b(1|2)\s*TB\b/);
  const storage = storageMatch
    ? storageMatch[1]
      ? `${storageMatch[1]}GB`
      : `${storageMatch[2]}TB`
    : "";

  const color = model
    ? ALL_PRODUCT_OPTIONS[model].colors.find((option) => normalized.includes(normalizedWords(option))) || ""
    : "";

  return { model, storage, color };
}

export function isValidImei(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 15) return false;

  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function parseProductBarcode(rawValue, forcedType = "auto") {
  const raw = String(rawValue || "").trim();
  const compact = raw.replace(/\s+/g, "");
  const upper = raw.toUpperCase();
  const digits = raw.replace(/\D/g, "");
  const fields = { ...extractProductDetails(raw) };

  const explicitImeiMatches = [...upper.matchAll(/IMEI\s*([12])?\s*[:#-]?\s*(\d{15})/g)];
  for (const match of explicitImeiMatches) {
    if (match[1] === "2") fields.imei2 = match[2];
    else if (!fields.imei) fields.imei = match[2];
    else if (fields.imei !== match[2]) fields.imei2 = match[2];
  }

  fields.serial_number = firstMatch(upper, /(?:SERIAL(?:\s*NUMBER)?|S\/?N)\s*[:#-]?\s*([A-Z0-9]{8,16})/);
  fields.part_number = firstMatch(upper, /(?:PART(?:\s*(?:NO|NUMBER))?|MPN)\s*[:#-]?\s*([A-Z0-9-]{5,16}\/A)/)
    || firstMatch(upper, /\b([A-Z0-9-]{5,16}\/A)\b/)
    || firstMatch(upper, /(?:MODEL)\s*[:#-]?\s*(A\d{4})\b/);
  fields.ean = firstMatch(upper, /(?:EAN|UPC|GTIN)\s*[:#-]?\s*(\d{8,14})/);

  if (forcedType === "imei") fields.imei = digits.slice(0, 15);
  if (forcedType === "serial") fields.serial_number = compact.toUpperCase();
  if (forcedType === "ean") fields.ean = digits;
  if (forcedType === "part_number") fields.part_number = compact.toUpperCase();

  if (forcedType === "auto") {
    if (!fields.imei && /^\d{15}$/.test(compact)) fields.imei = compact;
    else if (!fields.ean && /^\d{8}$|^\d{12,14}$/.test(compact)) fields.ean = compact;
    else if (!fields.part_number && (/^[A-Z0-9-]{5,16}\/A$/i.test(compact) || /^A\d{4}$/i.test(compact))) fields.part_number = compact.toUpperCase();
    else if (!fields.serial_number && /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{8,16}$/i.test(compact)) fields.serial_number = compact.toUpperCase();
  }

  const detectedEntries = Object.entries(fields).filter(([, value]) => Boolean(value));
  return {
    raw,
    fields,
    detected: detectedEntries.map(([key]) => key),
    imeiValid: fields.imei ? isValidImei(fields.imei) : null,
  };
}

export function mergeProductLabelData(currentData, parsed) {
  const next = { ...EMPTY_LABEL_DATA, ...currentData };
  const fields = parsed.fields || {};

  if (fields.imei) {
    if (!next.imei || next.imei === fields.imei) next.imei = fields.imei;
    else if (!next.imei2) next.imei2 = fields.imei;
  }
  if (fields.imei2 && fields.imei2 !== next.imei) next.imei2 = fields.imei2;

  for (const key of ["serial_number", "ean", "part_number", "model", "storage", "color"]) {
    if (fields[key]) next[key] = fields[key];
  }

  if (parsed.raw && !next.raw_codes.includes(parsed.raw)) {
    next.raw_codes = [...next.raw_codes, parsed.raw];
  }
  return next;
}

export function createEmptyProductLabelData() {
  return { ...EMPTY_LABEL_DATA, raw_codes: [] };
}
