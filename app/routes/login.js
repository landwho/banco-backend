const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/conexion');
const secretKey = "secretkey";  

const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, 
    secure: false, 
    auth: {
        user: 'ubicob@gmail.com',
        pass: 'ljsi wzlf zkff wnyo'
    },
    tls: {
        rejectUnauthorized: true, 
        minVersion: "TLSv1.2" 
    }
});

transporter.verify((error, success) => {
    if (error) {
      console.error('Error al conectar con el servidor de correo:', error);
    } else {
      console.log('Servidor de correo listo para enviar mensajes');
    }
});


router.post('/register', (req, res) => {
    const { nombres, apellidos, genero, fecha_nac, direccion, correo, telefono, clave } = req.body;

    if (!nombres || !apellidos || !correo || !clave) {
        return res.status(400).json({ message: 'Los campos nombres, apellidos, correo y contraseña son obligatorios.' });
    }

    const checkEmailQuery = 'SELECT * FROM USUARIO WHERE CORREO = ?';

    db.query(checkEmailQuery, [correo], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar el correo.' });
        }

        if (results.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
        }

        const hashedPassword = bcrypt.hashSync(clave, 10); // 10 es el número de rondas para el hash

        const insertUserQuery = `
            INSERT INTO USUARIO (NOMBRES, APELLIDOS, GENERO, FECHA_NAC, DIRECCION, CORREO, TELEFONO, CLAVE) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const userValues = [nombres, apellidos, genero, fecha_nac, direccion, correo, telefono, hashedPassword];

        db.query(insertUserQuery, userValues, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al registrar el usuario.' });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente', userId: result.insertId });
        });
    });
});


router.post('/login', (req, res) => {
    const { correo, clave } = req.body;

    if (!correo || !clave) {
        return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
    }

    const findUserQuery = `
        SELECT 
            USUARIO_ID, 
            NOMBRES, 
            APELLIDOS, 
            CORREO, 
            CLAVE 
        FROM USUARIO 
        WHERE CORREO = ?
    `;

    db.query(findUserQuery, [correo], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al buscar el usuario en la base de datos' });
        }
        if (results.length === 0) {
            return res.status(401).json({ 
                code:'x0L01',
                message: 'Correo electrónico o contraseña incorrectos'
            });
        }

        const user = results[0];

        bcrypt.compare(clave, user.CLAVE, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar la contraseña' });
            }

            if (!isMatch) {
                return res.status(401).json({
                    code:'x0L01',
                    message: 'Correo electrónico o contraseña incorrectos' 
                });
            }

            const token = jwt.sign(
                { usuario_id: user.USUARIO_ID, correo: user.CORREO },
                secretKey,
                { expiresIn: '1h' }
            );

            const revokeOldTokensQuery = `DELETE FROM tokens WHERE usuario_id = ?`;
            db.query(revokeOldTokensQuery, [user.USUARIO_ID], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al revocar tokens anteriores' });
                }

                const saveTokenQuery = `INSERT INTO tokens (usuario_id, token, status) VALUES (?, ?, 'active')`;
                db.query(saveTokenQuery, [user.USUARIO_ID, token], (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al guardar el token en la base de datos' });
                    }

                    const { CLAVE, ...userData } = user;
                    res.json({
                        message: 'Inicio de sesión exitoso',
                        data: userData,
                        token
                    });
                });
            });
        });
    });
});


router.post('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No se proporcionó un token o el formato es incorrecto' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Decodificar el token para obtener el usuario_id
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        const usuario_id = decoded.usuario_id;

        // Verificar los valores de usuario_id y token
        console.log('usuario_id:', usuario_id);
        console.log('token:', token);

        // Elimina el token de la base de datos para cerrar sesión
        const deleteTokenQuery = `DELETE FROM tokens WHERE usuario_id = ? AND token = ?`;
        db.query(deleteTokenQuery, [usuario_id, token], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al eliminar el token' });
            }

            // Verifica si realmente se eliminó un registro
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Token no encontrado o ya eliminado' });
            }

            res.json({ message: 'Cierre de sesión exitoso' });
        });
    });
});

module.exports = router;