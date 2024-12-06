module.exports = {
  allowedHosts: ['.loca.lt', 'localhost'],
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      secure: false,
      changeOrigin: true,
    },
  },
  client: {
    webSocketURL: 'auto://0.0.0.0:0/ws',
  },
};
