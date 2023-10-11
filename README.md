<ol>
    <li>
        Navigate to 'player' folder and run `pip install -r requirements.txt`
    </li>
    <li>
        Comment out 'uploader_id' around line 1795 in myEnv\Lib\site-packages\youtube_dl\extractor\youtube.py
    </li>
    <li>
        Comment out `self._likes = self._ydl_info['like_count']` & `self._dislikes = self._ydl_info['dislike_count']` around line 53 in myEnv\Lib\site-packages\youtube_dl\extractor\youtube.py
    </li>
</ol>
Now run `manage.py runserver` to use the app on localhost
