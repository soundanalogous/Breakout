This file contains details about the maintenance task which occurs in the
development process of Breakout.

Installation (dev)
------------------
1. Install [Node.js](http://nodejs.org/)
2. Install grunt-cli globally (may require `sudo`)

    ```bash
    $ npm install -g grunt-cli
    ```

3. Install Node modules

    ```bash
    $ npm install
    ```

Building a new release
----------------------

Execute the following command to build a release:

```bash
$ grunt
```

This process executes the following steps in order:

1. Check each file for lint
2. Concatenate files
3. Minify files
4. Run unit tests
5. Generate docs

If any step fails, the build process will exit.

Linting
-------
[JSHint](https://github.com/jshint/jshint/) is run for each file in the src 
directory during the build process.

```bash
$ grunt jshint
```

Concatenate and minify
----------------------

If you make changes to any files in the Breakout src directory, you will need
to concatenate and minify the src files.

```bash
$ grunt concat
```

```bash
$ grunt uglify
```

Running tests
-------------
Tests (in *Breakout/test/*) are run automatically at the end of the build process.
[phantomJS](http://phantomjs.org/) and [mocha-phantomjs](https://github.com/metaskills/mocha-phantomjs) are required to run tests via the build script.
See the README file in *Breakout/test/* for more info on running the tests.

```bash
$ grunt mocha_phantomjs
```

Updating the documentation
--------------------------
The documentation uses [yuidoc](http://yui.github.io/yuidoc/).
Generate the documentation by running: 

```bash
$ grunt yuidoc
```

Cleaning-up
-----------
Too much temp files in your directories, get rid of them.

```bash
$ find . -type f -name "*~" -print0 | xargs -0 rm
```


License
-------
Breakout is distributed under the terms of the MIT License.
