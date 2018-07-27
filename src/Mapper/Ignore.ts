import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapKey } from "./MapKeys";
import { IMappingExpression } from "./Mapper";

export function Ignore() {
  return Reflect.metadata(DecoratorTypes.Ignore, true);
}

export const isIgnored = <TT>(target: TT, key: keyof TT): boolean =>
  Reflect.getMetadata(DecoratorTypes.Ignore, target, <string>key);
