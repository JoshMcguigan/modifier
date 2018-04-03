class Store {

    constructor(initialState = {}){
        this._state = initialState;
        this._modifiers = {};
    }

    register(modifier){
        this._modifiers[modifier.name] = {
            modifier,
            loading: {},
        };
    }

    async execute(modifierName){

        const modifier = this._modifiers[modifierName].modifier;
        const modifierReducers = modifier.reducers;

        const actionInstanceId = process.hrtime()[0];

        const args = [].slice.call(arguments, 1); // remove the modifier name and convert the arguments to a real array

        this._modifiers[modifierName].loading[actionInstanceId] = {args};

        const asyncActionResult = await modifier.asyncAction(...args);

        for(const reducer of modifierReducers){
            const obj = reducer.selector(this._state, ...args);
            const result = reducer.reducerFunction(obj, asyncActionResult);
            Object.assign(obj, result);
        }

        delete this._modifiers[modifierName].loading[actionInstanceId];
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
            .forEach((modifier)=>{
                Object.keys(modifier.loading)
                    .forEach(actionInstanceId=>{
                        modifier.modifier.reducers.forEach((reducer)=>{
                            this.setLoading(reducer.selector(state, ...modifier.loading[actionInstanceId].args));
                        });
                    })

            });

        return state;
    }

}

module.exports = Store;
