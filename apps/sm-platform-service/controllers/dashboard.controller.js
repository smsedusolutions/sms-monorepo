const {
  SchoolModel: School,
  UserModel: User,
  MenuModel: Menu,
  AdminModel: adminModel,
  MenuBackupModel: MenuBackup,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");
const {
  generateMenuId,
  generateMenuOrderCode,
} = require("../utils/generateMenuID");

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    // Get total schools count
    const totalSchools = await School.countDocuments();

    // Get total users (school admins) count
    const totalUsers = await User.countDocuments();

    // Get active schools count
    const activeSchools = await School.countDocuments({ status: "active" });

    // Get active users count
    const activeUsers = await User.countDocuments({ status: "active" });

    res.status(200).json({
      success: true,
      data: {
        totalSchools,
        totalUsers,
        activeSchools,
        activeUsers,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: error.message,
    });
  }
};

const getMenus = async (req, res) => {
  try {
    const { role } = req.params;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required to fetch menus",
      });
    }

    const user = await adminModel.findOne({ role });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Match menus either by role or explicit username in the access list
    const accessTokens = [user.role].filter(Boolean);

    const menus = await Menu.find(
      {
        menuAccessRoles: { $in: accessTokens },
        deactivatedRoles: { $nin: accessTokens },
        status: "active",
      },
      { menuAccessRoles: 0 },
    );

    // Sort in memory because we need to find the specific order code in the array relevant to the role
    let prefix = "M";
    const r = role.toLowerCase();
    if (r === "super_admin") prefix = "SA";
    else if (r === "school_admin" || r === "sch_admin") prefix = "A";
    else if (r === "teacher") prefix = "T";
    else if (r === "parent") prefix = "P";
    else if (r === "student") prefix = "S";

    const getRoleOrder = (menu) => {
      const orders = Array.isArray(menu.menuOrder)
        ? menu.menuOrder
        : [menu.menuOrder];
      // Find code starting with prefix followed by a digit (to avoid S matching SA)
      const regex = new RegExp(`^${prefix}\\d`);
      const code = orders.find((o) => regex.test(String(o)));
      return code || "Z99999"; // Fallback to end if no code found
    };

    const sortedMenus = menus.sort((a, b) => {
      const orderA = getRoleOrder(a);
      const orderB = getRoleOrder(b);
      return orderA.localeCompare(orderB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return res.status(200).json({
      success: true,
      message: "Menus fetched successfully",
      data: sortedMenus,
      count: sortedMenus.length,
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menus",
      error: error.message,
    });
  }
};

// Create menu
const createMenu = async (req, res) => {
  try {
    const {
      menuName,
      menuUrl,
      menuOrder,
      menuType,
      parentMenuId,
      menuAccessRoles,
      menuIcon,
      schoolId,
      status,
      defaultMenu,
      showInSidebar,
    } = req.body;

    // Normalize menuAccessRoles to array if it is a string
    let roles = menuAccessRoles;
    if (typeof roles === "string") {
      roles = [roles];
    }

    if (
      !menuName ||
      !menuUrl ||
      !menuType ||
      !Array.isArray(roles) ||
      roles.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "menuName, menuUrl, menuType, and menuAccessRoles are required",
      });
    }

    const effectiveParentMenuId = parentMenuId || req.body.parentId || null;

    if (menuType === "sub" && !effectiveParentMenuId) {
      return res.status(400).json({
        success: false,
        message: "parentMenuId is required for submenus",
      });
    }

    // Normalize schoolId to array
    let schoolIds = [];
    if (Array.isArray(schoolId)) {
      schoolIds = schoolId;
    } else if (schoolId) {
      schoolIds = [schoolId];
    }

    const existingMenu = await Menu.findOne({
      menuName,
      schoolId: schoolIds.length > 0 ? { $all: schoolIds } : { $size: 0 },
      parentMenuId: effectiveParentMenuId,
    });

    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: `Menu with name "${menuName}" already exists for this ${effectiveParentMenuId ? "parent menu" : "school"
          }`,
      });
    }

    // Auto-generate menuOrder if not provided
    let finalMenuOrder = menuOrder;
    if (
      finalMenuOrder === undefined ||
      finalMenuOrder === "" ||
      finalMenuOrder === null
    ) {
      finalMenuOrder = await generateMenuOrderCode(
        roles,
        schoolIds[0] || null,
        effectiveParentMenuId,
      );
    }

    const menuId = await generateMenuId();

    const newMenu = new Menu({
      menuId,
      menuName,
      menuUrl,
      menuOrder: finalMenuOrder,
      menuType,
      parentMenuId: effectiveParentMenuId,
      menuAccessRoles: roles,
      menuIcon: menuIcon || null,
      schoolId: roles.includes("super_admin") && schoolIds.length === 0 ? [] : schoolIds,
      defaultMenu: defaultMenu || false,
      showInSidebar: showInSidebar !== undefined ? showInSidebar : true,
      status: status || "active",
    });

    const savedMenu = await newMenu.save();

    return res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: savedMenu,
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create menu",
      error: error.message,
    });
  }
};

