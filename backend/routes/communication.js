const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const ctrl = require("../controllers/communicationController");

// Public / Provider Webhooks (no user JWT auth)
router.post("/webhooks/msg91", ctrl.msg91Webhook);
router.post("/webhooks/whatsapp", ctrl.whatsappWebhook);

// Protected routes
router.use(verifyToken);

// Provider status & configuration check
router.get("/providers/status", checkPermission("communications"), ctrl.getProvidersStatus);

// Message Templates
router.get("/templates", checkPermission("communications"), ctrl.getTemplates);
router.post("/templates", checkPermission("communications", "edit"), ctrl.createTemplate);
router.put("/templates/:id", checkPermission("communications", "edit"), ctrl.updateTemplate);

// Communication Logs & History
router.get("/logs", checkPermission("communications"), ctrl.getCommunicationLogs);
router.get("/logs/:id", checkPermission("communications"), ctrl.getLogById);

// Direct Send & Trigger Dispatchers
router.post("/send", checkPermission("communications", "edit"), ctrl.sendDirectMessage);
router.post("/dispatch/occasions", checkPermission("communications", "edit"), ctrl.triggerOccasionsDispatch);
router.post("/dispatch/emi", checkPermission("communications", "edit"), ctrl.triggerEmiDispatch);

module.exports = router;
