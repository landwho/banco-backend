const jwt = require('jsonwebtoken');

const secretKey = 'secretkey'; // Cambia esto por una clave secreta segura

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: '1h'});
};



const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error('Token inválido');
  }
};
  
module.exports = { 
  generateToken, 
  verifyToken };