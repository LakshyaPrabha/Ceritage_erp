const db = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function runCompleteAudit() {
  console.log('================================================================');
  console.log('CERITAGE ERP — COMPLETE 31-MODULE AUDIT AGAINST AIVEN MYSQL');
  console.log('================================================================');

  // 1. Authenticate to obtain token for admin
  let adminToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'ceritage123' })
    });
    const data = await res.json();
    adminToken = data.token;
    console.log('✓ Admin authenticated');
  } catch (e) {
    console.error('Failed to login admin:', e.message);
    process.exit(1);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 2. Check Database Connection & Tables
  const [dbTables] = await db.query(`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME ASC
  `);
  const tableNames = new Set(dbTables.map(t => t.TABLE_NAME));
  console.log(`✓ Total base tables in Aiven defaultdb: ${tableNames.size}`);

  // Test map for all 31 modules
  const moduleAudit = [
    // MAIN
    { id: 1, name: 'Dashboard', route: '/dashboard/stats', tables: ['invoices', 'products', 'customers'] },
    { id: 2, name: 'Analytics', route: '/analytics/overview', tables: ['invoices', 'products'] },

    // OPERATIONS
    { id: 3, name: 'Customers', route: '/customers?limit=5', tables: ['customers', 'customer_notes', 'customer_audit_logs', 'customer_occasion_reminders'] },
    { id: 4, name: 'Products & Inventory', route: '/products?limit=5', tables: ['products', 'inventory_items', 'categories'] },
    { id: 5, name: 'Billing / GST Invoice', route: '/billing?limit=5', tables: ['invoices', 'invoice_items', 'payments'] },
    { id: 6, name: 'Sales', route: '/sales?limit=5', tables: ['invoices', 'customers'] },
    { id: 7, name: 'Purchase', route: '/purchase?limit=5', tables: ['purchase_orders', 'grns', 'suppliers', 'supplier_ledger', 'supplier_payments', 'old_metal_purchases'] },
    { id: 8, name: 'Gold Exchange', route: '/gold-exchange?limit=5', tables: ['gold_exchanges'] },

    // WORKSHOP
    { id: 9, name: 'Repair Job Card', route: '/repair?limit=5', tables: ['repair_jobs'] },
    { id: 10, name: 'Order Booking', route: '/orders?limit=5', tables: ['orders'] },
    { id: 11, name: 'Karigar Management', route: '/karigar?limit=5', tables: ['karigars', 'karigar_issues', 'karigar_receives', 'karigar_payments'] },
    { id: 12, name: 'Jangad / Approval', route: '/jangad?limit=5', tables: ['jangad_items'] },

    // FINANCE
    { id: 13, name: 'Accounting', route: '/accounting/summary', tables: ['customer_ledger', 'supplier_ledger'] },
    { id: 14, name: 'Payment Modes', route: '/payments/modes', tables: ['payment_modes'] },
    { id: 15, name: 'EMI & Credit', route: '/emi/plans', tables: ['emi_plans', 'emi_installments', 'emi_payments'] },
    { id: 16, name: 'GST & Taxation', route: '/gst/reports', tables: ['invoices'] },
    { id: 17, name: 'Fine Metal Ledger', route: '/tunch/summary', tables: ['fine_metal_ledger', 'tunch_records'] },
    { id: 18, name: 'TCS & Compliance', route: '/compliance/tcs-summary', tables: ['invoices', 'customers'] },

    // CATALOG & STOCK
    { id: 19, name: 'Inventory', route: '/inventory/live', tables: ['inventory_items', 'stock_movements'] },
    { id: 20, name: 'Hallmark & HUID', route: '/hallmark?limit=5', tables: ['hallmark_huid_records', 'hallmark_batches'] },
    { id: 21, name: 'Gold & Silver Rates', route: '/rates/current', tables: ['metal_rates', 'live_market_rates'] },
    { id: 22, name: 'RFID & Tray Audit', route: '/rfid/scans', tables: ['rfid_tags', 'tray_audits'] },
    { id: 23, name: 'Rate Lock / Advance', route: '/advance?limit=5', tables: ['customer_advances', 'advance_rate_locks'] },

    // MANAGEMENT
    { id: 24, name: 'Employees', route: '/employees?limit=5', tables: ['employees', 'employee_attendance', 'employee_leaves', 'employee_salaries'] },
    { id: 25, name: 'Suppliers', route: '/suppliers?limit=5', tables: ['suppliers', 'supplier_ledger'] },
    { id: 26, name: 'Multi-Branch', route: '/branch', tables: ['branches'] },
    { id: 27, name: 'Reports', route: '/reports/sales-summary', tables: ['invoices'] },

    // SYSTEM
    { id: 28, name: 'Users & Roles', route: '/users?limit=5', tables: ['users', 'roles', 'role_permissions'] },
    { id: 29, name: 'Security', route: '/security/audit-logs', tables: ['audit_logs', 'login_attempts'] },
    { id: 30, name: 'AI Features', route: '/ai/recommendations', tables: ['ai_insights', 'customers'] },
    { id: 31, name: 'Communication', route: '/communications/logs', tables: ['communication_logs', 'communication_templates'] }
  ];

  console.log('\n--- 3. TESTING API ENDPOINTS AND DATABASE PERSISTENCE FOR ALL 31 MODULES ---');
  const results = [];

  for (const m of moduleAudit) {
    let apiStatus = 'FAIL';
    let httpCode = 0;
    let errorMsg = '';
    let responseData = null;

    try {
      const res = await fetch(`${API_BASE}${m.route}`, { headers: adminHeaders });
      httpCode = res.status;
      if (res.ok) {
        apiStatus = 'PASS';
        responseData = await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        errorMsg = errData.message || res.statusText;
      }
    } catch (e) {
      errorMsg = e.message;
    }

    // Check DB tables existence
    const missingTables = m.tables.filter(t => !tableNames.has(t));

    results.push({
      ...m,
      httpCode,
      apiStatus,
      errorMsg,
      missingTables
    });

    console.log(`[#${m.id.toString().padStart(2, '0')}] ${m.name.padEnd(25)} -> HTTP ${httpCode} (${apiStatus}) | Missing Tables: ${missingTables.length ? missingTables.join(', ') : 'None'}`);
  }

  // Write full audit result to JSON for inspection
  const fs = require('fs');
  fs.writeFileSync('./tests/audit_31_results.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Saved audit results to audit_31_results.json');
  process.exit(0);
}

runCompleteAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
