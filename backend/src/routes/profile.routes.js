const express = require("express");

const router = express.Router();

const profileController = require("../controllers/profile.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  updateProfileSchema,
} = require("../validators/profile.validator");

router.get(
  "/",
  authenticate,
  profileController.getProfile
);

router.patch(
  "/",
  authenticate,
  validate(updateProfileSchema),
  profileController.updateProfile
);

module.exports = router;