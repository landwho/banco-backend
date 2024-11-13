const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');


const app = express();
const cors = require('cors'); 
const port = 3000;



// rutas
const authRoutes = require('./app/routes/login');
const users      = require('./app/routes/users');
const cuentas    = require('./app/routes/cuentas')

app.use(express.json());
app.use(cors()); 
app.use(bodyParser.json());




app.use('/api/auth', authRoutes);
app.use('/api', users);
app.use('/api',cuentas)



app.get('/', (req, res) => {
  res.send('¡Hola, Mundo!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});