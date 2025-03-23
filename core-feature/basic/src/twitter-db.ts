import mysql from 'mysql2/promise';
import { ethers } from 'ethers';
import { settings } from '@binkai/core';

export interface WalletInfo {
  privateKey: string;
  publicKey: string;
}

interface DatabaseConfig {
  uri: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

export async function getOrCreateWallet(twitterHandle: string): Promise<WalletInfo | null> {
  const pool = mysql.createPool({
    uri: settings.get('MYSQL_URL') as string,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  } as DatabaseConfig);

  console.log(`🤖 Start connect to database...`);
  let connection: mysql.PoolConnection | undefined;

  try {
    connection = await pool.getConnection();
    console.log(`🤖 Connected to database`);

    // Check if user handle exists
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT private_key, public_key FROM users WHERE twitter_handle = ?',
      [twitterHandle],
    );

    if (rows.length > 0) {
      console.log('✓ User wallet found in database');
      console.log(`Private Key: ${rows[0].private_key}`);
      console.log(`Public Key: ${rows[0].public_key}`);
      return {
        privateKey: rows[0].private_key,
        publicKey: rows[0].public_key,
      };
    }

    // If doesn't exist, create a new wallet
    // @TODO: Create BNB wallet
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const publicKey = wallet.address;

    console.log(`🤖 Create new wallet: ${twitterHandle}`);
    console.log(`🤖 Private Key: ${privateKey}`);
    console.log(`🤖 Public Key: ${publicKey}`);

    console.log(`🤖 Save wallet info to database...`);
    await connection.execute(
      'INSERT INTO users (twitter_handle, private_key, public_key) VALUES (?, ?, ?)',
      [twitterHandle, privateKey, publicKey],
    );
    console.log(`🤖 Wallet info saved to database`);

    return { privateKey, publicKey };
  } catch (error) {
    console.error('❌Error: ', error);
    return null;
  } finally {
    if (connection) connection.release(); // release connection
    console.log('🔌 Connection released.');
    await pool.end(); // close pool
    console.log('🔌 Pool closed.');
  }
}

// Example usage:
// (async () => {
//     const twitterHandle = 'example_user';
//     const walletInfo = await getOrCreateWallet(twitterHandle);
//     console.log("Wallet info:", walletInfo);
// })();
