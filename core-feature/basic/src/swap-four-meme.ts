import { ethers } from 'ethers';
import {
  Agent,
  Wallet,
  Network,
  settings,
  NetworkType,
  NetworksConfig,
  NetworkName,
} from '@binkai/core';
import { SwapPlugin } from '@binkai/swap-plugin';
import { FourMemeProvider } from '@binkai/four-meme-provider';
import { getOrCreateWallet } from './twitter-db';
import { PancakeSwapProvider } from '@binkai/pancakeswap-provider';

// Hardcoded RPC URLs for demonstration
const BNB_RPC = 'https://bsc-dataseed1.binance.org';
const ETH_RPC = 'https://eth.llamarpc.com';

export async function swapFourMeme(twitterHandle: string, request: string): Promise<string> {
  console.log('🚀 Starting BinkOS swap example...\n');

  // Check required environment variables
  if (!settings.has('OPENAI_API_KEY')) {
    console.error('❌ Error: Please set OPENAI_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('🔑 OpenAI API key found\n');

  // Define available networks
  console.log('📡 Configuring networks...');
  const networks: NetworksConfig['networks'] = {
    bnb: {
      type: 'evm' as NetworkType,
      config: {
        chainId: 56,
        rpcUrl: BNB_RPC,
        name: 'BNB Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18,
        },
      },
    },
    ethereum: {
      type: 'evm' as NetworkType,
      config: {
        chainId: 1,
        rpcUrl: ETH_RPC,
        name: 'Ethereum',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
      },
    },
  };
  console.log('✓ Networks configured:', Object.keys(networks).join(', '), '\n');

  // Initialize network
  console.log('🌐 Initializing network...');
  const network = new Network({ networks });
  console.log('✓ Network initialized\n');

  // Initialize provider
  console.log('🔌 Initializing provider...');
  const provider = new ethers.JsonRpcProvider(BNB_RPC);
  console.log('✓ Provider initialized\n');

  // Initialize a new wallet
  console.log('👛 Creating wallet...');
  const walletInfo = await getOrCreateWallet(twitterHandle);
  const seedPhrase = walletInfo?.seedPhrase;
  const secretKey = walletInfo?.secretKey;
  const wallet = new Wallet(
    {
      seedPhrase,
      index: 0,
    },
    network,
  );
  console.log('👛 Wallet:', network.getConfig(NetworkName.BNB));

  console.log('✓ Wallet created\n');

  console.log('🤖 Wallet BNB:', await wallet.getAddress(NetworkName.BNB));
  console.log('🤖 Wallet ETH:', await wallet.getAddress(NetworkName.ETHEREUM));
  // Create an agent with OpenAI
  console.log('🤖 Initializing AI agent...');
  const agent = new Agent(
    {
      model: 'gpt-4o',
      temperature: 0,
    },
    wallet,
    networks,
  );
  console.log('✓ Agent initialized\n');

  // Create and configure the swap plugin
  console.log('🔄 Initializing swap plugin...');
  if (!secretKey) {
    throw new Error('Secret key is undefined. Please ensure the wallet information is correct.');
  }
  const swapPlugin = new SwapPlugin(secretKey);

  // Create providers with proper chain IDs
  const fourMeme = new FourMemeProvider(provider, 56);
  const pancakeswap = new PancakeSwapProvider(provider, 56);

  // Configure the plugin with supported chains
  await swapPlugin.initialize({
    defaultSlippage: 0.5,
    defaultChain: 'bnb',
    providers: [fourMeme, pancakeswap],
    supportedChains: ['bnb'], // These will be intersected with agent's networks
  });
  console.log('✓ Swap plugin initialized\n');

  // Register the plugin with the agent
  console.log('🔌 Registering swap plugin with agent...');
  await agent.registerPlugin(swapPlugin);
  console.log('✓ Plugin registered\n');

  console.log('💱 Example 1: Buy SAFUFOUR');
  const inputResult = await agent.execute({
    input: request,
  });
  console.log('✓ Swap result (input):', inputResult, '\n');
  return inputResult;
}

// (async () => {
//   await swapFourMeme('testHandle', 'Buy 0.0002 BNB to SAFUFOUR on FourMeme bnb chain with 10 % slippage. Use the following token addresses: SAFUFOUR: 0xcf4eef00d87488d523de9c54bf1ba3166532ddb0');
// })();
