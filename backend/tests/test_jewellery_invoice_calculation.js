const assert = require("assert");

function computeJewelleryInvoice({ weight, goldRate, makingRate, gstPct = 3, isSameState = true, tcsPct = 1 }) {
  // 1. Gold Value: weight * gold rate per gram
  const goldValue = Math.round(weight * goldRate * 100) / 100;
  
  // 2. Making Charges: weight * making rate per gram
  const makingCharges = Math.round(weight * makingRate * 100) / 100;
  
  // 3. Taxable Subtotal: Gold Value + Making Charges
  const taxableSubtotal = Math.round((goldValue + makingCharges) * 100) / 100;
  
  // 4. GST: Taxable Subtotal * GST%
  const totalGst = Math.round(taxableSubtotal * (gstPct / 100) * 100) / 100;
  const cgst = isSameState ? Math.round((totalGst / 2) * 100) / 100 : 0;
  const sgst = isSameState ? Math.round((totalGst / 2) * 100) / 100 : 0;
  const igst = !isSameState ? totalGst : 0;
  
  // 5. TCS: 1% of Taxable Subtotal (for high value transactions > ₹2,00,000)
  const tcs = taxableSubtotal > 200000 ? Math.round(taxableSubtotal * (tcsPct / 100) * 100) / 100 : 0;
  
  // 6. Grand Total: Taxable Subtotal + Total GST + TCS
  const grandTotal = Math.round((taxableSubtotal + totalGst + tcs) * 100) / 100;

  return {
    goldValue,
    makingCharges,
    taxableSubtotal,
    totalGst,
    cgst,
    sgst,
    igst,
    tcs,
    grandTotal
  };
}

console.log("Running Jewellery Invoice Calculation Test...");

const result = computeJewelleryInvoice({
  weight: 25.500,
  goldRate: 13000,
  makingRate: 450,
  gstPct: 3,
  isSameState: true,
  tcsPct: 1,
});

console.log("Calculation Output:", result);

assert.strictEqual(result.goldValue, 331500.00, "Gold value mismatch");
assert.strictEqual(result.makingCharges, 11475.00, "Making charges mismatch");
assert.strictEqual(result.taxableSubtotal, 342975.00, "Taxable subtotal mismatch");
assert.strictEqual(result.totalGst, 10289.25, "Total GST mismatch");
assert.strictEqual(result.cgst, 5144.63, "CGST mismatch");
assert.strictEqual(result.sgst, 5144.63, "SGST mismatch");
assert.strictEqual(result.tcs, 3429.75, "TCS mismatch");
assert.strictEqual(result.grandTotal, 356694.00, "Grand total mismatch");

console.log("✓ ALL JEWELLERY INVOICE CALCULATION ASSERTIONS PASSED PERFECTLY!");
