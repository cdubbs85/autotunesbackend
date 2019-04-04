# autotunesbackend


/play/:spotifyUri
/pause
/next
/prev
/volume/:newVolume
/getCurrentTrackDetails
/stop

/addSession
```
  {
    "schedule" : {
      "minute" : "*/1",
          "hour" : "*",
          "day_of_month" : "*",
          "month" : "*",
          "day_of_week" : "*"
    },
    "spotifyUri" : "One ring to bring them all."
  }
```
  
/removeSession/:id

/getAllSessions

/editSession/:id
  not implemented
