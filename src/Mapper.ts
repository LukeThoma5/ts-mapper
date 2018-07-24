import "reflect-metadata";

const DecoratorTypes = {
  MapFrom: "MapFrom",
  Ignore: "Ignore",
  UseValue: "UseValue"
};

class MapKey {
  P2ToP3: "P2ToP3" = "P2ToP3";
}

export const MapKeys = new MapKey();

type ValidMapKey = keyof typeof MapKeys;

export function MapFrom(mapFunc: (self: any) => any) {
  return Reflect.metadata(DecoratorTypes.MapFrom, mapFunc);
}

export function Ignore() {
  return Reflect.metadata(DecoratorTypes.Ignore, true);
}

export function UseValue(value) {
  return Reflect.metadata(DecoratorTypes.UseValue, value);
}

interface IMappable<TO, TT extends object> {
  origin: TO;
  targetCtor: () => TT;
  mapKey: ValidMapKey;
}

interface IMappingExpression<TO, TT> {
  expression: (self: TO) => any;
  key: keyof TT;
}

const isIgnored = <TT>(target: TT, key: keyof TT): boolean =>
  Reflect.getMetadata(DecoratorTypes.Ignore, target, <string>key);

const keyOfOriginAndTarget = <TO, TT>(
  origin: TO,
  key: any
): key is keyof TO => {
  return key in origin;
};

export const mappable = <TO, TT extends object>({
  origin,
  targetCtor,
  mapKey
}: IMappable<TO, TT>): ((originCtor: any) => void) => originCtor => {
  const expressions: IMappingExpression<TO, TT>[] = [];
  const target: TT = targetCtor();

  for (const k of Reflect.ownKeys(target)) {
    const key = k as keyof TT;
    if (isIgnored(target, key)) continue;

    const useValue = Reflect.getMetadata(DecoratorTypes.UseValue, target, <
      string
    >key);

    if (useValue != undefined) {
      expressions.push({ expression: (self: TO) => useValue, key });
      continue;
    }

    let mapFrom: (self: TO) => any = Reflect.getMetadata(
      DecoratorTypes.MapFrom,
      origin,
      <string>key
    );

    if (mapFrom) {
      expressions.push({ expression: mapFrom, key });
      continue;
    }

    if (keyOfOriginAndTarget(origin, key)) {
      expressions.push({ expression: (self: TO) => self[key], key });
      continue;
    }

    throw "unmapped expression";
  }
  Mapper.AddMap(mapKey, expressions, targetCtor);
};

export namespace Mapper {
  type KnownMapsMap = {
    expressions: IMappingExpression<any, any>[];
    targetCtor: () => any;
  };
  type KnownMapsType = { [key in ValidMapKey]: KnownMapsMap };

  const KnownMaps = {} as KnownMapsType;

  export const AddMap = <TO, TT>(
    key: ValidMapKey,
    expressions: IMappingExpression<TO, TT>[],
    targetCtor: () => TT
  ) => (KnownMaps[key] = { expressions, targetCtor });

  export const PreformMap = <TO, TT>(
    mapKey: ValidMapKey,
    originalObject: TO,
    target: TT = undefined
  ): TT => {
    const map = KnownMaps[mapKey];
    if (target == undefined) target = map.targetCtor();

    map.expressions.forEach(({ expression, key }) => {
      target[key] = expression(originalObject);
    });
    return target;
  };
}
