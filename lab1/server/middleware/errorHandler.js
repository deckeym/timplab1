function errorHandler(err, req, res, next) {
  console.error('[SERVER_ERROR]', err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Внутренняя ошибка сервера'
  });
}

module.exports = errorHandler;
