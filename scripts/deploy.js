var ghpages = require('gh-pages');

ghpages.publish('out', {
    branch: 'main',
    add: true,
    name: 'oasis',
    message: "Updates"
});
