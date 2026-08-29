const db = require("./config/db");

async function migrate() {
  try {
    console.log("Starting Phase 6B migrations...");

    await db.query(`
      CREATE TABLE IF NOT EXISTS message_templates (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        template_code         VARCHAR(50) UNIQUE NOT NULL,
        name                  VARCHAR(150) NOT NULL,
        channel               ENUM('SMS','WHATSAPP') NOT NULL,
        provider              VARCHAR(50) NOT NULL DEFAULT 'MSG91',
        provider_template_id  VARCHAR(100) NULL,
        language              VARCHAR(10) DEFAULT 'en',
        category              ENUM('BIRTHDAY','ANNIVERSARY','EMI_REMINDER','PAYMENT_REMINDER','REPAIR_READY','ORDER_READY','GENERAL') NOT NULL,
        content               TEXT NOT NULL,
        variables             JSON NULL,
        is_active             BOOLEAN NOT NULL DEFAULT TRUE,
        created_by            VARCHAR(100) DEFAULT 'System',
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tpl_channel_cat (channel, category, is_active)
      )
    `);
    console.log("✓ Created message_templates table");

    await db.query(`
      CREATE TABLE IF NOT EXISTS communication_logs (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        customer_id           INT NOT NULL,
        channel               ENUM('SMS','WHATSAPP') NOT NULL,
        provider              VARCHAR(50) NOT NULL,
        template_id           INT NULL,
        template_code         VARCHAR(50) NULL,
        recipient             VARCHAR(30) NOT NULL,
        message_preview       TEXT NULL,
        provider_message_id   VARCHAR(150) NULL,
        status                ENUM('QUEUED','SENDING','SENT','DELIVERED','FAILED','SKIPPED','CANCELLED') NOT NULL DEFAULT 'QUEUED',
        error_code            VARCHAR(50) NULL,
        error_message         TEXT NULL,
        retry_count           INT DEFAULT 0,
        is_test               BOOLEAN DEFAULT FALSE,
        sent_at               TIMESTAMP NULL,
        delivered_at          TIMESTAMP NULL,
        failed_at             TIMESTAMP NULL,
        created_by            VARCHAR(100) DEFAULT 'System',
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        INDEX idx_cust_comm (customer_id, created_at),
        INDEX idx_status_channel (status, channel, created_at)
      )
    `);
    console.log("✓ Created communication_logs table");

    await db.query(`
      CREATE TABLE IF NOT EXISTS message_dispatches (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        customer_id           INT NOT NULL,
        event_type            VARCHAR(50) NOT NULL,
        event_reference       VARCHAR(100) NOT NULL,
        channel               ENUM('SMS','WHATSAPP') NOT NULL,
        template_code         VARCHAR(50) NOT NULL,
        scheduled_for         DATE NULL,
        status                ENUM('PENDING','SENT','SKIPPED','FAILED') NOT NULL DEFAULT 'PENDING',
        communication_log_id  INT NULL,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_dispatch_event (customer_id, event_type, event_reference, channel, template_code),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        FOREIGN KEY (communication_log_id) REFERENCES communication_logs(id) ON DELETE SET NULL
      )
    `);
    console.log("✓ Created message_dispatches table");

    const templates = [
      ['BDAY_SMS', 'Birthday Greetings SMS', 'SMS', 'MSG91', 'DLT_BDAY_01', 'BIRTHDAY', 'Dear {{customer_name}}, wishing you a sparkling Birthday from Ceritage Jewellery! May your day shine bright with happiness.', JSON.stringify(['customer_name'])],
      ['BDAY_WA', 'Birthday Celebration WhatsApp', 'WHATSAPP', 'WhatsApp', 'ceritage_birthday_wish', 'BIRTHDAY', 'Dear {{customer_name}}, wishing you a joyful Birthday filled with precious moments! Best wishes from Team Ceritage.', JSON.stringify(['customer_name','coupon_code'])],
      ['ANNIV_SMS', 'Anniversary Wishes SMS', 'SMS', 'MSG91', 'DLT_ANNIV_01', 'ANNIVERSARY', 'Dear {{customer_name}}, warmest anniversary congratulations to you & family from Ceritage. Wishing you many golden years together!', JSON.stringify(['customer_name'])],
      ['ANNIV_WA', 'Anniversary Celebration WhatsApp', 'WHATSAPP', 'WhatsApp', 'ceritage_anniv_wish', 'ANNIVERSARY', 'Dear {{customer_name}}, heartfelt congratulations on your Anniversary! May your bond continue to sparkle with eternal love. - Team Ceritage', JSON.stringify(['customer_name','coupon_code'])],
      ['EMI_DUE_SMS', 'EMI Installment Due SMS', 'SMS', 'MSG91', 'DLT_EMI_01', 'EMI_REMINDER', 'Dear {{customer_name}}, your Ceritage jewellery EMI installment of Rs.{{due_amount}} is due on {{due_date}}. Kindly clear on time.', JSON.stringify(['customer_name','due_amount','due_date'])],
      ['DUE_REMINDER_SMS', 'Outstanding Balance Due SMS', 'SMS', 'MSG91', 'DLT_DUE_01', 'PAYMENT_REMINDER', 'Dear {{customer_name}}, a gentle reminder regarding your outstanding store balance of Rs.{{due_amount}} at Ceritage. Thank you.', JSON.stringify(['customer_name','due_amount'])],
      ['REPAIR_READY_SMS', 'Repair Ready for Pickup SMS', 'SMS', 'MSG91', 'DLT_REP_01', 'REPAIR_READY', 'Dear {{customer_name}}, your jewellery repair job #{{repair_no}} is inspected & ready for pickup at our showroom. - Ceritage', JSON.stringify(['customer_name','repair_no'])],
      ['ORDER_READY_SMS', 'Custom Order Ready SMS', 'SMS', 'MSG91', 'DLT_ORD_01', 'ORDER_READY', 'Dear {{customer_name}}, your custom jewellery order #{{order_no}} is crafted & ready for collection at Ceritage.', JSON.stringify(['customer_name','order_no'])],
    ];

    for (const t of templates) {
      await db.query(`
        INSERT INTO message_templates (template_code, name, channel, provider, provider_template_id, category, content, variables)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), content=VALUES(content), variables=VALUES(variables)
      `, t);
    }
    console.log("✓ Seeded default message templates");

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
