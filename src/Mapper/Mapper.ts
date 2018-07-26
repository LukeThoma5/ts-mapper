import "reflect-metadata";
import { MapKeys, ValidMapKey } from "./MapKeys";

import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapFroms } from "./MapFrom";

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
  originCtor: () => TO;
  targetCtor?: () => TT;
  mapKey: ValidMapKey;
}

interface IStoredMappable<TO, TT extends object> extends IMappable<TO, TT> {
  defaultTargetCtor: { new (): TT };
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
  originCtor,
  targetCtor,
  mapKey
}: IMappable<TO, TT>): ((
  defaultTargetCtor: { new (): TT }
) => void) => defaultTargetCtor => {
  Mapper.DefineMap({ originCtor, targetCtor, mapKey, defaultTargetCtor });
};

export namespace Mapper {
  type KnownMapsMap = {
    expressions: IMappingExpression<any, any>[];
    targetCtor: () => any;
  };
  type KnownMapsType = { [key in ValidMapKey]: KnownMapsMap };
  type DefinedMapsType = { [key in ValidMapKey]: IStoredMappable<any, any> };

  const KnownMaps = {} as KnownMapsType;
  const DefinedMap = {} as DefinedMapsType;

  export const DefineMap = <TO, TT extends object>(
    map: IStoredMappable<TO, TT>
  ) => {
    DefinedMap[map.mapKey] = map;
  };

  export const CreateMappingExpression = <TO, TT extends object>(
    validMapKey: ValidMapKey
  ) => {
    const { defaultTargetCtor, mapKey, originCtor, targetCtor } = DefinedMap[
      validMapKey
    ];
    const expressions: IMappingExpression<TO, TT>[] = [];
    const targetConstructor = targetCtor || (() => new defaultTargetCtor());
    const target: TT = targetConstructor();
    const origin: TO = originCtor();

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

      let mapsFrom: ValidMapFroms[] = Reflect.getMetadata(
        DecoratorTypes.MapFromMany,
        target,
        <string>key
      );

      if (mapsFrom) {
        const manyMapFrom = mapsFrom.find(m => m.mapKey == mapKey);
        if (manyMapFrom) {
          expressions.push({ expression: manyMapFrom.mapFunc, key });
          continue;
        }
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

      const recursiveMapKey: IUseMap = Reflect.getMetadata(
        DecoratorTypes.UseMap,
        target,
        <string>key
      );

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
    let map = KnownMaps[mapKey];
    if (!map) {
      // If the map hasn't been initialised
      Mapper.CreateMappingExpression(mapKey);
      map = KnownMaps[mapKey];

      if (!map) {
        throw `No map exists for key ${mapKey}`;
      }
    }
    if (target == undefined) target = map.targetCtor();

    map.expressions.forEach(({ expression, key }) => {
      target[key] = expression(originalObject);
    });
    return target;
  };
}
