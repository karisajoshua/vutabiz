export interface CourierPartner {
  id: string;
  name: string;
  estimatedDelivery: string;
  baseRateKsh: number;
  perKgKsh: number;
  coverage: string;
  trackingUrlTemplate?: string;
  icon: string;
}

export const KENYA_COURIERS: CourierPartner[] = [
  {
    id: "fargo",
    name: "Fargo Courier",
    estimatedDelivery: "24-48 hours",
    baseRateKsh: 350,
    perKgKsh: 40,
    coverage: "Nationwide (Over 100+ branches)",
    trackingUrlTemplate: "https://www.fargocourier.co.ke/tracking?waybill=",
    icon: "Truck",
  },
  {
    id: "g4s",
    name: "G4S Secure Courier",
    estimatedDelivery: "24-48 hours",
    baseRateKsh: 400,
    perKgKsh: 50,
    coverage: "All 47 Counties & Remote centers",
    trackingUrlTemplate: "https://www.g4s.com/en-ke/tracking?ref=",
    icon: "ShieldCheck",
  },
  {
    id: "wellsfargo",
    name: "Wells Fargo Courier",
    estimatedDelivery: "24-36 hours",
    baseRateKsh: 380,
    perKgKsh: 45,
    coverage: "Major towns & county headquarters",
    icon: "Package",
  },
  {
    id: "speedaf",
    name: "Speedaf Express",
    estimatedDelivery: "1-3 days",
    baseRateKsh: 280,
    perKgKsh: 30,
    coverage: "Nairobi, Mombasa, Kisumu, Nakuru, Eldoret",
    icon: "Zap",
  },
  {
    id: "boda",
    name: "Local Rider / Boda Boda",
    estimatedDelivery: "Same-day (1-4 hours)",
    baseRateKsh: 200,
    perKgKsh: 0,
    coverage: "Same-town / Intracounty only",
    icon: "Bike",
  },
];

export function calculateEstimatedDeliveryFee(
  courierId: string,
  _weightKg: number = 2,
  isInterCounty: boolean = false
): number {
  const courier = KENYA_COURIERS.find((c) => c.id === courierId) ?? KENYA_COURIERS[0];
  const fee = courier.baseRateKsh + (isInterCounty ? 150 : 0);
  return fee;
}

export function generateTrackingNumber(courierId: string): string {
  const prefix = courierId.slice(0, 3).toUpperCase();
  const randNum = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-KE-${randNum}`;
}

export interface TrackingCheckpoint {
  status: "pending" | "shipped" | "in_transit" | "delivered";
  label: string;
  description: string;
  date: string;
}

export function getTrackingTimeline(
  courierName: string,
  _deliveryStatus: string,
  createdAt: string
): TrackingCheckpoint[] {
  const createdDate = new Date(createdAt);
  const formatDate = (offsetHours: number) => {
    const d = new Date(createdDate.getTime() + offsetHours * 3600 * 1000);
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const steps: TrackingCheckpoint[] = [
    {
      status: "pending",
      label: "Order Placed & Escrow Funded",
      description: "Buyer funds secured in platform escrow.",
      date: formatDate(0),
    },
    {
      status: "shipped",
      label: "Dispatched to Courier",
      description: `Seller dropped package at ${courierName}.`,
      date: formatDate(6),
    },
    {
      status: "in_transit",
      label: "In Transit",
      description: "Package is en route to destination sorting hub.",
      date: formatDate(18),
    },
    {
      status: "delivered",
      label: "Out for Delivery & Received",
      description: "Buyer inspected item and confirmed delivery.",
      date: formatDate(30),
    },
  ];

  return steps;
}
