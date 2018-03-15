const Store = require("./Store");
const Modifier = require("./Modifier");

describe('Store', ()=>{

    let initialState, store, modifier1, modifier2, modifierSelectorKey, modifierAsyncKey, modifier1AsyncActionData, modifier2AsyncActionData;

    beforeEach(()=>{
        initialState = {
            part1: {
                right: 'left'
            },
            part2: {}
        };

        store = new Store(JSON.parse(JSON.stringify(initialState)));

        modifierSelectorKey = 'part1';
        modifierAsyncKey = 'testPart';
        modifier1AsyncActionData = 'slow data from modifier 1';
        modifier2AsyncActionData = 'slow data from modifier 2';

        modifier1 = new Modifier(
            // the name of the modifier is used to call it, using the stores execute function
            'part 1 modifier',
            [
                {
                    // selector much be a function which returns a child object or array of the state
                    selector: (state)=>state[modifierSelectorKey],
                    // reducer function is passed the portion of the state tree selected by the selector,
                    // as well as the results of the async action, and should return updated state
                    reducerFunction: (part1State, asyncActionResult)=>({...part1State, [modifierAsyncKey]: asyncActionResult})
                }
            ],
            // the async action results are passed along to the reducer for this modifier
            ()=>new Promise(resolve => setTimeout(() => resolve(modifier1AsyncActionData), 50))
        );

        modifier2 = new Modifier(
            // the name of the modifier is used to call it, using the stores execute function
            'part 2 modifier',
            [
                {
                    // selector much be a function which returns a child object or array of the state
                    selector: (state)=>state[modifierSelectorKey],
                    // reducer function is passed the portion of the state tree selected by the selector,
                    // as well as the results of the async action, and should return updated state
                    reducerFunction: (part1State, asyncActionResult)=>({...part1State, [modifierAsyncKey]: asyncActionResult})
                }
            ],
            // the async action results are passed along to the reducer for this modifier
            ()=>new Promise(resolve => setTimeout(() => resolve(modifier2AsyncActionData), 100))
        );
    });

    describe('setup', ()=>{
        it('should correctly initialize state', async ()=>{
            store.register(modifier1);
            expect(store.state).toEqual(initialState);
        });

        it('should return a deep copy of state (not the original)', async ()=>{
            const initialState = {};
            const store = new Store(initialState);
            // shallow equals check here confirms a copy was returned
            expect(store.state).not.toBe(initialState);
        });
    });

    describe('single modifier', ()=> {
        it('should set the loading flag on the appropriate data while async function is running', ()=>{
            store.register(modifier1);
            const executePromise = store.execute(modifier1.name);
            const stateWithPart1Loading = initialState;
            stateWithPart1Loading[modifierSelectorKey]._loading = true;
            expect(store.state).toEqual(stateWithPart1Loading);
        });

        it('should clear the loading flag and update the data after the async function resolves', async (done)=>{
            store.register(modifier1);
            const executePromise = store.execute(modifier1.name);
            await executePromise;
            const stateWithPart1DataAdded = initialState;
            stateWithPart1DataAdded[modifierSelectorKey][modifierAsyncKey] = modifier1AsyncActionData;
            expect(store.state).toEqual(stateWithPart1DataAdded);
            done();
        });
    });

    describe('two modifiers that modify the same portion of the store', ()=> {
        it('should maintain loading flag after one async action finishes if the other is still running', async (done)=>{
            store.register(modifier1);
            store.register(modifier2);
            const execute1Promise = store.execute(modifier1.name);
            const execute2Promise = store.execute(modifier2.name);
            await execute1Promise;
            const stateWithPart1LoadingAndModifier1Data = initialState;
            stateWithPart1LoadingAndModifier1Data[modifierSelectorKey]._loading = true;
            stateWithPart1LoadingAndModifier1Data[modifierSelectorKey][modifierAsyncKey] = modifier1AsyncActionData;
            expect(store.state).toEqual(stateWithPart1LoadingAndModifier1Data);
            done();
        });

        it('should clear the loading flag after both async functions are complete', async (done)=>{
            store.register(modifier1);
            store.register(modifier2);
            const execute1Promise = store.execute(modifier1.name);
            const execute2Promise = store.execute(modifier2.name);
            await execute1Promise;
            await execute2Promise;
            const stateWithModifier2Data = initialState;
            stateWithModifier2Data[modifierSelectorKey][modifierAsyncKey] = modifier2AsyncActionData;
            expect(store.state).toEqual(stateWithModifier2Data);
            done();
        });
    });

});
