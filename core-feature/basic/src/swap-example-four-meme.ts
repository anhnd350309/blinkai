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

// Hardcoded RPC URLs for demonstration
const BNB_RPC = 'https://bsc-dataseed1.binance.org';
const ETH_RPC = 'https://eth.llamarpc.com';

async function main() {
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
  const twitterHandle = 'testHandle';
  const walletInfo = await getOrCreateWallet(twitterHandle);
  const privateKey = walletInfo?.privateKey;
  const wallet = new Wallet(
    {
      seedPhrase:
        settings.get('WALLET_MNEMONIC') ||
        'test test test test test test test test test test test junk',
      privateKey,
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
  const swapPlugin = new SwapPlugin();

  // Create providers with proper chain IDs
  const fourMeme = new FourMemeProvider(provider, 56);

  // Configure the plugin with supported chains
  await swapPlugin.initialize({
    defaultSlippage: 0.5,
    defaultChain: 'bnb',
    providers: [fourMeme],
    supportedChains: ['bnb', 'ethereum'], // These will be intersected with agent's networks
  });
  console.log('✓ Swap plugin initialized\n');

  // Register the plugin with the agent
  console.log('🔌 Registering swap plugin with agent...');
  await agent.registerPlugin(swapPlugin);
  console.log('✓ Plugin registered\n');

  console.log('💱 Example 1: Buy SAFUFOUR');
  const inputResult = await agent.execute({
    input: `
      Buy 0.0001 BNB to SAFUFOUR on FourMeme bnb chain with 10 % slippage.
      Use the following token addresses:
      SAFUFOUR: 0xcf4eef00d87488d523de9c54bf1ba3166532ddb0
    `,
  });
  console.log('✓ Swap result (input):', inputResult, '\n');

  console.log('💱 Example 2: Sell SAFUFOUR');
  const outputResult = await agent.execute({
    input: `
      Sell 100 SAFUFOUR on FourMeme bnb chain with 10 % slippage.
      Use the following token addresses:
      SAFUFOUR: 0xcf4eef00d87488d523de9c54bf1ba3166532ddb0
    `,
  });
  console.log('✓ Swap result (input):', outputResult, '\n');

  // Get plugin information
  const registeredPlugin = agent.getPlugin('swap') as SwapPlugin;

  // Check available providers for each chain
  console.log('📊 Available providers by chain:');
  const chains = registeredPlugin.getSupportedNetworks();
  for (const chain of chains) {
    const providers = registeredPlugin.getProvidersForNetwork(chain);
    console.log(`Chain ${chain}:`, providers.map(p => p.getName()).join(', '));
  }
  // console.log();
}

// main().catch(error => {
//   console.error('❌ Error:', error.message);
//   process.exit(1);
// });
