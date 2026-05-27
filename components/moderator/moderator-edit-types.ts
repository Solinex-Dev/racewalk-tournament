export type EditRoundOption = { id: string; name: string; status: string };

export type EditAthlete = {
  id: string;
  bib: string;
  name: string;
  status: "OK" | "DQ" | "DNF";
  position: number | null;
};

export type EditCard = {
  id: string;
  athleteId: string;
  athleteName: string;
  bib: string;
  judgeName: string;
  color: "YELLOW" | "RED";
  symbol: "BENT_KNEE" | "LIFTED_FOOT";
  state: "PENDING" | "CONFIRMED" | "OVERRIDDEN" | null;
  issuedAt: string;
};

export type EditLap = {
  id: string;
  athleteId: string;
  athleteName: string;
  bib: string;
  lapNumber: number;
  timeMs: number;
};

export type EditFinish = {
  id: string;
  athleteId: string;
  athleteName: string;
  bib: string;
  timeMs: number;
  position: number;
};
