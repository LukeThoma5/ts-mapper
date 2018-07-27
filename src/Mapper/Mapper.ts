import "reflect-metadata";
import { MapKeys, ValidMapKey } from "./MapKeys";

import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapFroms, AttemptMapFrom } from "./MapFrom";
import { AttemptUseValue } from "./UseValue";
import { AttemptAutoMap, AttemptUseMap } from "./UseMap";
import { isIgnored } from "./Ignore";

interface IMappable<TO, TT extends object> {
  origin: () => TO;
  targetCtor?: () => TT;
  mapKey: ValidMapKey;
}

interface IStoredMappable<TO, TT extends object> extends IMappable<TO, TT> {
  defaultTargetCtor: { new (): TT };
}

export interface IMappingExpression<TO, TT> {
  expression: (self: TO) => any;
  key: keyof TT;
}

export const Mappable = <TO, TT extends object>({
  origin,
  targetCtor,
  mapKey
}: IMappable<TO, TT>): ((
  defaultTargetCtor: { new (): TT }
) => void) => defaultTargetCtor => {
  Mapper.DefineMap({ origin, targetCtor, mapKey, defaultTargetCtor });
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
    const { defaultTargetCtor, mapKey, origin, targetCtor } = DefinedMap[
      validMapKey
    ];
    const expressions: IMappingExpression<TO, TT>[] = [];
    const targetConstructor = targetCtor || (() => new defaultTargetCtor());
    const target: TT = targetConstructor();
    const originInstance: TO = origin();

    keyLoop: for (const k of Reflect.ownKeys(target)) {
      const key = k as keyof TT;
      if (isIgnored(target, key)) continue;
      const mappingExpressions = [
        AttemptUseValue,
        AttemptMapFrom,
        AttemptUseMap,
        AttemptAutoMap
      ];
      for (const mappingExpression of mappingExpressions) {
        let expression = mappingExpression(originInstance, target, key, mapKey);
        if (expression) {
          expressions.push(expression);
          continue keyLoop;
        }
      }

      throw `unmapped expression ${mapKey} ${key}`;
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
    origin: TO,
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
      target[key] = expression(origin);
    });
    return target;
  };
}
