"""Adds release signing to the generated android/app/build.gradle.
The keystore path and password come from the environment (GitHub secrets),
so nothing secret is ever written into the repository."""
import re, sys
p = sys.argv[1]
s = open(p).read()
if "signingConfigs" not in s:
    s = s.replace("    buildTypes {", """    signingConfigs {
        release {
            storeFile file(System.getenv("SOV_KEYSTORE"))
            storePassword System.getenv("SOV_KS_PASS")
            keyAlias "sovereign"
            keyPassword System.getenv("SOV_KS_PASS")
            storeType "pkcs12"
        }
    }
    buildTypes {""", 1)
    s, n = re.subn(r"(buildTypes \{\s*release \{)", r"\1\n            signingConfig signingConfigs.release", s, count=1)
    assert n == 1, "release build type not found"
open(p, "w").write(s)
print("release signing configured")
