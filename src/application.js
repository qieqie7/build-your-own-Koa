const http = require('http');
const EventEmitter = require('events');
const context = require('./context');
const request = require('./request');
const response = require('./response');

class Application extends EventEmitter {
  constructor() {
    super();
    this.middleware = [];
    this.context = context;
    this.request = request;
    this.response = response;
  }

  /**
   * @description 开启 http server 并传入 callback
   * @date 2020-01-05
   * @param {*} args
   * @memberof Application
   */
  listen(...args) {
    const server = http.createServer(this.callback());
    server.listen(...args);
  }

  /**
   * @description 挂载回调函数
   * @date 2020-01-05
   * @param {function} fn
   * @memberof Application
   */
  use(fn) {
    this.middleware.push(fn);
  }

  /**
   * @description 获取 http server 所需要的 callback 函数
   * @date 2020-01-05
   * @returns {function} fn
   * @memberof Application
   */
  callback() {
    return (req, res) => {
      let ctx = this.createContext(req, res);
      let respond = () => this.responseBody(ctx);
      let onerror = error => this.onerror(error, ctx);
      this.compose(ctx)
        .then(respond)
        .catch(onerror);
    };
  }

  /**
   * @description 构造ctx
   * @date 2020-01-05
   * @param {object} req node req 实例
   * @param {object} res node res 实例
   * @returns {object} ctx 实例
   * @memberof Application
   */
  createContext(req, res) {
    const ctx = Object.create(this.context);
    ctx.request = Object.create(this.request);
    ctx.response = Object.create(this.response)

    ctx.req = ctx.request.req = req;
    ctx.res = ctx.response.res = res;
    return ctx;
  }

  /**
   * @description 处理完成后, 最后对客服端回复
   * @date 2020-01-05
   * @param {*} ctx ctx 实例
   * @memberof Application
   */
  responseBody(ctx) {
    console.log(ctx.body);
    const content = ctx.body;
    if (typeof content === 'string') {
      ctx.res.end(content);
    } else if (typeof content === 'object') {
      ctx.res.end(JSON.stringify(content));
    }
  }

  compose(ctx) {
    const createNext = (middleware, oldCb) => async () => middleware(ctx, oldCb);
    let next = async () => {};
    for (let i = this.middleware.length - 1; i >= 0; i--) {
      next = createNext(this.middleware[i], next);
    }
    return next();
  }

  onerror(error, ctx) {
    ctx.status = 500;
    if (error.code === 'ENOENT') {
      ctx.status = 404;
    }
    let msg = error.message || 'Internal error';
    console.log(ctx.status);
    ctx.res.end(msg);
    this.emit('error', error);
  }
}

module.exports = Application;
