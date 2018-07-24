import "reflect-metadata";

import { MapFrom, mappable, Mapper, Ignore, UseValue, MapKeys } from "./Mapper";

class Point {
  public constructor() {
    this.x = 5;
    this.y = 3;
  }
  @MapFrom(x => "hello")
  x: number;
  y: number;
}
const p = new Point();

class Point3 {
  x: number = null;
  y: number = null;
  @Ignore() z: number = undefined;
  @UseValue("hello") q: string = undefined;
}

@mappable({
  origin: new Point2(),
  targetCtor: () => new Point3(),
  mapKey: MapKeys.P2ToP3
})
class Point2 {
  constructor() {
    this.x = 5;
    this.y = 7;
  }

  @MapFrom(self => self.x + 3)
  x: number;
  y: number;
}

const p2 = new Point2();
const result = Mapper.PreformMap(MapKeys.P2ToP3, { x: 3, y: 15 });
console.log(result);
