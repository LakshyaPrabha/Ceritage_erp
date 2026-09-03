const jwt = require("jsonwebtoken");

const { getBranchScope } = require("../utils/branchScope");

// Verify JWT token
async function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role, branch_id, permissions }

    // Multi-Branch Context Hierarchy Resolution:
    // Resolves active branch ID and array of allowed branch IDs
    // (Main branch includes itself + all its sub-branches; Sub-branch strictly includes itself)
    const scope = await getBranchScope(req);
    req.branchId = scope.activeBranchId;
    req.isMainBranch = scope.isMain;
    req.allowedBranchIds = scope.allowedBranchIds;
    req.branchScope = scope;

    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
}

// Only admin can access
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

// Check module permission
function checkPermission(module, action = "view") {
  return (req, res, next) => {
    // Admin always has full access
    if (req.user.role === "admin") return next();

    const perms = req.user.permissions || {};
    if (!perms[module] || !perms[module][action]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${action} on ${module}`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, adminOnly, checkPermission };
