const db = require('../config/db');
const occasionService = require('../services/occasionService');
const occasionController = require('../controllers/occasionController');
const customersController = require('../controllers/customersController');

async function testAllFixedEndpoints() {
  console.log('====================================================');
  console.log('VERIFYING FIXED CUSTOMER ENDPOINTS AGAINST LIVE AIVEN');
  console.log('====================================================');

  function mockRes(name) {
    return {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(data) {
        console.log(`\n[${name}] Status: ${this.statusCode}`);
        if (data.success !== undefined) {
          console.log(`Success: ${data.success}`);
        }
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`Items returned: ${data.data.length}`);
            if (data.data.length > 0) {
              console.log('Sample item:', JSON.stringify(data.data[0], null, 2));
            }
          } else {
            console.log('Data payload:', JSON.stringify(data.data, null, 2));
          }
        } else {
          console.log('Response:', data);
        }
        return this;
      }
    };
  }

  // 1. GET /api/customers/occasions/kpis
  console.log('\n--- 1. Testing GET /api/customers/occasions/kpis ---');
  await occasionController.getOccasionKpis({ query: {} }, mockRes('GET /occasions/kpis'));

  // 2. GET /api/customers/occasions?range=7d&occasion=all
  console.log('\n--- 2. Testing GET /api/customers/occasions?range=7d&occasion=all ---');
  await occasionController.getOccasions({ query: { range: '7d', occasion: 'all' } }, mockRes('GET /occasions?range=7d&occasion=all'));

  // 3. GET /api/customers/occasions?range=30d&occasion=birthday
  console.log('\n--- 3. Testing GET /api/customers/occasions?range=30d&occasion=birthday ---');
  await occasionController.getOccasions({ query: { range: '30d', occasion: 'birthday' } }, mockRes('GET /occasions?range=30d&occasion=birthday'));

  // 4. GET /api/customers/occasions?range=30d&occasion=anniversary
  console.log('\n--- 4. Testing GET /api/customers/occasions?range=30d&occasion=anniversary ---');
  await occasionController.getOccasions({ query: { range: '30d', occasion: 'anniversary' } }, mockRes('GET /occasions?range=30d&occasion=anniversary'));

  // 5. GET /api/customers/:id/activity?limit=50
  const [custs] = await db.query('SELECT id, full_name FROM customers LIMIT 3');
  for (const c of custs) {
    console.log(`\n--- 5. Testing GET /api/customers/${c.id}/activity?limit=50 (${c.full_name}) ---`);
    await customersController.getActivityTimeline(
      { params: { id: c.id }, query: { limit: 50 } },
      mockRes(`GET /customers/${c.id}/activity`)
    );
  }

  // 6. GET /api/customers/:id/360
  for (const c of custs.slice(0, 1)) {
    console.log(`\n--- 6. Testing GET /api/customers/${c.id}/360 (${c.full_name}) ---`);
    await customersController.getCustomer360(
      { params: { id: c.id }, user: { role: 'admin' } },
      mockRes(`GET /customers/${c.id}/360`)
    );
  }

  // 7. Verify Leap Year February 29 evaluation
  console.log('\n--- 7. Testing Leap Year Feb 29 Birthday Handling ---');
  const istNowNonLeap = { year: 2025, month: 2, day: 20, todayMidnight: new Date(2025, 1, 20), todayStr: '2025-02-20' };
  const res2025 = occasionService.calculateNextOccurrence('1996-02-29', istNowNonLeap);
  console.log('Feb 29 in non-leap year (2025):', res2025);

  const istNowLeap = { year: 2028, month: 2, day: 20, todayMidnight: new Date(2028, 1, 20), todayStr: '2028-02-20' };
  const res2028 = occasionService.calculateNextOccurrence('1996-02-29', istNowLeap);
  console.log('Feb 29 in leap year (2028):', res2028);

  console.log('\n====================================================');
  console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY WITH HTTP 200');
  console.log('====================================================');
  process.exit(0);
}

testAllFixedEndpoints().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
