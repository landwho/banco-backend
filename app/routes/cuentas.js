const db = require('../database/conexion');  
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/jwt');



router.get('/tipo-cuenta',authenticate, (req, res) => {
    const query = `
        SELECT 
            TIPO_CUENTA_ID, 
            TIPO_CUENTA, 
            TIPO_CUENTA_DESCRIPCION 
        FROM TIPO_CUENTA
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener los tipos de cuenta' });
        }
        res.json({ data: results });
    });
});


router.get('/estado-cuenta', authenticate, (req, res) => {
    const query = `
        SELECT 
            ESTADO_ID, 
            ESTADO 
        FROM ESTADOS
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener los estados' });
        }
        res.json({ data: results });
    });
});






// router.post('/apertura-cuenta', authenticate, (req, res) => {
    // // Extraer los datos del cuerpo de la solicitud
    // const { fechaApertura, montoInicial,  usuarioId, tipoCuenta, estadoCuenta } = req.body;
    // // Llamar al procedimiento almacenado, que generará el número de cuenta automáticamente
    // const procedureCall = `CALL apertura_cuenta(?, ?, ?, ?, ?, ?)`;
    // // Pasar los parámetros al procedimiento almacenado
    // db.query(
    //     procedureCall,
    //     [fechaApertura, montoInicial, "Activo", usuarioId, tipoCuenta, estadoCuenta],
    //     (err, result) => {
    //         if (err) {
    //             console.error('Error al abrir la cuenta:', err);
    //             return res.status(500).send('Error al abrir la cuenta');
    //         }
    //         res.send('Cuenta creada correctamente');
    //     }
    // );
// });



router.post('/apertura-cuenta', authenticate, (req, res) => {
    // Extraer los datos del cuerpo de la solicitud
    const { fechaApertura, montoInicial,  usuarioId, tipoCuenta, estadoCuenta } = req.body;
    // Llamar al procedimiento almacenado, que generará el número de cuenta automáticamente
    const procedureCall = `CALL apertura_cuenta(?, ?, ?, ?, ?, ?)`;
    // Pasar los parámetros al procedimiento almacenado
    db.query(procedureCall, [fechaApertura, montoInicial, "Activo", usuarioId, tipoCuenta, estadoCuenta],
        (err, result) => {
            if (err) {
                console.error('Error al abrir la cuenta:', err);
                return res.status(500).send('Error al abrir la cuenta');
            }
        // Suponiendo que el procedimiento devuelve el NO_CUENTA en la primera fila del primer conjunto de resultados
        const numeroCuenta = result[0][0].NO_CUENTA;
        console.log(usuarioId, numeroCuenta)
        // Ahora, insertar en USUARIOS_CUENTAS para asociar la cuenta con el usuario
        const insertUsuarioCuenta = `INSERT INTO USUARIOS_CUENTAS (USUARIO_ID, NO_CUENTA) VALUES (?, ?)`;
        db.query(insertUsuarioCuenta, [usuarioId, numeroCuenta], (err, result) => {
            if (err) {
                console.error('Error al asociar la cuenta con el usuario:', err);
                return res.status(500).send('Error al asociar la cuenta con el usuario');
            }
            res.status(201).json({ message: 'Cuenta creada y asociada correctamente al usuario'});
        });
    });
});





router.get('/mis-cuentas', authenticate, (req, res) => {
    const usuarioId = req.user.usuario_id; // Obtenemos el usuarioId del usuario autenticado

    console.log("102",req.user.usuario_id)

    const query = `
        SELECT 
            U.NOMBRES, 
            U.APELLIDOS, 
            C.NO_CUENTA, 
            C.FECHA_APERTURA, 
            C.SALDO, 
            C.ESTADO,
            TC.TIPO_CUENTA
        FROM 
            USUARIO U
        JOIN 
            USUARIOS_CUENTAS UC ON U.USUARIO_ID = UC.USUARIO_ID
        JOIN 
            CUENTAS C ON UC.NO_CUENTA = C.NO_CUENTA
        JOIN 
            TIPO_CUENTA TC ON C.ID_TIPO_CUENTA = TC.TIPO_CUENTA_ID
        WHERE 
            U.USUARIO_ID = ?;  -- Parámetro para evitar SQL injection
    `;

    // Ejecutar la consulta con el usuarioId como parámetro
    db.query(query, [usuarioId], (err, results) => {
        if (err) {
            console.error('Error al obtener las cuentas del usuario:', err);
            return res.status(500).send('Error al obtener las cuentas del usuario');
        }
        
        // Enviar los resultados como respuesta
        res.json(results);
    });
});








module.exports = router;