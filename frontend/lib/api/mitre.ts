import { BASE } from "./constants";
import { authHeaders } from "./auth";

export interface MitreTactic {
  id: string;
  label: string;
  shortname: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactics: string[];
}

export interface MitreData {
  tactics: Record<string, MitreTactic>;
  techniques: MitreTechnique[];
}

export async function fetchMitreData(): Promise<MitreData> {
  const r = await fetch(`${BASE}/api/mitre/techniques`, { headers: authHeaders() });
  if (!r.ok) throw new Error("Failed to fetch MITRE ATT&CK data");
  return r.json();
}
