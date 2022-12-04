var ghpages = require('gh-pages');

ghpages.publish('out', {
    branch: 'main',
    dest: './',
    add: true,
});
