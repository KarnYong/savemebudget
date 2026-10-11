export const TIME_ZONE = "Asia/Bangkok";

const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
export const formatBaht = (amount: number | string) => baht.format(Number(amount));

/** Today's calendar date in Bangkok as YYYY-MM-DD. */
export const todayInBangkok = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);

// Expense dates are calendar dates already chosen in Bangkok time,
// so format them as-is (UTC) to avoid shifting the day.
const thaiDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "UTC" });
export const formatThaiDate = (isoDate: string) => thaiDate.format(new Date(`${isoDate}T00:00:00Z`));

export const formatThaiMonth = (now = new Date()) =>
  new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric", timeZone: TIME_ZONE }).format(now);
