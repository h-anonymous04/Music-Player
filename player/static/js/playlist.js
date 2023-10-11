{
  var playlist = {};
  var suggestionsCache = {};
  var any_open = false;
  var crr = 0;
  var xhr;
  var aud = new Audio();
  aud.volume = 0.8;
  var isQueueOpen = false;
  var multiFac = 1;
  if ("mediaSession" in navigator) {
    var media_session = true;
  }
  if (Storage !== "undefined") {
    if (localStorage.getItem("lastSong") != null && aud.src == "") {
      xhr = new XMLHttpRequest();
      var fd = new FormData();
      fd.append("id", localStorage.getItem("lastSong"));
      fd.append(
        "csrfmiddlewaretoken",
        $("input[name=csrfmiddlewaretoken]").val()
      );
      xhr.open("POST", "song/", true);
      xhr.addEventListener("loadstart", function () {
        $(".player .s-title").html(
          "<i class='fa fa-circle-o-notch fa-spin'></i>"
        );
        document.getElementById("prev_song").disabled = true;
        document.getElementById("next_song").disabled = true;
      });
      xhr.onreadystatechange = function () {
        if (this.status == 500) {
          $(".status span").html(
            "An error has occured! Please retry or refresh!"
          );
          $(".status").fadeIn(200).delay(1000).fadeOut(200);
          let a = document.getElementsByTagName("button");
          for (var v = 0; v <= a.length; v++) {
            a[v].disabled = false;
          }
          // document.getElementsByTagName("button").disabled = false;
          return 0;
        }
      };
      xhr.onload = function () {
        var data_recv = JSON.parse(this.responseText.toString());
        console.log(data_recv["thumb"]);
        if (data_recv["duration_high"] == true) {
          $(".player .s-title").html(
            "Cannot play songs having duration more than 20mins"
          );
          return 0;
        }
        aud.src = data_recv["url"];
        aud.load();
        aud.currentTime = localStorage.getItem("wasPlayingAt");
        if (media_session) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: data_recv["title"],
            artwork: [{ src: data_recv["thumb"] }],
            artist: data_recv["author"],
          });
          navigator.mediaSession.setActionHandler("play", function () {
            if (aud.paused == true) {
              aud.play();
              $(".song-controls #pause_play").html(
                '<i class="fa fa-pause"></i>'
              );
            } else {
              aud.pause();
              $(".song-controls #pause_play").html(
                '<i class="fa fa-play"></i>'
              );
            }
          });
          navigator.mediaSession.setActionHandler("nexttrack", function () {
            nextSong();
          });
          navigator.mediaSession.setActionHandler("previoustrack", function () {
            prevSong();
          });
        }
        $("title").html(data_recv["title"]);
        $(".player .s-img").attr("src", data_recv["thumb"]);
        $(".player .s-title").html(data_recv["title"]);
        $("#dlink").attr("href", data_recv["url"]);
        $("button").attr("data-id", localStorage.getItem("lastSong"));
        setRangeOfAud(
          data_recv["duration"],
          localStorage.getItem("wasPlayingAt")
        );
        document.getElementById("prev_song").disabled = false;
        document.getElementById("next_song").disabled = false;
      };
      xhr.send(fd);
    }
    if (localStorage.getItem("queue") != null) {
      playlist = JSON.parse(localStorage.getItem("queue"));
      crr = parseInt(JSON.parse(localStorage.getItem("crr")));
    }
    updateQueueDisp();
  }

  function addSong(y_id, title, crr_el) {
    crr_el.disabled = true;
    size = Object.keys(playlist).length;
    playlist[size + 1] = [y_id.toString(), title];
    var queue_data = JSON.stringify(playlist);
    localStorage.setItem("queue", queue_data);
    $(".status span").html("Added to your queue.");
    $(".status").fadeIn(200).delay(1000).fadeOut(200);
    updateQueueDisp();
    crr_el.disabled = false;
  }

  function setRangeOfAud(m, c) {
    document.getElementById("aud_range").min = 0;
    document.getElementById("aud_range").max = m * multiFac;
    document.getElementById("aud_range").value = c * multiFac;
  }

  function removeSug() {
    if ($(".search-i").val().trim() == "") {
      $(".suggestions ul").html("");
    }
  }

  setInterval(removeSug, 500);

  function addPlaylist(id, t) {
    var fd = new FormData();
    t.disabled = true;
    var xhr = new XMLHttpRequest();
    fd.append("p_id", id);
    fd.append(
      "csrfmiddlewaretoken",
      $("input[name=csrfmiddlewaretoken]").val()
    );
    xhr.open("POST", "playlist/", true);
    xhr.addEventListener("loadstart", function () {
      $(t).html("<i class='fa fa-circle-o-notch fa-spin'></i>");
    });
    xhr.onload = function () {
      var vids = JSON.parse(this.responseText.toString());
      var size = Object.keys(vids).length;
      for (var o = 1; o <= size; o++) {
        playlist[o] = [vids[o]["id"], vids[o]["title"]];
      }
      crr = 0;
      localStorage.setItem("crr", crr);
      localStorage.setItem("queue", JSON.stringify(playlist));
      updateQueueDisp();
      $(t).html('<i class="fa fa-plus"></i>');
      t.disabled = false;
    };
    xhr.onreadystatechange = function () {
      if (this.status == 500) {
        $(".status span").html(
          "An error has occured! Please retry or refresh!"
        );
        $(".status").fadeIn(200).delay(1000).fadeOut(200);
        let a = document.getElementsByTagName("button");
        for (var v = 0; v <= a.length; v++) {
          a[v].disabled = false;
        }
        // document.getElementsByTagName("button").disabled = false;
        return 0;
      }
    };
    xhr.send(fd);
  }

  var d = 100;
  var timer;
  $(".search-i").on("keyup", function () {
    clearTimeout(timer);
    timer = setTimeout(typing, d);
  });

  $(".search-i").on("keydown", function () {
    clearTimeout(timer);
  });

  $("#close_s").on("click", function () {
    $(".suggestions").html("");
  });

  function updateVal(t) {
    if ($(t).val() == "") {
      $(".suggestions ul").html("<ul></ul>");
    }
    document.getElementById("query").value = $(t).html();
    var searchQuery = document.getElementById("query").value.trim();
    upPlayer();
    formData = new FormData();
    formData.append("query", searchQuery);
    formData.append(
      "csrfmiddlewaretoken",
      $("input[name=csrfmiddlewaretoken]").val()
    );
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);
    xhr.onreadystatechange = function () {
      if (this.status == 500) {
        $(".status span").html(
          "An error has occured! Please retry or refresh!"
        );
        $(".status").fadeIn(200).delay(1000).fadeOut(200);
        let a = document.getElementsByTagName("button");
        for (var v = 0; v <= a.length; v++) {
          a[v].disabled = false;
        }
        // document.getElementsByTagName("button").disabled = false;
        return 0;
      }
    };
    xhr.setRequestHeader(
      "X-CSRF-Token",
      $("input[name='csrfmiddlewaretoken']").val()
    );
    xhr.onloadstart = function () {
      $("#data").html(
        "<div class='song-info' style='width: 100%; height: 100px;'><i class='fa fa-circle-o-notch fa-spin'></i></div>"
      );
    };
    xhr.onload = function () {
      document.getElementById("data").innerHTML = this.responseText;
    };
    xhr.send(formData);
  }
  function closeS() {
    $(".suggestions ul").html("");
  }
  function typing() {
    var t = $(".search-i").val();
    if (t.trim() !== "") {
      if (t in suggestionsCache) {
        $(".suggestions ul").html(suggestionsCache[t]);
      } else {
        var xhr = new XMLHttpRequest();
        var fd = new FormData();
        fd.append("word", t);
        fd.append(
          "csrfmiddlewaretoken",
          $("input[name=csrfmiddlewaretoken]").val()
        );
        xhr.onload = function () {
          var s = this.status;
          if (s != 500 || s != "500") {
            var data_recv = this.responseText;
            $(".suggestions ul").html(data_recv);
            suggestionsCache[t] = data_recv;
          }
        };
        xhr.onreadystatechange = function () {
          if (this.status == 500) {
            $(".status span").html(
              "An error has occured! Please retry or refresh!"
            );
            $(".status").fadeIn(200).delay(1000).fadeOut(200);
            let a = document.getElementsByTagName("button");
            for (var v = 0; v <= a.length; v++) {
              a[v].disabled = false;
            }
            // document.getElementsByTagName("button").disabled = false;
            return 0;
          }
        };
        xhr.open("POST", "search/", true);
        xhr.send(fd);
      }
    }
  }

  function toogleQueueDisp() {
    var myQueueCont = $(".s-data");
    //var myQueue = $(".s-data .sdata.main");
    if (isQueueOpen) {
      myQueueCont.css("display", "none");
      $("body").css("overflow-y", "scroll");
      isQueueOpen = false;
    } else {
      myQueueCont.css({ display: "flex" });
      $("body").css("overflow-y", "hidden");
      isQueueOpen = true;
    }
  }

  $("#close_q").on("click", toogleQueueDisp);
  $("#showQ").on("click", toogleQueueDisp);

  function updateQueueDisp() {
    $(".s-data-queue ul").html("<i class='fa fa-circle-o-notch fa-spin></i>'");
    if (Object.keys(playlist).length == 0) {
      $(".s-data-queue ul").html("Empty...");
      return;
    }
    for (var a = 1; a <= Object.keys(playlist).length; a++) {
      var title_song = playlist[a][1];
      var data_ =
        '<li class="list-group-item text-light" style="background: transparent"><div><b>' +
        title_song +
        '</b></div><div class="btn btn-group"><button class="btn bg-dark text-light" onclick="removeSong(this)" data-q-indx="' +
        a +
        '"><i class="fa fa-close"></i></button><button class="btn bg-dark text-light" type="button" onclick="pause_play(this)" data-q-indx="' +
        a +
        '"><i class="fa fa-pause"></i></button></div></li>';
      if (crr == a) {
        $(".s-data-queue ul").append(data_);
      } else {
        $(".s-data-queue ul").append(
          '<li class="list-group-item text-light" style="background: transparent"><div>' +
            title_song +
            '</div><div class="btn btn-group"><button class="btn bg-dark text-light" onclick="removeSong(this)" data-q-indx="' +
            a +
            '"><i class="fa fa-close"></i></button><button class="btn bg-dark text-light" type="button" data-q-indx="' +
            a +
            '" onclick="playQueueSong(this)"><i class="fa fa-play"></i></button></div></li>'
        );
      }
    }
  }

  function removeSong(t) {
    var songToRemove = parseInt($(t).attr("data-q-indx"));
    if (songToRemove == crr) {
      crr = 0;
    }
    if (songToRemove < crr) {
      crr -= 1;
    }
    for (var p = songToRemove; p <= Object.keys(playlist).length; p++) {
      playlist[p] = playlist[p + 1];
    }
    for (var p = 0; p <= Object.keys(playlist).length; p++) {
      if (playlist[p] === undefined) {
        delete playlist[p];
      }
    }
    localStorage.setItem("queue", JSON.stringify(playlist));
    localStorage.setItem("crr", crr);
    updateQueueDisp();
  }

  function pause_play(t) {
    if (aud.paused == true) {
      aud.play();
      $(t).html('<i class="fa fa-pause"></i>');
      $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
    } else {
      aud.pause();
      $(t).html('<i class="fa fa-play"></i>');
      $(".song-controls #pause_play").html('<i class="fa fa-play"></i>');
    }
  }

  function playQueueSong(t) {
    var song_idx = $(t).attr("data-q-indx");
    xhr.abort();
    xhr = new XMLHttpRequest();
    var fd = new FormData();
    fd.append("id", playlist[song_idx][0]);
    fd.append(
      "csrfmiddlewaretoken",
      $("input[name=csrfmiddlewaretoken]").val()
    );
    xhr.open("POST", "song/", true);
    xhr.addEventListener("loadstart", function () {
      document.getElementById("prev_song").disabled = true;
      document.getElementById("next_song").disabled = true;
      $(".player .s-title").html(
        "<i class='fa fa-circle-o-notch fa-spin'></i>"
      );
      $(t).html("<i class='fa fa-circle-o-notch fa-spin'></i>");
      $(t).disabled = true;
    });
    xhr.onreadystatechange = function () {
      if (this.status == 500) {
        $(".status span").html(
          "An error has occured! Please retry or refresh!"
        );
        $(".status").fadeIn(200).delay(1000).fadeOut(200);
        let a = document.getElementsByTagName("button");
        for (var v = 0; v <= a.length; v++) {
          a[v].disabled = false;
        }
        // document.getElementsByTagName("button").disabled = false;
        return 0;
      }
    };
    xhr.onload = function () {
      var data_recv = JSON.parse(this.responseText.toString());
      aud.src = data_recv["url"];
      aud.load();
      aud.play();
      $(t).disabled = false;
      localStorage.setItem("lastSong", playlist[song_idx][0]);
      crr = parseInt(song_idx);
      $("button").attr("data-id", playlist[song_idx][0]);
      localStorage.setItem("crr", crr);
      updateQueueDisp();
      $("#dlink").attr("href", data_recv["url"]);
      $(".player .s-img").attr("src", data_recv["thumb"]);
      $("title").html(data_recv["title"]);
      setRangeOfAud(data_recv["duration"], 0);
      if (media_session) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: data_recv["title"],
          artwork: [{ src: data_recv["thumb"] }],
          artist: data_recv["author"],
        });
        navigator.mediaSession.setActionHandler("play", function () {
          if (aud.paused == true) {
            aud.play();
            $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
          } else {
            aud.pause();
            $(".song-controls #pause_play").html('<i class="fa fa-play"></i>');
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", function () {
          nextSong();
        });
        navigator.mediaSession.setActionHandler("previoustrack", function () {
          prevSong();
        });
      }
      $(".player .s-title").html(data_recv["title"]);
      $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
      document.getElementById("prev_song").disabled = false;
      document.getElementById("next_song").disabled = false;
    };
    xhr.send(fd);
  }

  function nextSong() {
    if (Object.keys(playlist).length == 0) {
      $(".status span").html("Queue is empty!");
      $(".status").fadeIn(200).delay(1000).fadeOut(200);
    } else if (crr + 1 > Object.keys(playlist).length) {
      $(".status span").html("No more songs in Queue!");
      $(".status").fadeIn(200).delay(1000).fadeOut(200);
    } else {
      xhr = new XMLHttpRequest();
      var fd = new FormData();
      fd.append("id", playlist[crr + 1][0]);
      fd.append(
        "csrfmiddlewaretoken",
        $("input[name=csrfmiddlewaretoken]").val()
      );
      xhr.open("POST", "song/", true);
      xhr.addEventListener("loadstart", function () {
        $(".player .s-title").html(
          "<i class='fa fa-circle-o-notch fa-spin'></i>"
        );
        document.getElementById("prev_song").disabled = true;
        document.getElementById("next_song").disabled = true;
      });
      xhr.onreadystatechange = function () {
        if (this.status == 500) {
          $(".status span").html(
            "An error has occured! Please retry or refresh!"
          );
          $(".status").fadeIn(200).delay(1000).fadeOut(200);
          let a = document.getElementsByTagName("button");
          for (var v = 0; v <= a.length; v++) {
            a[v].disabled = false;
          }
          // document.getElementsByTagName("button").disabled = false;
          return 0;
        }
      };
      xhr.onload = function () {
        var data_recv = JSON.parse(this.responseText.toString());
        if (data_recv["duration_high"] == true) {
          $(".player .s-title").html(
            "Cannot play songs having duration more than 60mins"
          );
          return 0;
        }
        aud.src = data_recv["url"];
        aud.load();
        aud.play();
        $("#dlink").attr("href", data_recv["url"]);
        localStorage.setItem("lastSong", playlist[crr + 1][0]);
        $("button").attr("data-id", playlist[crr + 1][0]);
        $("#aud_range").max = aud.duration;
        $(".player .s-img").attr("src", data_recv["thumb"]);
        setRangeOfAud(data_recv["duration"], 0);
        crr = crr + 1;
        localStorage.setItem("crr", crr);
        updateQueueDisp();
        if (media_session) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: data_recv["title"],
            artwork: [{ src: data_recv["thumb"] }],
            artist: data_recv["author"],
          });
          navigator.mediaSession.setActionHandler("play", function () {
            if (aud.paused == true) {
              aud.play();
              $(".song-controls #pause_play").html(
                '<i class="fa fa-pause"></i>'
              );
            } else {
              aud.pause();
              $(".song-controls #pause_play").html(
                '<i class="fa fa-play"></i>'
              );
            }
          });
          navigator.mediaSession.setActionHandler("nexttrack", function () {
            nextSong();
          });
          navigator.mediaSession.setActionHandler("previoustrack", function () {
            prevSong();
          });
        }
        $("title").html(data_recv[1]);
        $(".player .s-title").html(data_recv["title"]);
        $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
        document.getElementById("prev_song").disabled = false;
        document.getElementById("next_song").disabled = false;
      };
      xhr.send(fd);
    }
  }

  function prevSong() {
    // var aud = document.getElementById("aud");
    if (Object.keys(playlist).length == 0) {
      $(".status span").html("Queue is empty!");
      $(".status").fadeIn(200).delay(1000).fadeOut(200);
    } else if (crr - 1 <= 0) {
      $(".status span").html("There is no song!");
      $(".status").fadeIn(200).delay(1000).fadeOut(200);
    } else {
      xhr = new XMLHttpRequest();
      var fd = new FormData();
      fd.append("id", playlist[crr - 1][0]);
      fd.append(
        "csrfmiddlewaretoken",
        $("input[name=csrfmiddlewaretoken]").val()
      );
      xhr.open("POST", "song/", true);
      xhr.addEventListener("loadstart", function () {
        $(".player .s-title").html(
          "<i class='fa fa-circle-o-notch fa-spin'></i>"
        );
        document.getElementById("prev_song").disabled = true;
        document.getElementById("next_song").disabled = true;
      });
      xhr.onreadystatechange = function () {
        if (this.status == 500) {
          $(".status span").html(
            "An error has occured! Please retry or refresh!"
          );
          $(".status").fadeIn(200).delay(1000).fadeOut(200);
          let a = document.getElementsByTagName("button");
          for (var v = 0; v <= a.length; v++) {
            a[v].disabled = false;
          }
          // document.getElementsByTagName("button").disabled = false;
          return 0;
        }
      };
      xhr.onload = function () {
        var data_recv = JSON.parse(this.responseText.toString());
        if (data_recv["duration_high"] == true) {
          $(".player .s-title").html(
            "Cannot play songs having duration more than 60mins"
          );
          return 0;
        }
        aud.src = data_recv["url"];
        aud.load();
        aud.play();
        $("#dlink").attr("href", data_recv["url"]);
        localStorage.setItem("lastSong", playlist[crr - 1][0]);
        $("button").attr("data-id", playlist[crr - 1][0]);
        $("#aud_range").max = aud.duration;
        $(".player .s-img").attr("src", data_recv["thumb"]);
        setRangeOfAud(data_recv["duration"], 0);
        crr = crr - 1;
        localStorage.setItem("crr", crr);
        updateQueueDisp();
        if (media_session) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: data_recv["title"],
            artwork: [{ src: data_recv["thumb"] }],
            artist: data_recv["author"],
          });
          navigator.mediaSession.setActionHandler("play", function () {
            if (aud.paused == true) {
              aud.play();
              $(".song-controls #pause_play").html(
                '<i class="fa fa-pause"></i>'
              );
            } else {
              aud.pause();
              $(".song-controls #pause_play").html(
                '<i class="fa fa-play"></i>'
              );
            }
          });
          navigator.mediaSession.setActionHandler("nexttrack", function () {
            nextSong();
          });
          navigator.mediaSession.setActionHandler("previoustrack", function () {
            prevSong();
          });
        }
        $("title").html(data_recv[1]);
        $(".player .s-title").html(data_recv["title"]);
        $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
        document.getElementById("prev_song").disabled = false;
        document.getElementById("next_song").disabled = false;
      };
      xhr.send(fd);
    }
  }

  //aud.addEventListener("loadedmetadata", function() {});

  function songMenu(el) {
    $(document).ready(function () {
      var nxt = $(el).parent().next();
      var hidden = $(el).attr("data-hidden");
      if (hidden == "true") {
        $("#for_menu").css("display", "block");
        $(nxt).css("display", "block");
        any_open = true;
        $(el).attr("data-hidden", "false");
      } else {
        $("#for_menu").css("display", "none");
        $(nxt).css("display", "none");
        any_open = false;
        $(el).attr("data-hidden", "true");
      }
    });
  }

  function like(id, t) {
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    fd.append("id", id);
    fd.append(
      "csrfmiddlewaretoken",
      $("input[name=csrfmiddlewaretoken]").val()
    );
    xhr.open("POST", "like/", true);
    xhr.onloadstart = function () {
      $(t).html("<i class='fa fa-heart'></i>");
    };
    xhr.onreadystatechange = () => {
      if (this.status == 500) {
        $(".status span").html(
          "An error has occured! Please retry or refresh!"
        );
        $(".status").fadeIn(200).delay(1000).fadeOut(200);
        let a = document.getElementsByTagName("button");
        for (var v = 0; v <= a.length; v++) {
          a[v].disabled = false;
        }
        // document.getElementsByTagName("button").disabled = false;
        return 0;
      }
    };
    xhr.onload = function () {
      if (this.responseText == "0") {
        console.log(this.responseText);
      } else if (this.responseText == "1") {
        $(t).html("<span class='fa fa-heart-o'></span>");
      }
    };

    xhr.send(fd);
  }

  document.oncontextmenu = function (e) {
    e.preventDefault();
  };
  aud.addEventListener("timeupdate", function () {
    // var aud = document.getElementById("aud");
    var w = (aud.currentTime / aud.duration) * 100;
    localStorage.setItem("wasPlayingAt", aud.currentTime);
    $(".p-main-bar").css({ width: w.toString() + "%" });
    if (aud.currentTime == aud.duration) {
      aud.pause();
      $(".song-controls #pause_play").html('<i class="fa fa-play"></i>');
    }
    if (aud.ended == true) {
      nextSong();
    }
  });

  $("#lib").on("click", getLikedStuff);

  function getLikedStuff() {
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    fd.append(
      "csrfmiddlewaretoken",
      $("input[name=csrfmiddlewaretoken]").val()
    );
    xhr.open("POST", "mylibrary/", true);
    xhr.onloadstart = function () {
      $("#data").html(
        "<div class='song-info' style='width: 100%; height: 100px;'><i class='fa fa-circle-o-notch fa-spin'></i></div>"
      );
    };
    xhr.onreadystatechange = () => {
      if (this.status == 500) {
        $(".status span").html(
          "An error has occured! Please retry or refresh!"
        );
        $(".status").fadeIn(200).delay(1000).fadeOut(200);
        let a = document.getElementsByTagName("button");
        for (var v = 0; v <= a.length; v++) {
          a[v].disabled = false;
        }
        // document.getElementsByTagName("button").disabled = false;
        return 0;
      }
    };
    xhr.onload = function () {
      $("#info").html("Your Library");
      $("#data").html(this.responseText);
    };
    xhr.send(fd);
  }

  function randomizeQueue() {
    var done_nums = [crr];
    var temp_playlist = {};
    var c = 1;
    if (crr > 0 && Object.keys(playlist).length > 0) {
      temp_playlist[1] = playlist[crr];
      c = 2;
      crr = 1;
    }
    while (true) {
      if (c == Object.keys(playlist).length + 1) {
        break;
      }
      var rand = Math.floor(Math.random() * Object.keys(playlist).length) + 1;
      if (!checkIfIn(rand, done_nums)) {
        temp_playlist[c] = playlist[rand];
        done_nums.push(rand);
        c = c + 1;
      }
    }
    playlist = temp_playlist;
    localStorage.setItem("crr", 0);
    localStorage.setItem("queue", JSON.stringify(playlist));
    updateQueueDisp();
  }

  $("#rand_q").on("click", function () {
    randomizeQueue();
  });

  function checkIfIn(num, ar) {
    var xef = 0;
    while (true) {
      if (xef == ar.length) {
        break;
      }
      if (ar[xef] == num) {
        return true;
      }
      xef += 1;
    }
    return false;
  }
  document.getElementById("aud_range").addEventListener("change", function () {
    aud.currentTime = document.getElementById("aud_range").value / multiFac;
  });

  $("#next_song").click(function () {
    nextSong();
  });

  $("#prev_song").click(function () {
    prevSong();
  });

  $("#share").click(function () {
    var cb = navigator.clipboard;
    cb.writeText(
      "https://" + window.location.host + "/?id=" + $("#share").attr("data-id")
    ).then(function () {
      $(".status span").html("Copied to clipboard!");
      $(".status").fadeIn(200).delay(1000).fadeOut(200);
    });
  });

  $("#clear_q").click(function () {
    playlist = {};
    localStorage.removeItem("queue");
    crr = 0;
    $(".s-data-queue ul").html("Empty...");
    $(".status span").html("Queue cleared!");

    $(".status").fadeIn(200).delay(1000).fadeOut(200);
  });
  aud.addEventListener("paused", function () {
    $(".song-controls #pause_play").html('<i class="fa fa-play"></i>');
  });

  aud.addEventListener("play", function () {
    $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
  });

  aud.addEventListener("progress", function () {
    $("#prev_song").disabled = true;
    $("#next_song").disabled = true;
  });

  $("#aud_range").on("input", () => {
    aud.currentTime = document.getElementById("aud_range").value / multiFac;
  });

  function timeUpdate() {
    document.getElementById("aud_range").value = aud.currentTime * multiFac;
  }
  aud.addEventListener("timeupdate", timeUpdate);

  aud.addEventListener("canplay", function () {
    $("#prev_song").disabled = false;
    $("#next_song").disabled = false;
  });

  $("#for_menu").mouseup(function () {
    $(".song-menu").css("display", "none");
    $("#for_menu").css("display", "none");
    $("button[data-hidden='false']").attr("data-hidden", "true");
    any_open = false;
  });
  $(".chatFeatureButton").click(function () {
    $(".chatHeaderFreatureButtonFunc").slideDown("fast");
  });
  $(".close-dropdown").click(function () {
    $(".chatHeaderFreatureButtonFunc").slideUp("fast");
  });
}
