from django.db import models


class Liked_Songs(models.Model):
    username = models.TextField()
    liked = models.TextField()

    def __str__(self):
        return self.username


class Song(models.Model):
    sid = models.TextField()
    n = models.IntegerField()
    title = models.TextField()
    thumb = models.TextField()
    dur = models.TextField()

    class Meta:
        ordering = ['-n']

    def __str__(self):
        return str(self.sid) + "---" +str(self.n)
