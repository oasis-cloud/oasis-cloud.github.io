var ghpages = require('gh-pages')

ghpages.clean()
ghpages.publish('dist', {
  branch: 'main',
  add: true,
  name: 'oasis',
  message: 'Updates',
})
