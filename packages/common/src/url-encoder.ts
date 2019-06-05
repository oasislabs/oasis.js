export default class UrlEncoder {
  public static encode(params?: Object) {
    if (!params) {
      return '';
    }

    return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  }
}
