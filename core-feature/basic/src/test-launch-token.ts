import express, { Request, Response, RequestHandler } from 'express';
import { agentFunction } from './agent-function';

const agentFunctionHandler = async () => {
  const twitterHandle = '1722551467192860673';
  const request = 'Deploy token symbol: BITT, name: BTC';
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
