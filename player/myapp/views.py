from os import path, listdir, mkdir
import sys


from .models import Liked_Songs
from .models import Song


try:
    import pafy
    import pytube
    import time
    import json
    from player import settings
    from youtubesearchpython import Search, Playlist, Suggestions
    from django.shortcuts import HttpResponse, render, redirect
    from django.http import JsonResponse
    from django.contrib import messages
    from django.contrib.auth.models import User, auth
except ImportError:
    print("Dependencies are not satisfied\nRun pip install -r requirements.txt on myEnv")
    sys.exit(1)


base_dir = settings.BASE_DIR
max_dur = 10000


def home(request):
    if request.method == "POST":
        videos = []
        if str(request.POST["query"])[0:10] == ":playlist:":
            p = pytube.Playlist(str(request.POST["query"])[10:])
            if len(p.title) > 50:
                print(p.videos[0].thumbnail_url)
                videos.append([p.playlist_id, str(p.title.replace('"', " ").replace(
                    "'", " "))[0:51] + " ...", str(p.videos[0].thumbnail_url), "playlist"])
            else:
                videos.append([p.playlist_id, str(p.title.replace('"', " ").replace(
                    "'", " "))[0:51], str(p.videos[0].thumbnail_url), "playlist"])

            return render(request, "songs_list.html", {"videos": videos})

        videosSearch = Search(str(request.POST["query"]), limit=30)
        data = videosSearch.result()["result"]
        new_v = []

        for x in range(len(data)):
            if data[x]["type"] == "video":
                dur = str(data[x]["duration"]).split(":")
                if videosSearch.result()["result"][x]["duration"] is not None:
                    new_v.append(data[x])
            elif data[x]["type"] == "playlist":
                new_v.append(data[x])

        for x in new_v:
            if x["type"] == "video":
                y = x["title"]
                if len(x["title"]) > 50:
                    y = x["title"][0:51] + " ..."
                videos.append([x["id"], y.replace("'", " ").replace(
                    '"', " "), x["thumbnails"][0], x["type"], x["duration"]])
            elif x["type"] == "playlist":
                if len(x["title"]) > 50:
                    videos.append([x['id'], x['title'].replace('"', " ").replace(
                        "'", " ")[0:51] + " ...", x["thumbnails"][0]["url"], x["type"]])
                else:
                    videos.append([x["id"], x["title"].replace('"', " ").replace(
                        "'", " "), x["thumbnails"][0]["url"], x["type"]])
        if request.user.is_authenticated:
            if len(Liked_Songs.objects.filter(username=request.user.username)) != 0:
                return render(request, "songs_list.html", {"videos": videos, "liked": json.loads(Liked_Songs.objects.filter(username=request.user.username)[0].liked)})
            else:
                return render(request, "songs_list.html", {"videos": videos})
        else:
            return render(request, "songs_list.html", {"videos": videos})

    if request.method == "GET":
        try:
            y_id = request.GET['id']
            if not len(y_id) < 11:
                videoInfo = pafy.new(y_id)

                if videoInfo.length > max_dur or videoInfo.length == 0:
                    return HttpResponse("3")

                song = videoInfo.getbestaudio()

                if path.exists(path.join(base_dir, "static/songs/" + y_id)) == False:
                    mkdir(path.join(base_dir, "static/songs/" + y_id))

                print("Downloading:", videoInfo.title)
                song.download(quiet=True, filepath=path.join(
                    base_dir, 'static/songs/' + y_id + "/" + y_id + "." + song.extension))
                print("Done:", videoInfo.title)
                song_data = Song.objects.filter(sid=y_id)
                if len(song_data) == 0:
                    n = Song(sid=y_id, n=1, title=videoInfo.title,
                             thumb=videoInfo.bigthumb, dur=videoInfo.duration)
                    n.save()
                else:
                    song_data[0].n = int(song_data[0].n) + 1
                    song_data[0].save()
                my_file = listdir(
                    path.join(base_dir, "static/songs/" + y_id))[0]
                if len(videoInfo.title) > 40:
                    return render(request, "share.html", {"song_url": "static/songs/" + y_id + "/" + my_file,  "song_title": videoInfo.title[:41] + " ...", "song_thumb": videoInfo.bigthumb, "song_id": y_id})
                return render(request, "share.html", {"song_url": "static/songs/" + y_id + "/" + my_file,  "song_title": videoInfo.title[:41] + " ...", "song_thumb": videoInfo.bigthumb, "song_id": y_id})
            else:
                return render(request, "index.html")
        except:
            most_played = Song.objects.all()
            mp = []
            for x in most_played:
                mp.append({"title": x.title if len(x.title) < 41 else x.title[:41]+"...",
                           "sid": x.sid,
                           "thumb": x.thumb,
                           "dur": x.dur})
            if request.user.is_authenticated:
                l = Liked_Songs.objects.filter(username=request.user.username)
                if len(l) != 0:
                    return render(request, "index.html", {"liked": json.loads(Liked_Songs.objects.filter(username=request.user.username)[0].liked), "objs": mp[:11]})
                else:
                    return render(request, "index.html", {"objs": mp[:11]})
            else:
                return render(request, "index.html", {"objs": mp[:11]})


