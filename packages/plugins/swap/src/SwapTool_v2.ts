import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import {
  BaseTool,
  CustomDynamicStructuredTool,
  IToolConfig,
  ToolProgress,
  StructuredError,
  ErrorStep,
  settings,
} from '@binkai/core';
import { ProviderRegistry } from './ProviderRegistry';
import { ISwapProvider, SwapQuote, SwapParams, tokenAddressDict } from './types';
import { validateTokenAddress } from './utils/addressValidation';
import { parseTokenAmount } from './utils/tokenUtils';
import { isSolanaNetwork } from './utils/networkUtils';
import type { TokenInfo } from '@binkai/token-plugin';
import { defaultTokens } from '@binkai/token-plugin';

export interface SwapToolConfig extends IToolConfig {
  defaultSlippage?: number;
  defaultNetwork?: string;
  supportedNetworks?: string[];
  secretKey: string;
}

export class SwapTool extends BaseTool {
  public registry: ProviderRegistry;
  private defaultSlippage: number;
  private supportedNetworks: Set<string>;
  public secretKey!: string;

  constructor(config: SwapToolConfig) {
    super(config);
    this.registry = new ProviderRegistry();
    this.defaultSlippage = config.defaultSlippage || 1;
    this.supportedNetworks = new Set<string>(config.supportedNetworks || []);
    this.secretKey = config.secretKey;
  }

  registerProvider(provider: ISwapProvider): void {
    this.registry.registerProvider(provider);
    console.log('✓ Provider registered', provider.constructor.name);
    // Add provider's supported networks
    provider.getSupportedNetworks().forEach(network => {
      this.supportedNetworks.add(network);
    });
  }

  getName(): string {
    return 'BuyToken';
  }

  getDescription(): string {
    // const providers = this.registry.getProviderNames().join(', ');
    // const networks = Array.from(this.supportedNetworks).join(', ');
    let description = `Buy a token on the blockchain using SOL with token address, SOL amount, slippage
                        `;

    // Add provider-specific prompts if they exist
    // const providerPrompts = this.registry
    //   .getProviders()
    //   .map((provider: ISwapProvider) => {
    //     const prompt = provider.getPrompt?.();
    //     return prompt ? `${provider.getName()}: ${prompt}` : null;
    //   })
    //   .filter((prompt: unknown): prompt is string => !!prompt);

    // if (providerPrompts.length > 0) {
    //   description += '\n\nProvider-specific information:\n' + providerPrompts.join('\n');
    // }

    return description;
  }

  private getSupportedNetworks(): string[] {
    // Get networks from agent's wallet
    const agentNetworks = Object.keys(this.agent.getNetworks());

    // Intersect with supported networks from providers
    const providerNetworks = Array.from(this.supportedNetworks);

    // Return intersection of agent networks and provider supported networks
    return agentNetworks.filter(network => providerNetworks.includes(network));
  }

  getSchema(): z.ZodObject<any> {
    // const providers = this.registry.getProviderNames();
    // if (providers.length === 0) {
    //   throw new Error('No swap providers registered');
    // }

    // const supportedNetworks = this.getSupportedNetworks();
    // if (supportedNetworks.length === 0) {
    //   throw new Error('No supported networks available');
    // }

    return z.object({
      tokenName: z.string().optional().describe(`The name of token`),
      token_address: z
        .string()
        .optional()
        .describe(`The address of token or name of token user want to buy`),
      amount_sol: z.number().describe('The amount of tokens user want to spend to buy other token'),
      slippage: z
        .number()
        .optional()
        .describe(`Maximum slippage percentage allowed (default: ${this.defaultSlippage})`),
    });
  }

  createTool(): CustomDynamicStructuredTool {
    console.log('✓ Creating tool', this.getName());
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
          let { tokenName, token_address: tokenAddress, amount_sol, slippage } = args;
          console.log('🔄 Doing swap operation SwapTool_V2...');
          console.log('🤖 Swap Args:', args);
          let keypair = this.secretKey;
          console.log(
            tokenName,
            tokenName && tokenAddressDict[tokenName.toUpperCase()] === undefined,
          );
          if (tokenName !== undefined && tokenAddressDict[tokenName.toUpperCase()] === undefined) {
            console.log('🤖 Token address not found in dictionary');
            return `Do not have token address of ${tokenName}, please provide address of this token`;
          }

          if (slippage === undefined) {
            slippage = this.defaultSlippage;
          }

          let payload;
          if (tokenAddress) {
            payload = {
              token_address: tokenAddress,
              amount_sol,
              slippage,
              keypair,
            };
          } else if (tokenName) {
            payload = {
              token_address: tokenAddressDict[tokenName.toUpperCase()],
              amount_sol,
              slippage,
              keypair,
            };
          } else {
            return 'please provide token name or token address.';
          }
          console.log('🤖 Swap Payload:', payload);
          console.log('This one', settings.get('BASE_URL'));
          const response = await axios.post(
            settings.get('BASE_URL') + '/buy-token' ||
              (() => {
                throw new Error('BASE_URL is not defined in settings');
              })(),
            payload,
          );
          console.log('🤖 Token created:', response.data);

          if (response.data.code === 200) {
            return `Buy token Success with amount: ${response.data.message.tokens_received} and
            transaction hash is: ${response.data.message.transaction_hash}`;
          } else {
            return `Purchase token fail due to this error: ${response.data.message}`;
          }
        } catch (error) {
          console.error('Error in Purchase token:', error);
          throw error;
        }
      },
    };
  }
}
