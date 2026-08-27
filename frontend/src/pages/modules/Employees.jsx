import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select, SectionTitle } from "../../components/ui";

const TABS = [
  { id:"profiles",    label:"Profiles" },
  { id:"attendance",  label:"Attendance" },
  { id:"salary",      label:"Salary" },
  { id:"leaves",      label:"Leave" },
  { id:"performance", label:"Performance" },
  { id:"payroll",     label:"Payroll" },
];

export default function Employees({ t }) {
  const [tab,      setTab]      = useState("profiles");
  const [addModal, setAddModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);

  return (
    <div>
      <PageHeader title="Employee Management"
        subtitle="Profile · Attendance · Salary · Leave · Performance · Payroll"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => setLeaveModal(true)}>Leave Request</BtnOutline>
          <BtnOutline t={t}>Run Payroll</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(true)}>+ Add Employee</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Staff"     color={BRAND.blue}   t={t} />
        <StatCard label="Active"          color="#2ecc71"      t={t} />
        <StatCard label="Monthly Payroll" color="#f0c040"      t={t} />
        <StatCard label="On Leave"        color="#f39c12"      t={t} />
        <StatCard label="Avg Performance" color={BRAND.purple} t={t} />
        <StatCard label="Pending Leaves"  color={BRAND.pink}   t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "profiles" && (
        <Card t={t}>
          <CardHeader title="Staff Directory" t={t}
            actions={<>
              <input placeholder="Search name, role..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:180 }} />
              <Select t={t} style={{ width:130 }}>
                <option>All Branches</option><option>Mumbai HQ</option><option>Delhi</option><option>Jaipur</option>
              </Select>
            </>} />
          <DataTable
            columns={["Employee","Role","Dept","Branch","Phone","Salary","Joined","Status","Actions"]}
            t={t} emptyMsg="employees will load from backend" />
        </Card>
      )}

      {tab === "attendance" && (
        <Card t={t}>
          <CardHeader title="Attendance Summary — Current Month" t={t}
            actions={<><BtnSm t={t} primary>Mark Attendance</BtnSm><BtnSm t={t}>Export</BtnSm></>} />
          <DataTable
            columns={["Employee","Present (P)","Absent (A)","Leave (L)","Holiday (H)","Working Days","Attendance %","Status","Actions"]}
            t={t} emptyMsg="attendance data will load from backend" />
        </Card>
      )}

      {tab === "salary" && (
        <Card t={t}>
          <CardHeader title="Salary Structure — Current Month" t={t}
            actions={<><BtnSm t={t}>Export</BtnSm><BtnSm t={t} primary>Pay All</BtnSm></>} />
          <DataTable
            columns={["Employee","Role","Basic","HRA","DA","TA","Gross","Deductions","Net Pay","Status","Actions"]}
            t={t} emptyMsg="salary data will load from backend" />
        </Card>
      )}

      {tab === "leaves" && (
        <Card t={t}>
          <CardHeader title="Leave Requests" t={t}
            actions={<BtnSm t={t} primary onClick={() => setLeaveModal(true)}>+ New Request</BtnSm>} />
          <DataTable
            columns={["ID","Employee","Type","From","To","Days","Reason","Status","Approved By","Actions"]}
            t={t} emptyMsg="leave requests will load from backend" />
        </Card>
      )}

      {tab === "performance" && (
        <Card t={t}>
          <CardHeader title="Performance — Current Month" t={t}
            actions={<><BtnSm t={t}>Print</BtnSm><BtnSm t={t} primary>Refresh</BtnSm></>} />
          <div style={{ textAlign:"center", padding:"40px", color:t.textFaint, fontSize:13,
            border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
            performance cards will load from backend
          </div>
        </Card>
      )}

      {tab === "payroll" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
            gap:12, marginBottom:18 }}>
            <StatCard label="Total Payroll" color={BRAND.blue}  t={t} />
            <StatCard label="Paid"          color="#2ecc71"     t={t} />
            <StatCard label="Pending"       color={BRAND.pink}  t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Payroll — Current Month" t={t}
              actions={<><Select t={t} style={{ width:130 }}>
                <option>Current Month</option><option>Last Month</option>
              </Select>
              <BtnSm t={t}>Export</BtnSm><BtnSm t={t} primary>Run Payroll</BtnSm></>} />
            <DataTable
              columns={["Employee","Role","Branch","Basic","Allowances","Gross","Deductions","Net Pay","Status","Paid On","Actions"]}
              t={t} emptyMsg="payroll data will load from backend" />
          </Card>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)}
        title="Add Employee" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Save</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Full Name *" t={t} half><Input t={t} placeholder="Employee name" /></FormGroup>
          <FormGroup label="Role *"      t={t} half>
            <Select t={t}><option>Sales Executive</option><option>Store Manager</option><option>Accountant</option><option>Cashier</option></Select>
          </FormGroup>
          <FormGroup label="Department"  t={t} half>
            <Select t={t}><option>Sales</option><option>Finance</option><option>Operations</option><option>Admin</option></Select>
          </FormGroup>
          <FormGroup label="Phone"       t={t} half><Input t={t} placeholder="Mobile no." /></FormGroup>
          <FormGroup label="Email"       t={t} half><Input t={t} placeholder="Email" /></FormGroup>
          <FormGroup label="Basic Salary (₹/month)" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Join Date"   t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Branch"      t={t} half>
            <Select t={t}><option>Mumbai HQ</option><option>Delhi</option><option>Jaipur</option></Select>
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* Leave Request Modal */}
      <Modal open={leaveModal} onClose={() => setLeaveModal(false)}
        title="Leave Request" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setLeaveModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setLeaveModal(false)}>Submit Request</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Employee *"    t={t} half><Select t={t}><option>-- Select --</option></Select></FormGroup>
          <FormGroup label="Leave Type *"  t={t} half>
            <Select t={t}><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Emergency Leave</option></Select>
          </FormGroup>
          <FormGroup label="From Date *"   t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="To Date *"     t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Reason *"      t={t}><Input t={t} placeholder="Reason for leave" /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
