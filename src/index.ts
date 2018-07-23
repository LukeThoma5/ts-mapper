import "reflect-metadata";


const formatMetadataKey = "format:x";



function mapFrom(mapFunc: (self: any) => any) {
    return Reflect.metadata("mapFrom", mapFunc);
}

class Point {
    public constructor()
    {
        this.x = 5;
        this.y = 3;
    }
    @mapFrom(x => "hello")
    x: number;
    y: number;
}
const p = new Point();

// function map(t: any): any {
//     t.prototype.map = (target) => {
//         const originalObject = this;
//         console.log(this, originalObject)
        
        
//         for (const k of Reflect.ownKeys(target))
//         {
//             const key = <string>k;
//             let mapFrom: (self) => any = (Reflect.getMetadata("mapFrom", originalObject, key));
//             const original = (<any>originalObject)[key];
//             if (original == undefined) {
//                 throw "Unmapped object";
//             }
//             if (!mapFrom) {
//                 mapFrom = (self) => original;
//             }
//             target[key] = mapFrom(originalObject);
//         }
//         return target;
//     };
// }

const map = <T extends {new(...args:any[]):{}}>(constructor:T) => {
    return class extends constructor {
        map = (target) => {
            for (const k of Reflect.ownKeys(target))
            {
                const key = <string>k;
                let mapFrom: (self) => any = (Reflect.getMetadata("mapFrom", this, key));
                const original = (<any>this)[key];
                if (original == undefined) {
                    throw "Unmapped object";
                }
                if (!mapFrom) {
                    mapFrom = (self) => original;
                }
                target[key] = mapFrom(this);
            }
            return target;
        };
    }
}

interface Mapable {
    map?: () => void;
}

@map
class Point2 {
    constructor() {
        this.x = 5;
        this.y = 7;
    }

    @mapFrom(self => self.x + 5)
    x: number;
    y: number;
    map: (target: any) => any;
}

class Point3 {
    x: number = null;
    y: number = null;
    // z: number = undefined;
}

// const test = {x: 3, y: 2};


const p2 = new Point2();
// console.log(Point2.prototype.map); console.log(Point2.prototype.map.bind(test))
// console.log("test result", Point2.prototype.map(new Point3()).bind(test)());

console.log(p2);
console.log(p2.map(new Point3()));

const blah = p2.x;

