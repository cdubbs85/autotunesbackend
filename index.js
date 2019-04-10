const express = require('express')
const schedule = require('node-schedule')
const cmd = require('node-cmd')
const bodyParser = require('body-parser')
const loki = require('lokijs')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello from AutoTunes Node Server!'))

var db = new loki('Sessions.db', {
	autoload: true,
	autoloadCallback : databaseInitialize,
	autosave: true, 
    autosaveInterval: 4000
});

// PLAYBACK CONTROLS
app.post('/play', function (req, res) {
    cmd.run('mpc play');
    res.send('Play pausing/resuming');
})

app.post('/play/:spotifyUri', function (req, res) {
    console.log(req.params.spotifyUri);
    cmd.run('mpc clear');
    cmd.run(`mpc add ${req.params.spotifyUri}`);
    cmd.run('mpc play');
    res.send(`Playing ${req.params.spotifyUri}`);
})

app.post('/pause', function (req, res ){
    cmd.run('mpc pause');
    res.send('Music paused.');
})

app.post('/next', function (req, res ){
    cmd.run('mpc next');
    res.send('Playing next song.');
})

// If song progress is < 3 seconds, play revious song. Otherwise, restart current song
app.post('/prev', function (req, res ){
    cmd.get(
        'mpc',
        function(err, data, stderr) {
            if (!err) {
                // This is spoty even when run directly from the command line
                //  Event running mpc prev from the command line just restarts the current song
                // matches 1:11/2:22
                var timePlayedOne = data.match(/\d{1,2}[:]\d{1,2}[/]\d{1,2}[:]\d{1,2}/)[0];

                // gets the "1:11" portion to left of "/" and splits it into hours and minutes '[1,11]'
                var timePlayedTwo = timePlayedOne.split('/')[0].split(":");

                // converts "hours:minutes" to minutes
                var totalTimePlayed = parseInt(timePlayedTwo[0]) * 60 + parseInt(timePlayedTwo[1]);

                if (totalTimePlayed < 4){
                    cmd.run('mpc prev');
                    res.send('Playing previous song.');
                }
                else {
                    cmd.run('mpc seek 0%');
                    res.send('Restarting current song.');
                }
            } else {
                res.send('Error: ', err);
            }
        }
    );
})

app.post('/volume/:newVolume', function (req, res ){
    cmd.run(`mpc volume ${req.params.newVolume}`);
    res.send(`Volume set to ${req.params.newVolume}`);
})

app.get('/getCurrentTrackDetails', function (req, res ){
    cmd.get(
        'mpc',
        function(err, data, stderr) {
            if (!err) {
                res.send(data);
            } else {
                res.send('Error: ', err);
            }
        }
    )
})

// mpc has seperate pause and stop commands. I'm not sure what the difference is. So, we may not need this one.
app.post('/stop', function (req, res ){
    cmd.run('mpc stop');
    res.send('Music stopped.');
})

// Session controls
var scheduledSessions; // createJobsForPreviousSessions initializes this on startup
var idCounter = 0; // createJobsForPreviousSessions will update this when loading old sessions at startup

function createCronString(schedule){
    return `${schedule.minute} ${schedule.hour} ${schedule.day_of_month} ${schedule.month} ${schedule.day_of_week}`;
}

function createJob(session){
    var cron_string = createCronString(session.schedule);
    var sesh = schedule.scheduleJob(cron_string, function(){
        console.log(`Playing session: ${session.sessionName}`);
        // reset mpc just incase something weird happened
        resetMpc();

        if(session.useMotionToActivate){
            // do something
        }
        if(session.random){
            cmd.run('mpc random on');
        }
        if(session.fadeIn){
            var volumeInterval = 10;
            var timeInterval = 2000;
            var currentInterval = timeInterval;
            var i;
            for (i = 1; i <= 10; i++) { 
                setTimeout(fadeInHelper, currentInterval, i * volumeInterval);
                currentInterval += timeInterval;
            }
            cmd.run('mpc volume 10');
        }

        cmd.run(`mpc add ${session.spotifyUri}`);

        // start session
        cmd.run('mpc play');

        // stop playing after set time
        setTimeout(resetMpc, session.duration);
    })
    session.node_schedule_object = sesh;
}

