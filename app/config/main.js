module.exports = {
  'http': {
    'port': process.env.PORT || 3000
  },
  'jwt': {
    'secret': process.env.JWT_SECRET
  },
  'mongo_url': process.env.MONGO_URL,
  'redis_url': process.env.REDIS_URL,
  'collection': 'collab_pages'
}
