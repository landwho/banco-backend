const jwt = require('jsonwebtoken');
const secretKey = "secretkey";  
const db = require('../database/conexion');

// const authenticate = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'No se proporcionó un token o el formato es incorrecto' });
//     }
//     const token = authHeader.split(' ')[1];
//     if (!token) {
//         return res.status(401).json({ 
//             code:401,
//             message: 'No se proporcionó un token'
//          });
//     }
//     try {
//         const decoded = jwt.verify(token, secretKey);
//         req.user = decoded;  
//         next();  
//     } catch (error) {
//         res.status(401).json({ 
//             code:401,
//             message: 'Acceso no autorizado' 
//         });
//     }
// };

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No se proporcionó un token o el formato es incorrecto' });
    }
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            code: 401,
            message: 'No se proporcionó un token'
         });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        const checkTokenQuery = `SELECT status FROM tokens WHERE token = ? AND usuario_id = ?`;

        db.query(checkTokenQuery, [token, decoded.usuario_id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el token en la base de datos' });
            }

            if (results.length === 0 || results[0].status !== 'active') {
                return res.status(401).json({
                    code: 401,
                    message: 'Token inválido o revocado'
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        res.status(401).json({ 
            code: 401,
            message: 'Acceso no autorizado'
        });
    }
};



module.exports = authenticate;