const CustomError = require("../errors");

const checkPermissions = (resourcesUser, resourcesUserId) => {
  if (resourcesUser.role === "admin") return;
  if (resourcesUser.userId === resourcesUserId.toString()) return;
  throw new CustomError.UnathorizedError(
    "you are not authorized to access this route."
  );
};

module.exports = checkPermissions;
