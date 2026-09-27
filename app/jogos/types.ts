export type ContributionMode = "PER_GAME" | "MONTHLY";

export interface ContributionSettings {
  mode: ContributionMode;
  monthlyContributionPerDirector: number;
}

export interface Game {
  id: string;
  date: string;
  location?: string | null;
  opponent?: string | null;
  status: "ABERTO" | "FECHADO";
  expectedContributionPerDirector: number;
}

export type GameFormState = {
  location: string;
  opponent: string;
  status: Game["status"];
  expectedContributionPerDirector: string;
};

export const initialGameForm: GameFormState = {
  location: "",
  opponent: "",
  status: "ABERTO",
  expectedContributionPerDirector: "70",
};
