import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyProductLabelData,
  isValidImei,
  mergeProductLabelData,
  parseProductBarcode,
} from "./productBarcode.js";

test("validates an IMEI with its Luhn digit", () => {
  assert.equal(isValidImei("490154203237518"), true);
  assert.equal(isValidImei("490154203237519"), false);
});

test("extracts explicit IMEI and serial from a combined label", () => {
  const result = parseProductBarcode("IMEI: 490154203237518 S/N: F2LXYZ123456");
  assert.equal(result.fields.imei, "490154203237518");
  assert.equal(result.fields.serial_number, "F2LXYZ123456");
  assert.equal(result.imeiValid, true);
});

test("accumulates two IMEIs scanned separately", () => {
  const first = mergeProductLabelData(createEmptyProductLabelData(), parseProductBarcode("490154203237518"));
  const second = mergeProductLabelData(first, parseProductBarcode("356938035643809"));
  assert.equal(second.imei, "490154203237518");
  assert.equal(second.imei2, "356938035643809");
});

test("detects Apple product codes and EAN barcodes", () => {
  assert.equal(parseProductBarcode("MTV03LL/A").fields.part_number, "MTV03LL/A");
  assert.equal(parseProductBarcode("1234567890123").fields.ean, "1234567890123");
});

test("extracts known model, storage and color from descriptive text", () => {
  const result = parseProductBarcode("Apple iPhone 15 Pro 256GB Natural Titanium");
  assert.equal(result.fields.model, "iPhone 15 Pro");
  assert.equal(result.fields.storage, "256GB");
  assert.equal(result.fields.color, "Natural Titanium");
});
