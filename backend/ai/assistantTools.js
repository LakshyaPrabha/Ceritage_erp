/**
 * Ceritage Jewellery ERP - Function Calling Tool Declarations
 * Compatible with Google Gemini API (functionDeclarations) and OpenAI / Groq tool schema.
 */

const assistantTools = [
  {
    name: "get_dashboard_kpis",
    description: "Get high-level executive showroom KPIs including today's sales, bills generated, active customer count, pending repairs, in-stock products count, and total showroom stock valuation.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Optional date in YYYY-MM-DD format. Defaults to today."
        }
      },
      required: []
    }
  },

  {
    name: "get_today_sales",
    description: "Get sales performance and revenue details for today or a specific date, including total revenue, bills count, payment mode breakdown (cash, card, UPI, gold exchange), and today's collections.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format. Defaults to today's date."
        }
      },
      required: []
    }
  },

  {
    name: "get_monthly_sales",
    description: "Get monthly revenue analytics and comparison between current month and previous month.",
    parameters: {
      type: "object",
      properties: {
        month: {
          type: "integer",
          description: "Month number (1-12). Defaults to current month."
        },
        year: {
          type: "integer",
          description: "Year (e.g., 2026). Defaults to current year."
        }
      },
      required: []
    }
  },

  {
    name: "search_customer",
    description: "Search customer records by name, mobile phone number, city, or loyalty tier.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Customer name, partial name, or 10-digit mobile number."
        }
      },
      required: ["query"]
    }
  },

  {
    name: "get_customer_details",
    description: "Get full profile of a customer including loyalty points, tier, total lifetime purchases, active EMI schemes, and recent invoices.",
    parameters: {
      type: "object",
      properties: {
        customer_id: {
          type: "integer",
          description: "The unique customer ID."
        },
        phone: {
          type: "string",
          description: "Customer phone number (if customer_id is unknown)."
        }
      },
      required: []
    }
  },

  {
    name: "get_invoice",
    description: "Look up a sales invoice by invoice number (e.g. INV-1023, INV-001) or invoice ID.",
    parameters: {
      type: "object",
      properties: {
        invoice_no: {
          type: "string",
          description: "The invoice number string (e.g., INV-1001, INV-2026-005)."
        },
        invoice_id: {
          type: "integer",
          description: "The primary key invoice ID if known."
        }
      },
      required: []
    }
  },

  {
    name: "get_product_stock",
    description: "Search jewellery inventory by item name, SKU, category (e.g. Ring, Necklace, Bangle, Coin), purity (24K, 22K, 18K), or BIS HUID.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Item name, SKU, category, or HUID."
        },
        category: {
          type: "string",
          description: "Optional product category filter."
        },
        purity: {
          type: "string",
          description: "Optional gold purity filter (e.g. 24K, 22K, 18K, 14K)."
        }
      },
      required: ["query"]
    }
  },

  {
    name: "get_gold_rate",
    description: "Get the latest benchmark bullion market rates for 24K pure gold, 22K (916) hallmark gold, 18K diamond jewellery gold, 14K gold, and 925 sterling silver per gram.",
    parameters: {
      type: "object",
      properties: {
        purity: {
          type: "string",
          description: "Specific metal or purity: 24K, 22K, 18K, 14K, or silver. Leave empty for all rates."
        }
      },
      required: []
    }
  },

  {
    name: "get_karigar_balance",
    description: "Get workshop ledger and metal accounting for karigars/goldsmiths, including gold at hand (grams), pending job work orders, wastage %, and unpaid labour charges.",
    parameters: {
      type: "object",
      properties: {
        karigar_name: {
          type: "string",
          description: "Optional karigar/artisan name to filter by. If omitted, returns all active karigars."
        }
      },
      required: []
    }
  },

  {
    name: "get_low_stock_alerts",
    description: "Get a list of jewellery items that have reached or fallen below minimum reorder threshold.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },

  {
    name: "get_dead_stock",
    description: "Predict slow-moving and dead stock inventory that has been lying in showcase trays for over 45 to 90 days with locked capital valuation and AI remelt/discount recommendations.",
    parameters: {
      type: "object",
      properties: {
        min_days: {
          type: "integer",
          description: "Minimum days in stock (default 45 days)."
        }
      },
      required: []
    }
  },

  {
    name: "get_jangad_memos",
    description: "Get records of Jangad / On-Approval home selection memos given to clients on trust without invoicing, including pending items, approval status, and due dates.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Optional customer name."
        },
        status: {
          type: "string",
          description: "Approval status filter (e.g. 'Pending', 'Returned', 'Invoiced')."
        }
      },
      required: []
    }
  },

  {
    name: "get_tax_and_compliance_rules",
    description: "Explain Indian jewellery GST rules, HSN codes (7113, 7102, 9988), Section 206C TCS 1% cash collection limit (> ₹2 Lakh), and BIS Hallmark HUID compliance standards.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Specific compliance topic: 'gst', 'tcs', 'hsn', 'huid', 'making_charges'."
        }
      },
      required: []
    }
  }
];

module.exports = { assistantTools };
