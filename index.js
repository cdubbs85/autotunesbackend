const express = require('express')
const schedule = require('node-schedule')
const cmd = require('node-cmd')
const bodyParser = require('body-parser')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello from AutoTunes Node Server!'))

// PLAYBACK CONTROLS
app.post('/play', function (req, res) {
    cmd.run('mpc play')
    res.send('Play resuming')
})
app.post('/play/:spotifyUri', function (req, res) {
    console.log(req.params.spotifyUri)
    cmd.run('mpc clear')
    cmd.run(`mpc add ${req.params.spotifyUri}`)
    cmd.run('mpc play')
    res.send(`Playing ${req.params.spotifyUri}`)
})

app.post('/pause', function (req, res ){
    cmd.run('mpc pause')
    res.send('Music paused.')
})

app.post('/next', function (req, res ){
    cmd.run('mpc next')
    res.send('Playing next song.')
})

// If song progress is < 3 seconds, play revious song. Otherwise, restart current song
app.post('/prev', function (req, res ){
    cmd.get(
        'mpc',
        function(err, data, stderr) {
            if (!err) {
                // IF WE WANT TO DO BY PERCENT
                // matches "(100%)" then gets just the number
                // var percent = data.match(/[(]\d{1,3}%[)]/)[0].replace(/[(,),%]/g,'')
                
                // On my raspberry pi prev doesn't always work.
                //  Event running mpc prev from the command line just restarts the current song
                // matches 1:11/2:22
                var timePlayedOne = data.match(/\d{1,2}[:]\d{1,2}[/]\d{1,2}[:]\d{1,2}/)[0]
                // gets the "1:11" portion to left of "/" and splits it into hours and minutes '[1,11]'
                var timePlayedTwo = timePlayedOne.split('/')[0].split(":")
                // converts "hours:minutes" to minutes
                var totalTimePlayed = parseInt(timePlayedTwo[0]) * 60 + parseInt(timePlayedTwo[1])
                if(totalTimePlayed < 4){
                    cmd.run('mpc prev')
                    res.send('Playing previous song.')
                }
                else {
                    cmd.run('mpc seek 0%')
                    res.send('Restarting current song.')
                }
            } else {
                res.send('Error: ', err)
            }
        }
    )
})

app.post('/volume/:newVolume', function (req, res ){
    cmd.run(`mpc volume ${req.params.newVolume}`)
    res.send(`Volume set to ${req.params.newVolume}`)
})

app.get('/getCurrentTrackDetails', function (req, res ){
    cmd.get(
        'mpc',
        function(err, data, stderr) {
            if (!err) {
                res.send(data)
            } else {
                res.send('Error: ', err)
            }
        }
    )
})

// mpc has seperate pause and stop commands. I'm not sure what the difference is. So, we may not need this one.
app.post('/stop', function (req, res ){
    cmd.run('mpc stop')
    res.send('Music stopped.')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// var j = schedule.scheduleJob('*/1 * * * *', function(){
//     console.log('The answer to life, the universe, and everything!');
// });