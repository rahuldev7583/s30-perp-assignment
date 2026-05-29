import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running' });
});

app.post('/api/orders', (req, res) => {
  // must wait until the order is fully processed, then return the final result
  //  Do not return HTTP 400 for normal exchange rejections.
  //  Business failures like insufficient margin should return HTTP 200 with:
  //```json
  //{
  //  "status": "rejected",
  //  "reason": "insufficient margin",
  //  "fills": [],
  //  "remainingQuantity": 0,
  //  "cancelledQuantity": 10,
  //  "margin": {
  //    "locked": 0,
  //    "used": 0,
  //    "released": 0
  //  }
  //}
  //```
});

//GET /api/orderbook/:symbol
//GET /api/users/:userId/balance
//GET /api/users/:userId/positions

app.get('/api/orderbook/:symbol', (req, res) => {
  //
});

app.get('/api/users/:userId/balance', (req, res) => {
  //
});

app.get('/api/users/:userId/positions', (req, res) => {
  //
});

app.listen(3000, () => {
  console.log('server is running');
});
