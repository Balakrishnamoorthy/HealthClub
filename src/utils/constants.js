export const COLORS = {
  emerald: "#00C896",
  emeraldDark: "#00A87D",
  emeraldLight: "#E6FFF8",
  navy: "#0A1628",
  navyMid: "#12213A",
  navyLight: "#1A2F4E",
  slate: "#8A9BB0",
  slateLight: "#C5CDD9",
  white: "#FFFFFF",
  offWhite: "#F7F9FC",
  danger: "#FF4D6D",
  warning: "#FFB547",
  info: "#3B9EFF",
  glucose: "#FF6B6B",
  pressure: "#4ECDC4",
  cholesterol: "#FFD93D",
};

export const PLANS = [
  {
    id: "basic",
    name: "Basic Care",
    price: 799,
    period: "mo",
    metrics: ["blood_glucose", "blood_pressure"],
    description: "Essential monitoring for everyday health",
    color: COLORS.pressure,
    features: ["Blood Glucose tracking", "Blood Pressure tracking", "Monthly reports", "HSA home visits"],
  },
  {
    id: "standard",
    name: "Standard Health",
    price: 1199,
    period: "mo",
    metrics: ["blood_glucose", "blood_pressure", "cholesterol"],
    description: "Complete health monitoring package",
    color: COLORS.emerald,
    popular: true,
    features: ["Blood Glucose tracking", "Blood Pressure tracking", "Cholesterol tracking", "Trend analytics", "Priority HSA"],
  },
  {
    id: "cholesterol",
    name: "Cholesterol Only",
    price: 499,
    period: "mo",
    metrics: ["cholesterol"],
    description: "Focused cholesterol management",
    color: COLORS.cholesterol,
    features: ["LDL/HDL/Total tracking", "Lipid ratio analysis", "Dietary guidance", "Monthly HSA visits"],
  },
];

export const DURATIONS = [
  { id: "3m", label: "3 Months", months: 3, discount: 0 },
  { id: "6m", label: "6 Months", months: 6, discount: 8 },
  { id: "1y", label: "1 Year", months: 12, discount: 18 },
];

export const INTERVALS = [
  { id: "weekly", label: "Weekly", days: 7, desc: "Once every week" },
  { id: "biweekly", label: "Bi-weekly", days: 15, desc: "Once every 15 days" },
  { id: "monthly", label: "Monthly", days: 30, desc: "Once per month" },
];

export const AREAS = ["AREA1", "AREA2", "AREA3", "AREA4"];

export const MOCK_REPORTS = [
  { date: "2025-01-06", glucose: 94, systolic: 118, diastolic: 76, cholesterol: 182, status: "normal" },
  { date: "2025-01-13", glucose: 98, systolic: 122, diastolic: 78, cholesterol: 188, status: "normal" },
  { date: "2025-01-20", glucose: 102, systolic: 126, diastolic: 80, cholesterol: 195, status: "attention" },
  { date: "2025-01-27", glucose: 96, systolic: 120, diastolic: 75, cholesterol: 183, status: "normal" },
  { date: "2025-02-03", glucose: 91, systolic: 116, diastolic: 74, cholesterol: 178, status: "normal" },
  { date: "2025-02-10", glucose: 99, systolic: 119, diastolic: 77, cholesterol: 186, status: "normal" },
];

export const MOCK_USERS = [
  { id: "U001", name: "Priya Sharma", phone: "+91 98765 43210", area: "AREA1", plan: "Standard Health", status: "active", nextVisit: "2025-02-17", hsa: "Ravi Kumar" },
  { id: "U002", name: "Arjun Mehta", phone: "+91 87654 32109", area: "AREA2", plan: "Basic Care", status: "active", nextVisit: "2025-02-18", hsa: "Meena R." },
  { id: "U003", name: "Lakshmi Nair", phone: "+91 76543 21098", area: "AREA3", plan: "Cholesterol Only", status: "pending", nextVisit: "2025-02-20", hsa: "Suresh G." },
  { id: "U004", name: "Vikram Rao", phone: "+91 65432 10987", area: "AREA4", plan: "Standard Health", status: "active", nextVisit: "2025-02-19", hsa: "Priya K." },
  { id: "U005", name: "Deepa Krishnan", phone: "+91 54321 09876", area: "AREA1", plan: "Basic Care", status: "expired", nextVisit: "—", hsa: "Ravi Kumar" },
];

export const MOCK_HSAS = [
  { id: "H001", name: "Ravi Kumar", area: "AREA1", users: 12, phone: "+91 99887 76655", status: "active" },
  { id: "H002", name: "Meena Rajesh", area: "AREA2", users: 8, phone: "+91 88776 65544", status: "active" },
  { id: "H003", name: "Suresh Gopi", area: "AREA3", users: 15, phone: "+91 77665 54433", status: "active" },
  { id: "H004", name: "Priya Kumari", area: "AREA4", users: 6, phone: "+91 66554 43322", status: "inactive" },
];

export const TESTIMONIALS = [
  { name: "Ananya S.", area: "AREA2", rating: 5, text: "HealthClub transformed how I manage my blood pressure. The weekly visits are incredibly convenient!", plan: "Basic Care" },
  { name: "Rajan M.", area: "AREA1", rating: 5, text: "Having my cholesterol tracked at home with professional HSA visits makes such a difference. Highly recommend!", plan: "Standard Health" },
  { name: "Shalini V.", area: "AREA3", rating: 5, text: "The trend charts help my doctor understand my progress. Best health investment I made this year.", plan: "Cholesterol Only" },
];
