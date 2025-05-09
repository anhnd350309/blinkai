import express, { Request, Response, RequestHandler } from 'express';
import { agentFunction } from './agent-function';

const agentFunctionHandler = async () => {
  const twitterHandle = '1722551467192860673';
  const request = 'Buy me 0.01 Sol token 7Z7zLN3TWN49YYWLCkH4neCoJ4UAGvxsFZz2Ho3D9kQ';
  console.log('twitterHandle', twitterHandle);
  console.log('request', request);
  const result = await agentFunction(twitterHandle, request);
  console.log('result', result);
};

agentFunctionHandler()
  .then(() => {
    console.log('Agent function handler executed successfully');
  })
  .catch(error => {
    console.error('Error executing agent function handler:', error);
  });
