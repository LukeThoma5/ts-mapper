import { DecoratorTypes } from "./DecoratorTypes";
import { ValidMapKey } from "./MapKeys";
import { IMappingExpression } from "./Mapper";

export function UseValue(value) {
  return Reflect.metadata(DecoratorTypes.UseValue, value);
}

export function AttemptUseValue<TO, TT>(
  origin: TO,
  target: TT,
  key: keyof TT,
  mapKey: ValidMapKey
): IMappingExpression<TO, TT> {
  const useValue = Reflect.getMetadata(DecoratorTypes.UseValue, target, <
    string
  >key);

  if (useValue != undefined) {
    return { expression: (self: TO) => useValue, key };
  }
  return null;
}
