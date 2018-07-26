import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapKey } from "./MapKeys";

export function MapFrom(mapFunc: (self: any) => any) {
  return Reflect.metadata(DecoratorTypes.MapFrom, mapFunc);
}

export type ValidMapFroms = {
  mapFunc: (self: any) => any;
  mapKey: ValidMapKey;
};

export function MapsFrom(maps: ValidMapFroms[]) {
  return Reflect.metadata(DecoratorTypes.MapFromMany, maps);
}
