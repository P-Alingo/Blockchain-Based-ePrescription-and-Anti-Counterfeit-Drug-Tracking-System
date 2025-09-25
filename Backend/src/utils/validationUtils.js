import Joi from "joi";

export function validateUserRegistration(data) {
  const schema = Joi.object({
    address: Joi.string().required(),
    metadata: Joi.object().optional(),
  });
  return schema.validate(data);
}

export function validatePrescriptionCreation(data) {
  const schema = Joi.object({
    doctorId: Joi.number().integer().required(),
    patientId: Joi.number().integer().required(),
    data: Joi.object().required(),
  });
  return schema.validate(data);
}

export function validateBatchCreation(data) {
  const schema = Joi.object({
    manufacturerId: Joi.number().integer().required(),
    batchNumber: Joi.string().required(),
    data: Joi.object().required(),
  });
  return schema.validate(data);
}

export function validateTransferInitiation(data) {
  const schema = Joi.object({
    fromUserId: Joi.number().integer().required(),
    batchId: Joi.number().integer().required(),
    toUserId: Joi.number().integer().required(),
  });
  return schema.validate(data);
}

export function validateTransferCompletion(data) {
  const schema = Joi.object({
    transferId: Joi.number().integer().required(),
    toUserId: Joi.number().integer().required(),
  });
  return schema.validate(data);
}

export function validateTOTPCode(code) {
  const schema = Joi.string().length(6).regex(/^\d+$/).required();
  return schema.validate(code);
}
