const { RushHour, Product } = require("../models");

const pad = (n) => String(n).padStart(2, "0");

// Get the current time in Egypt (Africa/Cairo), regardless of server timezone.
const getEgyptNow = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;

  return {
    hours: Number(get("hour")),
    minutes: Number(get("minute")),
    seconds: Number(get("second")),
  };
};

// Is `rushHour` inside its active time window right now?
const isWithinWindow = (rushHour, now = new Date()) => {
  if (rushHour.schedule_type === "one_off") {
    if (!rushHour.start_at || !rushHour.end_at) return false;

    return (
      now >= new Date(rushHour.start_at) &&
      now <= new Date(rushHour.end_at)
    );
  }

  // recurring_daily — schedules are interpreted as Egypt time.
  if (!rushHour.start_time || !rushHour.end_time) return false;

  const egypt = getEgyptNow(now);

  const nowTime = `${pad(egypt.hours)}:${pad(egypt.minutes)}:${pad(egypt.seconds)}`;

  const { start_time: start, end_time: end } = rushHour;

  if (start <= end) {
    return nowTime >= start && nowTime <= end;
  }

  // Window crosses midnight, e.g. 22:00–02:00
  return nowTime >= start || nowTime <= end;
};

// When does the CURRENT window end?
const getWindowEndsAt = (rushHour, now = new Date()) => {
  if (rushHour.schedule_type === "one_off") {
    return rushHour.end_at ? new Date(rushHour.end_at) : null;
  }

  if (!rushHour.end_time || !rushHour.start_time) return null;

  const [eh, em, es = 0] = rushHour.end_time.split(":").map(Number);
  const [sh, sm] = rushHour.start_time.split(":").map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  const egypt = getEgyptNow(now);
  const nowMinutes = egypt.hours * 60 + egypt.minutes;

  // Build an absolute timestamp representing the end time in Egypt.
  const egyptDateString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [year, month, day] = egyptDateString.split("-").map(Number);

  const end = new Date(
    Date.UTC(year, month - 1, day, eh, em, es)
  );

  // Convert the Egypt-local end time into the correct UTC instant.
  const egyptOffset = getEgyptOffsetMinutes(now);
  const endUtc = new Date(end.getTime() - egyptOffset * 60 * 1000);

  // Crossing midnight: if we're currently in the evening portion,
  // the window ends tomorrow morning in Egypt.
  if (startMinutes > endMinutes && nowMinutes >= startMinutes) {
    endUtc.setUTCDate(endUtc.getUTCDate() + 1);
  }

  return endUtc;
};

// Get Egypt's current UTC offset in minutes.
const getEgyptOffsetMinutes = (date = new Date()) => {
  const utcParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const cairoParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (parts, type) =>
    Number(parts.find((p) => p.type === type)?.value);

  const utc = Date.UTC(
    get(utcParts, "year"),
    get(utcParts, "month") - 1,
    get(utcParts, "day"),
    get(utcParts, "hour"),
    get(utcParts, "minute"),
    get(utcParts, "second")
  );

  const cairo = Date.UTC(
    get(cairoParts, "year"),
    get(cairoParts, "month") - 1,
    get(cairoParts, "day"),
    get(cairoParts, "hour"),
    get(cairoParts, "minute"),
    get(cairoParts, "second")
  );

  return (cairo - utc) / 60000;
};

// Finds the single Rush Hour that is both switched on AND currently
// inside its schedule.
const getLiveRushHour = async () => {
  const candidate = await RushHour.findOne({
    where: { is_active: true },
    include: [{ model: Product, as: "products", attributes: ["id"] }],
  });

  if (!candidate) return null;

  if (!isWithinWindow(candidate)) return null;

  return candidate;
};

// { [productId]: discountPercent }
const getLiveRushHourDiscountMap = async () => {
  const live = await getLiveRushHour();

  if (!live) return {};

  const map = {};

  live.products.forEach((p) => {
    map[p.id] = parseFloat(live.discount_percent);
  });

  return map;
};

// Applies rush-hour discount only when product has no existing discount.
const applyRushHourOverride = (productPlain, rushHourMap) => {
  const stored = parseFloat(productPlain.discount || 0);
  const rushDiscount = rushHourMap[productPlain.id];

  if (stored === 0 && rushDiscount !== undefined) {
    return {
      discount: rushDiscount,
      is_rush_hour: true,
    };
  }

  return {
    discount: stored,
    is_rush_hour: false,
  };
};

module.exports = {
  isWithinWindow,
  getWindowEndsAt,
  getLiveRushHour,
  getLiveRushHourDiscountMap,
  applyRushHourOverride,
};