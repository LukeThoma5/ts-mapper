import "reflect-metadata";

import { MapFrom, mappable, Mapper, Ignore, UseValue, MapKeys } from "./Mapper";

class Point2 {
  constructor() {
    this.x = 5;
    this.y = 7;
  }
  x: number;
  y: number;
}

@mappable({
  origin: new Point2(),
  targetCtor: () => new Point3(),
  mapKey: MapKeys.P2ToP3
})
class Point3 {
  @MapFrom(self => self.x + 300)
  x: number = null;
  y: number = null;
  @Ignore() z: number = undefined;
  @UseValue("hello") q: string = undefined;
}

@mappable({
  origin: new Point2(),
  mapKey: MapKeys.P1ToP3
})
class Point {
  public constructor() {
    this.x = 5;
  }

  x: number;
  @Ignore() someFunc = () => "hello";
}

const p2 = new Point2();
const result = Mapper.PreformMap(MapKeys.P2ToP3, { x: 3, y: 15 });
console.log(result);

// const p = new Point();
const resultOne = Mapper.PreformMap(MapKeys.P1ToP3, { x: 3, y: 15 });
console.log(resultOne);
