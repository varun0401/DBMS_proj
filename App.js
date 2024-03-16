const { Client } = require('pg');

const client = new Client({
  host: 'ep-jolly-hill-a5vd1iv1.us-east-2.aws.neon.tech',
  database: 'Student_teacher',
  user: 'varunkulkarni30',
  password: '3tFgRIq0kxYm',
  port: 5432,
  ssl: true,
});

// Connect to the PostgreSQL server
client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL server');
  })
  .catch(error => console.error('Error connecting to PostgreSQL server:', error));


module.exports= client;