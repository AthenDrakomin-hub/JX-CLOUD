// Mock postgres module for client-side builds
export default {};

// Export common postgres functionality that might be expected
export const Client = class {
  constructor() {
    throw new Error('postgres.Client is not available in client-side builds. This is a server-side only module.');
  }
};