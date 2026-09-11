require("dotenv").config();
const connectDB = require("./config/db");
const Lead = require("./models/Lead");
const Keyword = require("./models/Keyword");

const leads = [
  {
    name: "Marcus Vance",
    title: "VP of Sales",
    company: "CloudScale",
    avatarInitials: "MV",
    avatarColor: "bg-blue-600",
    commentSnippet: "Looking for a reliable dev...",
    intentTier: "High Intent",
    intentTag: "DM Requested",
    matchScore: 98,
    status: "New",
    sourcePost: "Scale ARR to $10M",
  },
  {
    name: "Elena Rostova",
    title: "Founder & CEO",
    company: "FinEdge AI",
    avatarInitials: "ER",
    avatarColor: "bg-slate-500",
    commentSnippet: "Super interested in...",
    intentTier: "High Intent",
    intentTag: "Pricing Inquiry",
    matchScore: 94,
    status: "Contacted",
    contactedBy: "Sarah",
    sourcePost: "Scale ARR to $10M",
  },
  {
    name: "David Chen",
    title: "Head of Growth",
    company: "HyperLeap",
    avatarInitials: "DC",
    avatarColor: "bg-emerald-700",
    commentSnippet: "Can you send the whitepaper...",
    intentTier: "Medium Intent",
    intentTag: "Asset Request",
    matchScore: 89,
    status: "Converted",
    dealValue: 4050,
    sourcePost: "Scale ARR to $10M",
  },
  {
    name: "Sophie Martin",
    title: "Operations Lead",
    company: "ScaleOps",
    avatarInitials: "SM",
    avatarColor: "bg-slate-700",
    commentSnippet: "We are desperately...",
    intentTier: "High Intent",
    intentTag: "Hiring Devs",
    matchScore: 96,
    status: "New",
    sourcePost: "Scale ARR to $10M",
  },
  {
    name: "Alexandre Moreau",
    title: "CTO",
    company: "DataPulse",
    avatarInitials: "AM",
    avatarColor: "bg-slate-900",
    commentSnippet: "Interesting approach to...",
    intentTier: "High Intent",
    intentTag: "Meeting Requested",
    matchScore: 92,
    status: "Contacted",
    sourcePost: "Scale ARR to $10M",
  },
];

const keywords = [
  { term: "interested", matchCount: 14 },
  { term: "price", matchCount: 9 },
  { term: "DM me", matchCount: 22 },
  { term: "looking for dev", matchCount: 7 },
  { term: "cost", matchCount: 5 },
  { term: "demo", matchCount: 11 },
  { term: "evaluating vendors", matchCount: 2 },
];

const run = async () => {
  await connectDB();
  await Lead.deleteMany({});
  await Keyword.deleteMany({});
  await Lead.insertMany(leads);
  await Keyword.insertMany(keywords);
  console.log("Seed data inserted");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
