var ghpages = require('gh-pages');

ghpages.publish('out', {
    branch: 'main',
    dest: '.',
    add: true,
    push: false,
    name: 'oasis',
    message: "Updates"
});
