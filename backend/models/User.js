/**
 * Mock User Model
 * In a real app, this would use MongoDB (Mongoose) or PostgreSQL (Sequelize).
 */
const users = [];

const User = {
  create: async (userData) => {
    // Default role is "user" if not provided
    const newUser = {
      role: "user",
      profile: { bio: "", website: "" },
      ...userData
    };
    users.push(newUser);
    return newUser;
  },
  findByEmail: async (email) => {
    return users.find(u => u.email === email);
  },
  findById: async (id) => {
    return users.find(u => u.id === id);
  },
  findAll: async () => {
    // Return users without passwords
    return users.map(({ password, ...user }) => user);
  },
  updateProfile: async (id, profileData) => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    users[userIndex].profile = {
      ...users[userIndex].profile,
      ...profileData
    };
    return users[userIndex];
  }
};

module.exports = User;
