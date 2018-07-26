import "reflect-metadata";

const DecoratorTypes = {
  MapFrom: "MapFrom",
  Ignore: "Ignore",
  UseValue: "UseValue",
  UseMap: "UseMap"
};

class MapKey {
  P2ToP3: "P2ToP3" = "P2ToP3";
  P1ToP3: "P1ToP3" = "P1ToP3";
  YTOJ: "YTOJ" = "YTOJ";
  XTOZ: "XTOZ" = "XTOZ";
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
interface IUseMap {
  mapKey: ValidMapKey;
  originSelector?: (origin) => any;
}
export function UseMap(mapKey: ValidMapKey, originSelector?: (origin) => any) {
  const map: IUseMap = { mapKey, originSelector };
  return Reflect.metadata(DecoratorTypes.UseMap, map);
}

interface IMappable<TO, TT extends object> {
  origin: TO;
  targetCtor?: () => TT;
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
}: IMappable<TO, TT>): ((
  defaultTargetCtor: { new (): TT }
) => void) => defaultTargetCtor => {
  const expressions: IMappingExpression<TO, TT>[] = [];
  const targetConstructor = targetCtor || (() => new defaultTargetCtor());
  const target: TT = targetConstructor();

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
      target,
      <string>key
    );

    if (mapFrom) {
      expressions.push({ expression: mapFrom, key });
      continue;
    }

    const recursiveMapKey = Reflect.getMetadata(DecoratorTypes.UseMap, target, <
      string
    >key) as IUseMap;

    if (recursiveMapKey && recursiveMapKey.originSelector) {
      expressions.push({
        expression: (self: TO) =>
          Mapper.PreformMap(
            recursiveMapKey.mapKey,
            recursiveMapKey.originSelector(self)
          ),
        key
      });
      continue;
    }

    if (keyOfOriginAndTarget(origin, key)) {
      if (recursiveMapKey) {
        expressions.push({
          expression: (self: TO) =>
            Mapper.PreformMap(recursiveMapKey.mapKey, self[key]),
          key
        });
      } else {
        expressions.push({ expression: (self: TO) => self[key], key });
      }
      continue;
    }

    throw `unmapped expression ${key}`;
  }
  Mapper.AddMap(mapKey, expressions, targetConstructor);
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
