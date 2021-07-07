Path = function()
{
    this.steps = [];
};

Path.prototype = {
    isEmpty: function() {
        return this.steps.length == 0;
    },
    getLocAt: function(idx) {
        if(this.isEmpty() || idx < 0 || idx >= this.steps.length) return null;
        return this.steps[idx][this.steps[idx].length-1];
    },
    getAllLocs: function() {
        var locList = [];
        for(var idx = 0; idx < this.steps.length; idx++)
            locList.push(this.steps[idx][this.steps[idx].length-1]);
        return locList;
    },
    getNumSegments: function(idx) {
        return this.steps.length;
    },
    getDistance: function(i,j) {
        if (i == null) {
            i = 0; j = this.steps.length;
        }
        else if (j == null) return this.steps[i].length;
        else if (j == i || j < i) return 0;
        else if (i < 0 || j > this.steps.length) return null;
        
        var sum = 0;
        for(var a = i; a < j; a++)
            sum += this.steps[a].length;
        return sum;
    },
    getDotsWithinDistance: function(d) {
        var sum = 0;
        for(var i = 0; i < this.steps.length; i++)
            if(this.steps[i].length <= d) {
                sum++;
                d -= this.steps[i].length;
            } else return sum;
        return sum;
    },
    getNextPosition: function() {
        if(this.isEmpty()) return null;
        return this.steps[0][0];
    },
    removeNextPosition: function() {
        if(!this.isEmpty()) {
            var nextPos = this.steps[0].shift();
            if(this.steps[0].length == 0)
                this.steps.shift();
            return nextPos;
        }
        return null;
    },
    addSegment: function(path) {
        if(path != null)
            this.steps.push(path);
    },
    movePt: function(i,j,pathDB,tX,tY) {
        if(j == i || j == i+1) return;
        var movingPt = this.getLocAt(i);
        var ptBeforeA,ptAfterA,ptBeforeB,ptAfterB;
        if(i == 0)
            ptBeforeA = [tX,tY];
        else
            ptBeforeA = this.getLocAt(i-1);
        if(i == this.getNumSegments()-1)
            ptAfterA = null;
        else
            ptAfterA = this.getLocAt(i+1);
        if(j == 0)
            ptBeforeB = [tX,tY];
        else
            ptBeforeB = this.getLocAt(j-1);
        if(j == this.getNumSegments())
            ptAfterB = null;
        else
            ptAfterB = this.getLocAt(j);
        
        this.steps.splice(i, 1);
        if (i < this.steps.length) {
            var newPath = pathDB.getPath(ptBeforeA[0],ptBeforeA[1],ptAfterA[0],ptAfterA[1]);
            if(newPath.length == 0) {
                this.steps.splice(i,1);
                if(i < j)j--;
            } else {
                this.steps[i] = newPath;
            }
        }
        
        if(i < j) j--;
        var newPath = pathDB.getPath(ptBeforeB[0],ptBeforeB[1],movingPt[0],movingPt[1]);
        if(newPath.length == 0)
            j--;
        else
            this.steps.splice(j,0,newPath);
        
        if(j < this.steps.length-1) {
            newPath = pathDB.getPath(movingPt[0],movingPt[1],ptAfterB[0],ptAfterB[1]);
            if(newPath.length == 0)
                this.steps.splice(j+1,1);
            else
                this.steps[j+1] = newPath;
        }
    },
    swapPathSuffixes: function(other,i,j,pathDB,tX,tY,ttX,ttY) {
        if(i < 0 || i >= this.steps.length || j < 0 || j >= other.steps.length) return;
        var theirNewSuffix = this.steps.slice(i);
        var myNewSuffix = other.steps.slice(j);
        this.steps.splice(i,this.steps.length-i);
        other.steps.splice(j,other.steps.length-j);
        if(myNewSuffix.length > 0) {
            var myFirstNewLoc = myNewSuffix[0][myNewSuffix[0].length-1];
            if(i == 0) {
                myNewSuffix[0] = pathDB.getPath(tX,tY,myFirstNewLoc[0],myFirstNewLoc[1]);
            } else {
                var myLastOldLoc = this.getLocAt(i-1);
                myNewSuffix[0] = pathDB.getPath(myLastOldLoc[0],myLastOldLoc[1],myFirstNewLoc[0],myFirstNewLoc[1]);
            }
            if(myNewSuffix[0].length == 0)
                myNewSuffix.shift();
            this.steps.push.apply(this.steps, myNewSuffix);
        }
        if(theirNewSuffix.length > 0) {
            var theirFirstNewLoc = theirNewSuffix[0][theirNewSuffix[0].length-1];
            if(j == 0) {
                theirNewSuffix[0] = pathDB.getPath(ttX,ttY,theirFirstNewLoc[0],theirFirstNewLoc[1]);
            } else {
                var theirLastOldLoc = other.getLocAt(j-1);
                theirNewSuffix[0] = pathDB.getPath(theirLastOldLoc[0],theirLastOldLoc[1],theirFirstNewLoc[0],theirFirstNewLoc[1]);
            }
            if(theirNewSuffix[0].length == 0)
                theirNewSuffix.shift();
            other.steps.push.apply(other.steps, theirNewSuffix);
        }
    },
    calcMovePtDistance: function(i,j,pathDB,tX,tY) {
        if(j == i || j == i+1 || this.steps.length <= 1) return this.getDistance();
        var movingPt = this.getLocAt(i);
        var ptBeforeA,ptAfterA,ptBeforeB,ptAfterB;
        if(i == 0)
            ptBeforeA = [tX,tY];
        else
            ptBeforeA = this.getLocAt(i-1);
        if(i == this.getNumSegments()-1)
            ptAfterA = null;
        else
            ptAfterA = this.getLocAt(i+1);
        if(j == 0)
            ptBeforeB = [tX,tY];
        else
            ptBeforeB = this.getLocAt(j-1);
        if(j == this.getNumSegments())
            ptAfterB = null;
        else
            ptAfterB = this.getLocAt(j);

        var swapDistance = 0;
        if(i < j) {
            swapDistance += this.getDistance(0,i) + this.getDistance(i+2,j) + this.getDistance(j+1,this.steps.length);
        } else { //i > j
            swapDistance += this.getDistance(0,j) + this.getDistance(j+1,i) + this.getDistance(i+2,this.steps.length);
        }
        if(ptAfterA != null)
            swapDistance += pathDB.getPathLength(ptBeforeA[0],ptBeforeA[1],ptAfterA[0],ptAfterA[1]);
        swapDistance += pathDB.getPathLength(ptBeforeB[0],ptBeforeB[1],movingPt[0],movingPt[1]);
        if(ptAfterB != null)
            swapDistance += pathDB.getPathLength(movingPt[0],movingPt[1],ptAfterB[0],ptAfterB[1]);
        return swapDistance;
    },
    calcSwapSuffixDistance: function(other,i,j,pathDB,tX,tY) {
        if(i == 0)
            return pathDB.getPathLength(tX,tY,other.getLocAt(j)[0],other.getLocAt(j)[1]) +
                other.getDistance(j+1,other.getNumSegments());
        else
            return this.getDistance(0,i) +
                        pathDB.getPathLength(this.getLocAt(i-1)[0],this.getLocAt(i-1)[1],
                                       other.getLocAt(j)[0],other.getLocAt(j)[1]) +
                        other.getDistance(j+1,other.getNumSegments());
    },
    removeAll: function() {
        this.steps = [];
    },
    render: function(gfx) {
        var x, y;
        for(var i = 0; i < this.steps.length; i++) {
            for(var j = 0; j < this.steps[i].length; j++) {
                x = this.steps[i][j][0]*8+4;
                y = this.steps[i][j][1]*8+4;
                gfx.lineTo(x,y);
                gfx.moveTo(x,y);
            }
        }
    }
}