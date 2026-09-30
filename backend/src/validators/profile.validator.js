const { z } = require("zod");

const updateProfileSchema = z
  .object({
    ho_ten: z
      .string()
      .trim()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(150, "Họ tên tối đa 150 ký tự")
      .optional(),

    sdt: z
      .union([
        z.string().trim().max(20, "Số điện thoại tối đa 20 ký tự"),
        z.null(),
      ])
      .optional(),

    khoa: z
      .union([
        z.string().trim().max(100, "Khoa tối đa 100 ký tự"),
        z.null(),
      ])
      .optional(),

    avatar_url: z
      .union([
        z.string().url("avatar_url phải là URL hợp lệ"),
        z.literal(""),
        z.null(),
      ])
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải có ít nhất một trường cần cập nhật",
  });

module.exports = {
  updateProfileSchema,
};