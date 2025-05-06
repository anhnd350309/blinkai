import { NetworkName, Token } from '@binkai/core';
import { Provider } from 'ethers';
import { Connection } from '@solana/web3.js';

export type NetworkProvider = Provider | Connection;

export interface SwapQuote {
  network: NetworkName;
  quoteId: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  route: string[];
  estimatedGas: string;
  type: 'input' | 'output'; // Whether this is an exact input or exact output swap
  tx?: Transaction;
  slippage: number;
}

export interface SwapParams {
  network: NetworkName;
  fromToken: string;
  toToken: string;
  amount: string;
  type: 'input' | 'output'; // Whether amount is input or output
  slippage: number;
}

export const tokenAddress = {
  BTC: '123',
  ETH: '345',
  USDC: '567',
};

export interface Transaction {
  to: string;
  data: string;
  value: string;
  gasLimit?: bigint;
  spender: string;
  network: NetworkName;
}

export interface ISwapProvider {
  /**
   * Get the name of the DEX provider
   */
  getName(): string;

  /**
   * Get supported networks for this provider
   */
  getSupportedNetworks(): NetworkName[];

  /**
   * Get the provider-specific prompt that helps guide the AI in using this provider effectively
   * This is optional - if not implemented, no special prompt will be used
   */
  getPrompt?(): string;

  /**
   * Check if user has sufficient balance for the swap
   * @param quote The swap quote to check balance against
   * @param walletAddress The address of the user
   * @returns Promise<{ isValid: boolean; message?: string }> Returns if balance is sufficient and error message if not
   */
  checkBalance(
    quote: SwapQuote,
    walletAddress: string,
  ): Promise<{ isValid: boolean; message?: string }>;

  /**
   * Adjusts a token amount based on user's balance to handle precision issues
   * @param tokenAddress The address of the token to adjust
   * @param amount The requested amount
   * @param walletAddress The user's wallet address
   * @param network The blockchain network
   * @returns The adjusted amount that can be safely used
   */
  adjustAmount(
    tokenAddress: string,
    amount: string,
    walletAddress: string,
    network: NetworkName,
  ): Promise<string>;

  /**
   * Invalidates the balance cache for a specific token and wallet
   * @param tokenAddress The address of the token
   * @param walletAddress The address of the wallet
   * @param network The blockchain network
   */
  invalidateBalanceCache(tokenAddress: string, walletAddress: string, network: NetworkName): void;

  /**
   * Get a quote for swapping tokens
   */
  getQuote(params: SwapParams, walletAddress: string): Promise<SwapQuote>;

  /**
   * Build a transaction for swapping tokens
   * @param quote The quote to execute
   * @param walletAddress The address of the user who will execute the swap
   */
  buildSwapTransaction(quote: SwapQuote, walletAddress: string): Promise<Transaction>;

  /**
   * Build a transaction for approving token spending
   * @param network The network to approve
   * @param tokenAddress The address of the token to approve
   * @param spender The address to approve spending for
   * @param amount The amount to approve
   * @param walletAddress The address of the user who will approve
   */
  buildApproveTransaction(
    network: NetworkName,
    tokenAddress: string,
    spender: string,
    amount: string,
    walletAddress: string,
  ): Promise<Transaction>;

  /**
   * Check the allowance of a token for a spender
   * @param network The network to check
   * @param tokenAddress The address of the token to check
   * @param owner The owner of the tokens
   * @param spender The address to check allowance for
   */
  checkAllowance(
    network: NetworkName,
    tokenAddress: string,
    owner: string,
    spender: string,
  ): Promise<bigint>;
}
