//Global Variables
var SPEED = 50;
var DOT_SCORE = 100;
var DirEnum = {
    NONE : -1,
    LEFT : 0,
    RIGHT : 1,
    UP : 2,
    DOWN : 3
}

PacMan = function(game, mazeManager, world, id)
{
	this.game = game;
    this.mazeManager = mazeManager;
    this.world = world;
    this.myID = id;
    
    this.agent = null;
	this.sprite = null;
    
//    this.sfxChomp = null;
    this.sfxContinue = false;
    this.sfxAlive = null;
    this.sfxDead = null;
    
    this.dir = DirEnum.NONE;
    this.isAlive = true;
};

PacMan.prototype = {
	preload: function(){},
	create: function()
	{
		this.sprite = this.game.add.sprite(0,0,'pacman');
        this.sprite.animations.add('stay', [0], 10, true);
        this.sprite.animations.add('right', [1,2,0,2], 10, true);
        this.sprite.animations.add('up', [3,4,0,4], 10, true);
        this.sprite.animations.add('death', [4,5,6,7,8,9,10], 10, false);
        this.sprite.animations.play('stay');
        this.sprite.anchor.setTo(.5,.5);
        
		this.game.physics.p2.enable(this.sprite);
        this.sprite.body.setCircle(4);
        this.sprite.body.setZeroDamping();
        
        this.agent = new Agent(this.game, this.mazeManager, this.world, this.myID, 0, 0);
        
//        this.sfxChomp = this.game.add.audio('sfxChomp');
//        this.sfxChomp.onStop.add(this.soundStopped,this);
        this.sfxAlive = this.game.add.audio('sfxAlive');
        this.sfxDead = this.game.add.audio('sfxDead');
        
        this.sprite.inputEnabled = true;
        this.sprite.input.useHandCursor = true;
        this.sprite.events.onInputDown.add(this.clicked, this);
	},
	update: function()
	{
        if(this.world.gameIsRunning)
        {
            if(this.isAlive)
            {
                if(this.agent.rescueMissions.length > 0) {
                    for(var i = 0; i < this.agent.rescueMissions.length; i++) {
                        var dist = Math.sqrt(Math.pow(this.sprite.body.x-this.agent.rescueMissions[i][1],2)+Math.pow(this.sprite.body.y-this.agent.rescueMissions[i][2],2));
                        if(dist < 8.) {
                            this.world.pacmen[this.agent.rescueMissions[i][0]].clicked();
                            this.agent.rescueMissions.splice(i,1);
                            if(this.agent.rescueMissions.length > 0) {
                                var myPathToDeadPac = this.world.pathDB.getPath(Math.floor(this.sprite.x/8), Math.floor(this.sprite.y/8),
                                                                                Math.floor(this.agent.rescueMissions[0][1]/8),Math.floor(this.agent.rescueMissions[0][2]/8));
                                this.agent.path.removeAll();
                                this.agent.path.addSegment(myPathToDeadPac);
                            } else {
                                this.agent.path.removeAll();
                            }
                        }
                    }
                } else if (Math.abs((this.sprite.x/8. % 1.)-0.5) < 0.3 && Math.abs((this.sprite.y/8. % 1.)-0.5) < 0.3) {
                    var ateDot = this.mazeManager.visitLocation(Math.floor(this.sprite.x/8), Math.floor(this.sprite.y/8));
                    if(ateDot) {
                        this.agent.completeTaskAt(Math.floor(this.sprite.x/8), Math.floor(this.sprite.y/8));
                        this.world.setScore(this.world.score + DOT_SCORE);
//                        if(this.sfxChomp.isPlaying) {
//                            this.sfxContinue = true;
//                        } else {
//                            this.sfxChomp.play();
//                            this.sfxContinue = false;
//                        }
                    }
                }
                this.agent.update(this.sprite.x/8,this.sprite.y/8);
                this.dir = this.agent.direction;

                if(Math.abs(this.sprite.body.velocity.x) > SPEED/2. || Math.abs(this.sprite.body.velocity.y) > SPEED/2.)
                    this.sprite.animations.play('right');
                else {
                    this.sprite.animations.stop();
                    this.sfxContinue = false;
                }
                switch(this.dir) {
                    case DirEnum.LEFT:
                        this.sprite.body.velocity.x = -SPEED;
                        this.sprite.body.velocity.y = 0;
                        this.sprite.body.rotation = 3.14;
                        break;
                    case DirEnum.RIGHT:
                        this.sprite.body.velocity.x = SPEED;
                        this.sprite.body.velocity.y = 0;
                        this.sprite.body.rotation = 0;
                        break;
                    case DirEnum.UP:
                        this.sprite.body.velocity.x = 0;
                        this.sprite.body.velocity.y = -SPEED;
                        this.sprite.body.rotation = 4.71;
                        break;
                    case DirEnum.DOWN:
                        this.sprite.body.velocity.x = 0;
                        this.sprite.body.velocity.y = SPEED;
                        this.sprite.body.rotation = 1.57;
                        break;
                    case DirEnum.NONE:
                        this.sprite.body.velocity.x = 0;
                        this.sprite.body.velocity.y = 0;
                }
                this.sprite.body.setZeroRotation();
                this.game.world.wrap(this.sprite.body);
            } else {
                this.sprite.body.velocity.x = 0;
                this.sprite.body.velocity.y = 0;
            }
        } else {
            this.sprite.body.velocity.x = 0;
            this.sprite.body.velocity.y = 0;
            this.sprite.animations.play('stay');
        }
	},
    setPosition: function(x,y)
    {
        this.sprite.reset(x,y);
        this.agent.tilePos = [Math.floor(x/8),Math.floor(y/8)];
    },
    setColor: function(color)
    {
        this.sprite.tint = color;  
    },
    setPhysicsGroup: function(phys)
    {
        this.sprite.body.setCollisionGroup(phys);
        this.sprite.body.collides(this.mazeManager.physMap);
    },
    isAlive: function()
    {
        return this.isAlive;
    },
    setAlive: function()
    {
        this.isAlive = true;
    },
    resetPlanning: function()
    {
        this.agent.resetPlanning();
    },
    soundStopped: function(sound)
    {
//        if(this.sfxContinue) {
//            this.sfxChomp.play();
//            this.sfxContinue = false;
//        }
    },
    clicked: function(sprite)
    {
        if(this.world.gameIsRunning) {
            this.isAlive = !this.isAlive;
            if(this.isAlive) {
                this.sprite.animations.play('stay');
                this.dir = DirEnum.NONE;
                this.sfxAlive.play();
                this.setCoordinating(USE_COORDINATION);
            } else {
                this.sprite.body.velocity.x = 0;
                this.sprite.body.velocity.y = 0;
                this.sprite.body.rotation = 0;
                this.sprite.animations.play('death');
                this.sfxDead.play();
//                this.mazeManager.cedeAllObjectives(this.myID);
//                this.resetPlanning();
                for(var i = 0; i < this.world.pacmen.length; i++)
                    if(i != this.myID)
                        this.world.pacmen[i].agent.notifyOfDeath(this.myID);
            }
        }
    },
    hasCoordinated: function()
    {
        return this.agent.madeChanges;  
    },
    setCoordinating: function(val)
    {
        this.agent.doCoordination = val;
    },
    renderPlan: function(gfx)
    {
        if(this.isAlive)
            this.agent.renderPlan(gfx,this.sprite.body.x,this.sprite.body.y)
    },
    stop: function()
    {
        this.sprite.body.velocity.x = 0;
        this.sprite.body.velocity.y = 0;
        this.sprite.animations.play('stay');
    },
    destroy: function()
    {
        this.sprite.destroy();
    }
};