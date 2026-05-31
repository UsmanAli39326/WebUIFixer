/**
 * Mock Template Store for Marketplace
 */
const templates = [];

const Template = {
  create: async (templateData) => {
    const newTemplate = {
      id: Date.now().toString(),
      createdAt: new Date(),
      ...templateData
    };
    templates.push(newTemplate);
    return newTemplate;
  },
  findById: async (id) => {
    return templates.find(t => t.id === id);
  },
  findAllApproved: async () => {
    return templates.filter(t => t.status === "approved");
  },
  findAll: async () => {
    return templates;
  }
};

module.exports = Template;
