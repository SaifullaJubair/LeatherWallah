export const EnglishDateShort = (date) => {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(new Date(date));
};