def song(request):

    if request.method == "POST":
        y_id = request.POST['id']
        if not len(y_id) < 11:
            videoInfo = pafy.new(y_id)
            videoURL = videoInfo.getbestaudio().url

            if videoInfo.length > max_dur or videoInfo.length == 0:
                resp = {
                    "duration_high": True
                }
                return JsonResponse(resp)

            # if path.exists(path.join(base_dir, "static/songs/" + y_id)) == False:
            #     mkdir(path.join(base_dir, "static/songs/" + y_id))

            # print("Downloading:", videoInfo.title)

            # ydl_opts = {
            #     'format': 'bestaudio/best',
            #     'outtmpl': 'C:/Het Shah/YouTube_Player/player/static/songs' + '/' + y_id + '/' + y_id + '.%(ext)s'
            # }
            # with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            #     ydl.download(['https://www.youtube.com/watch?v='+y_id])
            # song.download(filepath=path.join(
            # base_dir, 'static/songs/' + y_id + "/" + y_id + "." + song.extension))
            song_data = Song.objects.filter(sid=y_id)
            if len(song_data) == 0:
                n = Song(sid=y_id, n=1, title=videoInfo.title,
                         thumb=videoInfo.bigthumb, dur=videoInfo.duration)
                n.save()
            else:
                song_data[0].n = int(song_data[0].n) + 1
                song_data[0].save()
            print(videoInfo.title)
            # my_file = listdir(path.join(base_dir, "static/songs/" + y_id))[0]
            if len(videoInfo.title) > 40:
                resp = {
                    # "path": "static/songs/" + y_id + "/" + my_file,
                    "title": videoInfo.title[:41] + " ...",
                    "thumb": videoInfo.bigthumb,
                    "author": videoInfo.author,
                    "url": videoURL,
                    "duration": videoInfo.length
                }
                return JsonResponse(resp)
            resp = {
                # "path": "static/songs/" + y_id + "/" + my_file,
                "title": videoInfo.title,
                "thumb": videoInfo.bigthumb,
                "author": videoInfo.author,
                "url": videoURL,
                "duration": videoInfo.length
            }

            return JsonResponse(resp)


def playlist(request):
    if request.method == "POST":
        p_id = request.POST["p_id"]
        p = pytube.Playlist("https://www.youtube.com/playlist?list=" + p_id)
        to_send = {}
        count = 0

        for x in p.videos:
            count += 1
            to_send[count] = {"id": x.video_id,
                              "title": x.title[:30] + " ...",
                              }

        return JsonResponse(to_send)


def suggestion(request):
    if request.method == "POST":
        word = request.POST["word"]
        s = Suggestions(region="US", language="en")
        su = s.get(word)["result"]
        return render(request, "suggestions.html", {"su": su})


def share(request):
    y_id = request.GET["id"]
    if request.method == "GET" and not (len(y_id) < 11):
        videoInfo = pafy.new(y_id)

        if videoInfo.length > max_dur or videoInfo.length == 0:
            return HttpResponse("3")

        song = videoInfo.getbestaudio()

        if path.exists(path.join(base_dir, "static/songs/" + y_id)) == False:
            mkdir(path.join(base_dir, "static/songs/" + y_id))

        print("Downloading:", videoInfo.title)
        song.download(quiet=True, filepath=path.join(
            base_dir, 'static/songs/' + y_id + "/" + y_id + "." + song.extension))
        print("Done:", videoInfo.title)
        my_file = listdir(path.join(base_dir, "static/songs/" + y_id))[0]
        if len(videoInfo.title) > 40:
            return render(request, "share.html", {"song_url": "static/songs/" + y_id + "/" + my_file,  "song_title": videoInfo.title[:41] + " ...", "song_thumb": videoInfo.bigthumb})
        return render(request, "share.html", {"song_url": "static/songs/" + y_id + "/" + my_file,  "song_title": videoInfo.title[:41] + " ...", "song_thumb": videoInfo.bigthumb})


def login(request):
    if not request.user.is_authenticated:
        if request.method == "POST":
            username = request.POST['username']
            password = request.POST['password']
            user = auth.authenticate(username=username, password=password)

            if user is not None:
                auth.login(request, user)
                return redirect("/")
            else:
                messages.info(request, "Invalid Credentials")
                return redirect('/login')
        else:
            return render(request, "login.html", {"title": "Login"})
    else:
        messages.info(request, "Seems like your are already logged in!")
        return redirect("/")


def logout(request):
    if request.user.is_authenticated:
        auth.logout(request)
        messages.info(request, "Successfully Logged Out!")
        return redirect('/')
    else:
        messages.info(
            request, "Seems like your are not logged in! Please login or register a new account!")
        return redirect("/")


