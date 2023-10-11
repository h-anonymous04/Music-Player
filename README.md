<h4>Please follow given instrcutions to install dependencies and to ensure no errors comes when running app:</h4>
<ol>
    <li>
        Navigate to 'player' folder and run <code>pip install -r requirements.txt</code>
    </li>
    <li>
        Comment out <code>'uploader_id': self._search_regex(r'/(?:channel|user)/([^/?&#]+)', owner_profile_url, 'uploader id') if owner_profile_url else None</code> around line 1795 in myEnv\Lib\site-packages\youtube_dl\extractor\youtube.py
    </li>
    <li>
        Comment out <code>self._likes = self._ydl_info['like_count']</code> & <code>self._dislikes = self._ydl_info['dislike_count']</code> around line 53 in myEnv\Lib\site-packages\youtube_dl\extractor\youtube.py
    </li>
</ol>
Now run <code>manage.py runserver</code> to use the app on localhost
