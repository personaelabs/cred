export const shouldDenyOperation = (fn: () => Promise<any>) => {
  expect(async () => {
    try {
      await fn();
    } catch (err: any) {
      throw new Error(err.code);
    }
  }).rejects.toThrow('permission-denied');
};