function resetMpc(){
    cmd.run('mpc stop');
    cmd.run('mpc clear');
    cmd.run('mpc random off');
    cmd.run('mpc volume 100');
}

function fadeInHelper(volume){
    cmd.run(`mpc volume ${volume}`);
}

app.post('/addSession', function (req, res){
    var sessionData = { id: idCounter,
                        sessionName: req.body.sessionName,
                        schedule: req.body.schedule,
                        duration: req.body.duration  * 60000,  //convert minutes to milliseconds with * 60000
                        spotifyUri: req.body.spotifyUri,
                        useMotionToActivate: req.body.useMotionToActivate ? req.body.useMotionToActivate : false,
                        random: req.body.random ? req.body.random : false,
                        fadeIn: req.body.fadeIn ? req.body.fadeIn : false
                      };

    createJob(sessionData);
    
    scheduledSessions.insert(sessionData);

    idCounter = idCounter + 1;

    res.send(`New session id: ${sessionData.id}`);
})

app.post('/removeSession/:id', function (req, res){
    
    var session = scheduledSessions.findOne({id : parseInt(req.params.id)});

    if(session){

        session.node_schedule_object.cancel();

        scheduledSessions.remove(session);

        res.send(`Session: ${req.params.id} removed`)
    } else {
        res.send(`Could not find id: ${req.params.id}`)
    }  
})

app.get('/getAllSessions', function (req, res){
    res.send(scheduledSessions.find());
})

app.post('/editSession/:id', function (req, res){

    var session = scheduledSessions.findOne({id : parseInt(req.params.id)});

    // If a session with matching id is found, update it. Otherwise ignore the request
    if(session){
        // check for all the possible things to update
        if (req.body.sessionName){
            session.sessionName = req.body.sessionName;
        }
        if (req.body.schedule){
            session.schedule = req.body.schedule;
        }
        if (req.body.duration){
            session.duration = req.body.duration;
        }
        if (req.body.spotifyUri){
            session.spotifyUri = req.body.spotifyUri;
        }
        if (req.body.useMotionToActivate != null){
            session.useMotionToActivate = req.body.useMotionToActivate;
        }
        if (req.body.random  != null){
            session.random = req.body.random;
        }
        if (req.body.fadeIn != null){
            session.fadeIn = req.body.fadeIn;
        }

        // You can only change the schedule of an exisiting job. So the easiest approach is to always create a new job
        session.node_schedule_object.cancel();

        createJob(session);

        // tell lokijs to update the document for this session
        scheduledSessions.update(session);

        res.send(`Session ${req.params.id} updated.`);
    }
    else {
        res.send(`Unable to find session with id: ${req.params.id}`);
    }
})

app.post('/removeAllSessions', function (req, res){
    scheduledSessions.find().forEach(function(session){
        session.node_schedule_object.cancel();
    })
    scheduledSessions.clear();
    res.send("All sessions removed");
})

function databaseInitialize() {

    // search for saved collection
    scheduledSessions = db.getCollection("sessions");

    // if no saved collection, create it
    if (scheduledSessions === null) {
        scheduledSessions = db.addCollection("session");
    }

    startServer();
}

function createJobsForPreviousSessions(){
    scheduledSessions.find().forEach(function(session){

        createJob(session);
        // Note: If I want to save this change to node_schedule_object I would call scheduledSessions.update(session) 
        //  but it doesn't matter because the job changes each time scheduledSession goes out of memory anyway

        // Increment the id counter
        if (session.id >= idCounter){
            idCounter = session.id + 1;
        }
    })
}

function startServer(){

    // load all the previous sessions saved in Lokijs
    createJobsForPreviousSessions();

    console.log(`Restarted sessions: ${scheduledSessions.count()}`);

    // clear mpc if something is already playing
    cmd.run('mpc stop');
    cmd.run('mpc clear');

    // start the server
    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
