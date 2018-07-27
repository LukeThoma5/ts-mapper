import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapKey } from "./MapKeys";
import { IMappingExpression, Mapper } from "./Mapper";
import { keyOfOriginAndTarget } from "./Utils";

export interface IUseMap {
  mapKey: ValidMapKey;
  originSelector?: (origin) => any;
}
export function UseMap(mapKey: ValidMapKey, originSelector?: (origin) => any) {
  const map: IUseMap = { mapKey, originSelector };
  return Reflect.metadata(DecoratorTypes.UseMap, map);
}

export function AttemptUseMap<TO, TT>(
  origin: TO,
  target: TT,
  key: keyof TT,
  mapKey: ValidMapKey
): IMappingExpression<TO, TT> {
  const recursiveMapKey: IUseMap = Reflect.getMetadata(
    DecoratorTypes.UseMap,
    target,
    <string>key
  );

  if (recursiveMapKey && recursiveMapKey.originSelector) {
    return {
      expression: (self: TO) =>
        Mapper.PreformMap(
          recursiveMapKey.mapKey,
          recursiveMapKey.originSelector(self)
        ),
      key
    };
  }

  if (keyOfOriginAndTarget(origin, key)) {
    if (recursiveMapKey) {
      return {
        expression: (self: TO) =>
          Mapper.PreformMap(recursiveMapKey.mapKey, self[key]),
        key
      };
    }
    return null;
  }
}

export function AttemptAutoMap<TO, TT>(
  origin: TO,
  target: TT,
  key: keyof TT,
  mapKey: ValidMapKey
): IMappingExpression<TO, TT> {
  if (keyOfOriginAndTarget(origin, key)) {
    return { expression: (self: TO) => self[key], key };
  }
  return null;
}
