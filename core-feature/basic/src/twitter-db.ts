import mysql from 'mysql2/promise';
import { Keypair } from '@solana/web3.js';
import { settings } from '@binkai/core';
import * as bip39 from 'bip39';
import bs58 from 'bs58';
import { ethers } from 'ethers';

export interface WalletInfo {
  seedPhrase: string;
  publicKey: string;
  secretKey: string;
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
      'SELECT seed_phrase, public_key, secret_key FROM users WHERE twitter_handle = ?',
      [twitterHandle],
    );

    if (rows.length > 0) {
      console.log('✓ User wallet found in database');
      console.log(`Seed Phrase: ${rows[0].seed_phrase}`);
      console.log(`Public Key: ${rows[0].public_key}`);
      return {
        seedPhrase: rows[0].seed_phrase,
        publicKey: rows[0].public_key,
        secretKey: rows[0].secret_key,
      };
    }

    // If doesn't exist, create a new wallet
    const seedPhrase = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    const publicKey = keypair.publicKey.toBase58();
    const secretKey = bs58.encode(keypair.secretKey);

    console.log(`🤖 Create new wallet: ${twitterHandle}`);
    console.log(`🤖 Seed Phrase: ${seedPhrase}`);
    console.log(`🤖 Public Key: ${publicKey}`);

    console.log(`🤖 Save wallet info to database...`);
    await connection.execute(
      'INSERT INTO users (twitter_handle, seed_phrase, public_key, secret_key, private_key) VALUES (?, ?, ?, ?, ?)',
      [twitterHandle, seedPhrase, publicKey, secretKey, ''],
    );
    console.log(`🤖 Wallet info saved to database`);

    return { seedPhrase, publicKey, secretKey };
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

export async function getOrCreateWalletEVM(twitterHandle: string): Promise<WalletInfo | null> {
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
        seedPhrase: '', // EVM wallets don't use seed phrases in the same way
        secretKey: rows[0].private_key,
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
      'INSERT INTO users (twitter_handle, seed_phrase, public_key, secret_key, private_key) VALUES (?, ?, ?, ?, ?)',
      [twitterHandle, '', publicKey, '', privateKey],
    );
    console.log(`🤖 Wallet info saved to database`);

    return { secretKey: privateKey, publicKey, seedPhrase: '' };
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
