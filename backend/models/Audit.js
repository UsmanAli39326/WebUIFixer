/**
 * Mock Audit Store
 */
const audits = new Map();

const AuditStore = {
  save: (id, data) => {
    audits.set(id, { ...data, id, timestamp: new Date() });
    return id;
  },
  get: (id) => {
    return audits.get(id);
  }
};

module.exports = AuditStore;
