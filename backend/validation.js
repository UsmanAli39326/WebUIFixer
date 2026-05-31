const { body, param, validationResult } = require('express-validator');

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registrationValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number'),

  validationMiddleware
];

const loginValidator = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validationMiddleware
];

const urlValidator = [
  param('url').optional().isURL().withMessage('Invalid URL format in path parameter'),
  body('url').optional().isURL().withMessage('Invalid URL format in request body'),
  // We'll validate the query parameter manually in the route or we can add query() here:
  // query('url').optional().isURL().withMessage('Invalid URL format in query parameter'),
  validationMiddleware
];

module.exports = {
  registrationValidator,
  loginValidator,
  urlValidator,
  validationMiddleware
};
