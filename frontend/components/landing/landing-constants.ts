import {
  DatabaseIcon as Database,
  BroadcastIcon as Broadcast,
  CrosshairIcon as Crosshair,
  UsersThreeIcon as UsersThree,
  MagnifyingGlassIcon as MagnifyingGlass,
  FileTextIcon as FileText,
} from "@phosphor-icons/react";

export const ACCENT = "#00c8ff";

export const FEED_LINES = [
  { type: "SHA256", value: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2", src: "MB" },
  { type: "URL",    value: "http://malicious-c2.ru/payload/stage2.exe",               src: "UH" },
  { type: "MD5",    value: "5f4dcc3b5aa765d61d8327deb882cf99",                        src: "MB" },
  { type: "IP",     value: "185.220.101.47",                                           src: "UH" },
  { type: "SHA256", value: "e3b0c44298fc1c149afbf4c8996fb924...",                      src: "MB" },
  { type: "Domain", value: "cdn-update-service.xyz",                                   src: "UH" },
];

export const CYCLE_WORDS = ["Neutralize", "Attribute", "Report"];

export const MARQUEE_ITEMS = [
  "COBALT STRIKE", "SHA-256", "YARA RULES", "TLP:RED", "C2 FRAMEWORK",
  "MIMIKATZ", "APT29", "LAZARUS GROUP", "SIGMA RULES",
  "IOC TRACKING", "TTP MAPPING", "EMOTET", "QAKBOT",
  "MITRE ATT&CK", "MALWARE BAZAAR", "URLHAUS", "THREAT HUNTING",
];

export const CAPABILITIES = [
  {
    num: "01",
    title: "Live IOC Collection",
    Icon: Broadcast,
    desc: "WebSocket-powered streaming from MalwareBazaar, URLhaus, and FeodoTracker. Watch indicators appear in real time as they're pulled from active threat feeds.",
    tags: ["MalwareBazaar", "URLhaus", "FeodoTracker", "WebSocket"],
    showPreview: true,
  },
  {
    num: "02",
    title: "MITRE ATT&CK Mapping",
    Icon: Crosshair,
    desc: "Map adversary techniques to the MITRE ATT&CK framework. Search TTPs by ID or keyword and attach them directly to campaigns.",
    tags: ["500+ Techniques", "TTP Search", "Campaign Enrichment"],
    showPreview: false,
  },
  {
    num: "03",
    title: "Campaign Tracking",
    Icon: UsersThree,
    desc: "Group IOCs into adversary campaigns. Track threat actors, motivations, and link associated TTPs for full situational awareness.",
    tags: ["Threat Actors", "Motivation", "Status Tracking"],
    showPreview: false,
  },
  {
    num: "04",
    title: "Intelligence Reports",
    Icon: FileText,
    desc: "TLP-classified tactical and flash reports with executive summaries, IOC blocklists, and defensive recommendations.",
    tags: ["TLP WHITE", "TLP GREEN", "TLP AMBER", "TLP RED"],
    showPreview: false,
  },
];

export const STEPS = [
  {
    num: "01",
    title: "Collect",
    Icon: Database,
    desc: "Pull IOCs from live threat feeds via WebSocket. MalwareBazaar samples, URLhaus malicious URLs, and FeodoTracker C2 IPs stream directly into your local database in real time.",
  },
  {
    num: "02",
    title: "Analyze",
    Icon: MagnifyingGlass,
    desc: "Auto-classify indicators, suggest campaign groupings based on shared malware families, and map techniques to MITRE ATT&CK.",
  },
  {
    num: "03",
    title: "Report",
    Icon: FileText,
    desc: "Generate TLP-classified intelligence: tactical reports with executive summaries, blocklists, and defensive recommendations.",
  },
];

export const SOURCES = [
  {
    abbr: "MB",
    name: "MalwareBazaar",
    color: "#00c8ff",
    status: "Active",
    desc: "Hash-based IOCs. SHA256, MD5, and SHA1 from daily malware sample submissions.",
  },
  {
    abbr: "UH",
    name: "URLhaus",
    color: "#ff6b35",
    status: "Active",
    desc: "Malicious URLs and domains from community-submitted threat intelligence reports.",
  },
  {
    abbr: "FT",
    name: "FeodoTracker",
    color: "#ef4444",
    status: "Active",
    desc: "C2 botnet IP addresses linked to Emotet, Qakbot, and other banking trojans.",
  },
];

export const STATS = [
  { value: "6",   suffix: "",  label: "IOC Types" },
  { value: "500", suffix: "+", label: "MITRE TTPs" },
  { value: "3",   suffix: "",  label: "Threat Feeds" },
  { value: "4",   suffix: "",  label: "TLP Levels" },
];
