import "reflect-metadata";

function mapFrom(mapFunc: (self: any) => any) {
  return Reflect.metadata("mapFrom", mapFunc);
}

namespace Mapper {
  const KnownMaps = {};

  export const AddMap = (key, map) => (KnownMaps[key] = map);
  export const PreformMap = (originalObject, target, mapKey): any => {
    const map = KnownMaps[mapKey];

    map.forEach(({ expression, key }) => {
      target[key] = expression(originalObject);
    });
    return target;
  };
}

class Point {
  public constructor() {
    this.x = 5;
    this.y = 3;
  }
  @mapFrom(x => "hello")
  x: number;
  y: number;
}
const p = new Point();

const mappable = ({ originalObject, target, mapKey }): any => something => {
  console.log(something);
  const expressions = [];

  for (const k of Reflect.ownKeys(target)) {
    const key = <string>k;
    let mapFrom: (self) => any = Reflect.getMetadata(
      "mapFrom",
      originalObject,
      key
    );

    if (!mapFrom) {
      const originalMap = self => (<any>self)[key];
      if (originalMap(originalObject) == undefined) {
        throw "Unmapped object";
      }
      mapFrom = originalMap;
    }
    expressions.push({ expression: mapFrom, key });
    // target[key] = mapFrom(originalObject);
  }
  Mapper.AddMap(mapKey, expressions);
};

interface Mapable {
  map?: () => void;
}

class Point3 {
  x: number = null;
  y: number = null;
  // z: number = undefined;
}

@mappable({
  originalObject: new Point2(),
  target: new Point3(),
  mapKey: "p2top3"
})
class Point2 {
  constructor() {
    this.x = 5;
    this.y = 7;
  }

  @mapFrom(self => self.x + 3)
  x: number;
  y: number;
  map: (original: any, target: any) => any;
}

const p2 = new Point2();
const result = Mapper.PreformMap({ x: 3, y: 15 }, new Point3(), "p2top3");
console.log(result);
