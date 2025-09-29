function validateRequest(schema) {
  return (req, res, next) => {
    const validationOptions = { abortEarly: false, allowUnknown: false };
    const { error } = schema.validate(req.body, validationOptions);
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ errors: messages });
    }
    next();
  };
}

export { validateRequest };
