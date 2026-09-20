const httpMocks = require('node-mocks-http');

function mockReqRes({ user = null, body = {}, params = {}, query = {}, headers = {}, file = null, method = 'GET', url = '/' } = {}) {
  const req = httpMocks.createRequest({ method, url, params, query, body, headers });
  req.user = user;
  if (file) req.file = file;
  const res = httpMocks.createResponse();
  return { req, res };
}

module.exports = { mockReqRes };
