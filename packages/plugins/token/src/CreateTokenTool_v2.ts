import { z } from 'zod';
import axios from 'axios';
import {
  BaseTool,
  CustomDynamicStructuredTool,
  ErrorStep,
  IToolConfig,
  Network,
  NetworkName,
  NetworksConfig,
  NetworkType,
  settings,
  ToolProgress,
  Wallet,
} from '@binkai/core';
import { ProviderRegistry } from './ProviderRegistry';
import { CreateTokenParams, ITokenProvider, TokenInfo } from './types';
import { DefaultTokenProvider } from './providers/DefaultTokenProvider';
import { defaultTokens } from './data/defaultTokens';

export interface CreateTokenToolConfig extends IToolConfig {
  supportedNetworks?: NetworkName[];
}

export class CreateTokenTool extends BaseTool {
  public registry: ProviderRegistry;
  private supportedNetworks: Set<NetworkName>;
  private defaultTokenProvider: DefaultTokenProvider;
  // Cache for token information to avoid modifying default tokens
  private tokenCache: Partial<Record<NetworkName, Record<string, TokenInfo>>> = {};

  constructor(config: CreateTokenToolConfig) {
    super(config);
    this.registry = new ProviderRegistry();
    this.supportedNetworks = new Set<NetworkName>(config.supportedNetworks || []);

    // Initialize default token provider
    this.defaultTokenProvider = new DefaultTokenProvider();

    // Register the default token provider first
    this.registerProvider(this.defaultTokenProvider);
    console.log(
      '✓ Default token provider registered with',
      Object.keys(defaultTokens).length,
      'networks and',
      Object.values(defaultTokens).reduce((acc, tokens) => acc + Object.keys(tokens).length, 0),
      'tokens',
    );

    // Initialize token cache for each network
    this.defaultTokenProvider.getSupportedNetworks().forEach(network => {
      this.tokenCache[network] = {};
    });
  }

  registerProvider(provider: ITokenProvider): void {
    this.registry.registerProvider(provider);
    console.log('✓ Provider registered CreateTokenTool', provider.constructor.name);
    // Add provider's supported networks
    provider.getSupportedNetworks().forEach(network => {
      this.supportedNetworks.add(network);
      // Initialize token cache for this network if it doesn't exist
      if (!this.tokenCache[network]) {
        this.tokenCache[network] = {};
      }
    });
  }

  getName(): string {
    return 'create_token';
  }

  getDescription(): string {
    const providers = this.registry.getProviderNames().join(', ');
    const networks = Array.from(this.supportedNetworks).join(', ');
    console.log('🤖 Supported networks:', networks);
    return `Create (or deploy) token blockchain with name, symbol, description using various providers (${providers}). Supports networks: ${networks}.`;
  }

  private getSupportedNetworks(): NetworkName[] {
    // Get networks from agent's wallet
    const agentNetworks = Object.keys(this.agent.getNetworks()) as NetworkName[];

    // Intersect with supported networks from providers
    const providerNetworks = Array.from(this.supportedNetworks);

    // Return intersection of agent networks and provider supported networks
    return agentNetworks.filter(network => providerNetworks.includes(network));
  }

  getSchema(): z.ZodObject<any> {
    // const providers = this.registry.getProviderNames();
    // if (providers.length === 0) {
    //   throw new Error('No token providers registered');
    // }

    // const supportedNetworks = this.getSupportedNetworks();
    // if (supportedNetworks.length === 0) {
    //   throw new Error('No supported networks available');
    // }

    return z.object({
      name: z.string().describe('The name of token created'),
      symbol: z.string().describe('The symbol of token created'),
      description: z.string().describe('Description of token created'),
      img: z.string().optional().describe('The logo image to use for the create token.'),
      amount: z
        .string()
        .optional()
        .describe('Small amount to buy coins helps protect your coin from snipers.'),
    });
  }

  createTool(): CustomDynamicStructuredTool {
    console.log('🛠️ Creating create token tool');
    return {
      name: this.getName(),
      description: this.getDescription(),
      schema: this.getSchema(),
      func: async (
        args: any,
        runManager?: any,
        config?: any,
        onProgress?: (data: ToolProgress) => void,
      ) => {
        try {
          const { name, symbol, description, img } = args;
          const payload = {
            name: name,
            symbol: symbol,
            description: description,
            image_url: img,
          };
          console.log('🤖 Create token Args:############', args);
          try {
            const response = await axios.post(
              settings.get('BASE_URL') + '/launch-token' ||
                (() => {
                  throw new Error('BASE_URL is not defined');
                })(),
              payload,
            );
            console.log('🤖 Token created:', response.data);
            const server_response = response.data;
            const token_address = server_response.token_address;
            return `Launch token finish with response: ${response.data} this information: 
                      token_address: https://coin.nani.ooo/c/${token_address}, 
                      `;
          } catch (error) {
            console.error('Error creating token:', error);
            throw error;
          }
        } catch (error: any) {
          // Use BaseTool's error handling
          return this.handleError(error, args);
        }
      },
    };
  }
}
