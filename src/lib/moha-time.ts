const NAIROBI_TIME_ZONE = "Africa/Nairobi";
const NAIROBI_OFFSET = "+03:00";

export function isValidNairobiDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function getNairobiDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NAIROBI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysToNairobiDate(dateString: string, days: number) {
  if (!isValidNairobiDate(dateString)) {
    return getNairobiDateString();
  }

  const [year, month, day] = dateString.split("-").map(Number);

  const shiftedDate = new Date(Date.UTC(year, month - 1, day + days));

  return shiftedDate.toISOString().slice(0, 10);
}

export function toNairobiDateTime(dateString: string, timeString: string) {
  if (
    !isValidNairobiDate(dateString) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeString)
  ) {
    throw new Error("Invalid Nairobi appointment date or time.");
  }

  return new Date(`${dateString}T${timeString}:00${NAIROBI_OFFSET}`);
}

export function getNairobiDayOfWeek(dateString: string) {
  const date = new Date(`${dateString}T12:00:00${NAIROBI_OFFSET}`);

  return date.getUTCDay();
}

export function getNairobiDayRange(dateString: string) {
  const start = toNairobiDateTime(dateString, "00:00");
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export function formatNairobiDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: NAIROBI_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatNairobiTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: NAIROBI_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
export function getNairobiDateInputValue(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NAIROBI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function getNairobiTimeInputValue(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: NAIROBI_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.hour}:${values.minute}`;
}
