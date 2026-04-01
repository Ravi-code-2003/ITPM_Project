const getMonthRange = ({ month, year } = {}) => {
  const now = new Date();
  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);
  const normalizedMonth = Number.isFinite(parsedMonth) ? parsedMonth : now.getMonth() + 1;
  const normalizedYear = Number.isFinite(parsedYear) ? parsedYear : now.getFullYear();

  const start = new Date(normalizedYear, normalizedMonth - 1, 1, 0, 0, 0, 0);
  const end = new Date(normalizedYear, normalizedMonth, 0, 23, 59, 59, 999);

  return { start, end, month: normalizedMonth, year: normalizedYear };
};

const getDaysInMonth = ({ month, year }) => new Date(year, month, 0).getDate();

const getMonthLabel = ({ month, year }) => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

module.exports = {
  getMonthRange,
  getDaysInMonth,
  getMonthLabel,
};
