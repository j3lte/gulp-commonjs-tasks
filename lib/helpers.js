module.exports = {
  extend: function (to, from) {
    for (var key in from) {
      to[key] = from[key];
    }
    return to;
  },
  isArray: function (value) {
    return Object.prototype.toString.call(value) === '[object Array]' && typeof value.length === 'number';
  },
  isObject: function (value) {
    var type = typeof value;
    return !!value && (type === 'object' || type === 'function');
  },
  padRight : function (str, len) {
    if (str.length > len) {
      return str;
    }
    return str + Array(len - str.length + 1).join(' ');
  }
};