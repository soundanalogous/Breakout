Building Breakout Server
===

Export Eclipse Project
---

1. File -> Export
2. Java -> Runnable JAR file
3. Runnable Jar File Specification
   1. Launch configuration: Select BreakoutServer from list
   2. Export destination: save to desktop as "BreakoutServer.jar"
   3. Library handling: Extract required libraries into generated JAR
   4. Save as ANT script (uncheck)


OSX Build
---

### Jar Bundler - Build Information Tab:

- Main Class: Select BreakoutServer.jar
- Arguments to Main: leave empty
- Custom Icon: Add BreakoutLogo.icns
- Use Macintosh Menu Bar (uncheck)
- Anti-alias Text (check)
- Anti-alias Graphics (check)
- JVM Version: 1.5+

### Jar Bundler - Classpath and Files Tab:

- Add librxtxSerial.jnilib (from Breakout/server/) to Additional Files and Resources

### Jar Bundler - Properties Tab:

- Type: APPL (default)
- Version: 0.2.0
- Signature: ???? (default)
- Identifier: com.breakoutjs
- Get-Info String: 0.2.0 Copyright Breakout Authors
- Allow Mixed Localizations (check)
- Development Region: English (default)
- Info Dictionary Version: 6.0 (default)

### Remove x86_64 portion from JavaApplicationStub

1. Navigate to: Breakout Server.app/Contents/MacOS/
2. lipo JavaApplicationStub -remove x86_64 -output JavaApplicationStub


Win Build
---

32 and 64 bit versions unfortunately require 2 separate programs.

### 32 bit (for 32 bit version of rxtxSerial.dll)

1. Download [exewrap096](http://code.google.com/p/exewrap/)
2. Copy BreakoutServer.jar, rxtxSerial.dll (32 bit) and BreakoutLogo.ico to the exewrap096 folder.
3. Run: exewrap.exe -g -i BreakoutLogo.ico -o "Breakout Server32.exe" -v 0.2.0.0 BreakoutServer.jar
4. Include the 32 bit version of rxtxSerial.dll with Breakout Server32.exe when distributing the app

### 64 bit (for 64 bit version of rxtxSerial.dll)

1. Download [launch4j](http://launch4j.sourceforge.net/)
2. Copy BreakoutServer.jar, rxtxSerial.dll (64 bit) and BreakoutLogo.ico to a new folder.
3. Copy Breakout/release/config.xml to same folder.
2. Open the Launch4j executable and load config.xml
3. Click the play button to build the exe file.
4. Include the 64 bit version of rxtxSerial.dll with Breakout Server64.exe when distributing the app


Linux Build
---

Include librxtxSerial.so and BreakoutLogo_512.png with BreakoutServer.jar

You may need to run: sudo apt-get install librxtx-java instead of copying librxtxSerial.so
