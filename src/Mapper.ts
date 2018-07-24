import "reflect-metadata";
export function MapFrom(mapFunc: (self: any) => any) {
  return Reflect.metadata("mapFrom", mapFunc);
}

export function Ignore() {
  return Reflect.metadata("ignore", true);
}

export function UseValue(value) {
  return Reflect.metadata("useValue", value);
}

interface IMappable<TO, TT> {
  origin: TO;
  targetCtor: () => TT;
  mapKey: string;
}
export const mappable = <TO, TT extends object>({
  origin,
  targetCtor,
  mapKey
}: IMappable<TO, TT>): any => something => {
  const expressions = [];
  const target = targetCtor();

  for (const k of Reflect.ownKeys(target)) {
    const key = <string>k;
    if (Reflect.getMetadata("ignore", target, key)) continue;

    const useValue = Reflect.getMetadata("useValue", target, key);

    if (useValue != undefined) {
      expressions.push({ expression: self => useValue, key });
      continue;
    }

    let mapFrom: (self) => any = Reflect.getMetadata("mapFrom", origin, key);

    if (!mapFrom) {
      const originalMap = self => (<any>self)[key];
      if (originalMap(origin) == undefined) {
        throw "Unmapped object";
      }
      mapFrom = originalMap;
    }
    expressions.push({ expression: mapFrom, key });
  }
  Mapper.AddMap(mapKey, expressions, targetCtor);
};

export namespace Mapper {
  const KnownMaps = {};

  export const AddMap = (key, expressions, targetCtor) =>
    (KnownMaps[key] = { expressions, targetCtor });
  export const PreformMap = (
    mapKey,
    originalObject,
    target = undefined
  ): any => {
    const map = KnownMaps[mapKey];
    if (target == undefined) target = map.targetCtor();

    map.expressions.forEach(({ expression, key }) => {
      target[key] = expression(originalObject);
    });
    return target;
  };
}
