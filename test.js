const Store = require("./Store");
const Modifier = require("./Modifier");

describe('Store', ()=>{

    let initialState, store, modifier, modifierName, modifierSelectorKey, modifierAsyncKey, modifierAsyncActionData;

    beforeEach(()=>{
        initialState = {
            part1: {
                right: 'left'
            },
            part2: {}
        };

        store = new Store(initialState);

        modifierName = 'part 1 modifier';
        modifierSelectorKey = 'part1';
        modifierAsyncKey = 'testPart';
        modifierAsyncActionData = 'slow data';

        modifier = new Modifier(
            // the name of the modifier is used to call it, using the stores execute function
            modifierName,
            [
                {
                    // selector much be a function which returns a child object or array of the state
                    selector: (state)=>state[modifierSelectorKey],
                    // reducer function is passed the portion of the state tree selected by the selector,
                    // as well as the results of the async action, and should return updated state
                    reducerFunction: (part1State, asyncActionResult)=>({...part1State, modifierAsyncKey: asyncActionResult})
                }
            ],
            // the async action results are passed along to the reducer for this modifier
            ()=>new Promise(resolve => setTimeout(() => resolve(modifierAsyncActionData), 50))
        );
    });

    it('should correctly initialize state', async ()=>{
        store.register(modifier);
        expect(store.state).toEqual(initialState);
    });

    it('should set the loading flag on the appropriate data while async function is running', ()=>{
        store.register(modifier);
        const executePromise = store.execute(modifierName);
        const stateWithPart1Loading = initialState;
        stateWithPart1Loading[modifierSelectorKey]._loading = true;
        expect(store.state).toEqual(stateWithPart1Loading);
    });

    it('should clear the loading flag and update the data after the async function resolves', async (done)=>{
        store.register(modifier);
        const executePromise = store.execute(modifierName);
        await executePromise;
        const stateWithPart1DataAdded = initialState;
        stateWithPart1DataAdded[modifierSelectorKey][modifierAsyncKey] = modifierAsyncActionData;
        expect(store.state).toEqual(stateWithPart1DataAdded);
        done();
    });

});
