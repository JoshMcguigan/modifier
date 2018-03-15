class Store {

    constructor(initialState = {}){
        this._state = initialState;
        this._modifiers = {};
        this._loading = [];
    }

    register(modifier){
        this._modifiers[modifier.name] = modifier;
    }

    async execute(modifierName){

        const modifier = this._modifiers[modifierName];
        const modifierReducers = modifier.reducers;

        for(const reducer of modifierReducers){
            this._loading.push(reducer.selector);
        }

        const asyncActionResult = await modifier.asyncAction();

        for(const reducer of modifierReducers){
            const obj = reducer.selector(this._state);
            const result = reducer.reducerFunction(reducer.selector(this._state), asyncActionResult);
            Object.assign(obj, result);
        }

        for(const reducer of modifierReducers){
            this._loading = [];
        }
    }

    get state(){
        const state = JSON.parse(JSON.stringify(this._state));
        for(const selector of this._loading){
            selector(state)._loading = true;
        }
        return state;
    }

}

module.exports = Store;