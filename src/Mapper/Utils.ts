export const keyOfOriginAndTarget = <TO, TT>(
  origin: TO,
  key: any
): key is keyof TO => {
  return key in origin;
};
