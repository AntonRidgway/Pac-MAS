var MAP_NAMES = ['mapPac','mapTU','mapOpen'];
var ObjEnum = {
    INVALID : -2,
    UNCLAIMED : -1
}

MazeManager = function(game)
{
	this.game = game;
    this.currMap = 0;
	this.map = null;
	this.layer = null;
	this.mapData = null;
    this.mapBodies = null;
    this.physMap = null;
    this.dots = null;
    this.dotLookup = null;
    this.walkableSpaces = new Array();
    
    this.bkgnd = null;
    this.sfxChomp = null;
    
    this.isFinished = true;
};

MazeManager.prototype = {
	preload: function()
	{
        for(var i = 0; i < MAP_NAMES.length; i++)
            this.game.load.tilemap(MAP_NAMES[i], 'assets/'+MAP_NAMES[i]+'.json', null, Phaser.Tilemap.TILED_JSON);
		this.game.load.image('tiles', 'assets/tiles.png');
        this.game.load.image('dot', 'assets/dot.png');
        this.game.load.image('stripesDark', 'assets/stripesDark.png');
	},
	create: function()
	{
        this.bkgnd = this.game.add.tileSprite(0,0,224,288,'stripesDark');
        this.physMap = this.game.physics.p2.createCollisionGroup();
        this.game.physics.p2.setBoundsToWorld(false, false, false, false, false);
        this.dots = this.game.add.group();        
        this.loadMap(this.currMap);
	},
    update: function()
    {
        this.bkgnd.tilePosition.x += 0.2;
    },
    reset: function()
    {
        this.dots.removeAll(true);
        for (x = 0; x < this.map.width; x++) {
            for (y = 0; y < this.map.height; y++) {
                var tile = this.map.getTile(x,y,'walls',false);
                if(tile.index == 1) {
                    dot = this.game.add.sprite(x*this.map.tileWidth+3,y*this.map.tileHeight+3,'dot');
                    this.dots.add(dot);
                    this.dotLookup[x][y] = dot;
                }
                else this.dotLookup[x][y] = null;
            }
        }
        this.isFinished = false;
    },
    loadMap: function(num)
    {
        if(this.map != null) {
            this.map.destroy();
            this.layer.destroy();
            for(var i = 0; i < this.mapBodies.length; i++)
                this.mapBodies[i].destroy();
            this.walkableSpaces = new Array();
        }
        this.currMap = num;
        
        this.map = this.game.add.tilemap(MAP_NAMES[num]);
		this.map.addTilesetImage('pactiles','tiles');
		this.layer = this.map.createLayer('walls');
        this.layer.resizeWorld();
        
        this.map.setCollisionBetween(2,36,true);
        this.mapBodies = this.game.physics.p2.convertTilemap(this.map, this.layer);
        for(var i = 0; i < this.mapBodies.length; i++)
            this.mapBodies[i].setCollisionGroup(this.physMap);
        
        for (x = 0; x < this.map.width; x++) {
            for (y = 0; y < this.map.height; y++) {
                var tile = this.map.getTile(x,y,'walls',false);
                if(y > 1 && y < 34 && (tile.index == 1 || tile.index == 38))
                    this.walkableSpaces.push([x,y]);
            }
        }
        
        this.dotLookup = new Array();
        for(var i = 0; i < this.map.width; i++)
            this.dotLookup[i] = new Array();
        this.reset();
    },
    getPacmanLoc: function(id)
    {
        return [this.map.objects.pacmen[id].x,this.map.objects.pacmen[id].y];
    },
    getMaxPacmen: function()
    {
        return this.map.objects.pacmen.length;
    },
    visitLocation: function(x,y)
    {
        if(this.dotLookup[x][y] != null) {
            this.dotLookup[x][y].destroy();
            this.dotLookup[x][y] = null;
            if(this.dots.length == 0) {
                this.isFinished = true;
            }
            return true;
        }
        else return false;
    }
}