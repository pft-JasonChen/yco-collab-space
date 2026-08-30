const networkPatterns = [
  {
    label: 'fetch',
    pattern: /\bfetch\s*\(/,
  },
  {
    label: 'XMLHttpRequest',
    pattern: /\bXMLHttpRequest\b/,
  },
  {
    label: 'WebSocket',
    pattern: /\bWebSocket\s*\(/,
  },
  {
    label: 'EventSource',
    pattern: /\bEventSource\s*\(/,
  },
  {
    label: 'axios',
    pattern: /\baxios(?:\.|\s*\()/,
  },
];

export function findNetworkApis(source) {
  return networkPatterns
    .filter(({ pattern }) => pattern.test(source))
    .map(({ label }) => label);
}
