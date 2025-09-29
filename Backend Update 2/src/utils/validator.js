import Joi from "joi";

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid("DOCTOR", "PATIENT", "PHARMACIST", "MANUFACTURER", "DISTRIBUTOR", "REGULATOR", "ADMIN")
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  passwordHash: Joi.string(),
  role: Joi.string().valid("DOCTOR", "PATIENT", "PHARMACIST", "MANUFACTURER", "DISTRIBUTOR", "REGULATOR", "ADMIN"),
});

export {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  updateUserSchema,
};
