export type PlanId = "basic" | "standard" | "premium";

export const PLANS: Record<PlanId, { name: string; price: number; orderLimit: number | null; features: string[] }> = {
  basic: {
    name: "Basic",
    price: 100,
    orderLimit: 150,
    features: ["Up to 150 orders / month", "QR + link ordering", "Email support"],
  },
  standard: {
    name: "Standard",
    price: 250,
    orderLimit: 500,
    features: ["Up to 500 orders / month", "QR + link ordering", "Priority support"],
  },
  premium: {
    name: "Premium",
    price: 500,
    orderLimit: null,
    features: ["Unlimited orders", "QR + link ordering", "Priority support"],
  },
};

export function isPlanId(value: string): value is PlanId {
  return value === "basic" || value === "standard" || value === "premium";
}
