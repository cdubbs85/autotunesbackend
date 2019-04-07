# autotunesbackend


**Playback Controls**

/play/:spotifyUri

/pause

/next

/prev

/volume/:newVolume

/getCurrentTrackDetails

/stop


**Session Management**

/addSession
```
  {
    "schedule" : {
      "minute" : "*",
      "hour" : "*",
      "day_of_month" : "*",
      "month" : "*",
      "day_of_week" : "*"
    },
    "duration" : int (time to play in minutes)
    "spotifyUri" : string,
    "useMotionToActivate" : boolean, // optional
    "random" : boolean, // optional
    "fadeIn" :boolean // optional
  }
```
  
/removeSession/:id

/getAllSessions

/editSession/:id
 ```
  {
    "schedule" : {
      "minute" : "*",
      "hour" : "*",
      "day_of_month" : "*",
      "month" : "*",
      "day_of_week" : "*"
    }, // optional
    "spotifyUri" : string, // optional
    "useMotionToActivate" : boolean, // optional
    "random" : boolean, // optional
    "fadeIn" :boolean // optional
  }
 ```
