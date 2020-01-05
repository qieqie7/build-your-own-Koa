# Build your own KOA

> 本文参考自百度@马龄阳同学, 仅供学习参考使用

## 四条主线

- 封装 node http Server
- 构造 request, response, context 对象
- 中间件机制
- 错误处理

## 封装 node http Server

### 从 hello world 说起

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('hello world');
});

server.listen(3000, () => console.log('listening on 3000'));
```

KOA 是如何实现返回`hello world`的呢?

```javascript
const Koa = require('koa');

const app = new Koa();

app.use(async ctx => {
  res.body = 'hello world';
});

app.listen(3000, () => console.log('listening on 3000'));
```

创建`src/application.js`文件, 实现 KOA 的 `app.use` / `app.listen` API :

```javascript
const http = require('http');

class Application {
  constructor() {
    this.callbackFunc;
  }

  /**
   * @description 开启 http server 并传入 callback
   */
  listen(...args) {
    const server = http.createServer(this.callback());
    server.listen(...args);
  }

  /**
   * @description 挂在回调函数
   */
  use(fn) {
    this.callbackFunc = fn;
  }

  /**
   * @description 获取 http server 所需要的 callback 函数
   */
  callback() {
    return (req, res) => {
      this.callbackFunc(req, res);
    };
  }
}

module.exports = Application;
```

### 构造 request, response, context 对象

美中不足, 上面的 SimpleKoa 使用的 request, response 依旧使用过的是原生的属性, 难用! 下面我们开始提供我们自己的这些对象.

- request: 对于 node 原生 request 对象的封装
- response: 对于 node 原生 response 对象的封装
- context: 挂在了 koa request response 的对象

详细见:

- request(`/src/request.js`)
- response(`/src/response.js`)
- context(`/src/context.js`)

`Application` 增加了两个新的方法

```javascript
// ...
const context = require('./context');
const request = require('./request');
const response = require('./response');

class Application {
  constructor() {
    this.callbackFunc;
    // 挂在这些属性
    this.context = context;
    this.request = request;
    this.response = response;
  }

  // ...

  /**
   * @description 获取 http server 所需要的 callback 函数
   */
  callback() {
    return (req, res) => {
      let ctx = this.createContext(req, res);
      let respond = () => this.responseBody(ctx);
      // 最后执行 respond 修改 res.end(content)
      this.callbackFunc(ctx).then(respond);
    };
  }

  /**
   * @description 为每一个请求构造ctx
   */
  createContext(req, res) {
    const ctx = Object.create(this.context);
    ctx.request = Object.create(this.request);
    ctx.response = Object.create(this.response);
    ctx.req = ctx.request.req = req;
    ctx.res = ctx.response = res;
    return ctx;
  }

  /**
   * @description 处理完成后, 最后对客服端回复
   */
  responseBody(ctx) {
    const content = ctx.body;
    if (typeof content === 'string') ctx.res.end(content);
    else if (typeof content === 'object') ctx.res.end(JSON.stringify(content));
  }
}
```

## 中间件机制

```javascript
async function cb1(next) {
  console.log('cb1 start');
  await next();
  console.log('cb1 end');
}

async function cb2(next) {
  console.log('cb2 start');
  await next();
  console.log('cb2 end');
}

async function cb3(next) {
  console.log('cb3 all');
}

// 如何实现 cb1 start -> cb2 start -> cb3 all -> cb2 end -> cb1 end
```

先思考如何完成`cb2 start -> cb3 all -> cb2 end`;

```javascript
const next3 = async () => cb3();

cb2(next3);
```

加上`cb1`

```javascript
const next2 = async () => cb2(next3);

cb1(next2);
```

把 `next` 抽象一下:

```javascript
function createNext(middleware, oldCb) {
  return async () => middleware(oldCb);
}

const next3 = createNext(cb3, null);
const next2 = createNext(cb2, next3);
const next1 = createNext(cb1, next2);

next1();
```

当有 n 个的情况呢?

```javascript
const cbList = [
  async function cb1(next) {
    console.log('cb1 start');
    await next();
    console.log('cb1 end');
  },
  async function cb2(next) {
    console.log('cb2 start');
    await next();
    console.log('cb2 end');
  },
  async function cb3(next) {
    console.log('cb3 all');
  },
];

let next = async () => {};

for (let i = cbList.length - 1; i >= 0; i--) {
  next = createNext(cbList[i], next);
}

next();
```

修改`Application`:
