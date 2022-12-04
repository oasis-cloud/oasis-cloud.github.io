var ghpages = require('gh-pages');

ghpages.clean()
ghpages.publish('out', {
    branch: 'main',
    add: true,
    name: 'oasis',
    message: "Updates"
});
