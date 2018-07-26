export class MapKey {
  P2ToP3: "P2ToP3" = "P2ToP3";
  P1ToP3: "P1ToP3" = "P1ToP3";
  YTOJ: "YTOJ" = "YTOJ";
  XTOZ: "XTOZ" = "XTOZ";
}

export const MapKeys = new MapKey();
export type ValidMapKey = keyof typeof MapKeys;
