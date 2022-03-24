// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the BLOCKLIST from the command-line so that we can update the BLOCKLIST without deploying
// again. CORS Anywhere is open by design, and this BLOCKLIST is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originAllowList instead.
var originBlockList = parseEnvList(process.env.CORSANYWHERE_BLOCKLIST);
var originAllowList = parseEnvList(process.env.CORSANYWHERE_ALLOWLIST);
var originBlackList = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhiteList = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originBlockList: originBlockList,
  originAllowList: originAllowList,
  originBlackList: originBlackList,
  originWhiteList: originWhiteList,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
}).listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
