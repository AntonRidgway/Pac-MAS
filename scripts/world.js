var PAC_COLORS = [0xffff00,0x0000ff,0xff7f00,0x7f3300,0xff0000,0x00ffff,0xff007f,0x007f0e,0x606060,0x00ff00,0x7f00ff,0xffb27f];
var QUIESCENCE_THRESHOLD = 5;

World = function(gameIn, mazeIn)
{
    this.game = gameIn;
    this.mazeManager = mazeIn;
    
    this.score = 0;
    this.numAgents = 0;
    this.pacmen = null;
    this.physPac = null;
    this.wasStopped = true;
    this.gameIsRunning = false;
    
    this.pathDB = null;
    this.havePathsForMap = new Array();
    for(var i = 0; i < MAP_NAMES.length; i++)
        this.havePathsForMap[i] = false;
    this.calcPathsFrom = -1;
    this.callbackSubject = null;
    this.pathingUpdateCallback = null;
    this.pathingDoneCallback = null;
    
    this.quiescenceTimer = 0;
    
    this.evalTimes = 0;
    this.evalTics = 0;
}
World.prototype = {
	preload: function() {},
	create: function()
	{
        this.physPac = this.game.physics.p2.createCollisionGroup();
        this.pacmen = [];
        this.addAgents(1);
        this.mazeManager.reset();
        for(var i = 0; i < this.mazeManager.mapBodies.length; i++)
            this.mazeManager.mapBodies[i].collides(this.physPac);
        this.game.physics.p2.updateBoundsCollisionGroup();
        
        this.pathDB = new PathDB(this.game,this.mazeManager,this.mazeManager.map.width,this.mazeManager.map.height);
        this.timer = this.game.time.create(false);
        this.timer.start();
	},
	update: function()
    {
        var time0 = window.performance.now();
        if(this.calcPathsFrom > -1) {
            for(var i = 0; i < this.mazeManager.walkableSpaces.length; i++) {
                this.pathDB.addPath(this.mazeManager.walkableSpaces[this.calcPathsFrom][0],
                                    this.mazeManager.walkableSpaces[this.calcPathsFrom][1],
                                    this.mazeManager.walkableSpaces[i][0],
                                    this.mazeManager.walkableSpaces[i][1]);
            }
            this.calcPathsFrom += 1;
            if(this.calcPathsFrom == this.mazeManager.walkableSpaces.length) {
                this.calcPathsFrom = -1;
                this.havePathsForMap[this.mazeManager.currMap] = true;
                this.donePathing(true);
            } else {
                this.pathingUpdateCallback(this.callbackSubject);
            }
        } else {
            var isQuiesced = true;
            for(var i = 0; i < this.pacmen.length; i++) {
                this.pacmen[i].update();
                if(this.pacmen[i].hasCoordinated())
                    isQuiesced = false;
            }
            if(this.gameIsRunning && isQuiesced) {
                this.quiescenceTimer++;
                if(this.quiescenceTimer > QUIESCENCE_THRESHOLD)
                    for(var i = 0; i < this.pacmen.length; i++)
                        this.pacmen[i].setCoordinating(false);
            }
        }
        var time1 = window.performance.now();
        this.evalTimes += time1-time0;
        ++this.evalTics;
    },
	render: function() {},
    
    doStopSim: function()
    {
        this.gameIsRunning = false;
        this.wasStopped = true;
        this.score = 0;
        if(this.pathingDoneCallback != null) {
            this.calcPathsFrom = -1;
            this.donePathing(false);
        }
        for(i = 0; i < this.pacmen.length; i++) {
            var pos = this.mazeManager.getPacmanLoc(i);
            this.pacmen[i].setPosition(pos[0],pos[1]);
            this.pacmen[i].setAlive();
            this.pacmen[i].setCoordinating(USE_COORDINATION);
            this.pacmen[i].resetPlanning(i);
        }
        this.mazeManager.reset();
        for(var i = 0; i < this.mazeManager.mapBodies.length; i++)
            this.mazeManager.mapBodies[i].collides(this.physPac);
        this.game.physics.p2.updateBoundsCollisionGroup();
    },
    doStartSim: function(callbackSub, updateCallback, doneCallback)
    {
        if(!this.gameIsRunning) {
            if(this.wasStopped) {
                this.doStopSim();
                this.callbackSubject = callbackSub;
                this.pathingUpdateCallback = updateCallback;
                this.pathingDoneCallback = doneCallback;
                if(this.havePathsForMap[this.mazeManager.currMap] == true)
                    this.donePathing(true);
                else
                    this.calcPathsFrom = 0;
            } else {
                this.gameIsRunning = true;
                this.timer.resume();
            }
        } else {
            this.gameIsRunning = false;
            this.timer.pause();
        }
        return this.wasStopped;
    },
    donePathing: function(success) {
        this.pathingDoneCallback(this.callbackSubject, success);
        this.callbackSubject = null;
        this.pathingUpdateCallback = null;
        this.pathingDoneCallback = null;
        this.gameIsRunning = true;
        this.timer.resume();
        if(this.wasStopped) {
            if(USE_COORDINATION)
                this.assignTasksRandomly();
            else {
                var agentLocs = [];
                for(var i = 0; i < this.pacmen.length; i++)
                    agentLocs.push(this.pacmen[i].agent.tilePos);
                this.assignTasksByDistance(agentLocs);
            }
            for(var i = 0; i < this.pacmen.length; i++)
                this.pacmen[i].agent.generatePlan();
            this.wasStopped = false;
            this.evalTics = 0;
            this.evalTimes = 0;
        }
    },
    assignTasksRandomly: function()
    {
        for (var x = 0; x < this.mazeManager.map.width; x++)
            for (var y = 0; y < this.mazeManager.map.height; y++) {
                var tile = this.mazeManager.map.getTile(x,y,'walls',false);
                if(tile.index == 1)
                    this.pacmen[Math.floor(Math.random()*this.numAgents)].agent.assignedTasks.push([x,y]);
            }
    },
    assignTasksByDistance: function(agentLocs)
    {
        for (var x = 0; x < this.mazeManager.map.width; x++)
            for (var y = 0; y < this.mazeManager.map.height; y++) {
                var tile = this.mazeManager.map.getTile(x,y,'walls',false);
                if(tile.index == 1) {
                    var closestID = 0; var closestDist = Number.MAX_SAFE_INTEGER;
                    for(var z = 0; z < agentLocs.length; z++) {
                        var dist = Math.sqrt(Math.pow(x-agentLocs[z][0],2)+Math.pow(y-agentLocs[z][1],2));
                        if(dist < closestDist) {
                            closestID = z;
                            closestDist = dist;
                        }
                    }
                    this.pacmen[closestID].agent.assignedTasks.push([x,y]);
                }
            }
    },
    addAgents: function(num)
    {
        var numToAdd = Math.min(num, this.mazeManager.getMaxPacmen()-this.numAgents);
        while(numToAdd > 0) {
            this.pacmen[this.numAgents] = new PacMan(this.game, this.mazeManager, this, this.numAgents);
            this.pacmen[this.numAgents].create();
            var pos = this.mazeManager.getPacmanLoc(this.numAgents);
            this.pacmen[this.numAgents].setPosition(pos[0],pos[1]);
            this.pacmen[this.numAgents].setColor(PAC_COLORS[this.numAgents]);
            this.pacmen[this.numAgents].setPhysicsGroup(this.physPac);
            this.numAgents += 1;
            numToAdd -= 1;
        }
    },
    removeAgents: function(num)
    {
        var numToRemove = Math.min(num, this.numAgents-1);
        while(numToRemove > 0) {
            this.numAgents -= 1;
            this.pacmen[this.numAgents].destroy();
            this.pacmen.pop();
            numToRemove -= 1;
        }
    },
    setScore: function(val)
    {
        this.score = val;
    }
};