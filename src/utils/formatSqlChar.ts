export const formatSqlChar = (str: string) => {
  if (!str) {
    return null;
  }
  return `'${str}'`;
};