def register(request):
    if not request.user.is_authenticated:
        if request.method == "POST":
            firstname = request.POST["firstname"]
            lastname = request.POST["lastname"]
            username = request.POST["username"]
            email = request.POST["email"]
            password = request.POST["password"]
            confirmpsw = request.POST["confirmpsw"]

            if firstname and lastname and username and email and password and confirmpsw != "":
                if confirmpsw == password:
                    if not User.objects.filter(username=username).exists():
                        if not User.objects.filter(email=email).exists():
                            user_inst = User.objects.create_user(first_name=firstname, last_name=lastname,
                                                                 username=username,
                                                                 email=email, password=password)
                            user_inst.save()
                            messages.info(
                                request, "Account Registered! Please log in to continue")
                            return redirect("/")
                        else:
                            messages.info(request, "Email already registered!")
                            return redirect("/register")
                    else:
                        messages.info(request, "Username already exists!")
                        return redirect("/register")
                else:
                    messages.info(request, "Password not matching!")
                    return redirect("/register")
            else:
                messages.info(request, "Fields are empty!")
                return redirect("/register")
        return render(request, "register.html", {"title": "Register"})
    else:
        messages.info(request, "You are already logged in!")
        return redirect("/")


def like(request):
    if request.user.is_authenticated:
        if request.method == "POST":
            u = request.user.username
            my_id = request.POST["id"]
            old_data = Liked_Songs.objects.filter(username=u)
            if len(old_data) == 0:
                if len(my_id) == 11:
                    vid = pafy.new(my_id)
                    data = {
                        my_id: {
                            "title": vid.title if len(vid.title) < 41 else vid.title[:41] + " ...",
                            "duration": vid.duration,
                            "type": "video",
                            "thumb": vid.bigthumb,
                            "time": time.time()
                        }
                    }
                    inst = Liked_Songs(username=u, liked=json.dumps(data))
                    inst.save()
                    return HttpResponse("0")
                else:
                    vid = Playlist.getInfo(
                        "https://www.youtube.com/playlist?list=" + my_id)
                    data = {
                        "title": vid["title"] if len(vid["title"]) < 41 else vid["title"][:41] + " ...",
                        "type": "playlist",
                        "thumb": vid["thumbnails"]["thumbnails"][-1]["url"],
                        "time": time.time()
                    }
                    inst = Liked_Songs(username=u, liked=json.dumps(data))
                    inst.save()
                    return HttpResponse("0")
            else:
                if len(my_id) == 11:
                    forcheck = json.loads(
                        Liked_Songs.objects.filter(username=u)[0].liked)
                    if my_id not in forcheck:
                        vid = pafy.new(my_id)
                        data = {
                            "title": vid.title if len(vid.title) < 41 else vid.title[:41] + " ...",
                            "duration": vid.duration,
                            "type": "video",
                            "thumb": vid.bigthumb,
                            "time": time.time()
                        }
                        old_data = Liked_Songs.objects.filter(username=u)[0]
                        new_data = json.loads(old_data.liked)
                        new_data[my_id] = data
                        old_data.liked = json.dumps(new_data)
                        old_data.save()
                        return HttpResponse("0")
                    else:
                        old_data = Liked_Songs.objects.filter(username=u)[0]
                        new_data = json.loads(old_data.liked)
                        del new_data[my_id]
                        old_data.liked = json.dumps(new_data)
                        old_data.save()
                        return HttpResponse("1")
                else:
                    forcheck = json.loads(
                        Liked_Songs.objects.filter(username=u)[0].liked)
                    if my_id not in forcheck:
                        vid = Playlist.getInfo(
                            "https://www.youtube.com/playlist?list=" + my_id)
                        data = {
                            "title": vid["title"] if len(vid["title"]) < 41 else vid["title"][:41] + " ...",
                            "type": "playlist",
                            "thumb": vid["thumbnails"]["thumbnails"][-1]["url"],
                            "time": time.time()
                        }
                        old_data = Liked_Songs.objects.filter(username=u)[0]
                        new_data = json.loads(old_data.liked)
                        new_data[my_id] = data
                        old_data.liked = json.dumps(new_data)
                        old_data.save()
                        return HttpResponse("0")
                    else:
                        old_data = Liked_Songs.objects.filter(username=u)[0]
                        new_data = json.loads(old_data.liked)
                        del new_data[my_id]
                        old_data.liked = json.dumps(new_data)
                        old_data.save()
                        return HttpResponse("1")

    else:
        messages.info(
            request, "Seems like your are not logged in! Please login or register a new account!")
        return redirect("/")


def lib(request):
    if request.user.is_authenticated:
        if request.method == "POST":
            if len(Liked_Songs.objects.filter(username=request.user.username)) != 0:
                data = json.loads(Liked_Songs.objects.filter(
                    username=request.user.username)[0].liked)
                return render(request, "liked.html", {"videos": data})
            else:
                return HttpResponse("No liked songs found!")
    else:
        return HttpResponse("Please authenticate first")
