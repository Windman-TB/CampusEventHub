const profileService = require("../services/profile.service");

async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfileById(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin cá nhân thành công",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await profileService.updateProfile(
      req.user.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
};