// Update menu by menuId
const updateMenu = async (req, res) => {
  try {
    const { menuId } = req.params;
    const updateData = { ...req.body };

    // Prevent menuId overwrite
    delete updateData.menuId;

    // Normalize schoolId to array if provided as string
    if (updateData.schoolId !== undefined && !Array.isArray(updateData.schoolId)) {
      updateData.schoolId = updateData.schoolId ? [updateData.schoolId] : [];
    }

    // Normalize menuAccessRoles to array if it is a string
    if (
      updateData.menuAccessRoles &&
      typeof updateData.menuAccessRoles === "string"
    ) {
      updateData.menuAccessRoles = [updateData.menuAccessRoles];
    }

    if (
      updateData.menuAccessRoles &&
      (!Array.isArray(updateData.menuAccessRoles) ||
        updateData.menuAccessRoles.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "menuAccessRoles must be a non-empty array when provided",
      });
    }

    const effectiveParentMenuId =
      updateData.parentMenuId !== undefined
        ? updateData.parentMenuId
        : updateData.parentId !== undefined
          ? updateData.parentId
          : undefined;

    // Check for duplicate menu name in the same school and parent during update
    // Fetch current menu to compare state - UNCONDITIONALLY
    const currentMenu = await Menu.findOne({ menuId });
    if (!currentMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    // Auto-update menuOrder if structural properties change and menuOrder is not provided
    if (updateData.menuOrder === undefined) {
      const newParentId =
        effectiveParentMenuId !== undefined
          ? effectiveParentMenuId
          : currentMenu.parentMenuId;
      const newSchoolId =
        updateData.schoolId !== undefined
          ? updateData.schoolId
          : currentMenu.schoolId;
      const newSchoolIdFirst = Array.isArray(newSchoolId) ? newSchoolId[0] : newSchoolId;

      let newRole = null;
      if (updateData.menuAccessRoles && updateData.menuAccessRoles.length > 0)
        newRole = updateData.menuAccessRoles[0];
      else if (
        currentMenu.menuAccessRoles &&
        currentMenu.menuAccessRoles.length > 0
      )
        newRole = currentMenu.menuAccessRoles[0];

      // Detect changes
      // Helper to normalize ID comparison (treat null, undefined, "" as equivalent for NO_ID)
      const normalizeId = (id) => (id ? String(id) : "");

      const parentChanged =
        effectiveParentMenuId !== undefined &&
        normalizeId(effectiveParentMenuId) !==
        normalizeId(currentMenu.parentMenuId);

      const schoolChanged =
        updateData.schoolId !== undefined &&
        JSON.stringify(updateData.schoolId) !== JSON.stringify(currentMenu.schoolId);

      const currentRole = currentMenu.menuAccessRoles?.[0];
      const roleChanged = newRole && currentRole && newRole !== currentRole;

      if (parentChanged || schoolChanged || roleChanged) {
        // Use all relevant roles for regeneration
        const rolesToUse =
          updateData.menuAccessRoles || currentMenu.menuAccessRoles;

        updateData.menuOrder = await generateMenuOrderCode(
          rolesToUse,
          newSchoolIdFirst || null,
          newParentId,
        );
      }
    }

    if (
      updateData.menuName ||
      updateData.schoolId !== undefined ||
      effectiveParentMenuId !== undefined ||
      updateData.menuType !== undefined
    ) {
      // currentMenu is already fetched

      const checkName = updateData.menuName || currentMenu.menuName;
      const checkSchoolId =
        updateData.schoolId !== undefined
          ? updateData.schoolId
          : currentMenu.schoolId;
      const checkParentMenuId =
        effectiveParentMenuId !== undefined
          ? effectiveParentMenuId
          : currentMenu.parentMenuId;
      const checkMenuType = updateData.menuType || currentMenu.menuType;

      if (checkMenuType === "sub" && !checkParentMenuId) {
        return res.status(400).json({
          success: false,
          message: "parentMenuId is required for submenus",
        });
      }

      const existingMenu = await Menu.findOne({
        menuName: checkName,
        schoolId: checkSchoolId || null,
        parentMenuId: checkParentMenuId || null,
        menuId: { $ne: menuId },
      });

      if (existingMenu) {
        return res.status(400).json({
          success: false,
          message: `Menu with name "${checkName}" already exists for this ${checkParentMenuId ? "parent menu" : "school"
            }`,
        });
      }
    }

    // Ensure we save it as parentMenuId in the DB
    if (
      updateData.parentId !== undefined &&
      updateData.parentMenuId === undefined
    ) {
      updateData.parentMenuId = updateData.parentId;
      delete updateData.parentId;
    }

    // Handle schoolId for super_admin roles
    if (
      updateData.menuAccessRoles &&
      updateData.menuAccessRoles.includes("super_admin") &&
      (!updateData.schoolId || updateData.schoolId.length === 0)
    ) {
      updateData.schoolId = [];
    }

    const updatedMenu = await Menu.findOneAndUpdate({ menuId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    // Cascade: if a main menu is set to inactive, deactivate all its submenus automatically
    let cascadedCount = 0;
    if (
      updatedMenu.menuType === "main" &&
      updateData.status === "inactive"
    ) {
      const cascadeResult = await Menu.updateMany(
        { parentMenuId: menuId, menuType: "sub" },
        { $set: { status: "inactive" } }
      );
      cascadedCount = cascadeResult.modifiedCount;
    }

    // Cascade: if a main menu is re-activated, re-activate all its submenus
    if (
      updatedMenu.menuType === "main" &&
      updateData.status === "active"
    ) {
      const cascadeResult = await Menu.updateMany(
        { parentMenuId: menuId, menuType: "sub" },
        { $set: { status: "active" } }
      );
      cascadedCount = cascadeResult.modifiedCount;
    }

    // Cascade: propagate role and school activation/deactivation changes to submenus
    if (updatedMenu.menuType === "main") {
      const submenus = await Menu.find({ parentMenuId: menuId, menuType: "sub" });
      if (submenus.length > 0) {
        if (updateData.deactivatedRoles !== undefined) {
          const parentDeactivated = updatedMenu.deactivatedRoles || [];
          const prevDeactivated = currentMenu.deactivatedRoles || [];
          const newlyDeactivated = parentDeactivated.filter(r => !prevDeactivated.includes(r));
          const newlyActivated = prevDeactivated.filter(r => !parentDeactivated.includes(r));
          for (const sub of submenus) {
            let subRoles = sub.deactivatedRoles || [];
            newlyDeactivated.forEach(r => {
              if (!subRoles.includes(r)) subRoles.push(r);
            });
            subRoles = subRoles.filter(r => !newlyActivated.includes(r));
            await Menu.updateOne({ menuId: sub.menuId }, { $set: { deactivatedRoles: subRoles } });
          }
        }
        if (updateData.deactivatedSchools !== undefined) {
          const parentDeactivated = updatedMenu.deactivatedSchools || [];
          const prevDeactivated = currentMenu.deactivatedSchools || [];
          const newlyDeactivated = parentDeactivated.filter(s => !prevDeactivated.includes(s));
          const newlyActivated = prevDeactivated.filter(s => !parentDeactivated.includes(s));
          for (const sub of submenus) {
            let subSchools = sub.deactivatedSchools || [];
            newlyDeactivated.forEach(s => {
              if (!subSchools.includes(s)) subSchools.push(s);
            });
            subSchools = subSchools.filter(s => !newlyActivated.includes(s));
            await Menu.updateOne({ menuId: sub.menuId }, { $set: { deactivatedSchools: subSchools } });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Menu updated successfully${cascadedCount > 0 ? `. ${cascadedCount} submenu(s) status updated automatically.` : ""}`,
      data: updatedMenu,
    });
  } catch (error) {
    console.error("Error updating menu:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update menu",
      error: error.message,
    });
  }
};

// Delete menu by menuId
const deleteMenu = async (req, res) => {
  try {
    const { menuId } = req.params;

    const deletedMenu = await Menu.findOneAndDelete({ menuId });

    if (!deletedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete menu",
      error: error.message,
    });
  }
};

// Get all menus (for Super Admin management)
// Paginates only main menus; submenus are always included with their parent
const getAllMenus = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, schoolId, menuType } = req.query;

    let baseQuery = {};

    // Filter by school if provided (schoolId is now an array in the model)
    if (schoolId) {
      baseQuery.schoolId = { $in: [schoolId] };
    }

    // Filter by search term if provided
    if (search) {
      baseQuery.$or = [
        { menuName: { $regex: search, $options: "i" } },
        { menuUrl: { $regex: search, $options: "i" } },
        { menuOrder: { $regex: search, $options: "i" } },
        { menuAccessRoles: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Only paginate main menus (or target menuType if explicitly requested)
    const mainMenuQuery = { ...baseQuery };
    if (menuType) {
      mainMenuQuery.menuType = menuType;
    } else {
      mainMenuQuery.menuType = "main";
    }

    const [mainMenus, totalMainMenus] = await Promise.all([
      Menu.find(mainMenuQuery).sort({ menuOrder: 1 }).skip(skip).limit(limit),
      Menu.countDocuments(mainMenuQuery),
    ]);

    // Fetch all submenus belonging to these main menus ONLY if menuType is not explicitly specified
    const mainMenuIds = mainMenus.map((m) => m.menuId);
    let subMenus = [];
    if (!menuType && mainMenuIds.length > 0) {
      subMenus = await Menu.find({
        ...baseQuery,
        menuType: "sub",
        parentMenuId: { $in: mainMenuIds },
      }).sort({ menuOrder: 1 });
    }

    // Merge main menus and submenus into a flat sorted list
    const allMenus = [...mainMenus, ...subMenus].sort((a, b) => {
      const orderA = Array.isArray(a.menuOrder) ? a.menuOrder[0] : a.menuOrder;
      const orderB = Array.isArray(b.menuOrder) ? b.menuOrder[0] : b.menuOrder;
      return String(orderA || "").localeCompare(String(orderB || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const response = formatPaginationResponse(allMenus, totalMainMenus, page, limit);

    return res.status(200).json({
      success: true,
      message: "All menus fetched successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching all menus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all menus",
      error: error.message,
    });
  }
};

// Get all menus without pagination (for Excel export)
const getAllMenusForExport = async (req, res) => {
  try {
    const menus = await Menu.find().sort({ menuOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "All menus fetched for export",
      data: menus,
    });
  } catch (error) {
    console.error("Error fetching menus for export:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menus for export",
      error: error.message,
    });
  }
};

// Bulk update menus (from Excel upload)
const bulkUpdateMenus = async (req, res) => {
  try {
    const { menus } = req.body;

    if (!Array.isArray(menus) || menus.length === 0) {
      return res.status(400).json({
        success: false,
        message: "menus array is required and must not be empty",
      });
    }

    // --- Data Safety: Take a snapshot before bulk update ---
    const currentMenus = await Menu.find({});
    const batchId = `BATCH_${Date.now()}`;

    await MenuBackup.create({
      batchId,
      performedBy: req.user?.userId || "super_admin",
      menuSnapshot: currentMenus,
    });

    const errors = [];
    const operations = [];

    for (let i = 0; i < menus.length; i++) {
      const item = menus[i];

      if (!item.menuId) {
        errors.push({ row: i + 1, error: "Missing menuId" });
        continue;
      }

      // Build update object from allowed fields only
      const allowedFields = [
        "menuName",
        "menuUrl",
        "menuType",
        "parentMenuId",
        "menuAccessRoles",
        "menuIcon",
        "schoolId",
        "defaultMenu",
        "showInSidebar",
        "status",
      ];

      const updateData = {};
      for (const field of allowedFields) {
        if (item[field] !== undefined) {
          updateData[field] = item[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        continue; // No updatable fields
      }

      operations.push({
        updateOne: {
          filter: { menuId: item.menuId },
          update: { $set: updateData },
        },
      });
    }

    if (errors.length > 0 && operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All rows had errors",
        errors,
      });
    }

    let result = { modifiedCount: 0, matchedCount: 0 };
    if (operations.length > 0) {
      result = await Menu.bulkWrite(operations);
    }

    return res.status(200).json({
      success: true,
      message: `Bulk update completed: ${result.modifiedCount} menu(s) updated`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        errorCount: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk update menus",
      error: error.message,
    });
  }
};

// Get all menu backups
const getMenuBackups = async (req, res) => {
  try {
    const backups = await MenuBackup.find({}, { menuSnapshot: 0 })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error("Error fetching backups:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch backups",
      error: error.message,
    });
  }
};

// Restore menus from a backup
const restoreMenuBackup = async (req, res) => {
  try {
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "batchId is required",
      });
    }

    const backup = await MenuBackup.findOne({ batchId });
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    // 1. Take a temporary snapshot before restoring (safety first!)
    const currentMenus = await Menu.find({});
    const safetyBatchId = `RESTORE_SAFETY_${Date.now()}`;
    await MenuBackup.create({
      batchId: safetyBatchId,
      performedBy: req.user?.userId || "super_admin",
      menuSnapshot: currentMenus,
    });

    // 2. Wipe current collection and restore from snapshot
    await Menu.deleteMany({});
    if (backup.menuSnapshot && backup.menuSnapshot.length > 0) {
      await Menu.insertMany(backup.menuSnapshot);
    }

    return res.status(200).json({
      success: true,
      message: `Menu collection restored successfully from ${batchId}. A safety backup (${safetyBatchId}) was created before the restore.`,
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to restore backup",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getMenus,
  getAllMenus,
  getAllMenusForExport,
  createMenu,
  updateMenu,
  deleteMenu,
  bulkUpdateMenus,
  getMenuBackups,
  restoreMenuBackup,
};
