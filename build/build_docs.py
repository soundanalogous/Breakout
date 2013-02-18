#!/usr/bin/env python

import os

def buildJSDocs():
    print "Building docs..."

    try:
        os.system("java -jar jsdoc-toolkit/jsrun.jar jsdoc-toolkit/app/run.js -a -t=jsdoc-toolkit/templates/jsdoc -r=2 ../src/ -d=../docs/")
    except:
        pass

def main(argv=None):

    buildJSDocs()

if __name__ == "__main__":
    main()

