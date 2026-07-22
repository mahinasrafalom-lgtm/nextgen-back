export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'এই কাজটি কেবল অ্যাডমিন করতে পারবেন।' });
  }
  next();
}
