export default class StringUtils {
  static isBlank(str) {
    return !str || (/^\s*$/).test(str);
  }

  static toBool(str) {
    if (typeof str === 'boolean') {
      return str;
    }

    return (str || '').toLowerCase().trim() === 'true';
  }

  static toNumber(str, prec) {
    const factor = Math.pow(10, isFinite(prec) ? prec : 0);
    return Math.round(str * factor) / factor;
  }

  static toDate(str) {
    if (!str) {
      return '';
    }

    try {
      return new Date(str);
    } catch (err) {
      return str;
    }
  }

  // Like str.replace, but allows multiple values.
  // Example:
  //   replaceAll("foo bar foo", {foo:'a', bar:'b'}) == "a b a"
  static replaceMap(str, mapObj) {
    if (!str || !mapObj) {
      return str;
    }

    const re = new RegExp(Object.keys(mapObj).join('|'), 'gi');

    return str.replace(re, function (matched) {
      return mapObj[matched];
    });
  }

}
