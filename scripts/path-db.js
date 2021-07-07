PathDB = function(gameIn,mazeIn,width,height)
{
    this.game = gameIn;
    this.maze = mazeIn;
	this.paths = new Array();
    for(var m = 0; m < MAP_NAMES.length; m++) {
        this.paths[m] = new Array();
        for(var x0 = 0; x0 < width; x0++) {
            this.paths[m][x0] = new Array();
            for(var y0 = 0; y0 < height; y0++) {
                this.paths[m][x0][y0] = new Array();
                for(var x1 = 0; x1 < width; x1++) {
                    this.paths[m][x0][y0][x1] = new Array();
                    for(var y1 = 0; y1 < width; y1++) {
                        this.paths[m][x0][y0][x1][y1] = null;
                    }
                }
            }
        }
    }
    this.pathfinder = this.game.plugins.add(Phaser.Plugin.PathFinderPlugin);
    this.pathfinder.setGrid(this.maze.map.layers[0].data, [1,38]);
    this.mapID = this.maze.currMap;
};

PathDB.prototype = {
    addPath: function(x0,y0,x1,y1,path) {
        if(this.mapID != this.maze.currMap) {
            this.mapID = this.maze.currMap;
            this.pathfinder.setGrid(this.maze.map.layers[0].data, [1,38]);
        }
        if(this.paths[this.mapID][x0][y0][x1][y1] == null) {
            if(path == null)
                this.paths[this.mapID][x0][y0][x1][y1] = this.findPath(x0,y0,x1,y1);
            else
                this.paths[this.mapID][x0][y0][x1][y1] = path.slice();
            if(x0 != x1 || y0 != y1) {
                this.paths[this.mapID][x1][y1][x0][y0] = this.paths[this.mapID][x0][y0][x1][y1].slice();
                this.paths[this.mapID][x1][y1][x0][y0].reverse();
            }
            var pLen = this.paths[this.mapID][x0][y0][x1][y1].length;
            if(pLen > 1) {
                var lSlice = this.paths[this.mapID][x0][y0][x1][y1].slice(1);
                this.addPath(lSlice[0][0],lSlice[0][1],x1,y1,lSlice);
                var rSlice = this.paths[this.mapID][x0][y0][x1][y1].slice(0,pLen-1);
                this.addPath(x0,y0,rSlice[pLen-2][0],rSlice[pLen-2][1],rSlice);
            }
        }
    },
    getPath: function(x0,y0,x1,y1) {
        if(this.mapID != this.maze.currMap)
            this.mapID = this.maze.currMap;
        if(this.paths[this.mapID][x0][y0][x1][y1] == null)
            this.addPath(x0,y0,x1,y1);
        var path = this.paths[this.mapID][x0][y0][x1][y1].slice();
        path.shift(); //Drop 'current' element.
        return path;
    },
    getPathLength: function(x0,y0,x1,y1) {
        return this.getPath(x0,y0,x1,y1).length;
    },
    resetMap: function() {
        if(this.mapID != this.maze.currMap)
            this.mapID = this.maze.currMap;
        this.paths = new Array();
        for(var x0 = 0; x0 < width; x0++) 
            for(var y0 = 0; y0 < height; y0++)
                for(var x1 = 0; x1 < width; x1++)
                    for(var y1 = 0; y1 < width; y1++)
                        this.paths[this.mapID][x0][y0][x1][y1] = null;
        this.pathfinder.setGrid(this.maze.map.layers[0].data, [1,38]);
    },
    findPath(x0,y0,x1,y1)
    {
        var path = [];
        this.pathfinder.setCallbackFunction(function(newPath) {
            newPath = newPath || [];
            if(newPath.length > 0) {
                for(i = 0; i < newPath.length; i++) {
                    path[i]=[newPath[i].x, newPath[i].y];
                }
            }
        });
        this.pathfinder.preparePathCalculation([x0,y0],[x1,y1]);
        this.pathfinder.calculatePath();
        return path;
    }
}