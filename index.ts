import express from 'express';

const app = express();

app.use(express.json());

let users: any = [];

let orderbook: any = [];

let open_orders: any = [];

let fills = [];

let balances = [];

const matching_engine = (order: any) => {
  console.log({ order });

  if (orderbook.length > 0) {
    if (order.type == 'limit') {
      //push to orderbook if not matched
      console.log({ orderbook });
      console.log({ order });

      if (order.side == 'long') {
        //find that asset at lowest price in short side

        const find_matches = orderbook.filter((o) => {
          if (
            o.side === 'short' &&
            o.type === order.type &&
            o.price === order.price
          ) {
            return o;
          }
        });
        console.log({ find_matches });

        if (find_matches.length > 0) {
          let total_quan: any = 0;
          find_matches.map((o) => {
            total_quan += o.quantity;
          });

          console.log({ total_quan });

          //short side available continue

          if (total_quan >= order.quantity) {
            //fully filled
            const filled_quan = total_quan;
            const locked_margin =
              (order.price * order.quantity) / order.leverage;
            const actual_used = (order.price * filled_quan) / order.leverage;

            //actual used = maker fill price * filled quantity / leverage

            console.log({ locked_margin });
            fills.push({
              price: order.price,
              quantity: filled_quan,
              makerOrderId: 'maker',
              takerUserId: order.userId,
            });

            console.log({ fills });

            return {
              orderId: Math.random() * 100,
              status: 'filled',
              reason: 'order fully filled',
              fills,
              remainingQuantity: 0,
              cancelledQuantity: 0,
              margin: {
                locked: locked_margin,
                used: actual_used,
                released: 0,
              },
            };
          } else {
            //partially filled

            const filled_quan = order.quantity - total_quan;
            console.log({ filled_quan });

            const locked_margin =
              (order.price * order.quantity) / order.leverage;
            const actual_used = (order.price * filled_quan) / order.leverage;

            //actual used = maker fill price * filled quantity / leverage

            console.log({ locked_margin });
            fills.push({
              price: order.price,
              quantity: filled_quan,
              makerOrderId: 'maker',
              takerUserId: order.userId,
            });

            console.log({ fills });

            return {
              orderId: Math.random() * 100,
              status: 'partially filled',
              reason: 'order partially filled',
              fills,
              remainingQuantity: order.quantity - filled_quan,
              cancelledQuantity: 0,
              margin: {
                locked: locked_margin,
                used: actual_used,
                released: 0,
              },
            };
          }
        } else {
          orderbook.push(order);
          const locked_margin = (order.price * order.quantity) / order.leverage;
          const actual_used = 0;

          console.log({ locked_margin });
          return {
            orderId: Math.random() * 100,
            status: 'resting',
            reason: 'No asses on short side',
            fills: [],
            remainingQuantity: 0,
            cancelledQuantity: 0,
            margin: {
              locked: locked_margin,
              used: actual_used,
              released: 0,
            },
          };
        }

        //fill the available quantity
      } else if (order.side == 'short') {
        //find that asset at highest price
        console.log({ orderbook });

        const find_matches = orderbook.filter((o) => {
          if (
            o.side === 'long' &&
            o.type === order.type &&
            o.price === order.price
          ) {
            return o;
          }
        });
        console.log({ find_matches });

        if (find_matches.length > 0) {
          let total_quan: any = 0;
          find_matches.map((o) => {
            total_quan += o.quantity;
          });

          console.log({ total_quan });

          //short side available continue
        } else {
          orderbook.push(order);
          const locked_margin = (order.price * order.quantity) / order.leverage;
          const actual_used = 0;

          console.log({ locked_margin });
          return {
            orderId: Math.random() * 100,
            status: 'resting',
            reason: 'No asses on long side',
            fills: [],
            remainingQuantity: 0,
            cancelledQuantity: 0,
            margin: {
              locked: locked_margin,
              used: actual_used,
              released: 0,
            },
          };
        }
      }
    } else if (order.type == 'market') {
      //get the best available price
    }
  } else {
    orderbook.push(order);
    const locked_margin = (order.price * order.quantity) / order.leverage;
    const actual_used = 0;

    console.log({ locked_margin });

    return {
      orderId: Math.random() * 100,
      status: 'resting',
      reason: 'No asset available on orderbook',
      fills: [],
      remainingQuantity: 0,
      cancelledQuantity: 0,
      margin: {
        locked: locked_margin,
        used: actual_used,
        released: 0,
      },
    };
  }
};

type status =
  | 'resting'
  | 'filled'
  | 'partially_filled'
  | 'cancelled'
  | 'rejected';

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running' });
});

app.post('/api/reset', (req, res) => {
  //Reset all users, balances, positions, orders, funding, insurance fund, and ADL events.

  users = [];

  res.status(200).json({ message: 'Reset successfully' });
});

app.post('/api/users', (req, res) => {
  const req_body = req.body;

  const { userId, initialBalance } = req_body;

  const user = users.find((u) => u.userId == userId);

  if (user) {
    return res.status(401).json({ message: 'User already exist' });
  }

  users.push({ userId, initialBalance });

  //  console.log({ users });

  res.status(200).json({ message: 'User created successfully', userId });
});

app.post('/api/orders', (req, res) => {
  const req_body = req.body;

  const order = req.body;

  if (order.postOnly) {
    return res.status(404).json({ message: 'Post only not supported' });
  }

  const user = users.find((u) => u.userId == order.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  console.log({ order });

  const filled = matching_engine(order);

  console.log({ filled });

  /*
{
  "orderId": "order-1",
  "status": "filled",
  "reason": "optional reason",
  "fills": [
    {
      "price": 105,
      "quantity": 5,
      "makerOrderId": "order-0",
      "makerUserId": "maker",
      "takerUserId": "alice"
    }
  ],
  "remainingQuantity": 0,
  "cancelledQuantity": 0,
  "margin": {
    "locked": 525,
    "used": 525,
    "released": 0
  }
}
*/

  /*
rejected response must include

fills
remainingQuantity
cancelledQuantity
margin
reason
*/
  res.status(200).json(filled);
});

app.get('/api/orderbook/:symbol', (req, res) => {
  //
});

app.get('/api/users/:userId/balance', (req, res) => {
  //
});

app.get('/api/users/:userId/positions', (req, res) => {
  //
});

app.post('/api/mark-price', (req, res) => {
  //must run liquidation immediately when runLiquidation is true.
});

app.post('/api/funding', (req, res) => {
  //must run liquidation immediately when runLiquidation is true.
});

app.get('/api/insurance-fund/:symbol', (req, res) => {});

app.get('api/adl-events', (req, res) => {});

app.listen(3000, () => {
  console.log('server is running');
});
