const SimpleKoa = require('../src/application');

const app = new SimpleKoa();

app.use(async (ctx, next) => {
  ctx.body = 'cb1';
  console.log('use1: start');
  await next();
  console.log('use1: end');
});

app.use(async (ctx, next) => {
  ctx.body = 'cb2';
  console.log('use2: start');
  throw new Error('english error');
  await next();
  console.log('use2: end');
});

app.use(async (ctx, next) => {
  ctx.body = 'cb3';
  console.log('use3: start');
  await next();
  console.log('use3: end');
  ctx.body = 'hh';
});

app.on('error', error => {
  console.log('---------------');
  console.log(error);
});

app.listen(3000, () => console.log('listening on 3000'));
