class Store {

    constructor(initialState = {}){
        this._state = initialState;
        this._modifiers = {};
    }

    register(modifier){
        this._modifiers[modifier.name] = {
            modifier,
            loading: false,
        };
    }

    async execute(modifierName){

        const modifier = this._modifiers[modifierName].modifier;
        const modifierReducers = modifier.reducers;

        for(const reducer of modifierReducers){
            this._modifiers[modifierName].loading = true;
        }

        const asyncActionResult = await modifier.asyncAction();

        for(const reducer of modifierReducers){
            const obj = reducer.selector(this._state);
            const result = reducer.reducerFunction(reducer.selector(this._state), asyncActionResult);
            Object.assign(obj, result);
        }

        for(const reducer of modifierReducers){
            this._modifiers[modifierName].loading = false;
        }
    }

    get state(){
        const state = JSON.parse(JSON.stringify(this._state));

        Object.values(this._modifiers)
            .filter((modifier)=>modifier.loading)
            .forEach((modifier)=>{
                modifier.modifier.reducers.forEach((reducer)=>{
                    reducer.selector(state)._loading = true;
                });
            });
        return state;
    }

}

module.exports = Store;