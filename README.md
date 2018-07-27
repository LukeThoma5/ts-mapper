# **TS-Mapper**

### Project Structure

- index.ts - Testing ground for mapping
- /Mapper - All files related to mapping
  - Contains decorators, Expression Builder and utils

### Getting started

Install all dependencies and start webpack in watch mode.

```
npm install
npm start
```

## Example Definition

```typescript
// Classes to be mapped from
class X {
  x: number = null;
  y: Y = null;
}
// Inner class to be automapped
class Y {
  field: string = null;
}

// Class that will be mapped to from Y
@Mappable({
  origin: () => new Y(),
  mapKey: MapKeys.YTOJ
})
class J {
  field: string = null;
}

// Class that will be mapped to from X
@Mappable({
  origin: () => new X(),
  mapKey: MapKeys.XTOZ
})
class Z {
  // Default for all maps, map directly to the number 20
  @MapFrom(self => 20)
  // Override the default specifically for the XtoZ map
  // Add 10 instead
  @MapsFrom([
    {
      mapFunc: self => self.x + 10,
      mapKey: MapKeys.XTOZ
    }
  ])
  x: number = null;

  // Map from X.y to Z.j using the specified map.
  @UseMap(MapKeys.YTOJ, (o: X) => o.y)
  j: J = null;

  @Ignore() // Ignores the value when mapping
  z: number = 7;

  // Use the specified value rather than the mapping from the origin
  @UseValue("Hello world!") k: string = null;
}
```

### Example use

```typescript
const newZ = Mapper.PreformMap(MapKeys.XTOZ, {
  x: 5,
  y: { field: "some field" }
});
```

#### Features

- Automap same properties
- Ignore properties eg functions
- Use a value while mapping
- Custom mapping function (mapFrom)
- Recursive mapping
- Lazy expression creation (on first use)

### Wishlist

- Less boilerplate for MapKeys
- Plural versions of more decorators for finer control
