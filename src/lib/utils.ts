import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number in Indian lakhs system: 1,00,000 */
export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const parts = abs.toFixed(2).split(".");
  const intPart = parts[0];
  const decPart = parts[1];

  let result = "";
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    result = groups + "," + last3;
  }

  return (isNegative ? "-" : "") + "\u20B9" + result + "." + decPart;
}

/** Format compact INR: 1.2L, 3.5Cr */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 10000000) return sign + "\u20B9" + (abs / 10000000).toFixed(1) + "Cr";
  if (abs >= 100000) return sign + "\u20B9" + (abs / 100000).toFixed(1) + "L";
  if (abs >= 1000) return sign + "\u20B9" + (abs / 1000).toFixed(1) + "K";
  return sign + "\u20B9" + abs.toFixed(0);
}

/** Format date for Indian locale */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Get Indian financial year string: FY 2025-26 */
export function getFY(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `FY ${startYear}-${(startYear + 1).toString().slice(-2)}`;
}

/** Generate initials from name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Generate a random ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
