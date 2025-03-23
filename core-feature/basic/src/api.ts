import express, { Request, Response, RequestHandler } from 'express';
import { agentFunction } from './agent-function';

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

const agentFunctionHandler: RequestHandler = async (req, res) => {
  try {
    const { twitterHandle, request } = req.body as WalletRequest;
    console.log('twitterHandle', twitterHandle);
    console.log('request', request);
    const result = await agentFunction(twitterHandle, request);
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

app.post('/api/agent-function', agentFunctionHandler);
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
