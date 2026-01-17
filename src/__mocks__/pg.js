// Mock pg module for client-side builds
export const Pool = class {
  constructor() {
    throw new Error('pg.Pool is not available in client-side builds. This is a server-side only module.');
  }
};

export default {
  Pool
};