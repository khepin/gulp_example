# Gulp with no local example

## Working project

The `/working_project` of this example is a very very simple gulp task that
concatenates two files and outputs the resulting file to the `build` folder.

It makes use of `gulp-concat` as a plugin, but no plugins are installed locally.

## global_gulp.js

This is the gulp command line file that gives you the command line gulp.
It has been changed so that:

 * it doesn't break whenever there is a version mismatch or no local gulp found
 * it falls back to loading the global gulp if it can't find a local one:

```javascript
var gulpInst;
try {
  gulpInst = require(env.modulePath);
} catch(e) {
  gulpInst = require('gulp');
}
```


instead of:

    var gulpInst = require(env.modulePath);

## Gulp plugins

### As global install

From here, if we run `npm install -g gulp-concat` and then in our working_project:
`gulp`, the result is a working build that outputs the expected file in the
build folder of the `working_project`.

### Somewhere in the path

The `gulp_plugins` folder contains an install of `gulp-concat`. If we now remove
the global install we had for `gulp-install`, things stop working (obviously).

We can then do the following:

 * `cd working_project`
 * `export NODE_PATH="......:/path/to/gulp_example/gulp_plugins/node_modules"`
 * `gulp`

And the build is passing as expected.

# Thoughts

I think while still keeping the local gulp install whenever it is present, keeping
this as a fallback allows quite some flexibility based only on standard node
mechanisms. Right now this flexibility cannot be easily achieved.

I'm also not sure what was meant about the fact that global module cannot require
other global modules. Here we only have require statements in 2 places:

 * In the gulp command file, which is global, but maybe since we require our own
 module, then this is considered fine by node.
 * In the gulpfile.js of the project, but this is not a global module so it has
 access to anything as long as it is in the `NODE_PATH`
