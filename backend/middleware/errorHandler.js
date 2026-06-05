export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route Not Found : ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status =
    req.statusCode && req.statusCode !== 200 ? req.statusCode : 500;
  res.status(status).json({
    message: err.message,
  });
};
