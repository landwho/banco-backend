const mysql = require('mysql2');

const connection = mysql.createConnection({
  host:     'localhost',   
  user:     'root',        
  password: 'root',  
  database: 'chn' 
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos MySQL con ID ' + connection.threadId);
});

module.exports = connection;