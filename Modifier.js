class Modifier {

    constructor(name, reducers, asyncAction){
        this.name = name;
        this.reducers = reducers;
        this.asyncAction = asyncAction;
    }

}

module.exports = Modifier;