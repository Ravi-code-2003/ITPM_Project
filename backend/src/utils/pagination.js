const normalizePagination = ({ page = 1, pageSize = 10, maxPageSize = 50 } = {}) => {
  const normalizedPage = Math.max(parseInt(page, 10) || 1, 1);
  const normalizedSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), maxPageSize);
  const skip = (normalizedPage - 1) * normalizedSize;

  return { page: normalizedPage, pageSize: normalizedSize, skip, limit: normalizedSize };
};

module.exports = {
  normalizePagination,
};
