var DEF_BONUS = 30000;
var FONT_SIZE = 7;

Hud = function(game, world, mazeManager)
{
	this.game = game;
    this.world = world;
    this.mazeManager = mazeManager;
	this.sprite = null;
    
    this.headerText1 = null;
    this.headerText2 = null;
	this.scoreText = null;
    this.bonus = DEF_BONUS;
    this.bonusText = null;
    this.bonusDec = 100;
    this.bonusDecEvent = null;
    this.bonusTransEvent = null;
    
    this.pacLogo = null;
    this.moreBtn = null;
    this.fewerBtn = null;
    this.numAgentsText = null;
    this.numAgentsTitleText = null;
    
    this.nextMapBtn = null;
    this.prevMapBtn = null;
    this.whichMapText = null;
    this.whichMapTitleText = null;
    this.thinkingText = null;
    
    this.startBtn = null;
    this.stopBtn = null;
    this.planVisible = false;
    this.soundEnabled = true;
    this.planBtn = null;
    this.soundBtn = null;
    
    this.timer = null;
    this.pathingText = null;
    this.planLines = null;
    
    this.sfxIntermission = null;
};

Hud.prototype = {
	preload: function()
	{
        this.game.load.bitmapFont('font','assets/pacfont_0.png','assets/pacfont.xml');
        this.game.load.image('paclogo', 'assets/pacmas.png');
        this.game.load.spritesheet('upBtn', 'assets/up.png', 50, 50);
        this.game.load.spritesheet('downBtn', 'assets/down.png', 50, 50);
        this.game.load.spritesheet('planBtn', 'assets/bulb.png', 25, 25);
        this.game.load.spritesheet('soundBtn', 'assets/speaker.png', 25, 25);
        this.game.load.spritesheet('startBtn', 'assets/start.png', 50, 25);
        this.game.load.spritesheet('stopBtn', 'assets/stop.png', 50, 25);
        this.game.load.audio('sfxIntermission','assets/intermission.wav');
	},
	create: function()
	{        
		this.headerText1 = this.game.add.bitmapText(0,8,'font',"SCORE",FONT_SIZE);
        this.headerText2 = this.game.add.bitmapText(184,8,'font',"BONUS",FONT_SIZE);
        this.scoreText = this.game.add.bitmapText(0,16,'font',this.world.score.toString(), FONT_SIZE);
        this.bonusText = this.game.add.bitmapText(184,16,'font',this.bonus.toString(), FONT_SIZE);
        
        this.pacLogo = this.game.add.sprite(232,0,'paclogo');
        this.pacLogo.scale.setTo(0.25,0.25);
        
        this.moreBtn = this.game.add.button(242, 60, 'upBtn', this.handleAdd, this, 1, 0, 2);
        this.fewerBtn = this.game.add.button(242, 130, 'downBtn', this.handleRemove, this, 1, 0, 2);
        this.numAgentsText = this.game.add.bitmapText(268,116,'font',this.world.numAgents.toString(), FONT_SIZE);
        this.numAgentsText.anchor.x = Math.round(this.numAgentsText.width * 0.5) / this.numAgentsText.width;
        this.numAgentsTitleText = this.game.add.bitmapText(244,48,'font',"AGENTS", FONT_SIZE);
        
        this.nextMapBtn = this.game.add.button(302, 60, 'upBtn', this.handleNextMap, this, 1, 0, 2);
        this.prevMapBtn = this.game.add.button(302, 130, 'downBtn', this.handlePrevMap, this, 1, 0, 2);
        this.whichMapText = this.game.add.bitmapText(328,116,'font',(this.mazeManager.currMap+1).toString(), FONT_SIZE);
        this.whichMapText.anchor.x = Math.round(this.whichMapText.width * 0.5) / this.whichMapText.width;
        this.whichMapTitleText = this.game.add.bitmapText(316,48,'font',"MAP", FONT_SIZE);
        this.thinkingText = this.game.add.bitmapText(0,280,'font',"ZZZ", FONT_SIZE);
        this.thinkingText.visible = false;
        
        this.startBtn = this.game.add.button(272, 190, 'startBtn', this.handleStart, this, 1, 0, 2);
        this.stopBtn = this.game.add.button(272, 225, 'stopBtn', this.handleStop, this, 1, 0, 2);
        this.planBtn = this.game.add.button(316, 263, 'planBtn', this.togglePlanMap, this, 4, 3, 5);
        this.soundBtn = this.game.add.button(346, 263, 'soundBtn', this.toggleSound, this, 1, 0, 2);
        
        this.planLines = this.game.add.graphics(0,0);
        
        this.sfxIntermission = this.game.add.audio('sfxIntermission');
	},
    
	update: function()
	{
        if(this.world.gameIsRunning && this.mazeManager.isFinished) {
            this.world.gameIsRunning = false;
            this.world.wasStopped = true;
            this.world.timer.remove(this.bonusDecEvent);
            this.startBtn.input.enabled = false;
            this.startBtn.frame = 2;
            this.bonusDecEvent = null;
            this.bonusTransEvent = this.world.timer.loop(1, this.transBonus, this);
            this.sfxIntermission.play();
            console.log("Average tic time: "+(this.world.evalTimes/this.world.evalTics)+" ms");
        }
        this.scoreText.setText(this.world.score.toString());
	},
    render: function()
    {
        if(this.planVisible) {
            this.planLines.clear();
            for(var i = 0; i < this.world.pacmen.length; i++)
                this.world.pacmen[i].renderPlan(this.planLines);
        }
    },
    setBonus: function(val)
    {
        this.bonus = val;
        this.bonusText.setText(this.bonus.toString());
    },
    decBonus: function()
    {
        this.setBonus(Math.max(0,this.bonus-this.bonusDec));
    },
    transBonus: function()
    {
        this.decBonus();
        this.world.setScore(this.world.score+this.bonusDec);
        if(this.bonus == 0) {
            this.world.timer.remove(this.bonusTransEvent);
            this.bonusTransEvent = null;
            
            this.moreBtn.input.enabled = true;
            this.moreBtn.frame = 0;
            this.fewerBtn.input.enabled = true;
            this.fewerBtn.frame = 0;
            this.nextMapBtn.input.enabled = true;
            this.nextMapBtn.frame = 0;
            this.prevMapBtn.input.enabled = true;
            this.prevMapBtn.frame = 0;
            this.startBtn.input.enabled = true;
            this.startBtn.setFrames(1,0,2);
            this.startBtn.frame = 0;
            this.world.wasStopped = true;
        }
    },
    togglePlanMap: function()
    {
        if(this.planVisible)
            this.planBtn.setFrames(4,3,5);
        else
            this.planBtn.setFrames(1,0,2);
        this.planVisible = !this.planVisible;
        this.planLines.visible = this.planVisible;
        this.planLines.clear();
    },
    toggleSound: function()
    {
        if(this.soundEnabled)
            this.soundBtn.setFrames(4,3,5);
        else
            this.soundBtn.setFrames(1,0,2);
        this.soundEnabled = !this.soundEnabled;
        this.game.sound.mute = !this.soundEnabled;
    },
    handleAdd: function()
    {
        if(this.world.numAgents < this.mazeManager.getMaxPacmen()) {
            if(this.mazeManager.isFinished)
                this.handleStop();
            this.world.addAgents(1);
            this.numAgentsText.setText(this.world.numAgents.toString());
        }
    },
    handleRemove: function()
    {
        if(this.world.numAgents > 1) {
            if(this.mazeManager.isFinished)
                this.handleStop();
            this.world.removeAgents(1);
            this.numAgentsText.setText(this.world.numAgents.toString());
        }
    },
    handleNextMap: function()
    {
        this.mazeManager.loadMap((this.mazeManager.currMap+1)%MAP_NAMES.length);
        this.whichMapText.setText((this.mazeManager.currMap+1).toString());
        this.handleStop();
    },
    handlePrevMap: function()
    {
        this.mazeManager.loadMap((this.mazeManager.currMap-1+MAP_NAMES.length)%MAP_NAMES.length);
        this.whichMapText.setText((this.mazeManager.currMap+1).toString());
        this.handleStop();
    },
    handleStop: function()
    {
        console.log("Average tic time: "+(this.world.evalTimes/this.world.evalTics)+" ms");
        this.world.doStopSim();
        this.moreBtn.input.enabled = true;
        this.moreBtn.frame = 0;
        this.fewerBtn.input.enabled = true;
        this.fewerBtn.frame = 0;
        this.nextMapBtn.input.enabled = true;
        this.nextMapBtn.frame = 0;
        this.prevMapBtn.input.enabled = true;
        this.prevMapBtn.frame = 0;
        this.startBtn.input.enabled = true;
        this.startBtn.setFrames(1,0,2);
        this.startBtn.frame = 0;
        this.world.setScore(0);
        if(this.bonusDecEvent != null) {
            this.world.timer.remove(this.bonusDecEvent);
            this.bonusDecEvent = null;
        }
        this.setBonus(DEF_BONUS);
        if(this.bonusTransEvent != null) {
            this.world.timer.remove(this.bonusTransEvent);
            this.bonusTransEvent = null;
        }
    },
    handleStart: function(wasStopped)
    {
        if(this.world.wasStopped) {
            this.setBonus(DEF_BONUS);
            if(this.bonusTransEvent != null) {
                this.world.timer.remove(this.bonusTransEvent);
                this.bonusTransEvent = null;
            }
        }
        this.world.doStartSim(this,this.handlePathingUpdate,this.handlePathingDone);
        if(this.world.wasStopped) {
            this.moreBtn.input.enabled = false;
            this.moreBtn.frame = 2;
            this.fewerBtn.input.enabled = false;
            this.fewerBtn.frame = 2;
            this.nextMapBtn.input.enabled = false;
            this.nextMapBtn.frame = 2;
            this.prevMapBtn.input.enabled = false;
            this.prevMapBtn.frame = 2;
            if(!this.world.havePathsForMap[this.mazeManager.currMap]) {
                this.thinkingText.visible = true;
                this.startBtn.input.enabled = false;
                this.startBtn.frame = 2;
            }
        } else {
            if(this.world.gameIsRunning)
                this.startBtn.setFrames(4,3,5);
            else
                this.startBtn.setFrames(1,0,2);
        }
    },
    handlePathingUpdate: function(subject)
    {
        subject.thinkingText.setText("PATHING... "+((subject.world.calcPathsFrom-1)/subject.mazeManager.walkableSpaces.length*100.).toFixed(2)+"%");
    },
    handlePathingDone: function(subject, success)
    {
        subject.thinkingText.visible = false;
        subject.startBtn.input.enabled = true;
        subject.startBtn.setFrame(0);
        subject.thinkingText.visibile = false;
        if(success) {
            subject.startBtn.setFrames(4,3,5);
            if(subject.bonusDecEvent == null)
                subject.bonusDecEvent = subject.world.timer.loop(500, subject.decBonus, subject);
        }
    }
};