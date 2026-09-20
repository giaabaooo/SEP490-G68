const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middleware/auth');
const authorize = require('../../../middleware/authorize');
const authOptional = require('../../../middleware/authOptional');
const { mockReqRes } = require('../../helpers/mockReqRes');

describe('middleware/auth', () => {
  test('UTC001 - khong co header Authorization -> 401 Unauthorized', () => {
    const { req, res } = mockReqRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('UTC002 - token hop le -> gan req.user va goi next()', () => {
    const token = jwt.sign({ id: 'u1', role: 'candidate' }, process.env.JWT_SECRET);
    const { req, res } = mockReqRes({ headers: { authorization: `Bearer ${token}` } });
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 'u1', role: 'candidate' });
  });

  test('UTC003 - token sai chu ky -> 401 Token invalid', () => {
    const badToken = jwt.sign({ id: 'u1' }, 'wrong-secret');
    const { req, res } = mockReqRes({ headers: { authorization: `Bearer ${badToken}` } });
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Token invalid' });
    expect(next).not.toHaveBeenCalled();
  });

  test('UTC004 - token het han -> 401 Token invalid', () => {
    const expiredToken = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const { req, res } = mockReqRes({ headers: { authorization: `Bearer ${expiredToken}` } });
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('middleware/authorize', () => {
  test('UTC005 - khong co req.user -> 401 Unauthorized', () => {
    const { req, res } = mockReqRes();
    const next = jest.fn();
    authorize(['admin'])(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('UTC006 - role nam trong allowedRoles -> goi next()', () => {
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'admin' } });
    const next = jest.fn();
    authorize(['admin', 'business'])(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  test('UTC007 - role khong nam trong allowedRoles -> 403 Access denied', () => {
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' } });
    const next = jest.fn();
    authorize(['admin'])(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res._getJSONData().message).toMatch(/Access denied/);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('middleware/authOptional', () => {
  test('UTC008 - khong co token -> req.user = null, van goi next()', () => {
    const { req, res } = mockReqRes();
    const next = jest.fn();
    authOptional(req, res, next);
    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('UTC009 - token hop le -> gan req.user, goi next()', () => {
    const token = jwt.sign({ id: 'u1', role: 'business' }, process.env.JWT_SECRET);
    const { req, res } = mockReqRes({ headers: { authorization: `Bearer ${token}` } });
    const next = jest.fn();
    authOptional(req, res, next);
    expect(req.user).toMatchObject({ id: 'u1', role: 'business' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('UTC010 - token khong hop le -> req.user = null (khong chan), van goi next()', () => {
    const { req, res } = mockReqRes({ headers: { authorization: 'Bearer invalid.token.here' } });
    const next = jest.fn();
    authOptional(req, res, next);
    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
