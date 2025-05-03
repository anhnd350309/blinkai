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
    // await connection.execute(`DROP TABLE IF EXISTS users`);

    // SQL query to create the user table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        twitter_handle VARCHAR(255) NOT NULL UNIQUE,
        private_key VARCHAR(255) NOT NULL,
        public_key VARCHAR(255) NOT NULL,
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

createUserTable()
  .then(() => {
    console.log('User table creation process completed');
  })
  .catch(error => {
    console.error('Error in user table creation process:', error);
  });
