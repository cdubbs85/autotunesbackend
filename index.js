const express = require('express')
const schedule = require('node-schedule')
const cmd = require('node-cmd')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

// PLAYBACK CONTROLS
// /play - params{spotifyUri(optional)}
app.post('/play', function (req, res) {
    cmd.run('mpc play')
})

app.post('/pause', function (req, res ){
    cmd.run('mpc pause')
})

app.post('/skip', function (req, res ){
    cmd.run('mpc skip')
})

app.post('/volume', function (req, res ){
    cmd.run('mpc stop')
})

app.post('/getCurrentTrackDetails', function (req, res ){
    cmd.run('mpc stop')
})

// mpc has seperate pause and stop commands. I'm not sure what the difference is. So, we may not need this one.
app.post('/stop', function (req, res ){
    cmd.run('mpc stop')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

var j = schedule.scheduleJob('*/1 * * * *', function(){
    console.log('The answer to life, the universe, and everything!');
});