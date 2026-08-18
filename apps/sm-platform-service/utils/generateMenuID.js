const { MenuModel: menuModel } = require("@sms/shared");
const { generateNextId } = require("@sms/shared/utils");

// Generate sequential menuId values like M00001
const generateMenuId = async () => {
  return generateNextId(menuModel, "menuId", "M", 5);
};

const generateMenuOrderCode = async (roles, schoolId, parentMenuId) => {
  try {
    const roleList = Array.isArray(roles) ? roles : [roles];
    const generatedCodes = [];

    // Map role to prefix helper
    const getPrefix = (roleName) => {
      const r = roleName.toLowerCase();
      if (r === "super_admin") return "SA";
      if (r === "school_admin" || r === "sch_admin") return "A";
      if (r === "teacher") return "T";
      if (r === "parent") return "P";
      if (r === "student") return "S";
      return "M";
    };

    for (const role of roleList) {
      const prefix = getPrefix(role);

      if (parentMenuId) {
        // Sub-menu logic
        const parentMenu = await menuModel.findOne({ menuId: parentMenuId });

        if (!parentMenu) {
          throw new Error("Parent menu not found");
        }

        // Parent orders should be an array now. Find the one matching our prefix.
        // e.g. if we want 'T...', parent must have 'T...' order.
        let parentOrders = [];
        if (Array.isArray(parentMenu.menuOrder)) {
          parentOrders = parentMenu.menuOrder;
        } else if (typeof parentMenu.menuOrder === "string") {
          parentOrders = [parentMenu.menuOrder];
        } // ignore objects/legacy mixed unless strictly needed, assuming migration to array

        // Find parent code starting with same prefix
        const parentCode = parentOrders.find((code) =>
          String(code).startsWith(prefix),
        );

        if (!parentCode) {
          console.warn(
            `Parent menu ${parentMenuId} has no order code starting with ${prefix} for role ${role}`,
          );
          continue;
        }

        // Find siblings
        const siblings = await menuModel.find({ parentMenuId });

        let maxSuffix = 0;
        const escapedParentCode = String(parentCode).replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const regex = new RegExp(`^${escapedParentCode}\\.(\\d+)$`);

        siblings.forEach((menu) => {
          const orders = Array.isArray(menu.menuOrder)
            ? menu.menuOrder
            : [menu.menuOrder];
          orders.forEach((order) => {
            if (order) {
              const match = String(order).match(regex);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxSuffix) maxSuffix = num;
              }
            }
          });
        });

        generatedCodes.push(`${parentCode}.${maxSuffix + 1}`);
      } else {
        // Root Menu logic
        const query = {
          $or: [
            { parentMenuId: { $exists: false } },
            { parentMenuId: null },
            { parentMenuId: "" },
          ],
          schoolId: schoolId ? { $in: [schoolId] } : { $size: 0 },
        };

        // Find existing menus with this prefix
        const regexPattern = new RegExp(`^${prefix}\\d+$`); // e.g. ^SA\d+

        // We can't easily query the array for specific regex per role efficiently in one go perfectly
        // but we can query matches.
        const existingMenus = await menuModel
          .find({
            ...query,
            menuOrder: { $elemMatch: { $regex: regexPattern } },
          })
          .select("menuOrder");

        let maxNum = 0;
        const extractRegex = new RegExp(`^${prefix}(\\d+)$`);

        existingMenus.forEach((menu) => {
          const orders = Array.isArray(menu.menuOrder)
            ? menu.menuOrder
            : [menu.menuOrder];
          orders.forEach((order) => {
            if (order) {
              const match = String(order).match(extractRegex);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
              }
            }
          });
        });

        generatedCodes.push(`${prefix}${maxNum + 1}`);
      }
    }

    // Return unique codes array
    return [...new Set(generatedCodes)];
  } catch (error) {
    console.error("Error inside generateMenuOrderCode:", error);
    throw error;
  }
};

module.exports = {
  generateMenuId,
  generateMenuOrderCode,
};
