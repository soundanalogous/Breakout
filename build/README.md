Building Breakout
===

This readme file describes the Breakout build process. If you are changing any
of the Breakout source code (in `Breakout/src/`) and/or making a contribution to
Breakout you will need to follow this process.


Installing the build tools (dev)
---
Breakout uses [grunt](http://gruntjs.com/) to run the build tasks. The following
instructions will get you set up with Node.js (which is a requrement to run grunt)
and grunt so you can build Breakout.

1. Install [Node.js](http://nodejs.org/)
2. Install grunt-cli globally (may require `sudo`)

    ```bash
    $ npm install -g grunt-cli
    ```

3. Navigate to the `Breakout` directory execute the following command to install
the required Node modules. This will install everything you need to build Breakout.

    ```bash
    $ npm install
    ```

*Windows users, see the 'Does Grunt work on Windows?' FAQ [here](http://gruntjs.com/frequently-asked-questions) to get setup.*    

Building a new release
---
If you are contributing to Breakout and have changed any of the source files
(excluding example files) you must run the full build process before submitting
a pull request. Executing the following command will run the full build.

```bash
$ grunt
```

This process executes the following steps in order:

1. Check each file for lint
2. Concatenate files
3. Minify (uglify) files
4. Run unit tests
5. Generate docs

If any step fails, the build process will exit. Correct any errors in the source
code and run `grunt` again.

It can take a while to build a full release so if you just want to run one or
two of the build steps refer to the grunt commands in the following sections for
each of the build steps. For example, while you are working on a new feature it
may be convenient to just run `grunt compile` (which only takes a few seconds)
after making changes to the code rather than running the full build.


Linting
---
[JSHint](https://github.com/jshint/jshint/) is run to enfoce code quality. See
the jshint options set in `Breakout/.jshintrc`. To run jshint alone, execute the
following command:

```bash
$ grunt jshint
```


Concatenate and minify
---
If you make changes to any files in the Breakout src directory, you will need
to concatenate and minify (uglify) the src files. Run the `compile` command to 
concatenate and minify the files.

```bash
$ grunt compile
```

If you would only like to concatenate (and not minify) or vice versa, use one
of the following two commands:

```bash
$ grunt concat
```

```bash
$ grunt uglify
```


Running tests
---
Unit tests are written with [mocha](http://visionmedia.github.io/mocha/), [chai for expect](http://chaijs.com/api/bdd/) and [sinon](http://sinonjs.org/) for spies and stubs. [phantomJS](http://phantomjs.org/) is used to run the tests headlessly. phantomJS is installed when you run `npm install` so there is no need to install it separately. If you already have phantomJS
installed, there will not be a conflict.

The following command will run jshint and then the unit tests via phantomjs:

```bash
$ grunt test
```

Use the following command to run the unit tests without first running jshint:

```bash
$ grunt mocha_phantomjs
```

See the README file in `Breakout/test/` for more info on running the tests. If
you are contributing to Breakout and add any JavaScript to the src files (example
files are excluded) be sure to add unit tests for any new functionality. Refer to
the existing tests and fixtures in `Breakout/test/core/`as a guilde.


Updating the documentation
---
The documentation uses [yuidoc](http://yui.github.io/yuidoc/). Be sure to use the
yui doc syntax when documenting any added code. If you need to generate the docs
outside of the full build process, run the following command:

```bash
$ grunt docs
```


License
---
Breakout is distributed under the terms of the MIT License.
