import type { AtlasDailyState } from "../domain/types";

export interface AtlasDailyRepository {
  load(): Promise<AtlasDailyState | null>;
  save(state: AtlasDailyState): Promise<void>;
  clear(): Promise<void>;
}
