import {
  Agent,
  Wallet,
  Network,
  settings,
  NetworkType,
  NetworksConfig,
  NetworkName,
} from '@binkai/core';
import { TokenPlugin } from '@binkai/token-plugin';
import { ethers } from 'ethers';
import { FourMemeProvider } from '@binkai/four-meme-provider';
import { getOrCreateWallet, getOrCreateWalletEVM } from './twitter-db';
import { SwapPlugin } from '@binkai/swap-plugin';
import { WalletPlugin } from '@binkai/wallet-plugin';
import { BnbProvider } from '@binkai/rpc-provider';
import { BirdeyeProvider } from '@binkai/birdeye-provider';
import { PostgresDatabaseAdapter } from '@binkai/postgres-adapter';
import { PancakeSwapProvider } from '@binkai/pancakeswap-provider';
import { KyberProvider } from '@binkai/kyber-provider';
// Hardcoded RPC URLs for demonstration
const BNB_RPC = 'https://bsc-dataseed1.binance.org';
const ETH_RPC = 'https://eth.llamarpc.com';

export async function agentFunction(twitterHandle: string, request: string): Promise<string> {
  // Check required environment variables
  if (!settings.has('OPENAI_API_KEY')) {
    console.error('❌ Error: Please set OPENAI_API_KEY in your .env file');
    process.exit(1);
  }

  if (!settings.has('BIRDEYE_API_KEY')) {
    console.error('❌ Error: Please set BIRDEYE_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('🔑 API keys found\n');

  // Define available networks
  console.log('📡 Configuring networks...');
  const networks: NetworksConfig['networks'] = {
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

  // Initialize a new wallet
  console.log('👛 Creating wallet...');
  const walletInfo = await getOrCreateWalletEVM(twitterHandle);
  const seedPhrase = walletInfo?.seedPhrase;
  const secretKey = walletInfo?.secretKey;
  const privateKey = walletInfo?.secretKey;
  console.log(privateKey);
  const wallet = new Wallet(
    {
      // seedPhrase: seedPhrase,
      privateKey: privateKey,
      index: 0,
    },
    network,
  );
  console.log('✓ Wallet created\n');

  console.log('🤖 Wallet ethereum:', await wallet.getAddress(NetworkName.ETHEREUM));

  // Create an agent with OpenAI
  console.log('🤖 Initializing AI agent...');
  const agent = new Agent(
    {
      model: 'gpt-4o',
      temperature: 0,
      character:
        'You are a fun, hype, and engaging chatbot with a Gen Z & crypto enthusiast vibe. Keep responses casual, use slang, and sprinkle in emojis where appropriate. React with excitement, and make sure replies feel dynamic, not robotic.',
    },
    wallet,
    networks,
  );
  console.log('✓ Agent initialized\n');

  // Create and configure the token plugin

  await agent.registerDatabase(
    new PostgresDatabaseAdapter({
      connectionString: settings.get('POSTGRES_URL'),
    }),
  );
  console.log('🔍 Initializing token plugin...');
  const tokenPlugin = new TokenPlugin();

  const provider = new ethers.JsonRpcProvider(ETH_RPC);

  const fourMeme = new FourMemeProvider(provider, 56);
  const kyber = new KyberProvider(provider, 56);
  const ethProvider = new BnbProvider({
    rpcUrl: ETH_RPC,
  });

  // // TOKEN PLUGIN
  // // Configure the plugin with supported chains
  await tokenPlugin.initialize({
    defaultChain: 'eth',
    providers: [ethProvider, fourMeme as any],
    supportedChains: ['bnb', 'eth'], // These will be intersected with agent's networks
  });
  console.log('✓ Token plugin initialized\n');

  // Register the plugin with the agent
  console.log('🔌 Registering token plugin with agent...');
  await agent.registerPlugin(tokenPlugin);
  console.log('✓ Token Plugin registered\n');

  // SWAP PLUGIN
  console.log('🔄 Initializing swap plugin...');
  if (!secretKey) {
    throw new Error('❌ Error: secretKey is undefined. Cannot initialize SwapPlugin.');
  }
  // const swapPlugin = new SwapPlugin(secretKey);

  // Configure the plugin with supported chains
  // await swapPlugin.initialize({
  //   defaultSlippage: 5,
  //   defaultChain: 'bnb',
  //   providers: [kyber],
  //   supportedChains: ['bnb'], // These will be intersected with agent's networks
  // });
  // console.log('✓ Swap plugin initialized\n');

  // // // Register the plugin with the agent
  // console.log('🔌 Registering swap plugin with agent...');
  // await agent.registerPlugin(swapPlugin);
  console.log('✓ Swap Plugin registered\n');

  // // WALLET PLUGIN
  // console.log('🔄 Initializing wallet plugin...');
  // const walletPlugin = new WalletPlugin();

  // // Configure the plugin with supported chains
  // await walletPlugin.initialize({
  //   defaultChain: 'bnb',
  //   providers: [bnbProvider],
  //   supportedChains: ['bnb'],
  // });
  // console.log('✓ Wallet plugin initialized\n');

  // // Register the plugin with the agent
  // console.log('🔌 Registering wallet plugin with agent...');
  // await agent.registerPlugin(walletPlugin);
  // console.log('✓ Wallet Plugin registered\n');

  // Agent execute
  console.log('💱 Executing user request...');
  const result = await agent.execute(request);
  console.log('✓ User request executed:', result);
  console.log('💱 length of result:', result.length);
  return result;
}

// (async () => {
//     await agentFunction('testHandle', 'transfer 0.0001 BNB to 0xC1b1729127E4029174F183aB51a4B10c58Dc006d');
// })();
