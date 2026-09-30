const { z } = require("zod");

const registerSchema = z
  .object({
    ho_ten: z
      .string()
      .trim()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(150, "Họ tên không được vượt quá 150 ký tự"),

    mssv: z
      .string()
      .trim()
      .min(5, "MSSV phải có ít nhất 5 ký tự")
      .max(20, "MSSV không được vượt quá 20 ký tự"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Email không hợp lệ")
      .max(100, "Email không được vượt quá 100 ký tự"),

    sdt: z
      .string()
      .trim()
      .max(20, "Số điện thoại không được vượt quá 20 ký tự")
      .optional(),

    khoa: z
      .string()
      .trim()
      .max(100, "Khoa không được vượt quá 100 ký tự")
      .optional(),

    mat_khau: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(100, "Mật khẩu không được vượt quá 100 ký tự"),
  })
  .strict("Request chứa trường không được phép");

const loginSchema = z
  .object({
    identifier: z
      .string()
      .trim()
      .min(1, "Email hoặc MSSV không được để trống"),

    mat_khau: z
      .string()
      .min(1, "Mật khẩu không được để trống"),
  })
  .strict();

module.exports = {
  registerSchema,
  loginSchema,
};