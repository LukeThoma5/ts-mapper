import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapKey } from "./MapKeys";
import { IMappingExpression } from "./Mapper";

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

export function AttemptMapFrom<TO, TT>(
  target: TT,
  key: keyof TT,
  mapKey: ValidMapKey
): IMappingExpression<TO, TT> {
  let mapsFrom: ValidMapFroms[] = Reflect.getMetadata(
    DecoratorTypes.MapFromMany,
    target,
    <string>key
  );

  if (mapsFrom) {
    const manyMapFrom = mapsFrom.find(m => m.mapKey == mapKey);
    if (manyMapFrom) {
      return { expression: manyMapFrom.mapFunc, key };
    }
  }

  let mapFrom: (self: TO) => any = Reflect.getMetadata(
    DecoratorTypes.MapFrom,
    target,
    <string>key
  );

  if (mapFrom) {
    return { expression: mapFrom, key };
  }
  return null;
}
