const { apiError } = require('./errors');
const { isCalendarDate, MAX_AMOUNT_CENTS } = require('../helpers/transactions');
const fields = ['type', 'amountCents', 'category', 'date', 'description'];
module.exports =
  (partial = false) =>
  (req, res, next) => {
    const { body } = req;
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return next(apiError(400, 'A transaction object is required.'));
    const keys = Object.keys(body);
    const unknown = keys.find(key => !fields.includes(key));
    if (unknown) return next(apiError(400, 'Unknown field: ' + unknown, 400, unknown));
    if (partial && keys.length === 0) return next(apiError(400, 'Provide at least one field to update.'));
    if (!partial) {
      const missing = fields.slice(0, 4).find(key => body[key] === undefined);
      if (missing) return next(apiError(400, missing + ' is required.', 400, missing));
    }
    if (keys.includes('type') && !['income', 'expense'].includes(body.type))
      return next(apiError(400, 'Type must be income or expense.', 400, 'type'));
    if (
      keys.includes('amountCents') &&
      (!Number.isSafeInteger(body.amountCents) || body.amountCents < 1 || body.amountCents > MAX_AMOUNT_CENTS)
    ) {
      return next(apiError(400, 'Amount must be a positive integer in cents, up to 999999999.', 400, 'amountCents'));
    }
    if (keys.includes('date') && !isCalendarDate(body.date))
      return next(apiError(400, 'Date must be a real calendar date in YYYY-MM-DD format (1900-9999).', 400, 'date'));
    if (keys.includes('category')) {
      if (typeof body.category !== 'string' || !body.category.trim() || body.category.trim().length > 64)
        return next(apiError(400, 'Category is required and must contain at most 64 characters.', 400, 'category'));
      body.category = body.category.trim();
    }
    if (keys.includes('description')) {
      if (typeof body.description !== 'string' || body.description.trim().length > 500)
        return next(apiError(400, 'Description must contain at most 500 characters.', 400, 'description'));
      body.description = body.description.trim();
    }
    return next();
  };
