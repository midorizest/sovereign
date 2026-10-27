"""Adds Sovereign's native pieces to the generated AndroidManifest.xml."""
import sys
p = sys.argv[1]
s = open(p).read()
perms = [
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    "android.permission.WAKE_LOCK",
    "android.permission.POST_NOTIFICATIONS",
]
add = "".join(f'    <uses-permission android:name="{x}" />\n' for x in perms if x not in s)
s = s.replace("</manifest>", add + "</manifest>")
service = ('        <service android:name=".SovereignAudioService" android:exported="false"\n'
           '            android:foregroundServiceType="mediaPlayback" />\n')
if "SovereignAudioService" not in s:
    s = s.replace("</application>", service + "    </application>")
open(p, "w").write(s)
print("manifest patched")
