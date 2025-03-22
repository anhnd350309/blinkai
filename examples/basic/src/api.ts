import express, { Request, Response, RequestHandler } from 'express';
import { transfer } from './transfer';
import { createToken } from './create-token';
import { swapFourMeme } from './swap-four-meme';

const app = express();
app.use(express.json());

// Request body interface
interface WalletRequest {
  twitterHandle: string;
  request: string;
}

// Response interface
interface WalletResponse {
  success: boolean;
  response: string;
}

const transferHandler: RequestHandler = async (req, res) => {
  try {
    const { twitterHandle, request } = req.body as WalletRequest;
    const result = await transfer(twitterHandle, request);
    const response: WalletResponse = {
      success: true,
      response: result,
    };
    res.status(200).json(response);
  } catch (error) {
    const response: WalletResponse = {
      success: false,
      response: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(response);
  }
};

const createTokenHandler: RequestHandler = async (req, res) => {
  try {
    const { twitterHandle, request } = req.body as WalletRequest;
    const result = await createToken(twitterHandle, request);
    const response: WalletResponse = {
      success: true,
      response: result,
    };
    res.status(200).json(response);
  } catch (error) {
    const response: WalletResponse = {
      success: false,
      response: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(response);
  }
};

const swapFourMemeHandler: RequestHandler = async (req, res) => {
  try {
    const { twitterHandle, request } = req.body as WalletRequest;
    console.log('twitterHandle', twitterHandle);
    console.log('request', request);
    const result = await swapFourMeme(twitterHandle, request);
    const response: WalletResponse = {
      success: true,
      response: result,
    };
    res.status(200).json(response);
  } catch (error) {
    const response: WalletResponse = {
      success: false,
      response: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(response);
  }
};

app.post('/api/transfer', transferHandler);
app.post('/api/create-token', createTokenHandler);
app.post('/api/swap-four-meme', swapFourMemeHandler);
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
