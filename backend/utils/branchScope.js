const db = require("../config/db");

/**
 * Resolve hierarchical branch scope for the current request.
 * - Secures queries to the logged in jeweler's root business network.
 * - If Main HQ is selected: allows root branch + all its sub-branches.
 * - If specific Sub-Branch is selected: scopes strictly to that sub-branch.
 */
async function getBranchScope(req) {
  const headerBranch = req.headers ? req.headers["x-branch-id"] : null;
  const queryBranch = req.query ? req.query.branch_id : null;
  const userBranch = req.user ? (req.user.root_branch_id || req.user.branch_id) : null;

  // If user is authenticated, determine their authorized branch realm
  let userRootBranchId = null;
  let allowedDomainBranchIds = null;

  if (userBranch) {
    const userBranchNum = parseInt(userBranch, 10);
    if (!isNaN(userBranchNum) && userBranchNum > 0) {
      try {
        const [[ub]] = await db.query(
          "SELECT id, parent_branch_id FROM branches WHERE id = ?",
          [userBranchNum]
        );
        if (ub) {
          userRootBranchId = ub.parent_branch_id ? ub.parent_branch_id : ub.id;
          const [subBranches] = await db.query(
            "SELECT id FROM branches WHERE (parent_branch_id = ? OR id = ?) AND status = 'Active'",
            [userRootBranchId, userRootBranchId]
          );
          allowedDomainBranchIds = subBranches.map(b => b.id);
        }
      } catch (e) {
        console.warn("User branch realm lookup error:", e.message);
      }
    }
  }

  let requestedBranchId = headerBranch || queryBranch || userBranch || 1;
  requestedBranchId = parseInt(requestedBranchId, 10);
  if (isNaN(requestedBranchId) || requestedBranchId <= 0) requestedBranchId = 1;

  // Security Boundary Check: If user is authenticated and requested branch is outside their realm,
  // enforce strictly their own root branch to prevent cross-jeweler leakage
  let targetBranchId = requestedBranchId;
  if (allowedDomainBranchIds && allowedDomainBranchIds.length > 0) {
    if (!allowedDomainBranchIds.includes(requestedBranchId)) {
      targetBranchId = userRootBranchId || userBranch;
    }
  } else if (userBranch) {
    targetBranchId = parseInt(userBranch, 10);
  }

  try {
    const [[branch]] = await db.query(
      "SELECT id, name, city, parent_branch_id, status FROM branches WHERE id = ?",
      [targetBranchId]
    );

    if (!branch) {
      return {
        activeBranchId: targetBranchId,
        rootBranchId: targetBranchId,
        isMain: true,
        allowedBranchIds: [targetBranchId],
        branchName: `Branch #${targetBranchId}`
      };
    }

    const rootBranchId = branch.parent_branch_id ? branch.parent_branch_id : branch.id;

    if (!branch.parent_branch_id) {
      // Target is a Main Branch -> include this Main Branch + ALL its Sub-Branches
      const [children] = await db.query(
        "SELECT id FROM branches WHERE (parent_branch_id = ? OR id = ?) AND status = 'Active'",
        [branch.id, branch.id]
      );
      const childIds = children.map(c => c.id);
      const allowedBranchIds = Array.from(new Set([branch.id, ...childIds]));
      return {
        activeBranchId: branch.id,
        rootBranchId: branch.id,
        isMain: true,
        allowedBranchIds,
        branchName: branch.name,
        branchCity: branch.city
      };
    } else {
      // Target is a specific Sub-Branch -> scope strictly to this Sub-Branch only
      return {
        activeBranchId: branch.id,
        rootBranchId,
        isMain: false,
        allowedBranchIds: [branch.id],
        branchName: branch.name,
        branchCity: branch.city,
        parentBranchId: branch.parent_branch_id
      };
    }
  } catch (err) {
    console.warn("Branch scope resolution error:", err.message);
    return {
      activeBranchId: targetBranchId,
      rootBranchId: targetBranchId,
      isMain: true,
      allowedBranchIds: [targetBranchId],
      branchName: `Branch #${targetBranchId}`
    };
  }
}

/**
 * Returns SQL fragment and param for filtering tables by branch_id / sub_branch_id
 * @param {Object} req - Express request
 * @param {String} colName - Column name with table alias (e.g. 'p.branch_id')
 * @param {Boolean} allowLegacyNull - If branch_id 1 is included, allow NULL for backward compatibility
 */
function branchFilter(req, colName = "branch_id", allowLegacyNull = true) {
  const ids = req.allowedBranchIds && req.allowedBranchIds.length > 0
    ? req.allowedBranchIds
    : [req.branchId || 1];

  let clause = "";
  if (allowLegacyNull && ids.includes(1)) {
    clause = `(${colName} IN (?) OR ${colName} IS NULL)`;
  } else {
    clause = `${colName} IN (?)`;
  }
  return {
    sql: clause,
    clause: clause,
    params: [ids]
  };
}

module.exports = { getBranchScope, branchFilter };
