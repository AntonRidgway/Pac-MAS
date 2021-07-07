var LOC_TOLERANCE = 0.2;
var USE_COORDINATION = false;
var AdaptEnum = {
    NO_RESCUE : 0,
    ALL_RESCUE : 1,
    SOME_RESCUE : 2,
    HISTORY_ADAPT : 3,
    FORGIVE_ADAPT : 4
}
var ADAPT_MODE = AdaptEnum.FORGIVE_ADAPT;
var ADAPTIVE_MEM_WINDOW = 2000;
var FAILURE_RATES = [0.008,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.]
var MAX_FAILURES = [3,0,0,0,0,0,0,0,0,0,0,0]

Agent = function(game, mazeManager, world, id, tX, tY)
{
	this.game = game;
    this.mazeManager = mazeManager;
    this.world = world;
    this.myID = id;
    
    this.tilePos = [tX,tY];
    this.direction = DirEnum.RIGHT;
    
    this.assignedTasks = new Array();
    this.path = new Path();
    this.tgt = new Array();
    this.doCoordination = USE_COORDINATION;
    this.madeChanges = false;
    this.rescueMissions = new Array();
    this.tempPath = null;
    this.agentUptime = new Array();
    
    this.failTimer = 0;
    this.failures = 0;
};

Agent.prototype = {
	update: function(myX, myY) {
        if(this.world.pacmen[this.myID].isAlive)
            this.failTimer += FAILURE_RATES[this.myID];
        if(this.failTimer >= 1 && this.failures < MAX_FAILURES[this.myID]) {
            this.world.pacmen[this.myID].clicked();
            this.failTimer = 0;
            this.failures++;
        } else {
            while(!this.path.isEmpty() &&
                  Math.abs(myX-this.path.getNextPosition()[0]-0.5) < LOC_TOLERANCE &&
                  Math.abs(myY-this.path.getNextPosition()[1]-0.5) < LOC_TOLERANCE) {
                this.tilePos = this.path.removeNextPosition();
            }

            //Monitor agent uptime.
            for(var i = 0; i < this.world.pacmen.length; i++) {
                if(ADAPT_MODE == AdaptEnum.HISTORY_ADAPT) {
                    if(this.agentUptime[i] == null) {
                        if(this.world.pacmen[i].isAlive)
                            this.agentUptime[i] = [1,1.];
                        else
                            this.agentUptime[i] = [1,0.];
                    } 
                    else {
                        this.agentUptime[i][1] *= this.agentUptime[i][0];
                        this.agentUptime[i][0] += 1;
                        if(this.world.pacmen[i].isAlive)
                            this.agentUptime[i][1] += 1.;
                        this.agentUptime[i][1] /= this.agentUptime[i][0];
                    } 
                } else if (ADAPT_MODE == AdaptEnum.FORGIVE_ADAPT) {
                    if(this.agentUptime[i] == null) {
                        if(this.world.pacmen[i].isAlive)
                            this.agentUptime[i] = [[1.],1.];
                        else
                            this.agentUptime[i] = [[0.],0.];
                    } 
                    else {
                        if(this.world.pacmen[i].isAlive)
                            this.agentUptime[i][0].push(1.);
                        else
                            this.agentUptime[i][0].push(0.);
                        while(this.agentUptime[i][0].length > ADAPTIVE_MEM_WINDOW)
                            this.agentUptime[i][0].shift();
                        this.agentUptime[i][1] = 0.;
                        for(var j = 0; j < this.agentUptime[i][0].length; j++)
                            this.agentUptime[i][1] += this.agentUptime[i][0][j];
                        this.agentUptime[i][1] /= this.agentUptime[i][0].length;
                    } 
                }
            }

//            while(!this.path.isEmpty() && this.path.steps[0].length == 0)
//                this.path.steps.shift();
            
            this.madeChanges = false;
            if(this.rescueMissions.length == 0 && this.assignedTasks.length > 0 && (this.path.getNumSegments() == 0 || this.path.getDistance(0) == 0))
                this.generatePlan();
            if(this.rescueMissions.length == 0 && this.doCoordination)
            {
                for(var i = 0; !this.madeChanges && i < this.path.getNumSegments(); i++) {
                    for(var j = 0; !this.madeChanges && j <= this.path.getNumSegments(); j++) {
                        if(j < i || j > i+1) {
                            var predDistance = this.path.calcMovePtDistance(i,j,this.world.pathDB,this.tilePos[0],this.tilePos[1]);
                            var nowDistance = this.path.getDistance();
                            if(predDistance < nowDistance) {
                                this.madeChanges = true;
                                this.path.movePt(i,j,this.world.pathDB,this.tilePos[0],this.tilePos[1]);
                            }
                            var newDistance = this.path.getDistance();
                            if(this.madeChanges && (newDistance != predDistance || newDistance >= nowDistance))
                                console.log("Whoops");
                        }
                    }
                }
                for(var p = 0; !this.madeChanges && p < this.world.pacmen.length; p++) {
                    if(p != this.myID) {
                        for(var m = 0; !this.madeChanges && m < this.path.getNumSegments(); m++) {
                            for(var t = 0; !this.madeChanges && t < this.world.pacmen[p].agent.path.getNumSegments(); t++) {
                                var theirTilePos = this.world.pacmen[p].agent.tilePos;
                                var theirPath = this.world.pacmen[p].agent.path;
                                var maxStayDistance = Math.max(this.path.getDistance(),theirPath.getDistance());
                                var maxSwapDistance = Math.max(this.path.calcSwapSuffixDistance(theirPath,m,t,this.world.pathDB,this.tilePos[0],this.tilePos[1]),
                                                              theirPath.calcSwapSuffixDistance(this.path,t,m,this.world.pathDB,theirTilePos[0],theirTilePos[1]));
                                if(maxSwapDistance < maxStayDistance) {
                                    this.madeChanges = true;
                                    this.path.swapPathSuffixes(theirPath,m,t,this.world.pathDB,this.tilePos[0],this.tilePos[1],theirTilePos[0],theirTilePos[1]);
                                    this.regenerateAssignments();
                                    this.world.pacmen[p].agent.regenerateAssignments();
                                }
                                var maxDistancePost = Math.max(this.path.getDistance(),theirPath.getDistance());
                                if(this.madeChanges && (maxSwapDistance != maxDistancePost || maxStayDistance <= maxDistancePost))
                                    console.log("Whoops");
                            }
                        }
                    }
                }
            }
            
//            while(!this.path.isEmpty() && this.path.steps[0].length == 0)
//                this.path.steps.shift();

            //Now execute the current plan.
            if (!this.path.isEmpty()) {
                this.tgt = this.path.getNextPosition();
                if(myX-0.5+LOC_TOLERANCE < this.tgt[0])
                    this.direction=DirEnum.RIGHT;
                else if (myX-0.5-LOC_TOLERANCE > this.tgt[0])
                    this.direction=DirEnum.LEFT;
                else if(myY-0.5+LOC_TOLERANCE < this.tgt[1])
                    this.direction=DirEnum.DOWN;
                else if (myY-0.5-LOC_TOLERANCE > this.tgt[1])
                    this.direction=DirEnum.UP;
                else
                    this.direction=DirEnum.NONE;
            } else
                this.direction=DirEnum.NONE;   
        }
    },
    generatePlan: function() {
        //Plan a greedy short path between the tasks in our assignment set.
        this.path.removeAll();
        var lastLoc = [Math.floor(this.world.pacmen[this.myID].sprite.x/8),Math.floor(this.world.pacmen[this.myID].sprite.y/8)];

        //Find closest task and path to it.
        var tempTasksList = Array.apply(Array, this.assignedTasks);
        while(tempTasksList.length > 0) {
            var closestIndex = -1; var shortestPath = null;
            for(var i = 0; i < tempTasksList.length; i++) {
                var pathTo = this.world.pathDB.getPath(lastLoc[0],lastLoc[1],tempTasksList[i][0],tempTasksList[i][1]);
                if(shortestPath == null || pathTo.length < shortestPath.length) {
                    shortestPath = pathTo;
                    closestIndex = i;
                }
            }
            if(shortestPath.length > 0)
                this.path.addSegment(shortestPath);
            tempTasksList.splice(closestIndex,1);
            if(shortestPath[shortestPath.length-1] != null)
                lastLoc = shortestPath[shortestPath.length-1];
        }
    },
    notifyOfDeath: function(id) {
        this.doCoordination = USE_COORDINATION;
        var deathLoc = [Math.floor(this.world.pacmen[id].sprite.x/8),Math.floor(this.world.pacmen[id].sprite.y/8)];
        var shortestPath = Number.MAX_SAFE_INTEGER; var closestID = -1;
        for(var i = 0; i < this.world.pacmen.length; i++)
            if(i != id && this.world.pacmen[i].isAlive) {
                var travelDist = this.world.pathDB.getPathLength(this.world.pacmen[i].agent.tilePos[0],
                                                                 this.world.pacmen[i].agent.tilePos[1],
                                                                 deathLoc[0], deathLoc[1]);
                if(travelDist < shortestPath) {
                    shortestPath = travelDist;
                    closestID = i;
                }
            }
        if(closestID == this.myID) { //Only take action if I am the closest.
            var myPathToDeadPac = this.world.pathDB.getPath(this.tilePos[0], this.tilePos[1], deathLoc[0], deathLoc[1]);
            var decidedToRescue = false;
            if(ADAPT_MODE != AdaptEnum.NO_RESCUE) {
                if(ADAPT_MODE == AdaptEnum.ALL_RESCUE) {
                    decidedToRescue = true;
                } else {
                    var numLivingAgents = 0;
                    var avgLivingPathLength = 0;
                    var avgAgentToDotDistance = 0;
                    for(var i = 0; i < this.world.pacmen.length; i++)
                        if(this.world.pacmen[i].isAlive) {
                            numLivingAgents++;
                            avgLivingPathLength += this.world.pacmen[i].agent.path.getDistance();
                            var agentLoc = this.world.pacmen[i].agent.tilePos;
                            for(var j = 0; j < this.world.pacmen[id].agent.assignedTasks.length; j++) {
                                var dotLoc = this.world.pacmen[id].agent.assignedTasks[j];
                                avgAgentToDotDistance += this.world.pathDB.getPathLength(agentLoc[0],agentLoc[1],dotLoc[0],dotLoc[1]);
                            }
                        }
                    avgLivingPathLength /= numLivingAgents;
                    avgAgentToDotDistance /= numLivingAgents*this.world.pacmen[id].agent.assignedTasks.length;
                    var deadPacmanDots = this.world.pacmen[id].agent.path.getNumSegments();
                    
                    var finishTimeWithoutHim = avgLivingPathLength + avgAgentToDotDistance + deadPacmanDots/numLivingAgents;
                    var finishTimeWithHim = Math.max(avgLivingPathLength,this.path.getDistance()+2*myPathToDeadPac.length);
                    if (ADAPT_MODE == AdaptEnum.HISTORY_ADAPT || ADAPT_MODE == AdaptEnum.FORGIVE_ADAPT) {
                        var estDeadPacmanPotential;
                        if(this.agentUptime[id][1] == 0)
                            estDeadPacmanPotential = 0;
                        else
                            estDeadPacmanPotential = this.world.pacmen[id].agent.path.getDotsWithinDistance(Math.floor(1/this.agentUptime[id][1]));
                        finishTimeWithHim += (deadPacmanDots-estDeadPacmanPotential)/numLivingAgents;
                    }
                    if(finishTimeWithHim < finishTimeWithoutHim) {
                        decidedToRescue = true;
                    }
                }
            }
            if(decidedToRescue) {
                this.rescueMissions.push([id,this.world.pacmen[id].sprite.x,this.world.pacmen[id].sprite.y]);
                this.path.removeAll();
                this.path.addSegment(myPathToDeadPac);
            } else {
                var agentLocs = [];
                for(var i = 0; i < this.world.pacmen.length; i++)
                    agentLocs.push(this.world.pacmen[i].agent.tilePos);
                var tasksToDistribute = this.world.pacmen[id].agent.assignedTasks;
                while(tasksToDistribute.length > 0) {
                    var shortestPath = Number.MAX_SAFE_INTEGER; var closestID = -1;
                    for(var i = 0; i < this.world.pacmen.length; i++)
                        if(i != id && this.world.pacmen[i].isAlive) {
                            var travelDist = this.world.pathDB.getPathLength(agentLocs[i][0], agentLocs[i][1], tasksToDistribute[0][0], tasksToDistribute[0][1]);
                            if(travelDist < shortestPath) {
                                shortestPath = travelDist;
                                closestID = i;
                            }
                        }
                    if(closestID == -1)
                        tasksToDistribute.shift()
                    else {
                        this.world.pacmen[closestID].agent.assignedTasks.push(tasksToDistribute.shift());
                        this.world.pacmen[closestID].agent.path.removeAll(); //force to regenerate path
                    }
                }
            }
        }
    },
    completeTaskAt: function(tX,tY) {
        for(var i = 0; i < this.world.pacmen.length; i++)
            for(var j = 0; j < this.world.pacmen[i].agent.assignedTasks.length; j++)
                if(this.world.pacmen[i].agent.assignedTasks[j][0] == tX && this.world.pacmen[i].agent.assignedTasks[j][1] == tY) {
                    this.world.pacmen[i].agent.assignedTasks.splice(j,1);
                    if(i != this.myID && this.world.pacmen[i].agent.rescueMissions.length == 0)
                        this.world.pacmen[i].agent.path.removeAll();
                    return true;
                }
        return false;
                
    },
    regenerateAssignments: function() {
        this.assignedTasks = this.path.getAllLocs();
    },
    resetPlanning: function() {
        this.assignedTasks = new Array();
        this.path.removeAll();
        this.tgt = new Array();
        this.rescueMissions = new Array();
        this.agentUptime = new Array();
        this.failTimer = 0;
        this.failures = 0;
    },
    renderPlan: function(gfx,x,y) {
        if(!this.path.isEmpty()) {
            gfx.lineStyle(2, this.world.pacmen[this.myID].sprite.tint, 0.5);
            gfx.moveTo(x,y);
            this.path.render(gfx);
        }
    }
}