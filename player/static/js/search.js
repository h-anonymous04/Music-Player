{
  var xhr = new XMLHttpRequest();
  var multiFac = 100;
  var aud = new Audio();

  function go(event) {
    var searchQuery = document.getElementById("query").value.trim();
    event.preventDefault();
    document.getElementById("sug_").innerHTML = "";
    upPlayer();
    if (searchQuery == "" || searchQuery == null || searchQuery == NaN) {
      $(".status span").html("Enter song name and search!");
      $(".status").fadeIn(200).delay(1000).fadeOut(200);
      return 0;
    }
    formData = new FormData();
    formData.append("query", searchQuery);
    formData.append(
      "csrfmiddlewaretoken",
      $("input[name=csrfmiddlewaretoken]").val()
    );
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);
    xhr.onerror = function () {
      $(".status span").html("An error has occured! Please retry or refresh!");
      $(".for-status")
        .css("display", "flex")
        .delay(1000)
        .css("display", "none");
      document.getElementsByTagName("button").disabled = false;
      return 0;
    };
    xhr.setRequestHeader(
      "X-CSRF-Token",
      $("input[name='csrfmiddlewaretoken']").val()
    );
    xhr.onloadstart = function () {
      $("#data").html(
        "<div class='song-info' style='width: 100%; height: 100px;'><i class='fa fa-circle-o-notch fa-spin'></i></div>"
      );
      $("#info").html("Search Results");
    };
    xhr.onload = function () {
      $(".suggestions ul").html("");
      $("#info").html("Search Results");
      $("#data").html(this.responseText);
    };
    xhr.send(formData);
  }
  // var aud = document.getElementById("aud");

  function play_aud(y_id, th) {
    xhr.abort();
    var formData = new FormData();
    formData.append("id", y_id);
    formData.append(
      "csrfmiddlewaretoken",
      $("input[name=csrfmiddlewaretoken]").val()
    );
    xhr = new XMLHttpRequest();
    xhr.open("POST", "song/", true);
    xhr.onreadystatechange = function () {
      if (this.status == 500) {
        $(".status span").html(
          "An error has occured! Please retry or refresh!"
        );
        $(".status").fadeIn(200).delay(1000).fadeOut(200);
        document.getElementsByTagName("button").disabled = false;
        return 0;
      }
    };
    xhr.onload = function () {
      var data_recv = JSON.parse(this.responseText.toString());
      aud.src = data_recv["url"];
      aud.load();
      $(".s-data-crr-title").html(data_recv["title"]);
      $(".player .s-img").attr("src", data_recv["thumb"]);
      $(".player .s-title").html(data_recv["title"]);
      $("title").html(data_recv["title"]);
      document.getElementById("aud_range").max =
        data_recv["duration"] * multiFac;
      $("#dlink").attr("href", data_recv["url"]);
      aud.play();
      localStorage.setItem("lastSong", y_id);
      $("button").attr("data-id", y_id);
      crr = 0;
      localStorage.setItem("crr", crr);
      updateQueueDisp();
      if ("mediaSession" in navigator) {
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
      $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
      document.getElementById("prev_song").disabled = false;
      document.getElementById("next_song").disabled = false;
      th.disabled = false;
      $(th).css("pointer-events", "initial");
    };
    xhr.onabort = function () {
      document.getElementById("prev_song").disabled = false;
      th.disabled = false;
      $(th).css("pointer-events", "initial");
      document.getElementById("next_song").disabled = false;
    };
    xhr.addEventListener("loadstart", function () {
      document.getElementById("prev_song").disabled = true;
      th.disabled = true;
      $(th).css("pointer-events", "none");
      document.getElementById("next_song").disabled = true;
      $(".player .s-title").html(
        "<i class='fa fa-circle-o-notch fa-spin'></i>"
      );
    });
    xhr.send(formData);
  }

  function upPlayer() {
    $(".player").css("bottom", "0px");
    is_focused = false;
  }

  function downPlayer() {
    is_focused = true;
    $(".player").css("bottom", -$(this).height());
  }

  var is_focused = false;

  $(document).on("keyup", function (e) {
    if (e.keyCode == 32 && !is_focused) {
      e.preventDefault();
      if (aud.paused == true) {
        aud.play();
        $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
      } else {
        aud.pause();
        $(".song-controls #pause_play").html('<i class="fa fa-play"></i>');
      }
    }
    if (e.keyCode == 191 && !is_focused) {
      $("#query").focus();
      downPlayer();
    }
  });

  document.getElementById("pause_play").addEventListener("click", function () {
    if (aud.paused == true) {
      aud.play();
      $(".song-controls #pause_play").html('<i class="fa fa-pause"></i>');
    } else {
      aud.pause();
      $(".song-controls #pause_play").html('<i class="fa fa-play"></i>');
    }
  });
}
