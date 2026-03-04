const bcrypt = {
  hash: jest.fn().mockImplementation((password) => {
    return Promise.resolve(`hashed_${password}`);
  }),
  compare: jest.fn().mockImplementation((password, hash) => {
    const originalPassword = hash.replace("hashed_", "");
    return Promise.resolve(password === originalPassword);
  }),
  genSalt: jest.fn().mockResolvedValue("salt"),
};

export default bcrypt;
