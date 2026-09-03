const db = require("../config/db");

/**
 * Resolve hierarchical branch scope for the current request.
 * - If target branch is a Main Branch (parent_branch_id IS NULL):
 *     returns [main_branch_id, ...all_sub_branches_where_parent_branch_id_is_main]
 * - If target branch is a Sub-Branch (parent_branch_id IS NOT NULL):
 *     returns [sub_branch_id]
 */
async function getBranchScope(req) {
  const headerBranch = req.headers ? req.headers["x-branch-id"] : null;
  const queryBranch = req.query ? req.query.branch_id : null;
  const userBranch = req.user ? req.user.branch_id : null;

  let targetBranchId = headerBranch || queryBranch || userBranch || 1;
  targetBranchId = parseInt(targetBranchId, 10);
  if (isNaN(targetBranchId) || targetBranchId <= 0) targetBranchId = 1;

  try {
    const [[branch]] = await db.query(
      "SELECT id, name, city, parent_branch_id, status FROM branches WHERE id = ?",
      [targetBranchId]
    );

    if (!branch) {
      return {
        activeBranchId: targetBranchId,
        isMain: true,
        allowedBranchIds: [targetBranchId],
        branchName: `Branch #${targetBranchId}`
      };
    }

    if (!branch.parent_branch_id) {
      // Target is a Main Branch -> include this Main Branch + ALL its Sub-Branches
      const [children] = await db.query(
        "SELECT id FROM branches WHERE parent_branch_id = ? AND status = 'Active'",
        [branch.id]
      );
      const childIds = children.map(c => c.id);
      const allowedBranchIds = [branch.id, ...childIds];
      return {
        activeBranchId: branch.id,
        isMain: true,
        allowedBranchIds,
        branchName: branch.name,
        branchCity: branch.city
      };
    } else {
      // Target is a specific Sub-Branch -> scope strictly to this Sub-Branch only
      return {
        activeBranchId: branch.id,
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
      isMain: true,
      allowedBranchIds: [targetBranchId],
      branchName: `Branch #${targetBranchId}`
    };
  }
}

/**
 * Returns SQL fragment and param for filtering tables by branch_id
 * @param {Object} req - Express request
 * @param {String} colName - Column name with table alias (e.g. 'p.branch_id')
 * @param {Boolean} allowLegacyNull - If branch_id 1 is included, allow NULL for backward compatibility
 */
function branchFilter(req, colName = "branch_id", allowLegacyNull = true) {
  const ids = req.allowedBranchIds && req.allowedBranchIds.length > 0
    ? req.allowedBranchIds
    : [req.branchId || 1];

  if (allowLegacyNull && ids.includes(1)) {
    return {
      sql: `(${colName} IN (?) OR ${colName} IS NULL)`,
      params: [ids]
    };
  }
  return {
    sql: `${colName} IN (?)`,
    params: [ids]
  };
}

module.exports = { getBranchScope, branchFilter };
