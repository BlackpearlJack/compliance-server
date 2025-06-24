const { isAdmin, requireAuth } = require('../../middleware/auth');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireAuth', () => {
    test('should call next() when user is authenticated', () => {
      req.session.user = { id: 1, username: 'testuser' };

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not authenticated', () => {
      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when session exists but no user', () => {
      req.session = {};

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    test('should call next() when user is admin', () => {
      req.session.user = { id: 1, username: 'admin', role: 'admin' };

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 403 when user is not admin', () => {
      req.session.user = { id: 1, username: 'user', role: 'user' };

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 when user is not authenticated', () => {
      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 when user has no role', () => {
      req.session.user = { id: 1, username: 'user' };

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
