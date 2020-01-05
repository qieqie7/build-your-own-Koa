const proto = {};

const DEFAULT_DESCRIPTOR = { enumerable: false, configurable: true };

function delegateSet(property, name) {
  const descriptor = Object.getOwnPropertyDescriptor(proto, name) || DEFAULT_DESCRIPTOR;
  descriptor.set = function(val) {
    this[property][name] = val;
  };
  Object.defineProperty(proto, name, descriptor);
}

function delegateGet(property, name) {
  const descriptor = Object.getOwnPropertyDescriptor(proto, name) || DEFAULT_DESCRIPTOR;
  descriptor.get = function() {
    return this[property][name];
  };
  Object.defineProperty(proto, name, descriptor);
}

const requestSet = [];
const requestGet = ['query'];
const responseSet = ['body', 'status'];
const responseGet = responseSet;

requestSet.forEach(ele => delegateSet('request', ele));
requestGet.forEach(ele => delegateGet('request', ele));
responseSet.forEach(ele => delegateSet('response', ele));
responseGet.forEach(ele => delegateGet('response', ele));

module.exports = proto;
