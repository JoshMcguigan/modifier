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

        this._modifiers[modifierName].loading = true;

        const asyncActionResult = await modifier.asyncAction();

        for(const reducer of modifierReducers){
            const obj = reducer.selector(this._state);
            const result = reducer.reducerFunction(obj, asyncActionResult);
            Object.assign(obj, result);
        }

        this._modifiers[modifierName].loading = false;
    }

    setLoading(object) {

        // should confirm that this is an object first

        Object.defineProperty(object, '_loading', {
            enumerable: false,
            writable: false,
            value: true
        });

        Object.keys(object).forEach((key) => {
            if(typeof object[key] === 'object'){
                this.setLoading(object[key]);
            }
        });

    };

    get state(){
        const state = JSON.parse(JSON.stringify(this._state));

        Object.values(this._modifiers)
            .filter((modifier)=>modifier.loading)
            .forEach((modifier)=>{
                modifier.modifier.reducers.forEach((reducer)=>{
                    this.setLoading(reducer.selector(state));
                });
            });

        return state;
    }

}

module.exports = Store;
