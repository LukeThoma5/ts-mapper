import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapKey } from "./MapKeys";
import { IMappingExpression, Mapper } from "./Mapper";
import { keyOfOriginAndTarget } from "./Utils";

export interface IUseMap<TO> {
  mapKey: ValidMapKey;
  originSelector?: (origin: TO) => any;
}
export function UseMap<TO>(
  mapKey: ValidMapKey,
  originSelector?: (origin: TO) => any
) {
  const map: IUseMap<TO> = { mapKey, originSelector };
  return Reflect.metadata(DecoratorTypes.UseMap, map);
}

export function AttemptUseMap<TO, TT>(
  origin: TO,
  target: TT,
  key: keyof TT,
  mapKey: ValidMapKey
): IMappingExpression<TO, TT> {
  const recursiveMapKey: IUseMap<TO> = Reflect.getMetadata(
    DecoratorTypes.UseMap,
    target,
    <string>key
  );

  const mapFactory = (originSelector: (origin: TO) => any) => (self: TO) => {
    const origin = originSelector(self);
    return origin ? Mapper.PreformMap(recursiveMapKey.mapKey, origin) : null;
  };

  if (recursiveMapKey && recursiveMapKey.originSelector) {
    return {
      expression: mapFactory(recursiveMapKey.originSelector),
      key
    };
  }

  if (keyOfOriginAndTarget(origin, key)) {
    if (recursiveMapKey) {
      return {
        expression: mapFactory(self => self[key]),
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
