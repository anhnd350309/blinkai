import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates the user table if it doesn't exist
 */
export async function createUserTable(): Promise<void> {
  try {
    // Create a connection using the MySQL URL from environment variables
    console.log('MYSQL_URL', process.env.MYSQL_URL);
    const connection = await mysql.createConnection(process.env.MYSQL_URL as string);
    await connection.execute(`DROP TABLE IF EXISTS users`);

    // SQL query to create the user table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        twitter_handle VARCHAR(255) NOT NULL UNIQUE,
        seed_phrase VARCHAR(255) NOT NULL,
        secret_key VARCHAR(255) NOT NULL,
        public_key VARCHAR(255) NOT NULL,
        private_key VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    // Execute the query
    await connection.execute(createTableQuery);

    console.log('User table created successfully or already exists');

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('Error creating user table:', error);
    throw error;
  }
}
export async function addSecretKeyColumn(): Promise<void> {
  try {
    // Create a connection using the MySQL URL from environment variables
    console.log('MYSQL_URL', process.env.MYSQL_URL);
    const connection = await mysql.createConnection(process.env.MYSQL_URL as string);

    // Check if the column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'secret_key'
    `);

    // If column doesn't exist, add it
    if (Array.isArray(columns) && columns.length === 0) {
      // SQL query to add the secret_key column
      const addColumnQuery = `
        ALTER TABLE users
        ADD COLUMN secret_key VARCHAR(255) AFTER seed_phrase
      `;

      await connection.execute(addColumnQuery);
      console.log('secret_key column added successfully');
    } else {
      console.log('secret_key column already exists');
    }

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('Error adding secret_key column:', error);
    throw error;
  }
}

createUserTable()
  .then(() => {
    console.log('User table creation process completed');
  })
  .catch(error => {
    console.error('Error in user table creation process:', error);
  });
