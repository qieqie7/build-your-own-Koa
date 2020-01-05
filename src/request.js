module.exports = {
  get query() {
    const params = {};
    // url 模块 是废弃模块不建议使用
    // req 中不包含 当前请求的完成 url, 暂时未解决: 如何获取完成url
    new URL(this.req.url, 'http://localhost:3000').searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  },
};
