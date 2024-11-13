const db = require('../database/conexion');  
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/jwt');

function ensureToken(req,res, next){
    const bearerHeader = req.headers['authorization'];
    console.log("token?",bearerHeader);
    if(typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(" ")
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    }else{
        res.sendStatus(403);
    }
}


router.get('/users', (req, res) => {
    const selectAllUsers = 'SELECT * FROM USUARIO';
    db.query(selectAllUsers,(err, results)=>{
        if (err) return res.status(500).json({ message: 'Error interno del servidor.' });
        res.json(results);

    })
});

router.get('/profile', authenticate, (req, res) => {
    const { usuario_id } = req.user;  
    const findUserQuery = `
        SELECT 
            USUARIO_ID, 
            NOMBRES, 
            APELLIDOS, 
            GENERO,
            FECHA_NAC, 
            DIRECCION,
            CORREO,
            TELEFONO,
            CLAVE
        FROM USUARIO 
        WHERE USUARIO_ID = ?
    `;

    db.query(findUserQuery, [usuario_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener los datos del usuario' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const user = results[0];
        res.json({ data: user });
    });
});



// Nueva ruta PUT para actualizar la información del perfil
router.put('/edit-profile', authenticate, (req, res) => {
    const { usuario_id } = req.user;
    const { nombres, apellidos, genero, fecha_nac, direccion, correo, telefono } = req.body;

    // Consulta SQL para actualizar el perfil del usuario
    const updateUserQuery = `
        UPDATE USUARIO SET 
            NOMBRES = ?, 
            APELLIDOS = ?, 
            GENERO = ?, 
            FECHA_NAC = ?, 
            DIRECCION = ?, 
            CORREO = ?, 
            TELEFONO = ?
        WHERE USUARIO_ID = ?
    `;

    const queryParams = [nombres, apellidos, genero, fecha_nac, direccion, correo, telefono, usuario_id];

    db.query(updateUserQuery, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar el perfil del usuario' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Perfil actualizado exitosamente' });
    });
});











// Ruta para agregar cuentas al usuario logeado
router.post('/add-account', authenticate, (req, res) => {
    const { no_cuenta, fecha_apertura, saldo, estado, id_tipo_cuenta, id_estado } = req.body;
    const usuario_id = req.user.usuario_id; // Obtener el ID del usuario desde el token

    // Validar que todos los campos necesarios estén presentes
    if (!no_cuenta || !fecha_apertura || saldo === undefined || !estado || !id_tipo_cuenta || !id_estado) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Consulta para insertar una nueva cuenta
    const insertAccountQuery = `
        INSERT INTO CUENTAS (NO_CUENTA, FECHA_APERTURA, SALDO, ESTADO, ID_USUARIO, ID_TIPO_CUENTA, ID_ESTADO) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertAccountQuery, [no_cuenta, fecha_apertura, saldo, estado, usuario_id, id_tipo_cuenta, id_estado], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error al agregar la cuenta' });
        }

        res.status(201).json({ message: 'Cuenta agregada exitosamente', accountId: result.insertId });
    });
});


module.exports = router;