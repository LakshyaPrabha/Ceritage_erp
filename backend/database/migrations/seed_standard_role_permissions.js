const db = require('../../config/db');

async function seedRolePermissions() {
  console.log('=== SEEDING STANDARD ROLE PERMISSIONS (NON-DESTRUCTIVE) ===');

  const modules = [
    'dashboard', 'analytics', 'customers', 'products', 'billing',
    'sales', 'purchase', 'goldExchange', 'repair', 'orders',
    'karigar', 'payments', 'accounting', 'gst', 'tunch',
    'inventory', 'hallmark', 'rates', 'advance', 'employees',
    'suppliers', 'branch', 'reports', 'users', 'communication'
  ];

  // Helper to insert permissions for a role
  async function ensureRole(role, viewList, editList, deleteList) {
    const [existing] = await db.query('SELECT COUNT(*) AS cnt FROM role_permissions WHERE role = ?', [role]);
    if (existing[0].cnt === 0) {
      const values = modules.map(m => [
        role,
        m,
        viewList.includes(m) ? 1 : 0,
        editList.includes(m) ? 1 : 0,
        deleteList.includes(m) ? 1 : 0
      ]);
      await db.query(
        'INSERT INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES ?',
        [values]
      );
      console.log(`✓ Seeded ${values.length} permissions for role: ${role}`);
    } else {
      console.log(`✓ Role ${role} already configured (${existing[0].cnt} permissions)`);
    }
  }

  // 1. Manager (Full operational access except user management)
  const managerModules = modules.filter(m => m !== 'users');
  await ensureRole('manager', managerModules, managerModules, ['billing', 'repair', 'orders']);

  // 2. Cashier (POS, Sales, Customer Dues, Payments, Rates)
  const cashierView = ['dashboard', 'billing', 'sales', 'customers', 'payments', 'rates', 'emi', 'advance', 'goldExchange'];
  const cashierEdit = ['billing', 'sales', 'customers', 'payments', 'emi', 'advance'];
  await ensureRole('cashier', cashierView, cashierEdit, []);

  // 3. Salesperson (Products, Rates, Billing creation, Customer 360)
  const salesView = ['dashboard', 'products', 'rates', 'billing', 'sales', 'customers', 'repair', 'orders', 'hallmark'];
  const salesEdit = ['billing', 'customers', 'orders', 'repair'];
  await ensureRole('salesperson', salesView, salesEdit, []);

  // 4. Accountant (Accounting, GST, Payments, Ledgers, Reports)
  const accView = ['dashboard', 'analytics', 'accounting', 'gst', 'payments', 'billing', 'sales', 'purchase', 'suppliers', 'customers', 'reports', 'tunch'];
  const accEdit = ['accounting', 'gst', 'payments'];
  await ensureRole('accountant', accView, accEdit, []);

  console.log('✅ Standard Role Permissions Ready!');
  process.exit(0);
}

seedRolePermissions().catch(err => {
  console.error('Error seeding role permissions:', err);
  process.exit(1);
});
