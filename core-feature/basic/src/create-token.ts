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
import { BirdeyeProvider } from '@binkai/birdeye-provider';
import { getOrCreateWallet } from './twitter-db';

// Hardcoded RPC URL for Solana
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

export async function createToken(twitterHandle: string, request: string): Promise<string> {
  console.log('🚀 Starting BinkOS token info example...\n');

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

  // Define Solana network
  console.log('📡 Configuring network...');
  const networks: NetworksConfig['networks'] = {
    solana: {
      type: 'solana' as NetworkType,
      config: {
        rpcUrl: SOLANA_RPC,
        name: 'Solana',
        nativeCurrency: {
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9,
        },
      },
    },
  };
  console.log('✓ Network configured: Solana\n');

  // Initialize network
  console.log('🌐 Initializing network...');
  const network = new Network({ networks });
  console.log('✓ Network initialized\n');

  // Initialize a new wallet
  console.log('👛 Creating wallet...');
  const walletInfo = await getOrCreateWallet(twitterHandle);
  const seedPhrase = walletInfo?.seedPhrase;
  const wallet = new Wallet(
    {
      seedPhrase: seedPhrase,
      index: 0,
    },
    network,
  );
  console.log('✓ Wallet created\n');

  console.log('🤖 Wallet Solana:', await wallet.getAddress(NetworkName.SOLANA));

  // Create an agent with OpenAI
  console.log('🤖 Initializing AI agent...');
  const agent = new Agent(
    {
      model: 'gpt-4',
      temperature: 0,
    },
    wallet,
    networks,
  );
  console.log('✓ Agent initialized\n');

  // Create and configure the token plugin
  console.log('🔍 Initializing token plugin...');
  const tokenPlugin = new TokenPlugin();

  const birdeye = new BirdeyeProvider({
    apiKey: settings.get('BIRDEYE_API_KEY'),
  });

  // Configure the plugin with Solana chain
  await tokenPlugin.initialize({
    defaultChain: 'solana',
    providers: [birdeye],
    supportedChains: ['solana'],
  });
  console.log('✓ Token plugin initialized\n');

  // Register the plugin with the agent
  console.log('🔌 Registering token plugin with agent...');
  await agent.registerPlugin(tokenPlugin);
  console.log('✓ Plugin registered\n');

  // Create token on Solana
  console.log('💎 Creating token on Solana');
  const result = await agent.execute({
    input: request,
  });
  console.log('✓ Token created:', result, '\n');

  // Get plugin information
  const registeredPlugin = agent.getPlugin('token') as TokenPlugin;

  // Check available providers for Solana
  console.log('📊 Available providers for Solana:');
  const providers = registeredPlugin.getProvidersForNetwork(NetworkName.SOLANA);
  console.log('Solana:', providers.map(p => p.getName()).join(', '));
  console.log();

  return result;
}

(async () => {
  await createToken(
    'testHandle',
    'Create a new token on BNB chain with name: "ITACHI", symbol: "ITC", description: "This is a Itachi Test token". image is https://static.four.meme/market/6fbb933c-7dde-4d0a-960b-008fd727707f4551736094573656710.jpg.',
  );
})();
